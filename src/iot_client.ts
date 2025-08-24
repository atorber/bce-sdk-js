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
 * @file src/iot_client.ts
 * @author leeight
 */

import BceBaseClient from './bce_base_client';
import type { BceConfig, BceResponse } from './types/common';

// ==================== 类型定义 ====================

/** IoT 客户端选项 */
interface IoTClientOptions {
  config?: Partial<BceConfig>;
}

/**
 * IoT 服务客户端
 */
export default class IoTClient extends BceBaseClient {
  /**
   * 构造函数
   * @param config IoT 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'iot', true);
  }

  /**
   * 通用请求方法
   * @param method HTTP 方法
   * @param path 请求路径
   * @param options 选项
   * @returns Promise 解析为响应
   */
  public async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    options: IoTClientOptions & {
      body?: any;
      headers?: Record<string, string>;
      params?: Record<string, any>;
    } = {}
  ): Promise<BceResponse> {
    return this.sendRequest(method, path, {
      body: options.body,
      headers: options.headers,
      params: options.params,
      config: options.config
    });
  }
}