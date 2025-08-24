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
 * @file src/config.ts
 * @author leeight
 */

import type { Protocol, Region } from './types/common';

/** 默认服务域名 */
export const DEFAULT_SERVICE_DOMAIN = 'baidubce.com';

/** 默认 BOS 域名 */
export const DEFAULT_BOS_DOMAIN = 'bcebos.com';

/** 默认配置接口 */
export interface DefaultConfig {
  /** 协议类型 */
  protocol: Protocol;
  /** 默认地域 */
  region: Region;
  /** 是否启用路径样式访问 BOS 资源，默认为 false */
  pathStyleEnable: boolean;
}

/** 默认配置 */
export const DEFAULT_CONFIG: DefaultConfig = {
  protocol: 'http',
  region: 'bj',
  // if true, use path style to visit bos resource, default is false
  pathStyleEnable: false,
} as const;

// 为向后兼容保留 CommonJS 导出
export default {
  DEFAULT_SERVICE_DOMAIN,
  DEFAULT_BOS_DOMAIN,
  DEFAULT_CONFIG,
};