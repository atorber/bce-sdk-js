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
 * @file src/bos_client.ts
 * @author leeight
 */

import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as qs from 'querystring';
import * as stream from 'stream';

import * as u from 'underscore';
import Q from 'q';

import * as H from './headers';
import * as strings from './strings';
import Auth from './auth';
import * as crypto from './crypto';
import HttpClient from './http_client';
import BceBaseClient from './bce_base_client';
import MimeType from './mime.types';
import WMStream from './wm_stream';
import Multipart from './multipart';
import Base64 from './base64';
import { domainUtils } from './helper';
import debugLib from 'debug';
import SuperUpload from './bos/super_upload';

// Import types
import type { BceConfig, BceResponse, HttpResponseHeaders, ResponseMetadata, HttpMethod } from './types/common';
import type { RequestArgs } from './bce_base_client';
import type {
  BosObject,
  ListObjectsResponse,
  ListBucketsResponse,
  BucketMetadata,
  ObjectMetadata,
  PutObjectResponse,
  PutBucketResponse,
  DeleteObjectResponse,
  DeleteBucketResponse,
  CopyObjectResponse,
  MultipartUploadResponse,
  ListPartsResponse,
  ListMultipartUploadsResponse,
  RestoreObjectResponse,
  PostObjectResponse,
  SelectObjectResponse,
  GeneratePresignedUrlOptions,
  StorageClass,
  ServerSideEncryption,
  ObjectAcl,
  BucketAcl,
  CannedAcl,
  LifecycleRule,
  ReplicationRule,
  CorsRule,
  WebsiteConfiguration,
  LoggingConfiguration,
  EncryptionConfiguration,
  ObjectLockConfiguration,
  PolicyDocument,
  BosClientOptions,
  ListObjectsOptions,
  PutObjectOptions,
  GetObjectOptions,
  CopyObjectOptions,
  MultipartUploadOptions,
  AppendObjectOptions,
  RestoreObjectOptions,
  FetchObjectOptions,
  OptionsObjectOptions,
  SelectObjectOptions,
  SuperUploadOptions,
  SuperUploadProgressCallback,
  SuperUploadStateChangeCallback,
  AclConfiguration,
  UserQuotaConfiguration
} from './bos/types';

const debug = debugLib('bce-sdk:bos-client');

// Constants
const MAX_PUT_OBJECT_LENGTH = 5368709120; // 5G
const MAX_USER_METADATA_SIZE = 2048; // 2 * 1024
const MIN_PART_NUMBER = 1;
const MAX_PART_NUMBER = 10000;
const MAX_RETRY_COUNT = 3;

const COMMAND_MAP: Record<string, string> = {
  scale: 's',
  width: 'w',
  height: 'h',
  quality: 'q',
  format: 'f',
  angle: 'a',
  display: 'd',
  limit: 'l',
  crop: 'c',
  offsetX: 'x',
  offsetY: 'y',
  watermark: 'wm',
  key: 'k',
  gravity: 'g',
  gravityX: 'x',
  gravityY: 'y',
  opacity: 'o',
  text: 't',
  fontSize: 'sz',
  fontFamily: 'ff',
  fontColor: 'fc',
  fontStyle: 'fs'
};

const IMAGE_DOMAIN = 'bceimg.com';

/**
 * BOS service client for Baidu Object Storage
 * 
 * @see http://gollum.baidu.com/BOS_API#BOS-API文档
 */
export default class BosClient extends BceBaseClient {
  /**
   * Create a new BOS client instance
   * 
   * @param config - The BOS client configuration
   */
  constructor(config: BceConfig) {
    super(config, 'bos', true);
  }

  // --- URL Generation Methods ---

  /**
   * Generate a presigned URL with expiration time and optional arguments
   * 
   * @param bucketName - The target bucket name
   * @param key - The target object name
   * @param timestamp - A number representing timestamp in seconds
   * @param expirationInSeconds - Expire time in seconds
   * @param headers - Optional HTTP request headers
   * @param params - Optional sign params
   * @param headersToSign - Optional request headers list to calculate in the signature
   * @param config - The client configuration
   * @returns The presigned URL with authorization string
   */
  public generatePresignedUrl(
    bucketName: string,
    key: string,
    timestamp: number,
    expirationInSeconds: number,
    headers?: Record<string, string>,
    params?: Record<string, string>,
    headersToSign?: string[],
    config?: Partial<BceConfig>
  ): string {
    const mergedConfig = u.extend({}, this.config, config);
    const normalizedBucketName = mergedConfig.cname_enabled ? '' : bucketName;

    let endpoint = mergedConfig.endpoint;

    // Handle endpoint configuration
    endpoint = domainUtils.handleEndpoint({
      bucketName: normalizedBucketName,
      endpoint,
      protocol: mergedConfig.protocol,
      cname_enabled: mergedConfig.cname_enabled,
      pathStyleEnable: mergedConfig.pathStyleEnable,
      customGenerateUrl: mergedConfig.customGenerateUrl
    });

    const normalizedParams = params || {};

    const resource = path
      .normalize(
        path.join(
          mergedConfig.removeVersionPrefix ? '/' : '/v1',
          !mergedConfig.pathStyleEnable ? '' : strings.normalize(normalizedBucketName || ''),
          strings.normalize(key || '', false)
        )
      )
      .replace(/\\/g, '/');

    const normalizedHeaders = headers || {};
    normalizedHeaders.Host = require('url').parse(endpoint).host;

    const credentials = mergedConfig.credentials;
    const auth = new Auth(credentials.ak, credentials.sk);

    if (mergedConfig.sessionToken) {
      normalizedParams['x-bce-security-token'] = mergedConfig.sessionToken;
    }

    // Generate the authorization string and return the signed URL
    const authorization = auth.generateAuthorization(
      'GET',
      resource,
      normalizedParams,
      normalizedHeaders,
      timestamp,
      expirationInSeconds,
      headersToSign
    );

    normalizedParams.authorization = authorization;

    return util.format('%s%s?%s', endpoint, resource, qs.encode(normalizedParams));
  }

