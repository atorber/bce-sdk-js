/**
 * @file src/bos/super_upload.ts
 * @desc BOS 分片上传封装
 * @author lurunze
 */

import {sortBy, omit, mean} from 'lodash';
import * as dayjs from 'dayjs';
import {filesize} from 'filesize';
import * as async from 'async';
import debugLib from 'debug';

import * as H from '../headers';
import {DATATYPE, STATE, StorageClass} from './enums';
import type {BceResponse} from '../types/common';
import type {
  UploadData,
  StorageClass as StorageClassType,
  PartInfo,
  ListPartsResponse,
  InitiateMultipartUploadResponse,
  UploadPartResponse
} from './types';

const debugLog = debugLib('bce-sdk:super-upload');

// 文件大小基数
const fileSizeBase = 1024;
/** 上传文件分片最大体积 5GB, 单位为bytes */
// const MAX_UPLOAD_PART_SIZE = 5 * fileSizeBase ** 3;
/** 上传文件分片最小体积 100KB, 单位为bytes */
// const MIN_UPLOAD_PART_SIZE = 100 * fileSizeBase;
/** 上传文件分片默认体积, 单位为bytes */
const DEFAULT_UPLOAD_PART_SIZE = 5 * fileSizeBase ** 2;
/** 最小分片数 */
// const MIN_UPLOAD_PART_COUNT = 1;
/** 最大分片数 */
const MAX_UPLOAD_PART_COUNT = 10000;
/** 默认上传任务分片并发数 */
const UPLOAD_PART_CONCURRENCY = 5;

/** 进度回调参数 */
export interface ProgressCallbackParams {
  /** 当前上传速度 */
  speed: string;
  /** 当前上传进度 */
  progress: number;
  /** 当前上传进度-百分比 */
  percent: string;
  /** 已上传字节数 */
  uploadedBytes: number;
  /** 文件总字节数 */
  totalBytes: number;
}

/** 进度回调函数 */
export type ProgressCallback = (params: ProgressCallbackParams) => void;

/** 状态变化回调参数 */
export interface StateChangeCallbackParams {
  /** 消息 */
  message: string;
  /** 数据 */
  data: any;
}

/** 状态变化回调函数 */
export type StateChangeCallback = (state: string, params: StateChangeCallbackParams) => void;

/** 超级上传选项 */
export interface SuperUploadOptions {
  /** 存储桶名称 */
  bucketName: string;
  /** 上传后对象名称 */
  objectName: string;
  /** 上传数据, 类型为string时表示文件路径 */
  data: UploadData;
  /** 文件大小 */
  ContentLength: number;
  /** MimeType */
  ContentType?: string;
  /** 默认分片大小, 单位为bytes */
  chunkSize?: number;
  /** 分片并发数 */
  partConcurrency?: number;
  /** 存储类型 */
  StorageClass?: StorageClassType;
  /** 任务创建时间 */
  createTime?: string;
  /** 上传ID, 如果存在则表示任务已经初始化 */
  uploadId?: string;
  /** 数据类型 */
  dataType?: string;
  /** 上传进度回调函数 */
  onProgress?: ProgressCallback;
  /** 状态变化回调函数 */
  onStateChange?: StateChangeCallback;
}

/** 分片任务 */
interface MicroTask {
  /** 数据 */
  data: UploadData;
  /** 上传ID */
  uploadId: string;
  /** 存储桶名称 */
  bucketName: string;
  /** 对象名称 */
  objectName: string;
  /** 分片号 */
  partNumber: number;
  /** 分片大小 */
  partSize: number;
  /** 开始位置 */
  start: number;
  /** 结束位置 */
  end: number;
}

/** 已上传分片信息 */
interface UploadedPart {
  /** 分片号 */
  partNumber: number;
  /** 分片大小 */
  partSize: number;
  /** ETag */
  eTag: string;
}

/** 已存在分片列表结果 */
interface ExistedPartsResult {
  /** 分片列表 */
  parts: PartInfo[];
  /** 已上传字节数 */
  uploadedBytes: number;
  /** 创建时间 */
  createTime: string;
  /** 下一个分片号 */
  nextPartNum: number;
  /** 错误信息 */
  error: Error | null;
}

