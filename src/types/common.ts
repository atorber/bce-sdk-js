/**
 * 通用类型定义
 * @file common.ts
 * @author TypeScript 重构团队
 */

// ==================== 基础配置类型 ====================

/** 百度云账户凭证 */
export interface Credentials {
  /** 百度云账户体系 Access Key */
  ak: string;
  /** 百度云账户体系 Secret Access Key */
  sk: string;
}

/** 百度云地域枚举 */
export type Region =
  | 'bj' // 北京
  | 'cn-n1' // 华北-北京一
  | 'gz' // 广州
  | 'hk' // 香港
  | 'hkg' // 香港
  | 'hk02' // 香港二区
  | 'su' // 苏州
  | 'fsh' // 上海
  | 'bd' // 保定
  | 'hb-fsg' // 河北-张家口
  | 'fwh' // 武汉
  | 'sin' // 新加坡
  | 'bjfsg' // 北京-张家口
  | 'gz' // 广州
  | string; // 允许自定义地域

/** 协议类型 */
export type Protocol = 'http' | 'https';

/** 自定义签名函数类型 */
export type CreateSignatureFunction = (
  credentials: { ak: string; sk: string },
  httpMethod: string,
  path: string,
  params: Record<string, any>,
  headers: Record<string, any>,
  context: any
) => Promise<string> | string;

/** 百度云引擎配置接口 */
export interface BceConfig {
  /** 服务端点 URL */
  endpoint: string;
  /** 认证凭证 */
  credentials: Credentials;
  /** 会话令牌（可选） */
  sessionToken?: string;
  /** 地域（可选） */
  region?: Region;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 协议类型（可选，默认 https） */
  protocol?: Protocol;
  /** 是否启用重试机制 */
  retryEnabled?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟基数（毫秒） */
  retryBaseDelay?: number;
  /** 是否移除版本前缀 */
  removeVersionPrefix?: boolean;
  /** 是否启用自定义域名 */
  cname_enabled?: boolean;
  /** 是否启用路径样式 */
  pathStyleEnable?: boolean;
  /** 自定义URL生成函数 */
  customGenerateUrl?: (bucketName: string, region?: string) => string;
  /** 自定义签名函数 */
  createSignature?: CreateSignatureFunction;
}

// ==================== HTTP 相关类型 ====================

/** HTTP 方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';

/** HTTP 请求头 */
export interface HttpHeaders {
  [key: string]: string | number | undefined;
}

/** HTTP 响应头 */
export interface HttpResponseHeaders {
  [key: string]: string | string[] | undefined;
}

/** 响应元数据 */
export interface ResponseMetadata {
  /** 请求 ID */
  requestId: string;
  /** 响应时间戳 */
  timestamp: number;
  /** HTTP 状态码 */
  statusCode: number;
  /** 是否成功 */
  success: boolean;
}

/** 通用 BCE 响应接口 */
export interface BceResponse<T = any> {
  /** 响应体数据 */
  body: T;
  /** HTTP 响应头 */
  http_headers: HttpResponseHeaders;
  /** 响应元数据 */
  metadata: ResponseMetadata;
}

/** 请求选项 */
export interface RequestOptions<T = any> {
  /** 请求头 */
  headers?: HttpHeaders;
  /** 查询参数 */
  params?: Record<string, any>;
  /** 请求体 */
  body?: T;
  /** 请求超时时间 */
  timeout?: number;
}

// ==================== 通用工具类型 ====================

/** 使对象的某些属性变为可选 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** 使对象的某些属性变为必需 */
export type Required<T, K extends keyof T> = T & {[P in K]-?: T[P]};

/** 提取Promise的返回类型 */
export type PromiseType<T> = T extends Promise<infer U> ? U : never;

/** 深度可选 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** 严格的字符串字面量类型 */
export type StrictExtract<T, U extends T> = U;

// ==================== 错误处理类型 ====================

/** BCE SDK 错误代码 */
export type BceErrorCode =
  | 'InvalidAccessKeyId'
  | 'SignatureDoesNotMatch'
  | 'RequestTimeTooSkewed'
  | 'InvalidArgument'
  | 'MalformedXML'
  | 'NoSuchBucket'
  | 'NoSuchKey'
  | 'BucketAlreadyExists'
  | 'AccessDenied'
  | 'InternalError'
  | string;

/** BCE SDK 错误接口 */
export interface BceError extends Error {
  /** 错误代码 */
  code: BceErrorCode;
  /** HTTP 状态码 */
  statusCode?: number;
  /** 请求 ID */
  requestId?: string;
  /** 错误详细信息 */
  details?: any;
}

// ==================== 分页相关类型 ====================

/** 分页请求参数 */
export interface PaginationParams {
  /** 页面标记 */
  marker?: string;
  /** 最大返回数量 */
  maxKeys?: number;
  /** 前缀过滤 */
  prefix?: string;
  /** 分隔符 */
  delimiter?: string;
}

/** 分页响应 */
export interface PaginationResponse<T> {
  /** 数据列表 */
  contents: T[];
  /** 是否截断 */
  isTruncated: boolean;
  /** 下一页标记 */
  nextMarker?: string;
  /** 最大键数 */
  maxKeys: number;
  /** 前缀 */
  prefix?: string;
  /** 分隔符 */
  delimiter?: string;
}

// ==================== 事件和回调类型 ====================

/** 进度回调函数 */
export type ProgressCallback = (progress: {loaded: number; total: number; percent: number}) => void;

/** 通用回调函数 */
export type Callback<T = any, E = BceError> = (error: E | null, result?: T) => void;

// ==================== 常量和枚举 ====================

/** 默认配置常量 */
export const DEFAULT_CONFIG = {
  TIMEOUT: 120000, // 2分钟
  RETRY_ENABLED: true,
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY: 1000,
  PROTOCOL: 'https' as const
} as const;

/** 通用 HTTP 状态码 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// ==================== 类型导出 ====================

export type {
  BceConfig as Config,
  BceResponse as Response,
  BceError as Error,
  HttpHeaders as Headers,
  HttpResponseHeaders as ResponseHeaders,
  RequestOptions as Options
};