  /**
   * Generate a URL for object access with optional image processing pipeline
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param pipeline - Image processing pipeline configuration
   * @param cdn - CDN domain
   * @param config - Optional configuration
   * @returns The generated URL
   */
  public generateUrl(
    bucketName: string,
    key: string,
    pipeline?: string | Record<string, any>[],
    cdn?: string,
    config?: Partial<BceConfig>
  ): string {
    const mergedConfig = u.extend({}, this.config, config);
    const normalizedBucketName = mergedConfig.cname_enabled ? '' : bucketName;

    const resource = path
      .normalize(
        path.join(
          mergedConfig.removeVersionPrefix ? '/' : '/v1',
          strings.normalize(normalizedBucketName || ''),
          strings.normalize(key || '', false)
        )
      )
      .replace(/\\/g, '/');

    // Process pipeline for image transformations
    let command = '';
    if (pipeline) {
      if (u.isString(pipeline)) {
        if (/^@/.test(pipeline)) {
          command = pipeline;
        } else {
          command = '@' + pipeline;
        }
      } else {
        command =
          '@' +
          u
            .map(pipeline, function (params) {
              return u
                .map(params, function (value, key) {
                  return [COMMAND_MAP[key] || key, value].join('_');
                })
                .join(',');
            })
            .join('|');
      }
    }

    if (command) {
      // Generate image transcoding URL
      if (cdn) {
        return util.format('http://%s/%s%s', cdn, path.normalize(key), command);
      }
      return util.format(
        'http://%s.%s/%s%s',
        path.normalize(normalizedBucketName),
        IMAGE_DOMAIN,
        path.normalize(key),
        command
      );
    }

    return util.format('%s%s%s', this.config.endpoint, resource, command);
  }

  // --- Bucket Management Methods ---

  /**
   * List all buckets
   * 
   * @param options - Optional configuration
   * @returns Promise resolving to the list of buckets
   */
  public listBuckets(options?: BosClientOptions): Promise<BceResponse<ListBucketsResponse>> {
    const opts = options || {};
    return this.sendRequest('GET', { config: opts.config });
  }

  /**
   * Create a new bucket
   * 
   * @param bucketName - The bucket name to create
   * @param options - Optional bucket configuration
   * @returns Promise resolving to the creation response
   */
  public createBucket(bucketName: string, options?: { body?: { enableMultiAZ?: boolean }; config?: Partial<BceConfig> }): Promise<BceResponse<PutBucketResponse>> {
    const opts = options || {};

    return this.sendRequest('PUT', {
      bucketName: bucketName,
      body: JSON.stringify({
        enableMultiAZ: !!(opts.body && opts.body.enableMultiAZ)
      }),
      config: opts.config
    });
  }

  /**
   * Alias for createBucket
   */
  public putBucket = this.createBucket;

  /**
   * Delete a bucket
   * 
   * @param bucketName - The bucket name to delete
   * @param options - Optional configuration
   * @returns Promise resolving to the deletion response
   */
  public deleteBucket(bucketName: string, options?: BosClientOptions): Promise<BceResponse<DeleteBucketResponse>> {
    const opts = options || {};

    return this.sendRequest('DELETE', {
      bucketName: bucketName,
      config: opts.config
    });
  }

  /**
   * Check if a bucket exists
   * 
   * @param bucketName - The bucket name to check
   * @param options - Optional configuration
   * @returns Promise resolving to true if bucket exists, false otherwise
   */
  public headBucket(bucketName: string, options?: BosClientOptions): Promise<boolean> {
    const opts = options || {};

    return this.sendRequest('HEAD', {
      bucketName: bucketName,
      config: opts.config
    }).then(
      () => Q.resolve(true),
      (e: any) => {
        if (e && e[H.X_STATUS_CODE] === 403) {
          return Q.resolve(true);
        }
        if (e && e[H.X_STATUS_CODE] === 404) {
          return Q.resolve(false);
        }
        return Q.reject(e);
      }
    );
  }

  /**
   * Alias for headBucket
   */
  public doesBucketExist = this.headBucket;

  /**
   * Get bucket location
   * 
   * @param bucketName - The bucket name
   * @param options - Optional configuration
   * @returns Promise resolving to the bucket location
   */
  public getBucketLocation(bucketName: string, options?: BosClientOptions): Promise<BceResponse<{ locationConstraint: string }>> {
    const opts = options || {};

    return this.sendRequest('GET', {
      bucketName: bucketName,
      params: { location: '' },
      config: opts.config
    });
  }

  // --- Bucket Configuration Methods ---

  /**
   * Set bucket static website hosting configuration
   * 
   * @param bucketName - The bucket name
   * @param body - Website configuration
   * @param options - Optional configuration
   * @returns Promise resolving to the response
   */
  public putBucketStaticWebsite(
    bucketName: string,
    body: WebsiteConfiguration,
    options?: BosClientOptions
  ): Promise<BceResponse<void>> {
    const opts = options || {};
    const normalizedBody = u.pick(body || {}, ['index', 'notFound']);

    if (!bucketName) {
      throw new TypeError('bucketName should not be empty.');
    }

    if (normalizedBody.index && typeof normalizedBody.index !== 'string') {
      throw new TypeError('field "index" should be a string.');
    }

    if (normalizedBody.notFound && typeof normalizedBody.notFound !== 'string') {
      throw new TypeError('field "notFound" should be a string.');
    }

    return this.sendRequest('PUT', {
      bucketName: bucketName,
      params: { website: '' },
      body: JSON.stringify(normalizedBody),
      config: opts.config
    });
  }

