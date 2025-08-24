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
 * @file src/http_client.ts
 * @author leeight
 */

import * as process from 'process';
import * as http from 'http';
import * as https from 'https';
import * as util from 'util';
import { Readable, Writable } from 'stream';
import { EventEmitter } from 'events';
import * as querystring from 'querystring';
import * as url from 'url';
import debugLib from 'debug';

import * as H from './headers';
import Auth from './auth';
import type { 
  BceConfig, 
  Credentials, 
  HttpMethod, 
  HttpHeaders, 
  HttpResponseHeaders, 
  BceResponse 
} from './types/common';

const debugLog = debugLib('bce-sdk:HttpClient');

/** 签名计算函数类型 */
export type SignatureFunction = (
  credentials: Credentials,
  httpMethod: HttpMethod,
  path: string,
  params: Record<string, any>,
  headers: HttpHeaders,
  context: HttpClient
) => string | Promise<string> | Promise<{ authorization: string; xbceDate?: string }>;

/** HTTP 请求体类型 */
export type RequestBody = string | Buffer | Readable | Blob | ArrayBuffer | FormData | null | undefined;

/** HTTP 请求选项 */
interface RequestOptions extends url.UrlWithStringQuery {
  method: HttpMethod;
  headers: HttpHeaders;
  mode?: string;
  withCredentials?: boolean;
  rejectUnauthorized?: boolean;
}

/** 响应成功结果 */
interface SuccessResponse {
  [H.X_HTTP_HEADERS]: HttpResponseHeaders;
  [H.X_BODY]: any;
}

/** 响应失败结果 */
interface FailureResponse {
  [H.X_STATUS_CODE]: number;
  [H.X_MESSAGE]: string;
  [H.X_CODE]?: string;
  [H.X_REQUEST_ID]?: string;
  [H.X_BCE_DATE]?: string;
}

/** HTTP 响应对象 */
interface HttpResponse {
  statusCode?: number;
  headers: HttpResponseHeaders;
  on(event: 'data', listener: (chunk: Buffer | string) => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: 'end', listener: () => void): void;
}

/** HTTP 请求对象 */
interface HttpRequest {
  write(chunk: any): void;
  end(): void;
  on(event: string, listener: (...args: any[]) => void): void;
}

/**
 * HTTP 客户端类
 * 
 * @example
 * ```typescript
 * const client = new HttpClient({
 *   endpoint: 'https://bj.bcebos.com',
 *   credentials: { ak: 'your-ak', sk: 'your-sk' }
 * });
 * 
 * const response = await client.sendRequest('GET', '/path', null, {}, {});
 * ```
 */
export class HttpClient extends EventEmitter {
  /** 配置对象 */
  public config: BceConfig;
  
  /** HTTP(S) 请求对象 */
  private _req: HttpRequest | null = null;

  /**
   * 构造函数
   * @param config HTTP 客户端配置
   */
  constructor(config: BceConfig) {
    super();
    this.config = config;
  }

  /**
   * 基于对象路径更新配置参数值
   * @param path 配置路径，用点分隔
   * @param value 新的值
   * @returns 更新后的配置对象
   */
  updateConfigByPath(path: string, value: any): BceConfig {
    const pathArr = path.split('.');

    const traverseAndUpdate = (currentObj: any, index: number): void => {
      if (index >= pathArr.length - 1) {
        // 到达路径的最后一个属性，设置其值
        currentObj[pathArr[index]] = value;
        return;
      }

      // 如果下一个属性在当前对象中不存在，则创建它
      if (!(pathArr[index] in currentObj)) {
        currentObj[pathArr[index]] = {};
      }

      // 递归遍历到下一个属性
      traverseAndUpdate(currentObj[pathArr[index]], index + 1);
    };

    // 调用辅助函数开始遍历和更新
    traverseAndUpdate(this.config, 0);
    return this.config;
  }