/** BOS 客户端接口（最小必需方法） */
interface BosClientLike {
  initiateMultipartUpload(
    bucket: string,
    key: string,
    options?: any
  ): Promise<BceResponse<InitiateMultipartUploadResponse>>;
  uploadPartFromFile(
    bucket: string,
    key: string,
    uploadId: string,
    partNumber: number,
    partSize: number,
    filename: string,
    start: number,
    options?: any
  ): Promise<BceResponse<UploadPartResponse>>;
  uploadPartFromDataUrl(
    bucket: string,
    key: string,
    uploadId: string,
    partNumber: number,
    partSize: number,
    dataUrl: string,
    options?: any
  ): Promise<BceResponse<UploadPartResponse>>;
  uploadPartFromBlob(
    bucket: string,
    key: string,
    uploadId: string,
    partNumber: number,
    partSize: number,
    blob: Blob,
    options?: any
  ): Promise<BceResponse<UploadPartResponse>>;
  listParts(bucket: string, key: string, uploadId: string, options?: any): Promise<BceResponse<ListPartsResponse>>;
  completeMultipartUpload(bucket: string, key: string, uploadId: string, parts: PartInfo[]): Promise<BceResponse>;
}

/**
 * 超级上传类 - 提供大文件分片上传功能
 *
 * @example
 * ```typescript
 * const superUpload = new SuperUpload(bosClient, {
 *   bucketName: 'my-bucket',
 *   objectName: 'large-file.zip',
 *   data: fileBuffer,
 *   ContentLength: fileBuffer.length,
 *   ContentType: 'application/zip',
 *   onProgress: (progress) => {
 *     console.log(`Upload progress: ${progress.percent}`);
 *   }
 * });
 *
 * await superUpload.start();
 * ```
 */
export class SuperUpload {
  /** BOS 客户端 */
  public client: BosClientLike;

  /** 当前状态 */
  public state: string;

  /** 存储桶名称 */
  public bucketName!: string;

  /** 对象名称 */
  public objectName!: string;

  /** 上传数据 */
  public data!: UploadData;

  /** 上传ID */
  public uploadId!: string;

  /** 内容类型 */
  public ContentType?: string;

  /** 内容长度 */
  public ContentLength!: number;

  /** 存储类型 */
  public StorageClass!: StorageClassType;

  /** 分片并发数 */
  public partConcurrency!: number;

  /** 分片大小 */
  public chunkSize!: number;

  /** 创建时间 */
  public createTime!: string;

  /** 进度回调 */
  public onProgress!: ProgressCallback | null;

  /** 状态变化回调 */
  public onStateChange!: StateChangeCallback | null;

  /** 数据类型 */
  private __dataType!: string;

  /** 已上传字节数 */
  private __uploadedBytes: number = 0;

  /** 已上传分片 */
  private __uploadedParts: UploadedPart[] = [];

  /** 上传速度集合 */
  private __speeds: number[] = [];

  /** 异常任务集合 */
  private __exceptionParts: MicroTask[] = [];

  /** 重试次数 */
  private __retryTimes: number = 0;

  /** 任务队列 */
  private __queue: any;

  /**
   * 构造函数
   * @param client BOS 客户端实例
   * @param options 上传选项
   */
  constructor(client: BosClientLike, options: SuperUploadOptions) {
    this.client = client;
    this.state = STATE.WAITING;
    this.__init(options);
  }

  /**
   * 初始化任务
   * @param options 上传选项
   */
  private __init(options: SuperUploadOptions): void {
    if (this.state !== STATE.WAITING) {
      debugLog('[__init] super upload already inited, skip.');
      return;
    }

    // 基本参数
    this.bucketName = options.bucketName;
    this.objectName = options.objectName;
    this.data = options.data;
    this.uploadId = options.uploadId || '';
    this.ContentType = options.ContentType;
    this.ContentLength = options.ContentLength;
    this.StorageClass = options.StorageClass || StorageClass.STANDARD;

    // 分片相关参数
    this.partConcurrency =
      Number.isInteger(options.partConcurrency) && options.partConcurrency! > 0
        ? options.partConcurrency!
        : UPLOAD_PART_CONCURRENCY;

    this.chunkSize =
      Number.isInteger(options.chunkSize) && options.chunkSize! > 0 ? options.chunkSize! : DEFAULT_UPLOAD_PART_SIZE;

    // 时间和回调
    this.createTime = options.createTime || (dayjs as any)().format('YYYY-MM-DDTHH:mm:ssZ');
    this.onProgress =
      options.onProgress && typeof options.onProgress === 'function' ? options.onProgress.bind(this) : null;
    this.onStateChange =
      options.onStateChange && typeof options.onStateChange === 'function' ? options.onStateChange.bind(this) : null;

    // 内部状态
    this.__dataType = options.dataType || DATATYPE.Buffer;
    this.__uploadedBytes = 0;
    this.__uploadedParts = [];
    this.__speeds = [];
    this.__exceptionParts = [];
    this.__retryTimes = 0;

    // 初始化任务队列
    this.__queue = async.queue(this.__uploadPart(), this.partConcurrency);

    this.__queue.drain(() => {
      debugLog('[queue] super upload queue drained.');
      this.__complete();
    });

    this.__queue.error((error: Error, task: MicroTask) => {
      debugLog('[queue] super upload queue task error: %j, task: %j', error, task);
    });

    // 更新状态
    this.state = STATE.INITED;

    if (this.onStateChange) {
      this.onStateChange(STATE.INITED, {
        message: 'bce-sdk:super-upload super upload inited.',
        data: null
      });
    }
  }

