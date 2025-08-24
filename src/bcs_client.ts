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
 * @file src/bcs_client.ts
 * @author leeight
 */

import * as crypto from 'crypto';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as u from 'underscore';

import * as H from './headers';
import HttpClient from './http_client';
import BceBaseClient from './bce_base_client';
import MimeType from './mime.types';
import type { BceConfig, BceResponse } from './types/common';

const MAX_PUT_OBJECT_LENGTH = 5368709120; // 5G
const MAX_USER_METADATA_SIZE = 2048; // 2 * 1024

// ==================== 类型定义 ====================

/** BCS 配置选项 */
interface BcsClientOptions {
  config?: Partial<BceConfig>;
  headers?: Record<string, string>;
}

/** 访问控制列表 */
interface AccessControlList {
  accessControlList: Array<{
    grantee: Array<{ id: string }>;
    permission: Array<string>;
  }>;
}

/** 对象元数据 */
interface ObjectMetadata {
  [H.CONTENT_TYPE]?: string;
  [H.CONTENT_LENGTH]?: number;
  [H.CONTENT_MD5]?: string;
  [key: string]: any;
}

/** 列出对象的选项 */
interface ListObjectsOptions extends BcsClientOptions {
  start?: string;
  limit?: number;
}

/** 存储桶信息 */
interface Bucket {
  name: string;
  creationDate: string;
}

/** 对象信息 */
interface BcsObject {
  key: string;
  lastModified: string;
  eTag: string;
  size: number;
  storageClass: string;
  owner: {
    id: string;
    displayName: string;
  };
}

/**
 * BCS service API client
 *
 * @see http://developer.baidu.com/wiki/index.php?title=docs/cplat/bcs/api
 */
export default class BcsClient extends BceBaseClient {
  /**
   * 构造函数
   * @param config BCS 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'bcs', true);
  }

  // --- 存储桶管理 ---

  /**
   * 列出所有存储桶
   * @param options 选项
   * @returns Promise 解析为存储桶列表
   */
  public async listBuckets(options: BcsClientOptions = {}): Promise<BceResponse<{ buckets: Bucket[] }>> {
    return this.sendRequest('GET', '/', { config: options.config });
  }

  /**
   * 创建存储桶
   * @param bucketName 存储桶名称
   * @param options 选项
   * @returns Promise 解析为创建结果
   */
  public async createBucket(bucketName: string, options: BcsClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('PUT', `/${bucketName}`, {
      config: options.config
    });
  }

  /**
   * 设置存储桶访问控制列表
   * @param bucketName 存储桶名称
   * @param acl 访问控制列表
   * @param options 选项
   * @returns Promise 解析为设置结果
   */
  public async setBucketAcl(bucketName: string, acl: AccessControlList['accessControlList'], options: BcsClientOptions = {}): Promise<BceResponse<void>> {
    const headers: Record<string, string> = {};
    headers[H.CONTENT_TYPE] = 'application/json; charset=UTF-8';
    
    return this.sendRequest('PUT', `/${bucketName}?acl`, {
      body: JSON.stringify({ accessControlList: acl }),
      headers: headers,
      config: options.config
    });
  }

  /**
   * 设置存储桶预定义访问控制权限
   * @param bucketName 存储桶名称
   * @param cannedAcl 预定义权限
   * @param options 选项
   * @returns Promise 解析为设置结果
   */
  public async setBucketCannedAcl(bucketName: string, cannedAcl: string, options: BcsClientOptions = {}): Promise<BceResponse<void>> {
    const headers: Record<string, string> = {};
    headers[H.X_BCE_ACL] = cannedAcl;
    
    return this.sendRequest('PUT', `/${bucketName}?acl`, {
      headers: headers,
      config: options.config
    });
  }

  /**
   * 获取存储桶访问控制列表
   * @param bucketName 存储桶名称
   * @param options 选项
   * @returns Promise 解析为访问控制列表
   */
  public async getBucketAcl(bucketName: string, options: BcsClientOptions = {}): Promise<BceResponse<AccessControlList>> {
    return this.sendRequest('GET', `/${bucketName}?acl`, {
      config: options.config
    });
  }

