/**
 * VOD 服务类型定义
 * @file src/vod/types.ts
 * @author TypeScript 重构团队
 */

import type {BceConfig, BceResponse} from '../types/common';

// ==================== 配置类型 ====================

/** VOD 客户端配置 */
export interface VodClientConfig extends BceConfig {
  /** 转码模式 */
  mode?: TranscodingMode;
}

// ==================== 基础类型 ====================

/** 媒资状态 */
export enum MediaStatus {
  /** 处理中 */
  RUNNING = 'RUNNING',
  /** 已发布 */
  PUBLISHED = 'PUBLISHED',
  /** 已停用 */
  DISABLED = 'DISABLED',
  /** 处理失败 */
  FAILED = 'FAILED'
}

/** 转码模式 */
export enum TranscodingMode {
  /** 不转码 */
  NO_TRANSCODING = 'no_transcoding',
  /** 普通转码 */
  NORMAL = ''
}

/** 媒资类型 */
export enum MediaType {
  /** 视频 */
  VIDEO = 'video',
  /** 音频 */
  AUDIO = 'audio'
}

// ==================== 媒资相关类型 ====================

/** 媒资基础信息 */
export interface MediaInfo {
  /** 媒资ID */
  mediaId: string;
  /** 媒资标题 */
  title: string;
  /** 媒资描述 */
  description?: string;
  /** 媒资状态 */
  status: MediaStatus;
  /** 媒资类型 */
  type: MediaType;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
  /** 源文件信息 */
  source?: SourceInfo;
  /** 转码信息 */
  transcoding?: TranscodingInfo;
  /** 缩略图信息 */
  thumbnails?: ThumbnailInfo[];
}

/** 源文件信息 */
export interface SourceInfo {
  /** 存储桶 */
  bucket: string;
  /** 对象键 */
  key: string;
  /** 文件大小 */
  size: number;
  /** 文件扩展名 */
  extension: string;
  /** 时长（秒） */
  duration?: number;
}

/** 转码信息 */
export interface TranscodingInfo {
  /** 转码预设组名称 */
  presetGroupName: string;
  /** 转码结果 */
  results: TranscodingResult[];
}

/** 转码结果 */
export interface TranscodingResult {
  /** 预设名称 */
  presetName: string;
  /** 转码状态 */
  status: string;
  /** 输出文件信息 */
  output?: {
    bucket: string;
    key: string;
    size: number;
    duration: number;
    bitrate: number;
    resolution: string;
  };
}

/** 缩略图信息 */
export interface ThumbnailInfo {
  /** 任务ID */
  taskId: string;
  /** 缩略图URL */
  url: string;
  /** 生成时间点（秒） */
  timeInSeconds: number;
}

// ==================== API 请求参数类型 ====================

/** 申请媒资响应 */
export interface ApplyMediaResponse {
  /** 媒资ID */
  mediaId: string;
  /** 源存储桶 */
  sourceBucket: string;
  /** 源对象键 */
  sourceKey: string;
  /** 上传主机 */
  host: string;
}

/** 处理媒资参数 */
export interface ProcessMediaOptions {
  /** 媒资标题 */
  title: string;
  /** 媒资描述 */
  description?: string;
  /** 源文件扩展名 */
  sourceExtension?: string;
  /** 转码预设组名称 */
  transcodingPresetGroupName?: string;
}

/** 查询媒资列表参数 */
export interface ListMediaOptions {
  /** 状态过滤 */
  status?: MediaStatus;
  /** 开始时间 */
  begin?: string;
  /** 结束时间 */
  end?: string;
  /** 标题关键字 */
  title?: string;
  /** 页面大小 */
  pageSize?: number;
  /** 页面标记 */
  marker?: string;
}

/** 查询媒资列表响应 */
export interface ListMediaResponse {
  /** 媒资列表 */
  media: MediaInfo[];
  /** 是否截断 */
  isTruncated: boolean;
  /** 下一页标记 */
  nextMarker?: string;
}

/** 更新媒资参数 */
export interface UpdateMediaOptions {
  /** 新标题 */
  title: string;
  /** 新描述 */
  description?: string;
}