  /**
   * 开始上传任务
   */
  async start(): Promise<void> {
    if (this.state !== STATE.WAITING && this.state !== STATE.INITED) {
      debugLog('[start] super upload already started, skip.');
      return;
    }

    const client = this.client;
    const dataType = this.__dataType;
    const bucketName = this.bucketName;
    const objectName = this.objectName;

    debugLog(
      '[start] Multipart upload ready to start: %s - %s - %s - %s - %s',
      bucketName,
      objectName,
      dataType,
      this.ContentType,
      this.ContentLength
    );

    let uploadId = this.uploadId;

    // 如果没有 uploadId，初始化分片上传
    if (!uploadId) {
      const response = await client.initiateMultipartUpload(bucketName, objectName, {
        'Content-Type': this.ContentType,
        'x-bce-storage-class': this.StorageClass
      });

      uploadId = response.body.uploadId;
      this.uploadId = uploadId;
      debugLog('[start] <initiateMultipartUpload> uploadId: %s', uploadId);
    }

    // 获取已上传的分片
    const existedResult = await this.__listExistedParts();
    if (existedResult.error) {
      throw existedResult.error;
    }

    this.__uploadedBytes = existedResult.uploadedBytes;
    this.createTime = existedResult.createTime || this.createTime;

    // 生成分片任务
    const microTasks = this.__getMicroTasks(
      uploadId,
      existedResult.uploadedBytes,
      existedResult.parts.length,
      existedResult.nextPartNum
    );

    debugLog('[start] micro tasks count: %d', microTasks.length);

    // 更新状态为运行中
    this.state = STATE.RUNNING;
    if (this.onStateChange) {
      this.onStateChange(STATE.RUNNING, {
        message: 'bce-sdk:super-upload super upload started.',
        data: {uploadId, microTasksCount: microTasks.length}
      });
    }

    // 添加任务到队列
    microTasks.forEach((task) => {
      this.__queue.push(task);
    });
  }

  /**
   * 暂停上传
   */
  pause(): void {
    if (this.state !== STATE.RUNNING) {
      debugLog('[pause] super upload is not running, skip.');
      return;
    }

    this.state = STATE.PAUSED;
    debugLog('[pause] super upload paused.');

    if (this.onStateChange) {
      this.onStateChange(STATE.PAUSED, {
        message: 'bce-sdk:super-upload super upload paused.',
        data: null
      });
    }
  }

  /**
   * 恢复上传
   */
  resume(): void {
    if (this.state !== STATE.PAUSED) {
      debugLog('[resume] super upload is not paused, skip.');
      return;
    }

    this.state = STATE.RUNNING;
    debugLog('[resume] super upload resumed.');

    if (this.onStateChange) {
      this.onStateChange(STATE.RUNNING, {
        message: 'bce-sdk:super-upload super upload resumed.',
        data: null
      });
    }
  }

  /**
   * 取消上传
   */
  cancel(): void {
    this.state = STATE.CANCELLED;
    this.__queue.kill();
    debugLog('[cancel] super upload cancelled.');

    if (this.onStateChange) {
      this.onStateChange(STATE.CANCELLED, {
        message: 'bce-sdk:super-upload super upload cancelled.',
        data: null
      });
    }
  }

  /**
   * 检查是否已完成
   */
  isCompleted(): boolean {
    return this.state === STATE.COMPLETED;
  }