  /**
   * 发送 HTTP 请求
   * @param httpMethod HTTP 方法
   * @param path 请求路径
   * @param body 请求体
   * @param headers 请求头
   * @param params 查询参数
   * @param signFunction 签名函数
   * @param outputStream 输出流
   * @returns Promise<BceResponse>
   */
  async sendRequest(
    httpMethod: HttpMethod,
    path: string,
    body?: RequestBody,
    headers?: HttpHeaders,
    params?: Record<string, any>,
    signFunction?: SignatureFunction,
    outputStream?: Writable
  ): Promise<BceResponse> {
    const upperMethod = httpMethod.toUpperCase() as HttpMethod;
    const requestUrl = this._getRequestUrl(path, params || {});
    const options = url.parse(requestUrl) as RequestOptions;
    
    debugLog('httpMethod = %s, requestUrl = %s, options = %j', upperMethod, requestUrl, options);

    // 准备请求头
    const defaultHeaders: HttpHeaders = {};
    
    if (typeof navigator === 'object' && navigator.userAgent) {
      defaultHeaders[H.USER_AGENT] = navigator.userAgent;
    } else {
      const packageJson = require('../package.json');
      defaultHeaders[H.USER_AGENT] = util.format(
        'bce-sdk-nodejs/%s/%s/%s',
        packageJson.version,
        process.platform,
        process.version
      );
    }
    
    defaultHeaders[H.X_BCE_DATE] = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    defaultHeaders[H.CONNECTION] = 'close';
    defaultHeaders[H.CONTENT_TYPE] = 'application/json; charset=UTF-8';
    defaultHeaders[H.HOST] = options.host!;

    const mergedHeaders: HttpHeaders = { ...defaultHeaders, ...headers };

    // 检查 Content-Length
    if (!mergedHeaders.hasOwnProperty(H.CONTENT_LENGTH)) {
      const contentLength = this._guessContentLength(body);
      if (!(contentLength === 0 && /GET|HEAD/i.test(upperMethod))) {
        // 如果是 GET 或 HEAD 请求，并且 Content-Length 是 0，那么 Request Header 里面就不要出现 Content-Length
        // 否则本地计算签名的时候会计算进去，但是浏览器发请求的时候不一定会有，此时导致 Signature Mismatch 的情况
        mergedHeaders[H.CONTENT_LENGTH] = contentLength;
      }
    }

    options.method = upperMethod;
    options.headers = mergedHeaders;
    
    // 通过browserify打包后，在Safari下并不能有效处理server的content-type
    // 参考ISSUE：https://github.com/jhiesey/stream-http/issues/8
    options.mode = 'prefer-fast';
    // 某些产品网关CORS Header `Access-Control-Allow-Origin` 为 `*`, 例如：VOD
    options.withCredentials = false;
    
    // rejectUnauthorized: If true, the server certificate is verified against the list of supplied CAs.
    options.rejectUnauthorized = false;

    if (typeof signFunction === 'function') {
      const promise = signFunction(this.config.credentials, upperMethod, path, params || {}, mergedHeaders, this);
      
      if (this._isPromise(promise)) {
        const result = await promise;
        if (typeof result === 'string') {
          mergedHeaders[H.AUTHORIZATION] = result;
        } else if (typeof result === 'object' && result.authorization) {
          mergedHeaders[H.AUTHORIZATION] = result.authorization;
          if (result.xbceDate) {
            mergedHeaders[H.X_BCE_DATE] = result.xbceDate;
          }
        }
      } else if (typeof promise === 'string') {
        mergedHeaders[H.AUTHORIZATION] = promise;
      } else {
        throw new Error('Invalid signature = (' + promise + ')');
      }
    } else {
      // 默认使用 BCE 认证
      const auth = new Auth(this.config.credentials.ak, this.config.credentials.sk);
      mergedHeaders[H.AUTHORIZATION] = auth.generateAuthorization(
        upperMethod,
        path,
        params,
        mergedHeaders
      );
    }

    debugLog('options = %j', options);
    return this._doRequest(options, body, outputStream);
  }