  /**
   * Get bucket static website hosting configuration
   * 
   * @param bucketName - The bucket name
   * @param options - Optional configuration
   * @returns Promise resolving to the website configuration
   */
  public getBucketStaticWebsite(bucketName: string, options?: BosClientOptions): Promise<BceResponse<WebsiteConfiguration>> {
    const opts = options || {};

    if (!bucketName) {
      throw new TypeError('bucketName should not be empty.');
    }

    return this.sendRequest('GET', {
      bucketName: bucketName,
      params: { website: '' },
      config: opts.config
    });
  }

  /**
   * Delete bucket static website hosting configuration
   * 
   * @param bucketName - The bucket name
   * @param options - Optional configuration
   * @returns Promise resolving to the response
   */
  public deleteBucketStaticWebsite(bucketName: string, options?: BosClientOptions): Promise<BceResponse<void>> {
    const opts = options || {};

    if (!bucketName) {
      throw new TypeError('bucketName should not be empty.');
    }

    return this.sendRequest('DELETE', {
      bucketName: bucketName,
      params: { website: '' },
      config: opts.config
    });
  }

  /**
   * Enable bucket encryption
   * 
   * @param bucketName - The bucket name
   * @param options - Encryption options
   * @returns Promise resolving to the response
   */
  public putBucketEncryption(
    bucketName: string,
    options: { headers: { encryptionAlgorithm: ServerSideEncryption }; config?: Partial<BceConfig> }
  ): Promise<BceResponse<void>> {
    if (!bucketName) {
      throw new TypeError('bucketName should not be empty.');
    }

    const opts = this._checkOptions(options || {});

    if (!opts.headers.encryptionAlgorithm) {
      throw new TypeError('encryptionAlgorithm should not be empty.');
    }

    return this.sendRequest('PUT', {
      bucketName: bucketName,
      params: { encryption: '' },
      headers: opts.headers,
      config: opts.config
    });
  }

  /**
   * Get bucket encryption configuration
   * 
   * @param bucketName - The bucket name
   * @param options - Optional configuration
   * @returns Promise resolving to the encryption configuration
   */
  public getBucketEncryption(bucketName: string, options?: BosClientOptions): Promise<BceResponse<EncryptionConfiguration>> {
    if (!bucketName) {
      throw new TypeError('bucketName should not be empty.');
    }

    const opts = options || {};

    return this.sendRequest('GET', {
      bucketName: bucketName,
      params: { encryption: '' },
      config: opts.config
    });
  }

  /**
   * Delete bucket encryption configuration
   * 
   * @param bucketName - The bucket name
   * @param options - Optional configuration
   * @returns Promise resolving to the response
   */
  public deleteBucketEncryption(bucketName: string, options?: BosClientOptions): Promise<BceResponse<void>> {
    if (!bucketName) {
      throw new TypeError('bucketName should not be empty.');
    }

    const opts = options || {};

    return this.sendRequest('DELETE', {
      bucketName: bucketName,
      params: { encryption: '' },
      config: opts.config
    });
  }

  /**
   * Set bucket default storage class
   * 
   * @param bucketName - The bucket name
   * @param storageClass - The storage class to set
   * @param options - Optional configuration
   * @returns Promise resolving to the response
   */
  public putBucketStorageClass(
    bucketName: string,
    storageClass: StorageClass,
    options?: BosClientOptions
  ): Promise<BceResponse<void>> {
    if (!bucketName) {
      throw new TypeError('bucketName should not be empty.');
    }

    if (!storageClass) {
      throw new TypeError('storageClass should not be empty.');
    }

    const opts = options || {};

    return this.sendRequest('PUT', {
      bucketName: bucketName,
      params: { storageClass: '' },
      headers: {
        'x-bce-storage-class': storageClass
      },
      config: opts.config
    });
  }

  /**
   * Get bucket default storage class
   * 
   * @param bucketName - The bucket name
   * @param options - Optional configuration
   * @returns Promise resolving to the storage class
   */
  public getBucketStorageClass(
    bucketName: string,
    options?: BosClientOptions
  ): Promise<BceResponse<{ storageClass: StorageClass }>> {
    if (!bucketName) {
      throw new TypeError('bucketName should not be empty.');
    }

    const opts = options || {};

    return this.sendRequest('GET', {
      bucketName: bucketName,
      params: { storageClass: '' },
      config: opts.config
    });
  }

  /**
   * Alias for getBucketStorageClass (lowercase c)
   * 
   * @param bucketName - The bucket name
   * @param options - Optional configuration
   * @returns Promise resolving to the storage class
   */
  public getBucketStorageclass = this.getBucketStorageClass;

  // --- Object Management Methods ---

  /**
   * List objects in a bucket
   * 
   * @param bucketName - The bucket name
   * @param options - List options
   * @returns Promise resolving to the list of objects
   */
  public listObjects(bucketName: string, options?: ListObjectsOptions & { config?: Partial<BceConfig> }): Promise<BceResponse<ListObjectsResponse>> {
    const opts = options || {};
    const params = u.extend(
      { maxKeys: 1000 },
      u.pick(opts, 'maxKeys', 'prefix', 'marker', 'delimiter')
    );

    return this.sendRequest('GET', {
      bucketName: bucketName,
      params: params,
      config: (opts as any).config
    });
  }