  /**
   * 删除存储桶
   * @param bucketName 存储桶名称
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteBucket(bucketName: string, options: BcsClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/${bucketName}`, {
      config: options.config
    });
  }

  // --- 对象管理 ---

  /**
   * 删除对象
   * @param bucketName 存储桶名称
   * @param key 对象键
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteObject(bucketName: string, key: string, options: BcsClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/${bucketName}/${encodeURIComponent(key)}`, {
      config: options.config
    });
  }

  /**
   * 列出对象
   * @param bucketName 存储桶名称
   * @param options 选项
   * @returns Promise 解析为对象列表
   */
  public async listObjects(bucketName: string, options: ListObjectsOptions = {}): Promise<BceResponse<{ contents: BcsObject[] }>> {
    const params = u.extend({}, u.pick(options, 'start', 'limit'));

    return this.sendRequest('GET', `/${bucketName}`, {
      params: params,
      config: options.config
    });
  }

  /**
   * 获取对象元数据
   * @param bucketName 存储桶名称
   * @param key 对象键
   * @param options 选项
   * @returns Promise 解析为对象元数据
   */
  public async getObjectMetadata(bucketName: string, key: string, options: BcsClientOptions = {}): Promise<BceResponse<ObjectMetadata>> {
    return this.sendRequest('HEAD', `/${bucketName}/${encodeURIComponent(key)}`, {
      config: options.config
    });
  }

  /**
   * 上传对象
   * @param bucketName 存储桶名称
   * @param key 对象键
   * @param data 数据
   * @param options 选项
   * @returns Promise 解析为上传结果
   */
  public async putObject(bucketName: string, key: string, data: any, options: BcsClientOptions = {}): Promise<BceResponse<void>> {
    if (!key) {
      throw new TypeError('key should not be empty.');
    }

    const checkedOptions = this._checkOptions(options);

    return this.sendRequest('PUT', `/${bucketName}/${encodeURIComponent(key)}`, {
      body: data,
      headers: checkedOptions.headers,
      config: checkedOptions.config
    });
  }

  /**
   * 从 Blob 上传对象（浏览器环境）
   * @param bucketName 存储桶名称
   * @param key 对象键
   * @param blob Blob 对象
   * @param options 选项
   * @returns Promise 解析为上传结果
   */
  public async putObjectFromBlob(bucketName: string, key: string, blob: Blob, options: BcsClientOptions = {}): Promise<BceResponse<void>> {
    const headers: Record<string, string> = {};
    headers[H.CONTENT_LENGTH] = blob.size.toString();
    
    const extendedOptions = u.extend(headers, options);
    return this.putObject(bucketName, key, blob, extendedOptions);
  }

  /**
   * 从字符串上传对象
   * @param bucketName 存储桶名称
   * @param key 对象键
   * @param data 字符串数据
   * @param options 选项
   * @returns Promise 解析为上传结果
   */
  public async putObjectFromString(bucketName: string, key: string, data: string, options: BcsClientOptions = {}): Promise<BceResponse<void>> {
    const headers: Record<string, string> = {};
    headers[H.CONTENT_LENGTH] = Buffer.byteLength(data).toString();
    headers[H.CONTENT_MD5] = require('./crypto').md5sum(data, null, 'hex');
    
    const extendedOptions = u.extend(headers, options);
    return this.putObject(bucketName, key, data, extendedOptions);
  }

  /**
   * 从文件上传对象
   * @param bucketName 存储桶名称
   * @param key 对象键
   * @param filename 文件路径
   * @param options 选项
   * @returns Promise 解析为上传结果
   */
  public async putObjectFromFile(bucketName: string, key: string, filename: string, options: BcsClientOptions = {}): Promise<BceResponse<void>> {
    const headers: Record<string, string> = {};
    headers[H.CONTENT_LENGTH] = fs.statSync(filename).size.toString();
    headers[H.CONTENT_TYPE] = options.headers?.[H.CONTENT_TYPE] || MimeType.guess(path.extname(filename));
    
    const extendedOptions = u.extend(headers, options);
    const fp = fs.createReadStream(filename);
    
    if (!u.has(extendedOptions, H.CONTENT_MD5)) {
      const md5sum = await require('./crypto').md5file(filename, 'hex');
      extendedOptions.headers = extendedOptions.headers || {};
      extendedOptions.headers[H.CONTENT_MD5] = md5sum;
    }

    return this.putObject(bucketName, key, fp, extendedOptions);
  }

  // --- 私有方法 ---

  /**
   * 检查选项参数
   * @param options 选项
   * @returns 检查后的选项
   */
  private _checkOptions(options: BcsClientOptions): Required<BcsClientOptions> {
    return {
      config: options.config || {},
      headers: options.headers || {}
    };
  }
}