  /**
   * 检查是否正在运行
   */
  isRunning(): boolean {
    return this.state === STATE.RUNNING;
  }

  /**
   * 检查是否已暂停
   */
  isPaused(): boolean {
    return this.state === STATE.PAUSED;
  }

  /**
   * 检查是否已取消
   */
  isCancelled(): boolean {
    return this.state === STATE.CANCELLED;
  }

  /**
   * 检查是否失败
   */
  isFailed(): boolean {
    return this.state === STATE.FAILED;
  }

  /**
   * 获取已上传的分片列表
   */
  private async __listExistedParts(): Promise<ExistedPartsResult> {
    const client = this.client;
    const bucketName = this.bucketName;
    const objectName = this.objectName;
    const uploadId = this.uploadId;

    let uploadedBytes = 0;
    let nextPartNumberMarker = 0;
    let isTruncated = true;
    let createTime = '';
    let error: Error | null = null;
    const parts: PartInfo[] = [];

    while (isTruncated) {
      const tempBytes = uploadedBytes;
      const tempPartNumber = nextPartNumberMarker;

      try {
        const response = await client.listParts(
          bucketName,
          objectName,
          uploadId,
          tempPartNumber === -1 ? {} : {partNumberMarker: tempPartNumber}
        );

        debugLog('[__listExistedParts] <listParts> --->', omit(response.body, ['parts']));

        nextPartNumberMarker = response.body.nextPartNumberMarker || 0;
        isTruncated = response.body.isTruncated;

        if (createTime === '') {
          createTime = response.body.initiated || '';
        }

        response.body.parts.forEach((part: any) => {
          const formatSize = parseInt(part.size, 10);
          const partSize = isNaN(formatSize) ? 0 : formatSize;
          uploadedBytes += partSize;
          parts.push(part);
        });
      } catch (err) {
        isTruncated = false;
        error = err as Error;
      }
    }

    return {
      parts,
      uploadedBytes,
      createTime,
      nextPartNum: nextPartNumberMarker + 1,
      error
    };
  }

  /**
   * 生成分片任务
   */
  private __getMicroTasks(
    uploadId: string,
    uploadedBytes: number,
    uploadedPartCount: number,
    nextPartNum: number
  ): MicroTask[] {
    const bucketName = this.bucketName;
    const objectName = this.objectName;
    const ContentLength = this.ContentLength;
    const data = this.data;
    const isFresh = uploadedPartCount === 0;

    let remainSize = ContentLength - uploadedBytes;
    let offset = uploadedBytes;
    let partNumber = isFresh ? 1 : nextPartNum;
    const chunkSize = this.__calculatePartSize(remainSize, uploadedPartCount);

    debugLog('[__getMicroTasks] chunkSize: %d', chunkSize);

    const microTasks: MicroTask[] = [];

    while (remainSize > 0) {
      const partSize = Math.min(remainSize, chunkSize);

      const microTask: MicroTask = {
        data,
        uploadId,
        bucketName,
        objectName,
        partNumber,
        partSize,
        start: offset,
        end: offset + partSize - 1
      };

      microTasks.push(microTask);

      remainSize -= partSize;
      offset += partSize;
      partNumber += 1;
    }

    return microTasks;
  }

  /**
   * 动态计算分片大小
   */
  private __calculatePartSize(remainSize: number, uploadedPartCount: number): number {
    let partSize = this.chunkSize;
    let isPartSizeAvailable = Math.ceil(remainSize / partSize) + uploadedPartCount <= MAX_UPLOAD_PART_COUNT;

    while (!isPartSizeAvailable) {
      partSize += this.chunkSize;
      isPartSizeAvailable = Math.ceil(remainSize / partSize) + uploadedPartCount <= MAX_UPLOAD_PART_COUNT;
    }

    return partSize;
  }