  /**
   * Delete multiple objects
   * 
   * @param bucketName - The bucket name
   * @param objects - Array of object keys to delete
   * @param options - Optional configuration
   * @returns Promise resolving to the deletion response
   */
  public deleteMultipleObjects(
    bucketName: string,
    objects: string[],
    options?: BosClientOptions
  ): Promise<BceResponse<{ errors?: any[] }>> {
    const opts = options || {};

    const body = u.map(objects, function (object) {
      return { key: object };
    });

    return this.sendRequest('POST', {
      bucketName: bucketName,
      params: { delete: '' },
      body: JSON.stringify({
        objects: body
      }),
      config: opts.config
    });
  }

  /**
   * Delete a single object
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param options - Optional configuration
   * @returns Promise resolving to the deletion response
   */
  public deleteObject(bucketName: string, key: string, options?: BosClientOptions): Promise<BceResponse<DeleteObjectResponse>> {
    const opts = options || {};

    return this.sendRequest('DELETE', {
      bucketName: bucketName,
      key: key,
      config: opts.config
    });
  }

  /**
   * Upload an object to BOS
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param data - The object data
   * @param options - Upload options
   * @returns Promise resolving to the upload response
   */
  public putObject(
    bucketName: string,
    key: string,
    data: string | Buffer | stream.Readable,
    options?: PutObjectOptions
  ): Promise<BceResponse<PutObjectResponse>> {
    if (!key) {
      throw new TypeError('key should not be empty.');
    }

    const opts = this._checkOptions(options || {});

    return this.sendRequest('PUT', {
      bucketName: bucketName,
      key: key,
      body: data,
      headers: opts.headers,
      config: opts.config
    });
  }

  /**
   * Upload an object from a Blob (browser environment)
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param blob - The Blob data
   * @param options - Upload options
   * @returns Promise resolving to the upload response
   */
  public putObjectFromBlob(
    bucketName: string,
    key: string,
    blob: Blob,
    options?: PutObjectOptions
  ): Promise<BceResponse<PutObjectResponse>> {
    const headers: Record<string, any> = {};

    // https://developer.mozilla.org/en-US/docs/Web/API/Blob/size
    headers[H.CONTENT_LENGTH] = blob.size;
    // For browser API calls, we don't add H.CONTENT_MD5 by default as it's slow to compute
    // and according to the API documentation, this field is not required.
    const mergedOptions = u.extend(headers, options);

    return this.putObject(bucketName, key, blob as any, mergedOptions);
  }

  /**
   * Upload an object from a base64 data URL
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param data - Base64 encoded data
   * @param options - Upload options
   * @returns Promise resolving to the upload response
   */
  public putObjectFromDataUrl(
    bucketName: string,
    key: string,
    data: string,
    options?: PutObjectOptions
  ): Promise<BceResponse<PutObjectResponse>> {
    const buffer = Buffer.from(data, 'base64');

    const headers: Record<string, any> = {};
    headers[H.CONTENT_LENGTH] = buffer.length;
    // For browser API calls, we don't add H.CONTENT_MD5 by default as it's slow to compute
    const mergedOptions = u.extend(headers, options);

    return this.putObject(bucketName, key, buffer, mergedOptions);
  }

  /**
   * Upload an object from a string
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param data - String data
   * @param options - Upload options
   * @returns Promise resolving to the upload response
   */
  public putObjectFromString(
    bucketName: string,
    key: string,
    data: string,
    options?: PutObjectOptions
  ): Promise<BceResponse<PutObjectResponse>> {
    const opts = options || {};

    const headers: Record<string, any> = {};
    headers[H.CONTENT_LENGTH] = Buffer.byteLength(data);
    headers[H.CONTENT_TYPE] = opts[H.CONTENT_TYPE] || MimeType.guess(path.extname(key));
    headers[H.CONTENT_MD5] = crypto.md5sum(data);
    const mergedOptions = u.extend(headers, opts);

    return this.putObject(bucketName, key, data, mergedOptions);
  }

  /**
   * Upload an object from a file
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param filename - Path to the file
   * @param options - Upload options
   * @returns Promise resolving to the upload response
   */
  public putObjectFromFile(
    bucketName: string,
    key: string,
    filename: string,
    options?: PutObjectOptions
  ): Promise<BceResponse<PutObjectResponse>> {
    const opts = options || {};

    const headers: Record<string, any> = {};

    // If not explicitly set, use the default value
    const fileSize = fs.statSync(filename).size;
    const contentLength = u.has(opts, H.CONTENT_LENGTH) ? opts[H.CONTENT_LENGTH] : fileSize;
    if (contentLength! > fileSize) {
      throw new Error(`options['Content-Length'] should less than ${fileSize}`);
    }

    headers[H.CONTENT_LENGTH] = contentLength!;

    // Because Firefox will automatically add charset attribute to Content-Type when making requests
    // This causes our Content-Type value used for signature calculation to be different from what the server receives
    // To solve this problem, we need to explicitly declare Charset
    headers[H.CONTENT_TYPE] = opts[H.CONTENT_TYPE] || MimeType.guess(path.extname(filename));
    const mergedOptions = u.extend(headers, opts);

    const streamOptions = {
      start: 0,
      end: Math.max(0, contentLength! - 1)
    };

    const me = this;

    function putObjectWithRetry(lastRetryTimes: number): Promise<BceResponse<PutObjectResponse>> {
      return me.putObject(bucketName, key, fs.createReadStream(filename, streamOptions), mergedOptions).catch(function (err: any) {
        const serverTimestamp = new Date(err[H.X_BCE_DATE]).getTime();

        BceBaseClient.prototype.timeOffset = serverTimestamp - Date.now();

        if (err[H.X_STATUS_CODE] === 400 && err[H.X_CODE] === 'Http400' && lastRetryTimes > 0) {
          return putObjectWithRetry(--lastRetryTimes);
        }

        return Q.reject(err);
      });
    }

    if (!u.has(mergedOptions, H.CONTENT_MD5)) {
      const fp2 = fs.createReadStream(filename, streamOptions);
      return crypto.md5stream(fp2).then(function (md5sum: string) {
        mergedOptions[H.CONTENT_MD5] = md5sum;
        return putObjectWithRetry(mergedOptions.retryCount || MAX_RETRY_COUNT);
      });
    }

    return putObjectWithRetry(mergedOptions.retryCount || MAX_RETRY_COUNT);
  }

