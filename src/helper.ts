/**
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * @file src/helper.ts
 * @author leeight
 */

import * as fs from 'fs';
import { Readable } from 'stream';
import * as async from 'async';
import * as url from 'url';
import * as util from 'util';
import debugLib from 'debug';

import { normalize, hasSuffix } from './strings';
import * as config from './config';
import type { BceConfig, BceResponse, Protocol, ProgressCallback } from './types/common';

const debugLog = debugLib('bce-sdk:helper');

// 超过这个限制就开始分片上传
const MIN_MULTIPART_SIZE = 5 * 1024 * 1024; // 5M

// 分片上传的时候，每个分片的大小
const PART_SIZE = 1 * 1024 * 1024; // 1M

// 数据类型枚举
enum DataType {
  FILE = 1,
  BUFFER = 2,
  STREAM = 3,
  BLOB = 4,
}

// cname形式的域名列表
const DEFAULT_CNAME_LIKE_LIST = ['.cdn.bcebos.com'];

/** 上传任务接口 */
interface UploadTask {
  data: string | Buffer | Blob;
  uploadId: string;
  bucket: string;
  object: string;
  partNumber: number;
  partSize: number;
  start: number;
  stop: number;
}

/** 分片信息接口 */
interface PartInfo {
  partNumber: number;
  eTag: string;
}