  /**
   * 执行 HTTP 请求
   * @param options 请求选项
   * @param body 请求体
   * @param outputStream 输出流
   * @returns Promise<BceResponse>
   */
  private async _doRequest(
    options: RequestOptions, 
    body?: RequestBody, 
    outputStream?: Writable
  ): Promise<BceResponse> {
    return new Promise((resolve, reject) => {
      const isHttps = options.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const req = httpModule.request(options, (res: HttpResponse) => {
        if (outputStream) {
          // 如果有输出流，直接管道输出
          (res as any).pipe(outputStream);
          outputStream.on('finish', () => {
            resolve(this._createSuccessResponse({}, {}));
          });
          outputStream.on('error', reject);
        } else {
          // 否则接收响应数据
          this._recvResponse(res).then(resolve, reject);
        }
      });

      req.on('error', reject);
      
      this._req = req;
      this._sendRequest(req, body);
    });
  }

  /**
   * 猜测内容长度
   * @param data 数据
   * @returns 内容长度
   */
  private _guessContentLength(data?: RequestBody): number {
    if (!data) {
      return 0;
    } else if (typeof data === 'string') {
      return Buffer.byteLength(data);
    } else if (Buffer.isBuffer(data)) {
      return data.length;
    } else if (typeof data === 'object') {
      if (typeof Blob !== 'undefined' && data instanceof Blob) {
        return data.size;
      }
      if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
        return data.byteLength;
      }
      if (data instanceof Readable) {
        // For streams, we can't determine the length easily
        throw new Error('Cannot determine content length for Readable streams.');
      }
    }