  /**
   * Get object metadata (HEAD request)
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param options - Optional configuration
   * @returns Promise resolving to the object metadata
   */
  public getObjectMetadata(bucketName: string, key: string, options?: BosClientOptions): Promise<BceResponse<ObjectMetadata>> {
    const opts = options || {};

    return this.sendRequest('HEAD', {
      bucketName: bucketName,
      key: key,
      config: opts.config
    });
  }

  /**
   * Get an object from BOS
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param range - Optional byte range
   * @param options - Get options
   * @returns Promise resolving to the object data
   */
  public getObject(
    bucketName: string,
    key: string,
    range?: string,
    options?: GetObjectOptions
  ): Promise<BceResponse<{ body: Buffer }>> {
    if (!key) {
      throw new TypeError('key should not be empty.');
    } else if (/\/\/+/.test(key)) {
      throw new TypeError('key should not contain consecutive forward slashes (/)');
    } else if (/^[\/\\]/.test(key) || /[\/\\]$/.test(key)) {
      throw new TypeError('key should not start or end with a forward slash (/) or a backslash (\\)');
    } else if (/\/\.\.\//g.test(key)) {
      throw new TypeError('path in key should not contain consecutive periods (..).');
    }

    const opts = (options || {}) as GetObjectOptions & { config?: Partial<BceConfig>; [H.X_BCE_TRAFFIC_LIMIT]?: number };
    const headers: Record<string, any> = {};
    
    if (opts[H.X_BCE_TRAFFIC_LIMIT as keyof typeof opts]) {
      const limit = opts[H.X_BCE_TRAFFIC_LIMIT as keyof typeof opts] as number;

      if (typeof limit !== 'number' || limit < 819200 || limit > 838860800) {
        throw new TypeError('x-bce-traffic-limit range should be 819200~838860800');
      }

      headers[H.X_BCE_TRAFFIC_LIMIT] = limit;
    }

    const outputStream = new WMStream();
    return this.sendRequest('GET', {
      bucketName: bucketName,
      key: key,
      headers: u.extend(
        {
          Range: range ? util.format('bytes=%s', range) : ''
        },
        headers
      ),
      config: opts.config,
      outputStream: outputStream
    }).then(function (response: any) {
      response.body = Buffer.concat(outputStream.store);
      return response;
    });
  }

  /**
   * Copy an object within BOS
   * 
   * @param sourceBucketName - Source bucket name
   * @param sourceKey - Source object key
   * @param targetBucketName - Target bucket name
   * @param targetKey - Target object key
   * @param options - Copy options
   * @returns Promise resolving to the copy response
   */
  public copyObject(
    sourceBucketName: string,
    sourceKey: string,
    targetBucketName: string,
    targetKey: string,
    options?: CopyObjectOptions
  ): Promise<BceResponse<CopyObjectResponse>> {
    if (!sourceBucketName) {
      throw new TypeError('sourceBucketName should not be empty');
    }
    if (!sourceKey) {
      throw new TypeError('sourceKey should not be empty');
    }
    if (!targetBucketName) {
      throw new TypeError('targetBucketName should not be empty');
    }
    if (!targetKey) {
      throw new TypeError('targetKey should not be empty');
    }

    const opts = this._checkOptions(options || {});
    let hasUserMetadata = false;
    
    u.some(opts.headers, function (value, key) {
      if (key.indexOf('x-bce-meta-') === 0) {
        hasUserMetadata = true;
        return true;
      }
      return false;
    });
    
    opts.headers['x-bce-copy-source'] = strings.normalize(util.format('/%s/%s', sourceBucketName, sourceKey), false);
    
    if (u.has(opts.headers, 'ETag')) {
      opts.headers['x-bce-copy-source-if-match'] = opts.headers.ETag;
    }
    
    opts.headers['x-bce-metadata-directive'] = hasUserMetadata ? 'replace' : 'copy';

    return this.sendRequest('PUT', {
      bucketName: targetBucketName,
      key: targetKey,
      headers: opts.headers,
      config: opts.config
    });
  }

  // --- Super Upload Method ---

  /**
   * Initiate multipart upload
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param options - Upload options
   * @returns Promise resolving to the initiation response
   */
  public initiateMultipartUpload(
    bucketName: string,
    key: string,
    options?: MultipartUploadOptions
  ): Promise<BceResponse<MultipartUploadResponse>> {
    const opts = options || {};

    const headers: Record<string, any> = {};
    headers[H.CONTENT_TYPE] = MimeType.guess(path.extname(key));

    const mergedOptions = this._checkOptions(u.extend(headers, opts));

    return this.sendRequest('POST', {
      bucketName: bucketName,
      key: key,
      params: { uploads: '' },
      headers: mergedOptions.headers,
      config: mergedOptions.config
    });
  }

