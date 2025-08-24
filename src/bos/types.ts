/**
 * BOS (Baidu Object Storage) 服务类型定义
 * @file src/bos/types.ts
 * @author TypeScript 重构团队
 */

import type {BceResponse, PaginationParams, PaginationResponse} from '../types/common';

// ==================== 枚举类型 ====================

/** BOS 存储类型枚举 */
export enum StorageClass {
  /** 标准存储类型 */
  STANDARD = 'STANDARD',
  /** 低频存储 */
  STANDARD_IA = 'STANDARD_IA',
  /** 归档存储 */
  ARCHIVE = 'ARCHIVE',
  /** 冷存储 */
  COLD = 'COLD',
  /** 标准存储-多AZ */
  MAZ_STANDARD = 'MAZ_STANDARD',
  /** 低频存储-多AZ */
  MAZ_STANDARD_IA = 'MAZ_STANDARD_IA'
}

/** BOS 访问控制列表 */
export enum BucketAcl {
  /** 私有 */
  PRIVATE = 'private',
  /** 公共读 */
  PUBLIC_READ = 'public-read',
  /** 公共读写 */
  PUBLIC_READ_WRITE = 'public-read-write'
}

/** 对象访问控制列表 */
export enum ObjectAcl {
  /** 私有 */
  PRIVATE = 'private',
  /** 公共读 */
  PUBLIC_READ = 'public-read',
  /** 公共读写 */
  PUBLIC_READ_WRITE = 'public-read-write'
}

/** BOS 错误代码 */
export enum ErrorCode {
  /** 上传不存在 */
  NoSuchUpload = 'NoSuchUpload',
  /** 存储桶不存在 */
  NoSuchBucket = 'NoSuchBucket',
  /** 对象不存在 */
  NoSuchKey = 'NoSuchKey',
  /** 存储桶已存在 */
  BucketAlreadyExists = 'BucketAlreadyExists',
  /** 访问被拒绝 */
  AccessDenied = 'AccessDenied'
}

/** 数据类型 */
export enum DataType {
  /** 文件 */
  FILE = 'File',
  /** 流 */
  STREAM = 'Stream',
  /** 缓冲区 */
  BUFFER = 'Buffer',
  /** Blob对象 */
  BLOB = 'Blob'
}

/** 任务状态 */
export enum TaskState {
  /** 等待中 */
  WAITING = 'waiting',
  /** 已初始化 */
  INITED = 'inited',
  /** 运行中 */
  RUNNING = 'running',
  /** 已暂停 */
  PAUSED = 'paused',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 已取消 */
  CANCELLED = 'cancelled',
  /** 失败 */
  FAILED = 'failed'
}

/** 恢复层级 */
export enum RestoreTier {
  /** 加急 */
  EXPEDITED = 'Expedited',
  /** 标准 */
  STANDARD = 'Standard',
  /** 批量 */
  BULK = 'Bulk'
}

// ==================== 基础接口 ====================

/** 所有者信息 */
export interface Owner {
  /** 用户ID */
  id: string;
  /** 显示名称 */
  displayName: string;
}

/** 存储桶信息 */
export interface Bucket {
  /** 存储桶名称 */
  name: string;
  /** 创建时间 */
  creationDate: string;
  /** 地域 */
  location: string;
  /** 所有者 */
  owner?: Owner;
}

/** 对象信息 */
export interface BosObject {
  /** 对象键 */
  key: string;
  /** 最后修改时间 */
  lastModified: string;
  /** ETag */
  eTag: string;
  /** 大小（字节） */
  size: number;
  /** 存储类型 */
  storageClass: StorageClass;
  /** 所有者 */
  owner?: Owner;
}

/** 对象元数据 */
export interface ObjectMetadata {
  /** 内容类型 */
  'Content-Type'?: string;
  /** 内容长度 */
  'Content-Length'?: number;
  /** 内容编码 */
  'Content-Encoding'?: string;
  /** 内容处置 */
  'Content-Disposition'?: string;
  /** 内容语言 */
  'Content-Language'?: string;
  /** 缓存控制 */
  'Cache-Control'?: string;
  /** 过期时间 */
  'Expires'?: string;
  /** 自定义元数据 */
  [key: string]: string | number | undefined;
}

/** 分片信息 */
export interface PartInfo {
  /** 分片号 */
  partNumber: number;
  /** ETag */
  eTag: string;
  /** 大小 */
  size?: number;
}

/** 分片上传信息 */
export interface MultipartUpload {
  /** 对象键 */
  key: string;
  /** 上传ID */
  uploadId: string;
  /** 存储类型 */
  storageClass: StorageClass;
  /** 初始化时间 */
  initiated: string;
}

