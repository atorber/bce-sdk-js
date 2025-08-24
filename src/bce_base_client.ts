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
 * @file src/bce_base_client.ts
 * @author leeight
 */

import * as util from 'util';
import { EventEmitter } from 'events';
import { Writable } from 'stream';

import * as config from './config';
import Auth from './auth';
import HttpClient, { RequestBody, SignatureFunction } from './http_client';
import * as H from './headers';
import type { 
  BceConfig, 
  BceResponse, 
  Credentials, 
  HttpMethod, 
  HttpHeaders 
} from './types/common';

/** 请求参数接口 */
export interface RequestArgs {
  /** 请求体 */
  body?: RequestBody;
  /** 请求头 */
  headers?: HttpHeaders;
  /** 查询参数 */
  params?: Record<string, any>;
  /** 请求级别的配置 */
  config?: Partial<BceConfig>;
  /** 输出流 */
  outputStream?: Writable;
}

/** 请求失败错误接口 */
interface RequestError {
  [H.X_STATUS_CODE]: number;
  [H.X_CODE]?: string;
  [H.X_BCE_DATE]?: string;
  [key: string]: any;
}

/**
 * BCE 基础客户端类
 * 所有 BCE 服务客户端的基类，提供通用的请求处理逻辑
 * 
 * @example
 * ```typescript
 * class CustomClient extends BceBaseClient {
 *   constructor(config: BceConfig) {
 *     super(config, 'custom-service', true);
 *   }
 * 
 *   async customMethod(): Promise<BceResponse> {
 *     return this.sendRequest('GET', '/custom-path');
 *   }
 * }
 * ```
 */
export class BceBaseClient extends EventEmitter {
  /** 客户端配置 */
  public config: BceConfig;
  
  /** 服务 ID */
  public serviceId: string;
  
  /** 是否支持地域 */
  public regionSupported: boolean;
  
  /** 时间偏移量（用于时间同步） */
  public timeOffset?: number;
  
  /** HTTP 代理客户端 */
  private _httpAgent: HttpClient | null = null;

  /**
   * 构造函数
   * @param clientConfig 客户端配置
   * @param serviceId 服务 ID
   * @param regionSupported 是否支持地域
   */
  constructor(clientConfig: BceConfig, serviceId: string, regionSupported: boolean = false) {
    super();

    this.config = { ...config.DEFAULT_CONFIG, ...clientConfig };
    this.serviceId = serviceId;
    this.regionSupported = !!regionSupported;

    this.config.endpoint = this._computeEndpoint();
  }

  /**
   * 计算服务端点
   * @returns 服务端点 URL
   */
  private _computeEndpoint(): string {
    if (this.config.endpoint) {
      return this.config.endpoint;
    }

    if (this.regionSupported) {
      return util.format('%s://%s.%s.%s',
        this.config.protocol,
        this.serviceId,
        this.config.region,
        config.DEFAULT_SERVICE_DOMAIN
      );
    }
    
    return util.format('%s://%s.%s',
      this.config.protocol,
      this.serviceId,
      config.DEFAULT_SERVICE_DOMAIN
    );
  }

  /**
   * 创建签名
   * @param credentials 认证凭据
   * @param httpMethod HTTP 方法
   * @param path 请求路径
   * @param params 查询参数
   * @param headers 请求头
   * @returns Promise<签名字符串>
   */
  createSignature(
    credentials: Credentials,
    httpMethod: HttpMethod,
    path: string,
    params: Record<string, any>,
    headers: HttpHeaders
  ): Promise<string> {
    const revisionTimestamp = Date.now() + (this.timeOffset || 0);

    headers[H.X_BCE_DATE] = new Date(revisionTimestamp).toISOString().replace(/\.\d+Z$/, 'Z');

    return Promise.resolve().then(() => {
      const auth = new Auth(credentials.ak, credentials.sk);
      return auth.generateAuthorization(httpMethod, path, params, headers, revisionTimestamp / 1000);
    });
  }

  /**
   * 发送请求（高级接口）
   * @param httpMethod HTTP 方法
   * @param resource 资源路径
   * @param varArgs 请求参数
   * @returns Promise<BceResponse>
   */
  async sendRequest(
    httpMethod: HttpMethod,
    resource: string,
    varArgs?: Partial<RequestArgs>
  ): Promise<BceResponse> {
    const defaultArgs: RequestArgs = {
      body: null,
      headers: {},
      params: {},
      config: {},
      outputStream: undefined,
    };
    
    const args: RequestArgs = { ...defaultArgs, ...varArgs };

    const mergedConfig: BceConfig = { ...this.config, ...args.config };
    
    if (mergedConfig.sessionToken) {
      args.headers = args.headers || {};
      args.headers[H.SESSION_TOKEN] = mergedConfig.sessionToken;
    }

    return this.sendHTTPRequest(httpMethod, resource, args, mergedConfig);
  }

  /**
   * 发送 HTTP 请求（底层接口）
   * @param httpMethod HTTP 方法
   * @param resource 资源路径
   * @param args 请求参数
   * @param requestConfig 请求配置
   * @returns Promise<BceResponse>
   */
  async sendHTTPRequest(
    httpMethod: HttpMethod,
    resource: string,
    args: RequestArgs,
    requestConfig: BceConfig
  ): Promise<BceResponse> {
    const client = this;

    const doRequest = async (): Promise<BceResponse> => {
      const agent = this._httpAgent = new HttpClient(requestConfig);
      
      // 转发事件
      ['progress', 'error', 'abort', 'timeout'].forEach(eventName => {
        agent.on(eventName, (evt: any) => {
          client.emit(eventName, evt);
        });
      });

      const signFunction: SignatureFunction = this.createSignature.bind(this);

      return this._httpAgent.sendRequest(
        httpMethod,
        resource,
        args.body,
        args.headers,
        args.params,
        signFunction,
        args.outputStream
      );
    };

    try {
      return await doRequest();
    } catch (err: any) {
      const error = err as RequestError;
      
      // 处理时间偏差错误
      if (error[H.X_BCE_DATE]) {
        const serverTimestamp = new Date(error[H.X_BCE_DATE]).getTime();
        BceBaseClient.prototype.timeOffset = serverTimestamp - Date.now();

        if (error[H.X_STATUS_CODE] === 403 && error[H.X_CODE] === 'RequestTimeTooSkewed') {
          // 重试请求
          return doRequest();
        }
      }

      throw error;
    }
  }

  /**
   * 获取当前 HTTP 代理
   * @returns HTTP 客户端实例
   */
  getHttpAgent(): HttpClient | null {
    return this._httpAgent;
  }

  /**
   * 更新配置
   * @param newConfig 新的配置
   */
  updateConfig(newConfig: Partial<BceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.config.endpoint = this._computeEndpoint();
  }

  /**
   * 获取服务端点
   * @returns 服务端点 URL
   */
  getEndpoint(): string {
    return this.config.endpoint;
  }

  /**
   * 获取服务 ID
   * @returns 服务 ID
   */
  getServiceId(): string {
    return this.serviceId;
  }

  /**
   * 检查是否支持地域
   * @returns 是否支持地域
   */
  isRegionSupported(): boolean {
    return this.regionSupported;
  }

  /**
   * 销毁客户端，清理资源
   */
  destroy(): void {
    this.removeAllListeners();
    this._httpAgent = null;
  }
}

// 为向后兼容保留默认导出
export default BceBaseClient;