    throw new Error('No Content-Length is specified.');
  }

  /**
   * 修复响应头部
   * @param headers 原始头部
   * @returns 修复后的头部
   */
  private _fixHeaders(headers?: HttpResponseHeaders): HttpResponseHeaders {
    const fixedHeaders: HttpResponseHeaders = {};

    if (headers) {
      Object.keys(headers).forEach(key => {
        let value = headers[key];
        if (typeof value === 'string') {
          value = value.trim();
        }
        if (value) {
          const lowerKey = key.toLowerCase();
          if (lowerKey === 'etag' && typeof value === 'string') {
            value = value.replace(/"/g, '');
          }
          fixedHeaders[lowerKey] = value;
        }
      });
    }

    return fixedHeaders;
  }

  /**
   * 接收响应数据
   * @param res 响应对象
   * @returns Promise<BceResponse>
   */
  private async _recvResponse(res: HttpResponse): Promise<BceResponse> {
    const responseHeaders = this._fixHeaders(res.headers);
    const statusCode = res.statusCode || 0;

    const parseHttpResponseBody = (raw: Buffer): any => {
      const contentType = responseHeaders['content-type'] as string;

      if (!raw.length) {
        return {};
      } else if (contentType && /(application|text)\/json/.test(contentType)) {
        return JSON.parse(raw.toString());
      }
      return raw;
    };

    return new Promise((resolve, reject) => {
      const payload: Buffer[] = [];
      
      res.on('data', (chunk: Buffer | string) => {
        if (Buffer.isBuffer(chunk)) {
          payload.push(chunk);
        } else {
          // xhr2返回的内容是 string，不是 Buffer
          payload.push(Buffer.from(chunk));
        }
      });
      
      res.on('error', (e: Error) => {
        reject(e);
      });
      
      res.on('end', () => {
        const raw = Buffer.concat(payload);
        let responseBody: any = null;

        try {
          debugLog('responseHeaders = %j', responseHeaders);
          responseBody = parseHttpResponseBody(raw);
        } catch (e: any) {
          debugLog('statusCode = %s, Parse response body error = %s', statusCode, e.message);
          reject(this._createFailureResponse(statusCode, e.message));
          return;
        }

        if (statusCode >= 100 && statusCode < 200) {
          reject(this._createFailureResponse(statusCode, 'Can not handle 1xx http status code.'));
        } else if (statusCode < 100 || statusCode >= 300) {
          if (responseBody.requestId) {
            reject(this._createFailureResponse(
              statusCode,
              responseBody.message,
              responseBody.code,
              responseBody.requestId,
              responseHeaders.date as string
            ));
          } else {
            reject(this._createFailureResponse(statusCode, responseBody));
          }
        } else {
          resolve(this._createSuccessResponse(responseHeaders, responseBody));
        }
      });
    });
  }

  /**
   * 发送请求数据
   * @param req 请求对象
   * @param data 数据
   */
  private _sendRequest(req: HttpRequest, data?: RequestBody): void {
    if (!data) {
      req.end();
      return;
    }

    let processedData = data;
    if (typeof data === 'string') {
      processedData = Buffer.from(data);
    }

    if (Buffer.isBuffer(processedData) || this._isXHR2Compatible(processedData)) {
      req.write(processedData);
      req.end();
    } else if (processedData instanceof Readable) {
      if (!processedData.readable) {
        throw new Error('stream is not readable');
      }

      processedData.on('data', (chunk: any) => {
        req.write(chunk);
      });
      processedData.on('end', () => {
        req.end();
      });
    } else {
      throw new Error('Invalid body type = ' + typeof data);
    }
  }

  /**
   * 构建查询字符串
   * @param params 参数对象
   * @returns 查询字符串
   */
  buildQueryString(params?: Record<string, any>): string {
    if (!params) return '';
    
    const urlEncodeStr = querystring.stringify(params);
    // https://en.wikipedia.org/wiki/Percent-encoding
    return urlEncodeStr.replace(/[()'!~.*\-_]/g, (char: string) => {
      return '%' + char.charCodeAt(0).toString(16);
    });
  }

  /**
   * 获取请求 URL
   * @param path 路径
   * @param params 参数
   * @returns 完整的请求 URL
   */
  private _getRequestUrl(path: string, params: Record<string, any>): string {
    let uri = path;
    const qs = this.buildQueryString(params);
    if (qs) {
      uri += '?' + qs;
    }

    if (/^https?/.test(uri)) {
      return uri;
    }

    return this.config.endpoint + uri;
  }

  /**
   * 创建成功响应
   * @param httpHeaders HTTP 头部
   * @param body 响应体
   * @returns 成功响应对象
   */
  private _createSuccessResponse(httpHeaders: HttpResponseHeaders, body: any): BceResponse {
    return {
      [H.X_HTTP_HEADERS]: httpHeaders,
      [H.X_BODY]: body,
    } as BceResponse;
  }

  /**
   * 创建失败响应
   * @param statusCode 状态码
   * @param message 错误消息
   * @param code 错误代码
   * @param requestId 请求 ID
   * @param xBceDate BCE 日期
   * @returns 失败响应对象
   */
  private _createFailureResponse(
    statusCode: number,
    message: string | Buffer | any,
    code?: string,
    requestId?: string,
    xBceDate?: string
  ): FailureResponse {
    const response: FailureResponse = {
      [H.X_STATUS_CODE]: statusCode,
      [H.X_MESSAGE]: Buffer.isBuffer(message) ? String(message) : String(message),
    };

    if (code) {
      response[H.X_CODE] = code;
    }
    if (requestId) {
      response[H.X_REQUEST_ID] = requestId;
    }
    if (xBceDate) {
      response[H.X_BCE_DATE] = xBceDate;
    }

    return response;
  }

  /**
   * 检查是否为 Promise
   * @param obj 对象
   * @returns 是否为 Promise
   */
  private _isPromise(obj: any): obj is Promise<any> {
    return obj && typeof obj.then === 'function';
  }

  /**
   * 检查是否为 XHR2 兼容对象
   * @param obj 对象
   * @returns 是否兼容
   */
  private _isXHR2Compatible(obj: any): boolean {
    if (typeof Blob !== 'undefined' && obj instanceof Blob) {
      return true;
    }
    if (typeof ArrayBuffer !== 'undefined' && obj instanceof ArrayBuffer) {
      return true;
    }
    if (typeof FormData !== 'undefined' && obj instanceof FormData) {
      return true;
    }
    return false;
  }
}

// 为向后兼容保留默认导出
export default HttpClient;