// ==================== 请求参数接口 ====================

/** 创建存储桶选项 */
export interface PutBucketOptions {
  /** 访问控制列表 */
  'x-bce-acl'?: BucketAcl;
  /** 存储类型 */
  'x-bce-storage-class'?: StorageClass;
  /** 自定义头部 */
  [key: string]: any;
}

/** 上传对象选项 */
export interface PutObjectOptions {
  /** 内容类型 */
  'Content-Type'?: string;
  /** 内容长度 */
  'Content-Length'?: number;
  /** 内容编码 */
  'Content-Encoding'?: string;
  /** 内容处置 */
  'Content-Disposition'?: string;
  /** 内容语言 */
  'Content-Language'?: string;
  /** 缓存控制 */
  'Cache-Control'?: string;
  /** 过期时间 */
  'Expires'?: string;
  /** 访问控制列表 */
  'x-bce-object-acl'?: ObjectAcl;
  /** 存储类型 */
  'x-bce-storage-class'?: StorageClass;
  /** 服务端加密 */
  'x-bce-server-side-encryption'?: string;
  /** 禁止覆写 */
  'x-bce-forbid-overwrite'?: string;
  /** 流量限制 */
  'x-bce-traffic-limit'?: number;
  /** 标签 */
  'x-bce-tagging'?: string;
  /** MD5校验 */
  'Content-MD5'?: string;
  /** 自定义元数据 */
  [key: string]: string | number | undefined;
}

/** 复制对象选项 */
export interface CopyObjectOptions extends PutObjectOptions {
  /** 源对象的修改时间条件 */
  'x-bce-copy-source-if-modified-since'?: string;
  /** 源对象的未修改时间条件 */
  'x-bce-copy-source-if-unmodified-since'?: string;
  /** 源对象的ETag匹配条件 */
  'x-bce-copy-source-if-match'?: string;
  /** 源对象的ETag不匹配条件 */
  'x-bce-copy-source-if-none-match'?: string;
  /** 元数据指令 */
  'x-bce-metadata-directive'?: 'COPY' | 'REPLACE';
}

/** 获取对象选项 */
export interface GetObjectOptions {
  /** 范围 */
  'Range'?: string;
  /** 修改时间条件 */
  'If-Modified-Since'?: string;
  /** 未修改时间条件 */
  'If-Unmodified-Since'?: string;
  /** ETag匹配条件 */
  'If-Match'?: string;
  /** ETag不匹配条件 */
  'If-None-Match'?: string;
  /** 响应内容类型 */
  'response-content-type'?: string;
  /** 响应内容语言 */
  'response-content-language'?: string;
  /** 响应过期时间 */
  'response-expires'?: string;
  /** 响应缓存控制 */
  'response-cache-control'?: string;
  /** 响应内容处置 */
  'response-content-disposition'?: string;
  /** 响应内容编码 */
  'response-content-encoding'?: string;
}

/** 列举对象参数 */
export interface ListObjectsOptions extends PaginationParams {
  /** 前缀 */
  prefix?: string;
  /** 分隔符 */
  delimiter?: string;
  /** 起始标记 */
  marker?: string;
  /** 最大键数 */
  maxKeys?: number;
}

/** 恢复归档对象选项 */
export interface RestoreObjectOptions {
  /** 恢复天数 */
  'x-bce-restore-days': number;
  /** 恢复层级 */
  'x-bce-restore-tier'?: RestoreTier;
}

/** 初始化分片上传选项 */
export interface InitiateMultipartUploadOptions {
  /** 内容类型 */
  'Content-Type'?: string;
  /** 内容长度 */
  'Content-Length'?: number;
  /** 内容编码 */
  'Content-Encoding'?: string;
  /** 内容处置 */
  'Content-Disposition'?: string;
  /** 内容语言 */
  'Content-Language'?: string;
  /** 缓存控制 */
  'Cache-Control'?: string;
  /** 过期时间 */
  'Expires'?: string;
  /** 访问控制列表 */
  'x-bce-object-acl'?: ObjectAcl;
  /** 存储类型 */
  'x-bce-storage-class'?: StorageClass;
  /** 服务端加密 */
  'x-bce-server-side-encryption'?: string;
  /** 禁止覆写 */
  'x-bce-forbid-overwrite'?: string;
  /** 流量限制 */
  'x-bce-traffic-limit'?: number;
  /** 标签 */
  'x-bce-tagging'?: string;
  /** MD5校验 */
  'Content-MD5'?: string;
  /** 自定义元数据 */
  [key: string]: string | number | undefined;
}

/** 上传分片选项 */
export interface UploadPartOptions {
  /** 内容MD5 */
  'Content-MD5'?: string;
  /** 流量限制 */
  'x-bce-traffic-limit'?: number;
}

