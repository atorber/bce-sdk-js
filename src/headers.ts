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
 * @file src/headers.ts
 * @author leeight
 */

/** 标准 HTTP 头部常量 */

/** 内容类型 */
export const CONTENT_TYPE = 'Content-Type' as const;
/** 内容长度 */
export const CONTENT_LENGTH = 'Content-Length' as const;
/** 内容 MD5 校验值 */
export const CONTENT_MD5 = 'Content-MD5' as const;
/** 内容编码 */
export const CONTENT_ENCODING = 'Content-Encoding' as const;
/** 内容处置 */
export const CONTENT_DISPOSITION = 'Content-Disposition' as const;
/** 实体标签 */
export const ETAG = 'ETag' as const;
/** 连接类型 */
export const CONNECTION = 'Connection' as const;
/** 主机名 */
export const HOST = 'Host' as const;
/** 用户代理 */
export const USER_AGENT = 'User-Agent' as const;
/** 缓存控制 */
export const CACHE_CONTROL = 'Cache-Control' as const;
/** 过期时间 */
export const EXPIRES = 'Expires' as const;
/** 源域 */
export const ORIGIN = 'Origin' as const;
/** 跨域请求方法 */
export const ACCESS_CONTROL_REQUEST_METHOD = 'Access-Control-Request-Method' as const;
/** 跨域请求头部 */
export const ACCESS_CONTROL_REQUEST_HEADERS = 'Access-Control-Request-Headers' as const;

/** BCE 相关头部常量 */

/** 授权头部 */
export const AUTHORIZATION = 'Authorization' as const;
/** BCE 日期头部 */
export const X_BCE_DATE = 'x-bce-date' as const;
/** BCE 访问控制列表 */
export const X_BCE_ACL = 'x-bce-acl' as const;
/** BCE 授予读权限 */
export const X_BCE_GRANT_READ = 'x-bce-grant-read' as const;
/** BCE 授予完全控制权限 */
export const X_BCE_GRANT_FULL_CONTROL = 'x-bce-grant-full-control' as const;
/** BCE 请求 ID */
export const X_BCE_REQUEST_ID = 'x-bce-request-id' as const;
/** BCE 内容 SHA256 校验值 */
export const X_BCE_CONTENT_SHA256 = 'x-bce-content-sha256' as const;
/** BCE 对象访问控制列表 */
export const X_BCE_OBJECT_ACL = 'x-bce-object-acl' as const;
/** BCE 对象授予读权限 */
export const X_BCE_OBJECT_GRANT_READ = 'x-bce-object-grant-read' as const;
/** BCE 存储类型 */
export const X_BCE_STORAGE_CLASS = 'x-bce-storage-class' as const;
/** BCE 服务端加密 */
export const X_BCE_SERVER_SIDE_ENCRYPTION = 'x-bce-server-side-encryption' as const;
/** BCE 恢复天数 */
export const X_BCE_RESTORE_DAYS = 'x-bce-restore-days' as const;
/** BCE 恢复层级 */
export const X_BCE_RESTORE_TIER = 'x-bce-restore-tier' as const;
/** BCE 符号链接目标 */
export const X_BCE_SYMLINK_TARGET = 'x-bce-symlink-target' as const;
/** BCE 禁止覆写 */
export const X_BCE_FORBID_OVERWRITE = 'x-bce-forbid-overwrite' as const;
/** BCE 流量限制 */
export const X_BCE_TRAFFIC_LIMIT = 'x-bce-traffic-limit' as const;
/** BCE 拉取源 */
export const X_BCE_FETCH_SOURCE = 'x-bce-fetch-source' as const;
/** BCE 拉取模式 */
export const X_BCE_FETCH_MODE = 'x-bce-fetch-mode' as const;
/** BCE 回调地址 */
export const X_BCE_CALLBACK_ADDRESS = 'x-bce-callback-address' as const;
/** BCE 拉取来源页 */
export const X_BCE_FETCH_REFERER = 'x-bce-fetch-referer' as const;
/** BCE 拉取用户代理 */
export const X_BCE_FETCH_USER_AGENT = 'x-bce-fetch-user-agent' as const;
/** BCE 处理参数 */
export const X_BCE_PROCESS = 'x-bce-process' as const;
/** BCE 源 */
export const X_BCE_SOURCE = 'x-bce-source' as const;
/** BCE 标签 */
export const X_BCE_TAGGING = 'x-bce-tagging' as const;

/** 响应相关头部常量 */

/** HTTP 头部 */
export const X_HTTP_HEADERS = 'http_headers' as const;
/** 响应体 */
export const X_BODY = 'body' as const;
/** HTTP 状态码 */
export const X_STATUS_CODE = 'status_code' as const;
/** 消息 */
export const X_MESSAGE = 'message' as const;
/** 错误代码 */
export const X_CODE = 'code' as const;
/** 请求 ID */
export const X_REQUEST_ID = 'request_id' as const;

/** 会话令牌 */
export const SESSION_TOKEN = 'x-bce-security-token' as const;

/** VOD 相关头部常量 */