  /**
   * Upload part from file
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param uploadId - The upload ID
   * @param partNumber - The part number
   * @param partSize - The part size
   * @param filename - The file path
   * @param offset - The file offset
   * @param options - Upload options
   * @returns Promise resolving to the upload response
   */
  public uploadPartFromFile(
    bucketName: string,
    key: string,
    uploadId: string,
    partNumber: number,
    partSize: number,
    filename: string,
    offset: number,
    options?: MultipartUploadOptions
  ): Promise<BceResponse<any>> {
    const start = offset;
    const end = offset + partSize - 1;
    const partFp = fs.createReadStream(filename, {
      start: start,
      end: end
    });
    return this.uploadPart(bucketName, key, uploadId, partNumber, partSize, partFp, options);
  }

  /**
   * Upload part from Blob
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param uploadId - The upload ID
   * @param partNumber - The part number
   * @param partSize - The part size
   * @param blob - The Blob data
   * @param options - Upload options
   * @returns Promise resolving to the upload response
   */
  public uploadPartFromBlob(
    bucketName: string,
    key: string,
    uploadId: string,
    partNumber: number,
    partSize: number,
    blob: Blob,
    options?: MultipartUploadOptions
  ): Promise<BceResponse<any>> {
    if (blob.size !== partSize) {
      throw new TypeError(util.format('Invalid partSize %d and data length %d', partSize, blob.size));
    }

    const headers: Record<string, any> = {};
    headers[H.CONTENT_LENGTH] = partSize;
    headers[H.CONTENT_TYPE] = 'application/octet-stream';

    const mergedOptions = this._checkOptions(u.extend(headers, options));
    return this.sendRequest('PUT', {
      bucketName: bucketName,
      key: key,
      body: blob,
      headers: mergedOptions.headers,
      params: {
        partNumber: partNumber,
        uploadId: uploadId
      },
      config: mergedOptions.config
    });
  }

  /**
   * Upload part from data URL
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param uploadId - The upload ID
   * @param partNumber - The part number
   * @param partSize - The part size
   * @param dataUrl - Base64 encoded data
   * @param options - Upload options
   * @returns Promise resolving to the upload response
   */
  public uploadPartFromDataUrl(
    bucketName: string,
    key: string,
    uploadId: string,
    partNumber: number,
    partSize: number,
    dataUrl: string,
    options?: MultipartUploadOptions
  ): Promise<BceResponse<any>> {
    const data = Buffer.from(dataUrl, 'base64');
    if (data.length !== partSize) {
      throw new TypeError(util.format('Invalid partSize %d and data length %d', partSize, data.length));
    }

    const headers: Record<string, any> = {};
    headers[H.CONTENT_LENGTH] = partSize;
    headers[H.CONTENT_TYPE] = 'application/octet-stream';

    const mergedOptions = this._checkOptions(u.extend(headers, options));
    return this.sendRequest('PUT', {
      bucketName: bucketName,
      key: key,
      body: data,
      headers: mergedOptions.headers,
      params: {
        partNumber: partNumber,
        uploadId: uploadId
      },
      config: mergedOptions.config
    });
  }

  /**
   * Upload a part for multipart upload
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param uploadId - The upload ID
   * @param partNumber - The part number
   * @param partSize - The part size
   * @param partFp - The part file stream
   * @param options - Upload options
   * @returns Promise resolving to the upload response
   */
  public uploadPart(
    bucketName: string,
    key: string,
    uploadId: string,
    partNumber: number,
    partSize: number,
    partFp: fs.ReadStream,
    options?: MultipartUploadOptions
  ): Promise<BceResponse<any>> {
    if (!bucketName) {
      throw new TypeError('bucketName should not be empty');
    }
    if (!key) {
      throw new TypeError('key should not be empty');
    }

    if (partNumber < MIN_PART_NUMBER || partNumber > MAX_PART_NUMBER) {
      throw new TypeError(
        util.format(
          'Invalid partNumber %d. The valid range is from %d to %d.',
          partNumber,
          MIN_PART_NUMBER,
          MAX_PART_NUMBER
        )
      );
    }

    const client = this;

    // Clone the part file stream
    const clonedPartFp = fs.createReadStream((partFp as any).path, {
      start: (partFp as any).start,
      end: (partFp as any).end
    });

    const headers: Record<string, any> = {};
    headers[H.CONTENT_LENGTH] = partSize;
    headers[H.CONTENT_TYPE] = 'application/octet-stream';
    const mergedOptions = u.extend(headers, options);

    if (!mergedOptions[H.CONTENT_MD5]) {
      return crypto.md5stream(partFp).then(function (md5sum: string) {
        mergedOptions[H.CONTENT_MD5] = md5sum;
        return newPromise();
      });
    }

    function newPromise() {
      const finalOptions = client._checkOptions(mergedOptions);
      return client.sendRequest('PUT', {
        bucketName: bucketName,
        key: key,
        body: clonedPartFp,
        headers: finalOptions.headers,
        params: {
          partNumber: partNumber,
          uploadId: uploadId
        },
        config: finalOptions.config
      });
    }

    return newPromise();
  }

  /**
   * List parts for a multipart upload
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param uploadId - The upload ID
   * @param options - List options
   * @returns Promise resolving to the list of parts
   */
  public listParts(
    bucketName: string,
    key: string,
    uploadId: string,
    options?: { partNumberMarker?: number; config?: Partial<BceConfig> }
  ): Promise<BceResponse<ListPartsResponse>> {
    if (!uploadId) {
      throw new TypeError('uploadId should not empty');
    }

    const allowedParams = ['maxParts', 'partNumberMarker', 'uploadId'];
    const opts = this._checkOptions(options || {}, allowedParams);
    opts.params.uploadId = uploadId;

    return this.sendRequest('GET', {
      bucketName: bucketName,
      key: key,
      params: opts.params,
      config: opts.config
    });
  }

