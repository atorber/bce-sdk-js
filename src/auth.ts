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
 * @file src/auth.ts
 * @author leeight
 */

import * as util from 'util';
import * as crypto from 'crypto';
import * as url from 'url';
import debugLib from 'debug';

import * as H from './headers';
import { normalize, trim } from './strings';
import type { HttpHeaders, HttpMethod } from './types/common';

const debugLog = debugLib('bce-sdk:auth');

/** 查询参数接口 */
interface QueryParams {
  [key: string]: string | number | boolean | null | undefined;
}

/** 头部规范化结果接口 */
interface HeadersCanonicalizationResult {
  0: string; // canonicalHeaders
  1: string[]; // signedHeaders
}

/**
 * 百度云认证类
 * 
 * @example
 * ```typescript
 * const auth = new Auth('your-access-key', 'your-secret-key');
 * const authorization = auth.generateAuthorization('GET', '/path', {}, {}, Date.now() / 1000);
 * ```
 */
export class Auth {
  /** Access Key */
  public readonly ak: string;
  /** Secret Key */
  public readonly sk: string;

  /**
   * 构造函数
   * @param ak Access Key
   * @param sk Secret Key
   */
  constructor(ak: string, sk: string) {
    this.ak = ak;
    this.sk = sk;
  }

  /**
   * 生成授权签名
   * 基于 http://gollum.baidu.com/AuthenticationMechanism
   * 
   * @param method HTTP 请求方法
   * @param resource 请求路径
   * @param params 查询字符串参数
   * @param headers HTTP 请求头
   * @param timestamp 当前时间戳（秒）
   * @param expirationInSeconds 签名有效期（秒）
   * @param headersToSign 用于计算签名的请求头列表
   * @returns 签名字符串
   */
  generateAuthorization(
    method: HttpMethod,
    resource: string,
    params?: QueryParams,
    headers?: HttpHeaders,
    timestamp?: number,
    expirationInSeconds?: number,
    headersToSign?: string[]
  ): string {
    const now = this.getTimestamp(timestamp);
    const rawSessionKey = util.format('bce-auth-v1/%s/%s/%d', this.ak, now, expirationInSeconds || 1800);
    debugLog('rawSessionKey = %j', rawSessionKey);
    const signingKey = this.hash(rawSessionKey, this.sk);

    const canonicalUri = this.generateCanonicalUri(resource);
    const canonicalQueryString = this.queryStringCanonicalization(params || {});

    const rv = this.headersCanonicalization(headers || {}, headersToSign);
    const canonicalHeaders = rv[0];
    const signedHeaders = rv[1];
    
    debugLog('canonicalUri = %j', canonicalUri);
    debugLog('canonicalQueryString = %j', canonicalQueryString);
    debugLog('canonicalHeaders = %j', canonicalHeaders);
    debugLog('signedHeaders = %j', signedHeaders);

    const rawSignature = util.format('%s\n%s\n%s\n%s', method, canonicalUri, canonicalQueryString, canonicalHeaders);
    debugLog('rawSignature = %j', rawSignature);
    debugLog('signingKey = %j', signingKey);
    const signature = this.hash(rawSignature, signingKey);

    if (signedHeaders.length) {
      return util.format('%s/%s/%s', rawSessionKey, signedHeaders.join(';'), signature);
    }
    return util.format('%s//%s', rawSessionKey, signature);
  }

  /**
   * URI 规范化
   * @param uri 原始 URI
   * @returns 规范化后的 URI
   */
  uriCanonicalization(uri: string): string {
    return uri;
  }

  /**
   * 查询字符串规范化
   * @see http://gollum.baidu.com/AuthenticationMechanism#生成CanonicalQueryString
   * @param params 查询字符串参数
   * @returns 规范化的查询字符串
   */
  queryStringCanonicalization(params: QueryParams): string {
    const canonicalQueryString: string[] = [];
    
    Object.keys(params).forEach(key => {
      if (key.toLowerCase() === H.AUTHORIZATION.toLowerCase()) {
        return;
      }

      const value = params[key] == null ? '' : String(params[key]);
      canonicalQueryString.push(key + '=' + normalize(value));
    });

    canonicalQueryString.sort();
    return canonicalQueryString.join('&');
  }