/** 进度状态接口 */
interface ProgressState {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

/** 域名解析结果接口 */
interface DomainInfo {
  protocol: string;
  host: string;
}

/** BOS客户端接口（最小必需方法） */
interface BosClientLike {
  putObject(bucket: string, object: string, data: any, options?: any): Promise<BceResponse>;
  putObjectFromFile(bucket: string, object: string, filename: string, options?: any): Promise<BceResponse>;
  putObjectFromBlob(bucket: string, object: string, blob: Blob, options?: any): Promise<BceResponse>;
  initiateMultipartUpload(bucket: string, object: string, options?: any): Promise<BceResponse<{ uploadId: string }>>;
  uploadPartFromFile(bucket: string, object: string, uploadId: string, partNumber: number, partSize: number, filename: string, start: number): Promise<BceResponse>;
  uploadPartFromDataUrl(bucket: string, object: string, uploadId: string, partNumber: number, partSize: number, dataUrl: string): Promise<BceResponse>;
  uploadPartFromBlob(bucket: string, object: string, uploadId: string, partNumber: number, partSize: number, blob: Blob): Promise<BceResponse>;
  completeMultipartUpload(bucket: string, object: string, uploadId: string, parts: PartInfo[]): Promise<BceResponse>;
  emit(event: string, data: any): void;
}

/** 端点处理选项接口 */
interface EndpointHandleOptions {
  bucketName?: string;
  endpoint: string;
  protocol: Protocol;
  region?: string;
  customGenerateUrl?: (bucketName?: string, region?: string) => string;
  cname_enabled?: boolean;
  pathStyleEnable?: boolean;
}

/**
 * 过滤 null 值的工具函数
 * @param value 值
 * @param key 键
 * @param object 对象
 * @returns 是否保留该值
 */
export function omitNull(value: any, key: string, object: any): boolean {
  return value != null;
}

/**
 * 自适应的按需上传文件
 * @param client BOS 客户端实例
 * @param bucket 存储桶名称
 * @param object 对象名称
 * @param data 要上传的数据
 * @param options 请求选项
 * @returns Promise
 */
export async function upload(
  client: BosClientLike,
  bucket: string,
  object: string,
  data: string | Buffer | Readable | Blob,
  options: any = {}
): Promise<BceResponse> {
  let contentLength = 0;
  let dataType: DataType | -1 = -1;

  if (typeof data === 'string') {
    // 文件路径
    try {
      contentLength = fs.lstatSync(data).size;
      dataType = DataType.FILE;
    } catch (error) {
      throw new Error(`Failed to read file: ${data}`);
    }
  } else if (Buffer.isBuffer(data)) {
    // Buffer
    contentLength = data.length;
    dataType = DataType.BUFFER;
  } else if (data instanceof Readable) {
    dataType = DataType.STREAM;
  } else if (typeof Blob !== 'undefined' && data instanceof Blob) {
    // 浏览器里面的对象
    contentLength = data.size;
    dataType = DataType.BLOB;
  }

  if (dataType === -1) {
    throw new Error('Unsupported `data` type.');
  }

  if (dataType === DataType.STREAM) {
    // XXX options['Content-Length'] 应该被设置过了吧？
    // 这种情况无法分片上传，只能直传了
    return client.putObject(bucket, object, data, options);
  } else if (contentLength <= MIN_MULTIPART_SIZE) {
    if (dataType === DataType.FILE) {
      return client.putObjectFromFile(bucket, object, data as string, options);
    } else if (dataType === DataType.BUFFER) {
      return client.putObject(bucket, object, data, options);
    } else if (dataType === DataType.BLOB) {
      return client.putObjectFromBlob(bucket, object, data as Blob, options);
    }
  } else if (contentLength > MIN_MULTIPART_SIZE) {
    // 开始分片上传
    debugLog('%s > %s -> multi-part', contentLength, MIN_MULTIPART_SIZE);
    return uploadViaMultipart(
      client,
      data as string | Buffer | Blob,
      dataType,
      bucket,
      object,
      contentLength,
      PART_SIZE,
      options
    );
  }

  throw new Error('Unexpected upload scenario');
}

/**
 * 分片上传实现
 * @param client BOS 客户端实例
 * @param data 上传的内容
 * @param dataType 数据类型
 * @param bucket 存储桶名称
 * @param object 对象名称
 * @param size 数据大小
 * @param partSize 分片大小
 * @param options 请求选项
 * @returns Promise
 */
async function uploadViaMultipart(
  client: BosClientLike,
  data: string | Buffer | Blob,
  dataType: DataType,
  bucket: string,
  object: string,
  size: number,
  partSize: number,
  options: any
): Promise<BceResponse> {
  let uploadId: string;

  try {
    const response = await client.initiateMultipartUpload(bucket, object, options);
    uploadId = response.body.uploadId;
    debugLog('initiateMultipartUpload = %j', response);

    const tasks = getTasks(data, uploadId, bucket, object, size, partSize);
    const state: ProgressState = {
      lengthComputable: true,
      loaded: 0,
      total: tasks.length,
    };

    const responses = await new Promise<BceResponse[]>((resolve, reject) => {
      async.mapLimit(
        tasks,
        2,
        uploadPart(client, dataType, state),
        (error: Error | null | undefined, results?: (BceResponse | undefined)[]) => {
          if (error) {
            reject(error);
          } else {
            resolve((results || []) as BceResponse[]);
          }
        }
      );
    });

    const parts: PartInfo[] = responses.map((response, index) => ({
      partNumber: index + 1,
      eTag: response.http_headers.etag as string,
    }));

    debugLog('parts = %j', parts);
    return client.completeMultipartUpload(bucket, object, uploadId, parts);
  } catch (error) {
    throw error;
  }
}

/**
 * 创建分片上传任务
 * @param client BOS 客户端
 * @param dataType 数据类型
 * @param state 进度状态
 * @returns 任务处理函数
 */
function uploadPart(
  client: BosClientLike,
  dataType: DataType,
  state: ProgressState
): (task: UploadTask, callback: (error: Error | null, result?: BceResponse) => void) => void {
  return (task: UploadTask, callback: (error: Error | null, result?: BceResponse) => void) => {
    const resolve = (response: BceResponse): void => {
      ++state.loaded;
      client.emit('progress', state);
      callback(null, response);
    };

    const reject = (error: Error): void => {
      callback(error);
    };

    if (dataType === DataType.FILE) {
      debugLog('client.uploadPartFromFile(%j)', { ...task, data: '[FILE_PATH]' });
      client
        .uploadPartFromFile(
          task.bucket,
          task.object,
          task.uploadId,
          task.partNumber,
          task.partSize,
          task.data as string,
          task.start
        )
        .then(resolve, reject);
    } else if (dataType === DataType.BUFFER) {
      // 没有直接 uploadPartFromBuffer 的接口，借用 DataUrl
      debugLog('client.uploadPartFromDataUrl(%j)', { ...task, data: '[BUFFER]' });
      const buffer = task.data as Buffer;
      const dataUrl = buffer.slice(task.start, task.stop + 1).toString('base64');
      client
        .uploadPartFromDataUrl(task.bucket, task.object, task.uploadId, task.partNumber, task.partSize, dataUrl)
        .then(resolve, reject);
    } else if (dataType === DataType.BLOB) {
      debugLog('client.uploadPartFromBlob(%j)', { ...task, data: '[BLOB]' });
      const blob = (task.data as Blob).slice(task.start, task.stop + 1);
      client
        .uploadPartFromBlob(task.bucket, task.object, task.uploadId, task.partNumber, task.partSize, blob)
        .then(resolve, reject);
    }
  };
}

/**
 * 生成分片任务列表
 * @param data 数据
 * @param uploadId 上传ID
 * @param bucket 存储桶
 * @param object 对象名
 * @param size 总大小
 * @param partSize 分片大小
 * @returns 任务列表
 */
function getTasks(
  data: string | Buffer | Blob,
  uploadId: string,
  bucket: string,
  object: string,
  size: number,
  partSize: number
): UploadTask[] {
  let leftSize = size;
  let offset = 0;
  let partNumber = 1;

  const tasks: UploadTask[] = [];
  while (leftSize > 0) {
    const xPartSize = Math.min(leftSize, partSize);
    tasks.push({
      data,
      uploadId,
      bucket,
      object,
      partNumber,
      partSize: xPartSize,
      start: offset,
      stop: offset + xPartSize - 1,
    });

    leftSize -= xPartSize;
    offset += xPartSize;
    partNumber += 1;
  }

  return tasks;
}

/**
 * 获取域名不带协议的部分
 * @param host 主机地址
 * @returns 域名信息
 */
function getDomainWithoutProtocol(host: string): DomainInfo {
  const urlObj = new URL(host);
  return {
    protocol: urlObj.protocol,
    host: urlObj.host,
  };
}

/**
 * 获取域名中不带端口号的部分
 * @param originHost 原始主机地址
 * @returns 主机名
 */
function getHostname(originHost: string): string {
  const urlObj = new URL(originHost);
  return urlObj.hostname;
}

/**
 * 判断是否为虚拟主机格式
 * @param host 主机地址
 * @returns 是否为虚拟主机
 */
function isVirtualHost(host: string): boolean {
  const domain = getHostname(host);
  const arr = domain.split('.');
  if (arr.length !== 4) {
    return false;
  }
  // bucketName rule: 只能包含小写字母、数字和"-"，开头结尾为小写字母和数字，长度在4-63之间
  // ends with bcebos.com
  if (!/^[a-z\d][a-z-\d]{2,61}[a-z\d]\.[a-z\d]+\.bcebos\.com$/.test(domain)) {
    return false;
  }

  return true;
}

/**
 * 判断是否为 IPv4 地址
 * @param input 输入字符串
 * @returns 是否为 IPv4
 */
function isIPv4(input: string): boolean {
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    input
  );
}