  /**
   * Complete multipart upload
   * 
   * @param bucketName - The bucket name
   * @param key - The object key
   * @param uploadId - The upload ID
   * @param partList - List of completed parts
   * @param options - Complete options
   * @returns Promise resolving to the completion response
   */
  public completeMultipartUpload(
    bucketName: string,
    key: string,
    uploadId: string,
    partList: Array<{ partNumber: number; eTag: string }>,
    options?: MultipartUploadOptions
  ): Promise<BceResponse<any>> {
    const headers: Record<string, any> = {};
    headers[H.CONTENT_TYPE] = 'application/json; charset=UTF-8';
    const mergedOptions = this._checkOptions(u.extend(headers, options));

    return this.sendRequest('POST', {
      bucketName: bucketName,
      key: key,
      body: JSON.stringify({ parts: partList }),
      headers: mergedOptions.headers,
      params: { uploadId: uploadId },
      config: mergedOptions.config
    });
  }

  /**
   * Adaptive multipart upload for large files
   * 
   * @param params - Upload parameters
   * @returns SuperUpload instance for managing the upload
   */
  public putSuperObject(params: SuperUploadOptions): SuperUpload {
    const options = params || {};
    const { objectName, data } = options;
    
    // Maximum upload file size in bytes
    const MAX_UPLOAD_FILE_SIZE = 48.8 * Math.pow(1024, 4);
    
    // Media type of the uploaded file
    const ContentType = options.ContentType || MimeType.guess(path.extname(objectName));
    
    // File size in bytes
    let ContentLength = options.ContentLength;
    
    // Data type: File, Buffer, Stream, Blob
    let dataType = '';

    if (typeof data === 'string') {
      ContentLength = fs.lstatSync(data).size;
      dataType = 'File';
    } else if (Buffer.isBuffer(data)) {
      ContentLength = data.length;
      dataType = 'Buffer';
    } else if (data instanceof stream.Readable) {
      dataType = 'Stream';
    } else if (typeof Blob !== 'undefined' && data instanceof Blob) {
      ContentLength = data.size;
      dataType = 'Blob';
    }

    if (!dataType) {
      throw new Error(`Unsupported data type: ${dataType}`);
    }

    if (ContentLength! > MAX_UPLOAD_FILE_SIZE) {
      throw new Error('File size should be less or equal than 48.8TB.');
    }

    if (dataType === 'Stream') {
      throw new Error('file type is Stream, please use `putObject` API.');
    }

    const self = this;
    const instance = new SuperUpload(self, u.extend(options, { ContentLength, ContentType, dataType }));

    return instance;
  }

  // --- Internal Helper Methods ---

  /**
   * Check and normalize options for API calls
   * 
   * @param options - Input options
   * @param allowedParams - Allowed parameter names
   * @returns Normalized options
   */
  public _checkOptions(options: any, allowedParams?: string[]): {
    config: Partial<BceConfig>;
    headers: Record<string, any>;
    params: Record<string, any>;
  } {
    const rv: any = {};

    rv.config = options.config || {};
    rv.headers = this._prepareObjectHeaders(options);
    rv.params = u.pick(options, allowedParams || []);

    // If using callback parameter format, process parameters as string format
    if (!u.has(options, H.X_BCE_PROCESS) && u.has(options, 'callback')) {
      const callbackParams = u.extend(
        {
          // urls, abbreviated as u
          u: Base64.urlEncode(options.callback.urls),
          // mode, abbreviated as m
          m: 'sync',
          v: Base64.urlEncode(options.callback.vars)
        },
        // encrypt, abbreviated as e
        options.callback.encrypt && options.callback.encrypt === 'config' ? { e: 'config' } : {},
        // key, abbreviated as k
        options.callback.key ? { k: options.callback.key } : {}
      );
      let callbackStr = '';
      const callbackKeys = Object.keys(callbackParams);

      callbackKeys.forEach((key, index) => {
        callbackStr += key + '_' + callbackParams[key] + (index === callbackKeys.length - 1 ? '' : ',');
      });

      if (callbackStr) {
        rv.headers[H.X_BCE_PROCESS] = 'callback/callback,' + callbackStr;
      }
    }

    return rv;
  }

