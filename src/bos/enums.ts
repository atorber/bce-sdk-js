/**
 * @file src/bos/enums.ts
 * @desc BOS 枚举类型定义
 * @author lurunze
 */

import {StorageClass, ErrorCode, DataType, TaskState} from './types';

/** 存储类型枚举 */
export const STORAGE_CLASS = {
  /** 标准存储类型 */
  STANDARD: StorageClass.STANDARD,
  /** 低频存储 */
  STANDARD_IA: StorageClass.STANDARD_IA,
  /** 归档存储 */
  ARCHIVE: StorageClass.ARCHIVE,
  /** 冷存储 */
  COLD: StorageClass.COLD,
  /** 标准存储-多AZ */
  MAZ_STANDARD: StorageClass.MAZ_STANDARD,
  /** 低频存储-多AZ */
  MAZ_STANDARD_IA: StorageClass.MAZ_STANDARD_IA
} as const;

/** 错误代码枚举 */
export const ERROR_CODE = {
  NoSuchUpload: ErrorCode.NoSuchUpload,
  NoSuchBucket: ErrorCode.NoSuchBucket,
  NoSuchKey: ErrorCode.NoSuchKey,
  BucketAlreadyExists: ErrorCode.BucketAlreadyExists,
  AccessDenied: ErrorCode.AccessDenied
} as const;

/** 数据类型枚举 */
export const DATATYPE = {
  File: DataType.FILE,
  Stream: DataType.STREAM,
  Buffer: DataType.BUFFER,
  Blob: DataType.BLOB
} as const;

/** 任务状态枚举 */
export const STATE = {
  WAITING: TaskState.WAITING,
  INITED: TaskState.INITED,
  RUNNING: TaskState.RUNNING,
  PAUSED: TaskState.PAUSED,
  COMPLETED: TaskState.COMPLETED,
  CANCELLED: TaskState.CANCELLED,
  FAILED: TaskState.FAILED
} as const;

// 同时导出类型版本的枚举
export {StorageClass, ErrorCode, DataType, TaskState};

// 为向后兼容保留 CommonJS 导出
export default {
  STORAGE_CLASS,
  ERROR_CODE,
  DATATYPE,
  STATE,
  StorageClass,
  ErrorCode,
  DataType,
  TaskState
};