/** VOD 媒体标题 */
export const X_VOD_MEDIA_TITLE = 'x-vod-media-title' as const;
/** VOD 媒体描述 */
export const X_VOD_MEDIA_DESCRIPTION = 'x-vod-media-description' as const;

/** 其他头部常量 */

/** 接受编码 */
export const ACCEPT_ENCODING = 'accept-encoding' as const;
/** 接受类型 */
export const ACCEPT = 'accept' as const;

/** 头部名称类型联合 */
export type HeaderName = 
  | typeof CONTENT_TYPE
  | typeof CONTENT_LENGTH
  | typeof CONTENT_MD5
  | typeof CONTENT_ENCODING
  | typeof CONTENT_DISPOSITION
  | typeof ETAG
  | typeof CONNECTION
  | typeof HOST
  | typeof USER_AGENT
  | typeof CACHE_CONTROL
  | typeof EXPIRES
  | typeof ORIGIN
  | typeof ACCESS_CONTROL_REQUEST_METHOD
  | typeof ACCESS_CONTROL_REQUEST_HEADERS
  | typeof AUTHORIZATION
  | typeof X_BCE_DATE
  | typeof X_BCE_ACL
  | typeof X_BCE_GRANT_READ
  | typeof X_BCE_GRANT_FULL_CONTROL
  | typeof X_BCE_REQUEST_ID
  | typeof X_BCE_CONTENT_SHA256
  | typeof X_BCE_OBJECT_ACL
  | typeof X_BCE_OBJECT_GRANT_READ
  | typeof X_BCE_STORAGE_CLASS
  | typeof X_BCE_SERVER_SIDE_ENCRYPTION
  | typeof X_BCE_RESTORE_DAYS
  | typeof X_BCE_RESTORE_TIER
  | typeof X_BCE_SYMLINK_TARGET
  | typeof X_BCE_FORBID_OVERWRITE
  | typeof X_BCE_TRAFFIC_LIMIT
  | typeof X_BCE_FETCH_SOURCE
  | typeof X_BCE_FETCH_MODE
  | typeof X_BCE_CALLBACK_ADDRESS
  | typeof X_BCE_FETCH_REFERER
  | typeof X_BCE_FETCH_USER_AGENT
  | typeof X_BCE_PROCESS
  | typeof X_BCE_SOURCE
  | typeof X_BCE_TAGGING
  | typeof SESSION_TOKEN
  | typeof X_VOD_MEDIA_TITLE
  | typeof X_VOD_MEDIA_DESCRIPTION
  | typeof ACCEPT_ENCODING
  | typeof ACCEPT
  | string; // 允许其他自定义头部

/** 标准 HTTP 头部集合 */
export const STANDARD_HEADERS = {
  CONTENT_TYPE,
  CONTENT_LENGTH,
  CONTENT_MD5,
  CONTENT_ENCODING,
  CONTENT_DISPOSITION,
  ETAG,
  CONNECTION,
  HOST,
  USER_AGENT,
  CACHE_CONTROL,
  EXPIRES,
  ORIGIN,
  ACCESS_CONTROL_REQUEST_METHOD,
  ACCESS_CONTROL_REQUEST_HEADERS,
  ACCEPT_ENCODING,
  ACCEPT,
} as const;

/** BCE 特定头部集合 */
export const BCE_HEADERS = {
  AUTHORIZATION,
  X_BCE_DATE,
  X_BCE_ACL,
  X_BCE_GRANT_READ,
  X_BCE_GRANT_FULL_CONTROL,
  X_BCE_REQUEST_ID,
  X_BCE_CONTENT_SHA256,
  X_BCE_OBJECT_ACL,
  X_BCE_OBJECT_GRANT_READ,
  X_BCE_STORAGE_CLASS,
  X_BCE_SERVER_SIDE_ENCRYPTION,
  X_BCE_RESTORE_DAYS,
  X_BCE_RESTORE_TIER,
  X_BCE_SYMLINK_TARGET,
  X_BCE_FORBID_OVERWRITE,
  X_BCE_TRAFFIC_LIMIT,
  X_BCE_FETCH_SOURCE,
  X_BCE_FETCH_MODE,
  X_BCE_CALLBACK_ADDRESS,
  X_BCE_FETCH_REFERER,
  X_BCE_FETCH_USER_AGENT,
  X_BCE_PROCESS,
  X_BCE_SOURCE,
  X_BCE_TAGGING,
  SESSION_TOKEN,
} as const;

/** VOD 特定头部集合 */
export const VOD_HEADERS = {
  X_VOD_MEDIA_TITLE,
  X_VOD_MEDIA_DESCRIPTION,
} as const;

/** 响应相关头部集合 */
export const RESPONSE_HEADERS = {
  X_HTTP_HEADERS,
  X_BODY,
  X_STATUS_CODE,
  X_MESSAGE,
  X_CODE,
  X_REQUEST_ID,
} as const;

/** 所有头部常量集合 */
export const ALL_HEADERS = {
  ...STANDARD_HEADERS,
  ...BCE_HEADERS,
  ...VOD_HEADERS,
  ...RESPONSE_HEADERS,
} as const;

// 为向后兼容保留 CommonJS 导出
export default ALL_HEADERS;