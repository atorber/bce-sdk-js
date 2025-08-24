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
 * @file src/sts.ts
 * @author zhouhua
 */

import * as u from 'underscore';
import BceBaseClient from './bce_base_client';
import type { BceConfig, BceResponse } from './types/common';

// ==================== 类型定义 ====================

/** 访问控制列表项 */
interface AccessControlListItem {
  /** 实体 ID (可选) */
  eid?: string;
  /** 服务名称 */
  service: string;
  /** 区域 */
  region: string;
  /** 效果 (Allow/Deny) */
  effect: 'Allow' | 'Deny';
  /** 资源路径 */
  resource: string | string[];
  /** 权限列表 */
  permission: string | string[];
}

/** STS 参数 */
interface STSParams {
  /** 用户 ID */
  id?: string;
  /** 访问控制列表 */
  accessControlList?: AccessControlListItem[];
}

/** STS 客户端选项 */
interface STSOptions {
  config?: Partial<BceConfig>;
}

/** 会话令牌响应 */
interface SessionTokenResponse {
  /** 访问密钥 ID */
  accessKeyId: string;
  /** 秘密访问密钥 */
  secretAccessKey: string;
  /** 会话令牌 */
  sessionToken: string;
  /** 创建时间 */
  createTime: string;
  /** 过期时间 */
  expiration: string;
  /** 用户 ID */
  userId: string;
}

/**
 * STS支持 - 将STS抽象成一种服务
 *
 * @see https://bce.baidu.com/doc/BOS/API.html#STS.20.E6.9C.8D.E5.8A.A1.E6.8E.A5.E5.8F.A3
 */
export default class STS extends BceBaseClient {
  /**
   * 构造函数
   * @param config STS 配置
   */
  constructor(config: BceConfig) {
    super(config, 'sts', true);
  }

  /**
   * 获取会话令牌
   * 
   * @param durationSeconds 令牌有效期（秒）
   * @param params STS 参数
   * @param options 选项
   * @returns Promise 解析为会话令牌
   */
  public async getSessionToken(
    durationSeconds: number,
    params?: STSParams,
    options: STSOptions = {}
  ): Promise<BceResponse<SessionTokenResponse>> {
    let body = '';
    
    if (params) {
      const filteredParams = u.pick(params, 'id', 'accessControlList');

      if (filteredParams.accessControlList) {
        filteredParams.accessControlList = u.map(filteredParams.accessControlList, (acl) => {
          return u.pick(acl, 'eid', 'service', 'region', 'effect', 'resource', 'permission');
        });
      }

      body = JSON.stringify(filteredParams);
    }

    const url = '/v1/sessionToken';

    return this.sendRequest('POST', url, {
      config: options.config,
      params: {
        durationSeconds: durationSeconds
      },
      body: body
    });
  }
}