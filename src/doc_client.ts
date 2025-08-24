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
 * @file src/doc_client.ts
 * @author guofan
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import * as u from 'underscore';
import debugLib from 'debug';

import BosClient from './bos_client';
import BceBaseClient from './bce_base_client';
import * as UploadHelper from './helper';
import * as crypto from './crypto';
import type { BceConfig, BceResponse } from './types/common';

const debug = debugLib('bce-sdk:Document');

// 数据类型常量
const DATA_TYPE_FILE = 1;
const DATA_TYPE_BUFFER = 2;
const DATA_TYPE_BLOB = 4;

// ==================== 类型定义 ====================

/** 文档客户端选项 */
interface DocumentOptions {
  config?: Partial<BceConfig>;
  title?: string;
  format?: string;
  notification?: string;
  meta?: {
    md5?: string;
    [key: string]: any;
  };
}

/** 文档创建响应 */
interface CreateDocumentResponse {
  documentId: string;
  bucket: string;
  object: string;
  bosEndpoint: string;
}

/** 文档注册响应 */
interface RegisterResponse {
  documentId: string;
  bucket: string;
  object: string;
  bosEndpoint: string;
}

/** 文档状态 */
interface DocumentStatus {
  documentId: string;
  status: 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  createTime: string;
  publishTime?: string;
  title: string;
  format: string;
  sizeInBytes: number;
  pageCount?: number;
  error?: {
    code: string;
    message: string;
  };
}

/** 文档列表选项 */
interface ListDocumentsOptions {
  status?: 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  maxKeys?: number;
  marker?: string;
  config?: Partial<BceConfig>;
}

/**
 * 文档转码任务接口（Job/Transcoding API）
 * http://bce.baidu.com/doc/DOC/API.html#.1D.1E.B0.1E.6C.74.0C.6D.C1.68.D2.57.6F.70.EA.F1
 */
export default class Document extends BceBaseClient {
  private _documentId: string | null = null;

  /**
   * 构造函数
   * @param config 文档客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'doc', false);
  }

  /**
   * 构建 URL
   * @param extraPaths 额外路径段
   * @returns 完整的 URL 路径
   */
  private _buildUrl(...extraPaths: string[]): string {
    let baseUrl = '/v2/document';
    
    if (extraPaths.length) {
      baseUrl += '/' + extraPaths.join('/');
    }

    return baseUrl;
  }

  /**
   * 获取文档 ID
   * @returns 文档 ID
   */
  public getId(): string | null {
    return this._documentId;
  }

  /**
   * 设置文档 ID
   * @param documentId 文档 ID
   * @returns this（链式调用）
   */
  public setId(documentId: string): this {
    this._documentId = documentId;
    return this;
  }

  /**
   * 创建文档转码任务
   * @param data 文档数据（文件路径、Buffer、Blob 或 BOS 路径）
   * @param options 选项
   * @returns Promise 解析为创建结果
   */
  public async create(data: string | Buffer | Blob, options: DocumentOptions = {}): Promise<BceResponse<CreateDocumentResponse>> {
    const opts = { ...options };
    let dataType = -1;
    const pattern = /^bos:\/\//;

    if (typeof data === 'string') {
      if (pattern.test(data)) {
        // 从 BOS 创建
        try {
          const parsed = url.parse(data, true);
          const bucket = parsed.hostname!;
          const object = parsed.pathname!.substr(1);

          const queryOptions = parsed.query as any;
          const title = queryOptions.title || path.basename(object);
          const format = queryOptions.format || path.extname(object).substr(1);
          const notification = queryOptions.notification;

          return this.createFromBos(bucket, object, title, format, notification);
        } catch (error) {
          throw error;
        }
      }

      dataType = DATA_TYPE_FILE;
      opts.format = opts.format || path.extname(data).substr(1);
      opts.title = opts.title || path.basename(data, path.extname(data));
    } else if (Buffer.isBuffer(data)) {
      if (!opts.format || !opts.title) {
        throw new Error('buffer type required options.format and options.title');
      }
      dataType = DATA_TYPE_BUFFER;
    } else if (typeof Blob !== 'undefined' && data instanceof Blob) {
      dataType = DATA_TYPE_BLOB;
      opts.format = opts.format || path.extname((data as any).name).substr(1);
      opts.title = opts.title || path.basename((data as any).name, path.extname((data as any).name));
    } else {
      throw new Error('Unsupported dataType.');
    }

    if (!opts.title || !opts.format) {
      throw new Error('`title` and `format` are required.');
    }

    opts.meta = opts.meta || {};

    if (opts.meta.md5) {
      return this._doCreate(data, opts);
    }

    if (dataType === DATA_TYPE_FILE && typeof data === 'string') {
      const md5 = await crypto.md5stream(fs.createReadStream(data), 'hex');
      opts.meta.md5 = md5;
      return this._doCreate(data, opts);
    } else if (dataType === DATA_TYPE_BLOB && data instanceof Blob) {
      const md5 = await crypto.md5blob(data, 'hex');
      opts.meta.md5 = md5;
      return this._doCreate(data, opts);
    }

    return this._doCreate(data, opts);
  }