  /**
   * HTTP 请求头规范化
   * @see http://gollum.baidu.com/AuthenticationMechanism#生成CanonicalHeaders
   * @param headers HTTP 请求头
   * @param headersToSign 用于计算签名的请求头列表
   * @returns 规范化的头部和签名头部列表
   */
  headersCanonicalization(headers: HttpHeaders, headersToSign?: string[]): HeadersCanonicalizationResult {
    if (!headersToSign || !headersToSign.length) {
      headersToSign = [H.HOST, H.CONTENT_MD5, H.CONTENT_LENGTH, H.CONTENT_TYPE];
    }
    debugLog('headers = %j, headersToSign = %j', headers, headersToSign);

    const headersMap: Record<string, boolean> = {};
    headersToSign.forEach(item => {
      headersMap[item.toLowerCase()] = true;
    });

    const canonicalHeaders: string[] = [];
    Object.keys(headers).forEach(key => {
      let value = headers[key];
      if (typeof value === 'string') {
        value = trim(value);
      }
      if (value == null || value === '') {
        return;
      }
      
      const lowerKey = key.toLowerCase();
      if (/^x\-bce\-/.test(lowerKey) || headersMap[lowerKey] === true) {
        canonicalHeaders.push(
          util.format(
            '%s:%s',
            normalize(lowerKey),
            normalize(String(value))
          )
        );
      }
    });

    canonicalHeaders.sort();

    const signedHeaders: string[] = [];
    canonicalHeaders.forEach(item => {
      const headerName = item.split(':')[0];
      if (headerName) {
        signedHeaders.push(headerName);
      }
    });

    return [canonicalHeaders.join('\n'), signedHeaders] as HeadersCanonicalizationResult;
  }

  /**
   * 计算 HMAC-SHA256 哈希
   * @param data 要哈希的数据
   * @param key 密钥
   * @returns 十六进制哈希值
   */
  hash(data: string, key: string): string {
    const sha256Hmac = crypto.createHmac('sha256', key);
    sha256Hmac.update(data);
    return sha256Hmac.digest('hex');
  }

  /**
   * 获取 ISO8601 格式的时间戳
   * @param timestamp 时间戳（秒），如果不提供则使用当前时间
   * @returns ISO8601 格式的时间字符串
   */
  getTimestamp(timestamp?: number): string {
    const now = timestamp ? new Date(timestamp * 1000) : new Date();
    return now.toISOString().replace(/\.\d+Z$/, 'Z');
  }

  /**
   * 字符串规范化（URL 编码）
   * @param string 要编码的字符串
   * @param encodingSlash 是否编码斜杠
   * @returns 编码后的字符串
   */
  normalize(string: string | null, encodingSlash?: boolean): string {
    const kEscapedMap: Record<string, string> = {
      '!': '%21',
      "'": '%27',
      '(': '%28',
      ')': '%29',
      '*': '%2A',
    };

    if (string === null) {
      return '';
    }

    let result = encodeURIComponent(string);
    result = result.replace(/[!'\(\)\*]/g, ($1: string) => {
      return kEscapedMap[$1] || $1;
    });

    if (encodingSlash === false) {
      result = result.replace(/%2F/gi, '/');
    }

    return result;
  }

  /**
   * 生成规范化 URI
   * @param resourceUrl 资源 URL
   * @returns 规范化的 URI
   */
  generateCanonicalUri(resourceUrl: string): string {
    if (!resourceUrl.includes('bos-share.baidubce.com')) {
      return resourceUrl;
    }

    const parsedUrl = url.parse(resourceUrl);
    const pathname = parsedUrl.pathname?.trim() || '';
    const resources = pathname.replace(/^\//, '').split('/');
    
    if (!resources.length) {
      return '';
    }

    let normalizedResourceStr = '';
    for (let i = 0; i < resources.length; i++) {
      normalizedResourceStr += '/' + this.normalize(resources[i]);
    }
    
    return normalizedResourceStr;
  }
}

// 为向后兼容保留默认导出
export default Auth;