// ==================== 响应接口 ====================

/** 列举存储桶响应 */
export interface ListBucketsResponse {
  /** 所有者 */
  owner: Owner;
  /** 存储桶列表 */
  buckets: Bucket[];
}

/** 列举对象响应 */
export interface ListObjectsResponse extends PaginationResponse<BosObject> {
  /** 存储桶名称 */
  name: string;
  /** 前缀 */
  prefix?: string;
  /** 分隔符 */
  delimiter?: string;
  /** 标记 */
  marker?: string;
  /** 下一个标记 */
  nextMarker?: string;
  /** 最大键数 */
  maxKeys: number;
  /** 是否截断 */
  isTruncated: boolean;
  /** 对象列表 */
  contents: BosObject[];
  /** 公共前缀 */
  commonPrefixes?: Array<{prefix: string}>;
}

/** 获取对象响应 */
export interface GetObjectResponse {
  /** 对象内容 */
  body: Buffer;
  /** ETag */
  eTag: string;
  /** 最后修改时间 */
  lastModified: string;
  /** 内容长度 */
  contentLength: number;
  /** 内容类型 */
  contentType: string;
  /** 其他元数据 */
  [key: string]: any;
}

/** 初始化分片上传响应 */
export interface InitiateMultipartUploadResponse {
  /** 存储桶名称 */
  bucket: string;
  /** 对象键 */
  key: string;
  /** 上传ID */
  uploadId: string;
}

/** 上传分片响应 */
export interface UploadPartResponse {
  /** ETag */
  eTag: string;
}

/** 列举分片响应 */
export interface ListPartsResponse {
  /** 存储桶名称 */
  bucket: string;
  /** 对象键 */
  key: string;
  /** 上传ID */
  uploadId: string;
  /** 分片大小上限 */
  partNumberMarker: number;
  /** 下一个分片号标记 */
  nextPartNumberMarker?: number;
  /** 最大分片数 */
  maxParts: number;
  /** 是否截断 */
  isTruncated: boolean;
  /** 存储类型 */
  storageClass: StorageClass;
  /** 初始化时间 */
  initiated?: string;
  /** 分片列表 */
  parts: PartInfo[];
}

/** 列举分片上传响应 */
export interface ListMultipartUploadsResponse {
  /** 存储桶名称 */
  bucket: string;
  /** 键标记 */
  keyMarker?: string;
  /** 上传ID标记 */
  uploadIdMarker?: string;
  /** 下一个键标记 */
  nextKeyMarker?: string;
  /** 下一个上传ID标记 */
  nextUploadIdMarker?: string;
  /** 最大上传数 */
  maxUploads: number;
  /** 是否截断 */
  isTruncated: boolean;
  /** 前缀 */
  prefix?: string;
  /** 分隔符 */
  delimiter?: string;
  /** 上传列表 */
  uploads: MultipartUpload[];
  /** 公共前缀 */
  commonPrefixes?: Array<{prefix: string}>;
}

/** 完成分片上传响应 */
export interface CompleteMultipartUploadResponse {
  /** 存储桶名称 */
  bucket: string;
  /** 对象键 */
  key: string;
  /** ETag */
  eTag: string;
  /** 位置 */
  location: string;
}

// ==================== BOS 客户端响应类型 ====================

/** BOS 响应类型别名 */
export type BosResponse<T = any> = BceResponse<T>;

/** 具体的 BOS 响应类型 */
export type BosListBucketsResponse = BosResponse<ListBucketsResponse>;
export type BosListObjectsResponse = BosResponse<ListObjectsResponse>;
export type BosGetObjectResponse = BosResponse<GetObjectResponse>;
export type BosInitiateMultipartUploadResponse = BosResponse<InitiateMultipartUploadResponse>;
export type BosUploadPartResponse = BosResponse<UploadPartResponse>;
export type BosListPartsResponse = BosResponse<ListPartsResponse>;
export type BosListMultipartUploadsResponse = BosResponse<ListMultipartUploadsResponse>;
export type BosCompleteMultipartUploadResponse = BosResponse<CompleteMultipartUploadResponse>;

// ==================== 工具类型 ====================

/** 上传数据类型 */
export type UploadData = string | Buffer | Blob | ReadableStream;

/** 服务端加密类型 */
export enum ServerSideEncryption {
  /** AES256 加密 */
  AES256 = 'AES256',
  /** KMS 加密 */
  KMS = 'aws:kms'
}

/** 权限控制别名 */
export type CannedAcl = BucketAcl | ObjectAcl;