  /**
   * 从 BOS 创建文档
   * @param bucket 存储桶名称
   * @param object 对象键
   * @param title 文档标题
   * @param format 文档格式
   * @param notification 通知配置
   * @returns Promise 解析为创建结果
   */
  public async createFromBos(
    bucket: string,
    object: string,
    title: string,
    format: string,
    notification?: string
  ): Promise<BceResponse<CreateDocumentResponse>> {
    const url = this._buildUrl();
    
    const body: any = {
      title: title,
      format: format,
      sourceType: 'BosObject',
      source: {
        bucket: bucket,
        object: object
      }
    };

    if (notification) {
      body.notification = notification;
    }

    return this.sendRequest('POST', url, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  /**
   * 执行创建文档
   * @param data 文档数据
   * @param options 选项
   * @returns Promise 解析为创建结果
   */
  private async _doCreate(data: string | Buffer | Blob, options: DocumentOptions): Promise<BceResponse<CreateDocumentResponse>> {
    let documentId: string;
    let bucket: string;
    let object: string;
    let bosEndpoint: string;

    // 注册文档
    const registerResponse = await this.register(options);
    debug('register[response = %j]', registerResponse);

    documentId = registerResponse.body.documentId;
    bucket = registerResponse.body.bucket;
    object = registerResponse.body.object;
    bosEndpoint = registerResponse.body.bosEndpoint;

    // 上传到 BOS
    const bosConfig = { ...this.config, endpoint: bosEndpoint };
    const bosClient = new BosClient(bosConfig);

    const uploadResponse = await UploadHelper.upload(bosClient, bucket, object, data);
    debug('upload[response = %j]', uploadResponse);

    // 发布文档
    await this.publish();
    debug('publish completed');

    // 构造响应
    const response: BceResponse<CreateDocumentResponse> = {
      body: {
        documentId: documentId,
        bucket: bucket,
        object: object,
        bosEndpoint: bosEndpoint
      }
    } as BceResponse<CreateDocumentResponse>;

    return response;
  }

  /**
   * 注册文档
   * @param options 选项
   * @returns Promise 解析为注册结果
   */
  public async register(options: DocumentOptions): Promise<BceResponse<RegisterResponse>> {
    debug('register[options = %j]', options);

    const url = this._buildUrl();
    return this.sendRequest('POST', url, {
      params: { register: '' },
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
      config: options.config
    });
  }

  /**
   * 发布文档
   * @param options 选项
   * @returns Promise 解析为发布结果
   */
  public async publish(options: DocumentOptions = {}): Promise<BceResponse<void>> {
    const url = this._buildUrl(this._documentId!);
    return this.sendRequest('PUT', url, {
      params: { publish: '' },
      config: options.config
    });
  }

  /**
   * 读取文档状态
   * @param documentId 文档 ID（可选，默认使用当前设置的 ID）
   * @param options 选项
   * @returns Promise 解析为文档状态
   */
  public async read(documentId?: string, options: DocumentOptions = {}): Promise<BceResponse<DocumentStatus>> {
    const docId = documentId || this._documentId;
    if (!docId) {
      throw new Error('documentId is required');
    }

    const url = this._buildUrl(docId);
    return this.sendRequest('GET', url, {
      config: options.config
    });
  }

  /**
   * 列出文档
   * @param options 选项
   * @returns Promise 解析为文档列表
   */
  public async list(options: ListDocumentsOptions = {}): Promise<BceResponse<{ documents: DocumentStatus[] }>> {
    const url = this._buildUrl();
    const params = u.pick(options, 'status', 'maxKeys', 'marker');

    return this.sendRequest('GET', url, {
      params: params,
      config: options.config
    });
  }

  /**
   * 删除文档
   * @param documentId 文档 ID（可选，默认使用当前设置的 ID）
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async remove(documentId?: string, options: DocumentOptions = {}): Promise<BceResponse<void>> {
    const docId = documentId || this._documentId;
    if (!docId) {
      throw new Error('documentId is required');
    }

    const url = this._buildUrl(docId);
    return this.sendRequest('DELETE', url, {
      config: options.config
    });
  }
}