/**
 * 判断是否为 IPv6 地址
 * @param input 输入字符串
 * @returns 是否为 IPv6
 */
function isIPv6(input: string): boolean {
  return /^(([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))$/.test(
    input
  );
}

/**
 * 判断是否为 IP 主机
 * @param host 主机地址
 * @returns 是否为 IP 主机
 */
function isIpHost(host: string): boolean {
  const domain = getHostname(host);
  return isIPv4(domain) || isIPv6(domain);
}

/**
 * 判断是否为 BOS 默认官方主机
 * @param host 主机地址
 * @returns 是否为 BOS 主机
 */
function isBosHost(host: string): boolean {
  const domain = getHostname(host);
  const arr = domain.split('.');
  
  if (domain === 'bj-bos-sandbox.baidu-int.com') {
    return true;
  }
  
  if (arr.length !== 3) {
    return false;
  }
  
  if (!/\.bcebos\.com$/.test(domain)) {
    return false;
  }
  
  return true;
}

/**
 * 判断是否为 CNAME 类型主机
 * @param host 主机地址
 * @returns 是否为 CNAME 类型主机
 */
function isCnameLikeHost(host: string): boolean {
  // CDN加速 <xxx>.cdn.bcebos.com
  if (DEFAULT_CNAME_LIKE_LIST.some(suffix => hasSuffix(host.toLowerCase(), suffix))) {
    return true;
  }
  
  // virtual host
  if (isVirtualHost(host)) {
    return true;
  }
  
  return false;
}

/**
 * 检查是否需要兼容存储桶和端点
 * @param bucket 存储桶名称
 * @param endpoint 端点地址
 * @returns 是否需要兼容
 */
function needCompatibleBucketAndEndpoint(bucket?: string, endpoint?: string): boolean {
  if (!bucket || bucket === '' || !endpoint) {
    return false;
  }
  
  // virtual host
  if (!isVirtualHost(endpoint)) {
    return false;
  }
  
  // <bucket>.xxx
  if (endpoint.split('.')[0] === bucket) {
    return false;
  }
  
  // bucket from api and from endpoint is different
  // bucket = AAAA，endpoint = BBBB.bcebos.com
  // if like so, just pass to server and it will handle
  return true;
}

/**
 * 根据存储桶替换端点
 * @param bucket 存储桶名称
 * @param endpoint 端点地址
 * @returns 新的端点地址
 */
function replaceEndpointByBucket(bucket: string, endpoint: string): string {
  const { protocol, host } = getDomainWithoutProtocol(endpoint);
  const arr = host.split('.');
  arr[0] = bucket;
  return protocol + '//' + arr.join('.');
}

/**
 * 生成基础端点
 * @param protocol 协议
 * @param region 地域
 * @returns 基础端点地址
 */
function generateBaseEndpoint(protocol: Protocol, region: string): string {
  return util.format('%s://%s.%s', protocol, region, config.DEFAULT_BOS_DOMAIN);
}

/**
 * 处理端点地址
 * @param options 端点处理选项
 * @returns 处理后的端点地址
 */
function handleEndpoint(options: EndpointHandleOptions): string {
  const {
    bucketName,
    endpoint,
    protocol,
    region,
    customGenerateUrl,
    cname_enabled = false,
    pathStyleEnable = false,
  } = options;

  let resolvedEndpoint = endpoint;

  // 有自定义域名函数
  if (customGenerateUrl) {
    return customGenerateUrl(bucketName, region);
  }

  // 使用的是自定义域名 / virtual-host
  if (isCnameLikeHost(resolvedEndpoint) || cname_enabled) {
    // if virtual host endpoint and bucket is not empty, compatible bucket and endpoint
    if (needCompatibleBucketAndEndpoint(bucketName, resolvedEndpoint)) {
      // bucket from api and from endpoint is different
      resolvedEndpoint = replaceEndpointByBucket(bucketName!, resolvedEndpoint);
    }
  } else {
    // 非ip/bns，pathStyleEnable不为true，强制转为pathStyle
    // 否则保持原状
    if (!pathStyleEnable && !isIpHost(resolvedEndpoint)) {
      // if this region is provided, generate base endpoint
      if (region) {
        resolvedEndpoint = generateBaseEndpoint(protocol, region);
      }
      // service级别的接口不需要转换
      if (bucketName && isBosHost(resolvedEndpoint)) {
        const { protocol: urlProtocol, host } = getDomainWithoutProtocol(resolvedEndpoint);
        resolvedEndpoint = urlProtocol + '//' + bucketName + '.' + host;
      }
    }
  }

  return resolvedEndpoint;
}

/** 域名工具集合 */
export const domainUtils = {
  getDomainWithoutProtocol,
  isVirtualHost,
  isIpHost,
  isBosHost,
  isCnameLikeHost,
  needCompatibleBucketAndEndpoint,
  replaceEndpointByBucket,
  generateBaseEndpoint,
  handleEndpoint,
};

// 为向后兼容保留 CommonJS 导出
export default {
  omitNull,
  upload,
  domainUtils,
};