  /**
   * 上传分片任务函数
   */
  private __uploadPart() {
    const context = this;
    const client = this.client;
    const bucketName = this.bucketName;
    const objectName = this.objectName;
    const dataType = this.__dataType;

    return function (task: MicroTask, callback: () => void) {
      const {start, partSize, partNumber, uploadId} = task;
      let resPromise: Promise<BceResponse<UploadPartResponse>>;
      const startTime = performance.now();

      // 检查任务状态
      if (context.isCancelled()) {
        return;
      }

      if (context.isPaused()) {
        context.__queue.push(task);
        callback();
        return;
      }

      // 根据数据类型选择上传方法
      if (dataType === DATATYPE.File) {
        resPromise = client.uploadPartFromFile(
          bucketName,
          objectName,
          uploadId,
          partNumber,
          partSize,
          task.data as string,
          start,
          {[H.CONTENT_LENGTH]: partSize}
        );
      } else if (dataType === DATATYPE.Buffer) {
        const buffer = task.data as Buffer;
        const dataURL = buffer.slice(start, start + partSize).toString('base64');
        resPromise = client.uploadPartFromDataUrl(bucketName, objectName, uploadId, partNumber, partSize, dataURL, {
          [H.CONTENT_LENGTH]: partSize
        });
      } else if (dataType === DATATYPE.Blob) {
        const blob = (task.data as Blob).slice(start, start + partSize);
        resPromise = client.uploadPartFromBlob(bucketName, objectName, uploadId, partNumber, partSize, blob, {
          [H.CONTENT_LENGTH]: partSize
        });
      } else {
        callback();
        return;
      }

      return resPromise
        .then((response) => {
          debugLog('[__uploadPart] success: [%d] [%s]', partNumber, response.http_headers.etag);

          const endTime = performance.now();
          const partElapsedTime = (endTime - startTime) / 1000;
          const speed = partElapsedTime === 0 ? 0 : partSize / partElapsedTime;

          context.__uploadedBytes += partSize;
          context.__uploadedParts.push({
            partNumber,
            partSize,
            eTag: response.http_headers.etag as string
          });
          context.__speeds.push(speed);

          context.__emitProgress({
            speed: mean(context.__speeds),
            progress: context.__uploadedBytes / context.ContentLength,
            uploadedBytes: context.__uploadedBytes,
            totalBytes: context.ContentLength
          });

          callback();
        })
        .catch((error) => {
          if (context.isCancelled()) {
            return;
          }

          debugLog('[__uploadPart] failed: [%d], error: %O', partNumber, error);

          const endTime = performance.now();
          const partElapsedTime = (endTime - startTime) / 1000;
          const speed = partElapsedTime === 0 ? 0 : partSize / partElapsedTime;

          context.__speeds.push(speed);
          context.__emitProgress({
            speed: mean(context.__speeds),
            progress: context.__uploadedBytes / context.ContentLength,
            uploadedBytes: context.__uploadedBytes,
            totalBytes: context.ContentLength
          });

          context.__exceptionParts.push(task);
          callback();
        });
    };
  }

  /**
   * 完成上传
   */
  private async __complete(): Promise<void> {
    // 如果有异常分片，标记为失败
    if (this.__exceptionParts.length > 0) {
      this.state = STATE.FAILED;
      if (this.onStateChange) {
        this.onStateChange(STATE.FAILED, {
          message: 'bce-sdk:super-upload super upload failed.',
          data: {exceptionParts: this.__exceptionParts}
        });
      }
      return;
    }

    try {
      // 完成分片上传
      const parts = sortBy(this.__uploadedParts, 'partNumber').map((part) => ({
        partNumber: part.partNumber,
        eTag: part.eTag
      }));

      await this.client.completeMultipartUpload(this.bucketName, this.objectName, this.uploadId, parts);

      this.state = STATE.COMPLETED;
      debugLog('[__complete] super upload completed.');

      if (this.onStateChange) {
        this.onStateChange(STATE.COMPLETED, {
          message: 'bce-sdk:super-upload super upload completed.',
          data: {parts}
        });
      }
    } catch (error) {
      this.state = STATE.FAILED;
      if (this.onStateChange) {
        this.onStateChange(STATE.FAILED, {
          message: 'bce-sdk:super-upload super upload failed to complete.',
          data: error
        });
      }
    }
  }

  /**
   * 发送进度事件
   */
  private __emitProgress(params: {speed: number; progress: number; uploadedBytes: number; totalBytes: number}): void {
    const normalizedParams: ProgressCallbackParams = {
      speed: `${filesize(params.speed, {base: 2, standard: 'jedec'})}/s`,
      progress: parseFloat(params.progress.toFixed(4)),
      percent: (params.progress * 100).toFixed(2) + '%',
      uploadedBytes: params.uploadedBytes,
      totalBytes: this.ContentLength
    };

    debugLog('[progress] %O', normalizedParams);

    if (this.onProgress) {
      this.onProgress(normalizedParams);
    }
  }
}

// 为向后兼容保留默认导出
export default SuperUpload;