/** 签名URL选项 */
export interface GeneratePresignedUrlOptions {
  /** 过期时间（秒） */
  expirationInSeconds?: number;
  /** HTTP方法 */
  method?: string;
  /** 额外的头部 */
  headers?: Record<string, string>;
  /** 额外的查询参数 */
  params?: Record<string, string>;
}

/** 存储桶策略 */
export interface BucketPolicy {
  /** 策略版本 */
  Version: string;
  /** 策略ID */
  Id?: string;
  /** 语句列表 */
  Statement: PolicyStatement[];
}

/** 策略语句 */
export interface PolicyStatement {
  /** 语句ID */
  Sid?: string;
  /** 效果 */
  Effect: 'Allow' | 'Deny';
  /** 主体 */
  Principal?: string | string[] | {[key: string]: string | string[]};
  /** 动作 */
  Action: string | string[];
  /** 资源 */
  Resource?: string | string[];
  /** 条件 */
  Condition?: {[key: string]: {[key: string]: string | string[]}};
}

// ==================== 导出 ====================

// 添加缺失的响应类型
export interface BucketMetadata {
  name: string;
  creationDate: string;
  owner?: Owner;
  location?: string;
}

export interface PutObjectResponse {
  eTag: string;
  versionId?: string;
}

export interface PutBucketResponse {
  location: string;
}

export interface DeleteObjectResponse {
  deleteMarker?: boolean;
  versionId?: string;
}

export interface DeleteBucketResponse {}

export interface CopyObjectResponse {
  eTag: string;
  lastModified: string;
}

export interface MultipartUploadResponse {
  uploadId: string;
  bucket: string;
  key: string;
}

export interface RestoreObjectResponse {}

export interface PostObjectResponse {
  location: string;
  bucket: string;
  key: string;
  eTag: string;
}

export interface SelectObjectResponse {
  payload: any;
}

// 添加缺失的选项类型
export interface MultipartUploadOptions {
  'Content-Type'?: string;
  'x-bce-storage-class'?: StorageClass;
  [key: string]: any;
}

export interface AppendObjectOptions extends PutObjectOptions {}

export interface FetchObjectOptions {
  'x-bce-fetch-source': string;
  'x-bce-fetch-mode'?: string;
  'config'?: any;
}

export interface OptionsObjectOptions {
  'Origin': string;
  'Access-Control-Request-Method': string;
  'Access-Control-Request-Headers'?: string;
  'config'?: any;
}

export interface SelectObjectOptions {
  selectRequest: any;
  type: 'json' | 'csv';
  config?: any;
}

export interface SuperUploadOptions {
  bucketName: string;
  objectName: string;
  data: string | Buffer | Blob;
  dataType?: string;
  chunkSize?: number;
  partConcurrency?: number;
  StorageClass?: StorageClass;
  ContentLength?: number;
  ContentType?: string;
  createTime?: string;
  uploadId?: string;
  onProgress?: SuperUploadProgressCallback;
  onStateChange?: SuperUploadStateChangeCallback;
}

export type SuperUploadProgressCallback = (progress: {
  speed: string;
  progress: number;
  percent: string;
  uploadedBytes: number;
  totalBytes: number;
}) => void;

export type SuperUploadStateChangeCallback = (
  state: string,
  data: {
    message: string;
    data: any;
  }
) => void;

export interface AclConfiguration {
  accessControlList: any[];
}

export interface UserQuotaConfiguration {
  maxBucketCount: number;
  maxCapacityMegaBytes: number;
}

export interface WebsiteConfiguration {
  index?: string;
  notFound?: string;
}

export interface LoggingConfiguration {
  targetBucket: string;
  targetPrefix?: string;
}

export interface EncryptionConfiguration {
  encryptionAlgorithm: string;
}

export interface ObjectLockConfiguration {
  retentionDays: number;
  status?: string;
}

export interface PolicyDocument {
  Version: string;
  Statement: PolicyStatement[];
}

export interface BosClientOptions {
  config?: any;
}

export interface LifecycleRule {
  id: string;
  status: 'Enabled' | 'Disabled';
  filter?: {prefix?: string};
  expiration?: {days?: number; date?: string};
  transitions?: {days: number; storageClass: StorageClass}[];
}

export interface ReplicationRule {
  id: string;
  status: 'Enabled' | 'Disabled';
  resource: string;
  destination: {bucket: string; storageClass?: StorageClass};
  replicateHistory?: boolean;
  replicateDeletes: boolean;
}

export interface CorsRule {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders?: string[];
  exposeHeaders?: string[];
  maxAgeSeconds?: number;
}

export default {
  StorageClass,
  BucketAcl,
  ObjectAcl,
  ErrorCode,
  DataType,
  TaskState,
  RestoreTier
};