/** 获取下载地址参数 */
export interface GetDownloadUrlOptions {
  /** 过期时间（秒） */
  expiredInSeconds?: number;
}

/** 获取下载地址响应 */
export interface GetDownloadUrlResponse {
  /** 下载URL */
  url: string;
  /** 过期时间 */
  expiredTime: string;
}

// ==================== 播放器相关类型 ====================

/** 播放器配置 */
export interface PlayerConfig {
  /** 访问密钥 */
  ak: string;
  /** 播放器宽度 */
  width: number;
  /** 播放器高度 */
  height: number;
  /** 是否自动播放 */
  autostart: boolean;
  /** 播放器主题 */
  theme?: string;
  /** 是否显示控制条 */
  controls?: boolean;
}

/** 获取播放地址响应 */
export interface GetPlayableUrlResponse {
  /** 播放地址列表 */
  playUrls: PlayUrl[];
}

/** 播放地址 */
export interface PlayUrl {
  /** 预设名称 */
  presetName: string;
  /** 播放URL */
  url: string;
  /** 协议类型 */
  protocol: string;
}

/** 获取播放器代码响应 */
export interface GetPlayerCodeResponse {
  /** 播放器HTML代码 */
  code: string;
  /** 播放器配置 */
  config: PlayerConfig;
}

// ==================== 通知相关类型 ====================

/** 通知配置 */
export interface NotificationConfig {
  /** 通知名称 */
  name: string;
  /** 回调URL */
  endpoint: string;
  /** 认证方式 */
  auth?: {
    token: string;
  };
}

// ==================== 预设组相关类型 ====================

/** 转码预设 */
export interface TranscodingPreset {
  /** 预设名称 */
  presetName: string;
  /** 容器格式 */
  container: string;
  /** 视频编码配置 */
  video?: VideoCodec;
  /** 音频编码配置 */
  audio?: AudioCodec;
  /** 加密配置 */
  encryption?: EncryptionConfig;
}

/** 视频编码配置 */
export interface VideoCodec {
  /** 编码器 */
  codec: string;
  /** 比特率 */
  bitrate: number;
  /** 帧率 */
  framerate: number;
  /** 分辨率 */
  resolution: string;
}

/** 音频编码配置 */
export interface AudioCodec {
  /** 编码器 */
  codec: string;
  /** 比特率 */
  bitrate: number;
  /** 采样率 */
  sampleRate: number;
  /** 声道数 */
  channels: number;
}

/** 加密配置 */
export interface EncryptionConfig {
  /** 加密策略 */
  strategy: string;
}

/** 预设组 */
export interface PresetGroup {
  /** 预设组名称 */
  presetGroupName: string;
  /** 预设列表 */
  presets: TranscodingPreset[];
  /** 创建时间 */
  createTime: string;
  /** 描述 */
  description?: string;
}

// ==================== 统计相关类型 ====================

/** 统计数据 */
export interface StatisticData {
  /** 日期 */
  date: string;
  /** 播放次数 */
  playCount: number;
  /** 流量（字节） */
  traffic: number;
  /** 存储量（字节） */
  storage: number;
  /** 转码时长（分钟） */
  transcodingDuration: number;
}

/** 统计查询参数 */
export interface StatisticOptions {
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
  /** 统计维度 */
  aggregate?: 'day' | 'month';
}

// ==================== 客户端选项类型 ====================

/** VOD 客户端选项 */
export interface VodClientOptions {
  /** 配置 */
  config?: Partial<VodClientConfig>;
}

// ==================== 创建媒资响应类型 ====================

/** 创建媒资响应 */
export interface CreateMediaResourceResponse extends BceResponse<MediaInfo> {}

/** 获取媒资响应 */
export interface GetMediaResourceResponse extends BceResponse<MediaInfo> {}

/** 查询媒资列表响应类型 */
export interface ListMediaResourceResponse extends BceResponse<ListMediaResponse> {}

/** 更新媒资响应 */
export interface UpdateMediaResourceResponse extends BceResponse<MediaInfo> {}

/** 删除媒资响应 */
export interface DeleteMediaResourceResponse extends BceResponse<void> {}