  /**
   * Prepare and validate object headers
   * 
   * @param options - Input options
   * @returns Validated headers
   */
  public _prepareObjectHeaders(options: any): Record<string, any> {
    const allowedHeaders = [
      H.ORIGIN,
      H.ACCESS_CONTROL_REQUEST_METHOD,
      H.ACCESS_CONTROL_REQUEST_HEADERS,
      H.CONTENT_LENGTH,
      H.CONTENT_ENCODING,
      H.CONTENT_MD5,
      H.X_BCE_CONTENT_SHA256,
      H.CONTENT_TYPE,
      H.CONTENT_DISPOSITION,
      H.ETAG,
      H.SESSION_TOKEN,
      H.CACHE_CONTROL,
      H.EXPIRES,
      H.X_BCE_ACL,
      H.X_BCE_GRANT_READ,
      H.X_BCE_GRANT_FULL_CONTROL,
      H.X_BCE_OBJECT_ACL,
      H.X_BCE_OBJECT_GRANT_READ,
      H.X_BCE_STORAGE_CLASS,
      H.X_BCE_SERVER_SIDE_ENCRYPTION,
      H.X_BCE_RESTORE_DAYS,
      H.X_BCE_RESTORE_TIER,
      H.X_BCE_SYMLINK_TARGET,
      H.X_BCE_FORBID_OVERWRITE,
      H.X_BCE_TRAFFIC_LIMIT,
      H.X_BCE_FETCH_SOURCE,
      H.X_BCE_FETCH_MODE,
      H.X_BCE_CALLBACK_ADDRESS,
      H.X_BCE_FETCH_REFERER,
      H.X_BCE_FETCH_USER_AGENT,
      H.X_BCE_PROCESS,
      H.X_BCE_SOURCE,
      H.X_BCE_TAGGING
    ];
    
    let metaSize = 0;
    const headers = u.pick(options, function (value, key) {
      if (allowedHeaders.indexOf(key) !== -1) {
        return true;
      } else if (/^x\-bce\-meta\-/.test(key)) {
        metaSize += Buffer.byteLength(key) + Buffer.byteLength('' + value);
        return true;
      }
      return false;
    });

    if (metaSize > MAX_USER_METADATA_SIZE) {
      throw new TypeError('Metadata size should not be greater than ' + MAX_USER_METADATA_SIZE + '.');
    }

    if (u.has(headers, H.CONTENT_LENGTH)) {
      const contentLength = headers[H.CONTENT_LENGTH];
      if (contentLength < 0) {
        throw new TypeError('content_length should not be negative.');
      } else if (contentLength > MAX_PUT_OBJECT_LENGTH) {
        // 5G
        throw new TypeError(
          'Object length should be less than ' + MAX_PUT_OBJECT_LENGTH + '. Use multi-part upload instead.'
        );
      }
    }

    if (u.has(headers, 'ETag')) {
      const etag = headers.ETag;
      if (!/^"/.test(etag)) {
        headers.ETag = util.format('"%s"', etag);
      }
    }

    if (!u.has(headers, H.CONTENT_TYPE)) {
      headers[H.CONTENT_TYPE] = 'application/octet-stream';
    }

    if (u.has(headers, H.X_BCE_STORAGE_CLASS)) {
      const storageClass = headers[H.X_BCE_STORAGE_CLASS];
      const STORAGE_CLASS = [
        'STANDARD',
        'STANDARD_IA', 
        'ARCHIVE',
        'COLD',
        'MAZ_STANDARD',
        'MAZ_STANDARD_IA'
      ];

      if (!STORAGE_CLASS.includes(storageClass)) {
        headers[H.X_BCE_STORAGE_CLASS] = STORAGE_CLASS[0];
      }
    }

    return headers;
  }

  // BOS-specific sendRequest overload for backward compatibility
  public override sendRequest(
    httpMethod: HttpMethod,
    resource: string,
    varArgs?: Partial<RequestArgs>
  ): Promise<BceResponse<any>>;
  public override sendRequest(
    httpMethod: string,
    varArgs: any,
    requestUrl?: string
  ): Promise<BceResponse<any>>;
  public override sendRequest(
    httpMethod: HttpMethod | string,
    resourceOrVarArgs: string | any,
    varArgsOrRequestUrl?: Partial<RequestArgs> | string
  ): Promise<BceResponse<any>> {
    // Handle the old BOS-specific signature (httpMethod, varArgs, requestUrl)
    if (typeof resourceOrVarArgs === 'object' && resourceOrVarArgs !== null) {
      return this.sendBosRequest(httpMethod as string, resourceOrVarArgs, varArgsOrRequestUrl as string);
    }
    
    // Handle the new base class signature (httpMethod, resource, varArgs)
    return super.sendRequest(
      httpMethod as HttpMethod,
      resourceOrVarArgs as string,
      varArgsOrRequestUrl as Partial<RequestArgs>
    );
  }

  // BOS-specific request handler
  private sendBosRequest(httpMethod: string, varArgs: any, requestUrl?: string): Promise<BceResponse<any>> {
    const defaultArgs = {
      bucketName: null,
      key: null,
      body: null,
      headers: {},
      params: {},
      config: {},
      outputStream: null
    };

    let endpoint = this.config.endpoint;

    const bucketName = varArgs.bucketName;
    const region = varArgs.config ? varArgs.config.region : this.config.region;
    const localRemoveVersionPrefix = varArgs.config ? varArgs.config.removeVersionPrefix : false;
    const versionPrefix = (localRemoveVersionPrefix || this.config.removeVersionPrefix) ? '/' : '/v1';

    varArgs.bucketName = this.config.cname_enabled ? '' : bucketName;

    const customGenerateUrl =
      varArgs.config && varArgs.config.customGenerateUrl
        ? varArgs.config.customGenerateUrl
        : this.config.customGenerateUrl
        ? this.config.customGenerateUrl
        : undefined;

    let resource: string;

    // Provide the method for generating URL
    if (typeof customGenerateUrl === 'function') {
      endpoint = customGenerateUrl(bucketName, region);
      resource =
        requestUrl ||
        path
          .normalize(path.join(versionPrefix, strings.normalize(varArgs.key || '', false)))
          .replace(/\\/g, '/');
    } else {
      endpoint = domainUtils.handleEndpoint({
        bucketName,
        endpoint,
        region,
        protocol: this.config.protocol!,
        cname_enabled: this.config.cname_enabled,
        pathStyleEnable: this.config.pathStyleEnable
      });

      resource =
        requestUrl ||
        path
          .normalize(
            path.join(
              versionPrefix ? '/' : '/v1',
              // if pathStyleEnable is true
              !this.config.pathStyleEnable ? '' : strings.normalize(varArgs.bucketName || ''),
              strings.normalize(varArgs.key || '', false)
            )
          )
          .replace(/\\/g, '/');
    }

    const args = u.extend(defaultArgs, varArgs);
    const config = u.extend({}, this.config, args.config, { endpoint });

    if (config.sessionToken) {
      args.headers[H.SESSION_TOKEN] = config.sessionToken;
    }
    
    return this.sendHTTPRequest(httpMethod as HttpMethod, resource, args, config);
  }
}

// CommonJS 兼容导出
module.exports = BosClient;
module.exports.default = BosClient;