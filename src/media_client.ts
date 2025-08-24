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
 * @file src/media_client.ts
 * @author leeight
 */

import * as u from 'underscore';
import BceBaseClient from './bce_base_client';
import type { BceConfig, BceResponse } from './types/common';

// ==================== 类型定义 ====================

/** Media 客户端选项 */
interface MediaClientOptions {
  config?: Partial<BceConfig>;
}

/** 媒体文件信息 */
interface MediaInfo {
  /** 媒体ID */
  mediaId: string;
  /** 文件名 */
  fileName: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 媒体类型 */
  mediaType: 'video' | 'audio' | 'image';
  /** 文件格式 */
  format: string;
  /** 时长（秒，仅视频/音频） */
  duration?: number;
  /** 分辨率（仅视频/图片） */
  resolution?: {
    width: number;
    height: number;
  };
  /** 码率（仅视频/音频） */
  bitrate?: number;
  /** 创建时间 */
  createTime: string;
  /** 状态 */
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED';
  /** 源文件URL */
  sourceUrl?: string;
  /** 处理后的URL */
  processedUrl?: string;
}

/** 上传选项 */
interface UploadOptions extends MediaClientOptions {
  /** 媒体类型 */
  mediaType?: 'video' | 'audio' | 'image';
  /** 文件名 */
  fileName?: string;
  /** 回调地址 */
  callbackUrl?: string;
  /** 自定义数据 */
  userData?: Record<string, any>;
}

/** 处理选项 */
interface ProcessOptions extends MediaClientOptions {
  /** 处理类型 */
  type: 'transcode' | 'thumbnail' | 'watermark' | 'clip';
  /** 转码配置 */
  transcoding?: {
    /** 输出格式 */
    format?: string;
    /** 视频配置 */
    video?: {
      codec?: string;
      bitrate?: number;
      width?: number;
      height?: number;
      frameRate?: number;
    };
    /** 音频配置 */
    audio?: {
      codec?: string;
      bitrate?: number;
      sampleRate?: number;
      channels?: number;
    };
  };
  /** 缩略图配置 */
  thumbnail?: {
    /** 时间点（秒） */
    timeInSeconds?: number;
    /** 格式 */
    format?: 'jpg' | 'png';
    /** 宽度 */
    width?: number;
    /** 高度 */
    height?: number;
  };
  /** 水印配置 */
  watermark?: {
    /** 水印类型 */
    type: 'image' | 'text';
    /** 图片水印 */
    image?: {
      url: string;
      position: { x: number; y: number };
      opacity?: number;
    };
    /** 文字水印 */
    text?: {
      content: string;
      fontSize?: number;
      fontColor?: string;
      position: { x: number; y: number };
    };
  };
  /** 剪辑配置 */
  clip?: {
    /** 开始时间（秒） */
    startTime: number;
    /** 结束时间（秒） */
    endTime: number;
  };
}

/** 列表选项 */
interface ListOptions extends MediaClientOptions {
  /** 最大返回数量 */
  maxKeys?: number;
  /** 分页标记 */
  marker?: string;
  /** 媒体类型过滤 */
  mediaType?: 'video' | 'audio' | 'image';
  /** 状态过滤 */
  status?: 'PROCESSING' | 'SUCCESS' | 'FAILED';
}

/** 批量操作选项 */
interface BatchOperationOptions extends MediaClientOptions {
  /** 媒体ID列表 */
  mediaIds: string[];
}

/** 搜索选项 */
interface SearchOptions extends MediaClientOptions {
  /** 搜索关键词 */
  keyword?: string;
  /** 媒体类型 */
  mediaType?: 'video' | 'audio' | 'image';
  /** 开始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
  /** 最大返回数量 */
  maxKeys?: number;
  /** 分页标记 */
  marker?: string;
}

/**
 * Media 媒体服务客户端
 */
export default class MediaClient extends BceBaseClient {
  /**
   * 构造函数
   * @param config Media 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'media', true);
  }

  // --- 媒体文件管理 ---

  /**
   * 上传媒体文件
   * @param data 文件数据
   * @param options 上传选项
   * @returns Promise 解析为媒体信息
   */
  public async uploadMedia(data: Buffer | string, options: UploadOptions = {}): Promise<BceResponse<MediaInfo>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream'
    };

    if (options.fileName) {
      headers['Content-Disposition'] = `attachment; filename="${options.fileName}"`;
    }

    const body: any = {
      mediaType: options.mediaType,
      callbackUrl: options.callbackUrl,
      userData: options.userData
    };

    return this.sendRequest('POST', '/v1/media', {
      headers: headers,
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 获取媒体信息
   * @param mediaId 媒体ID
   * @param options 选项
   * @returns Promise 解析为媒体信息
   */
  public async getMedia(mediaId: string, options: MediaClientOptions = {}): Promise<BceResponse<MediaInfo>> {
    return this.sendRequest('GET', `/v1/media/${mediaId}`, {
      config: options.config
    });
  }

  /**
   * 更新媒体信息
   * @param mediaId 媒体ID
   * @param updates 更新数据
   * @param options 选项
   * @returns Promise 解析为更新结果
   */
  public async updateMedia(
    mediaId: string,
    updates: Partial<Pick<MediaInfo, 'fileName'>>,
    options: MediaClientOptions = {}
  ): Promise<BceResponse<MediaInfo>> {
    return this.sendRequest('PUT', `/v1/media/${mediaId}`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      config: options.config
    });
  }

  /**
   * 删除媒体文件
   * @param mediaId 媒体ID
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteMedia(mediaId: string, options: MediaClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/media/${mediaId}`, {
      config: options.config
    });
  }

  /**
   * 列出媒体文件
   * @param options 列表选项
   * @returns Promise 解析为媒体列表
   */
  public async listMedia(options: ListOptions = {}): Promise<BceResponse<{ media: MediaInfo[] }>> {
    const params = u.pick(options, 'maxKeys', 'marker', 'mediaType', 'status');

    return this.sendRequest('GET', '/v1/media', {
      params: params,
      config: options.config
    });
  }

  // --- 媒体处理 ---

  /**
   * 处理媒体文件
   * @param mediaId 媒体ID
   * @param options 处理选项
   * @returns Promise 解析为处理结果
   */
  public async processMedia(mediaId: string, options: ProcessOptions): Promise<BceResponse<{ taskId: string }>> {
    const body = u.pick(options, 'type', 'transcoding', 'thumbnail', 'watermark', 'clip');

    return this.sendRequest('POST', `/v1/media/${mediaId}/process`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 获取处理任务状态
   * @param taskId 任务ID
   * @param options 选项
   * @returns Promise 解析为任务状态
   */
  public async getProcessTask(taskId: string, options: MediaClientOptions = {}): Promise<BceResponse<any>> {
    return this.sendRequest('GET', `/v1/task/${taskId}`, {
      config: options.config
    });
  }

  /**
   * 取消处理任务
   * @param taskId 任务ID
   * @param options 选项
   * @returns Promise 解析为取消结果
   */
  public async cancelProcessTask(taskId: string, options: MediaClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/task/${taskId}`, {
      config: options.config
    });
  }

  // --- 批量操作 ---

  /**
   * 批量删除媒体文件
   * @param options 批量操作选项
   * @returns Promise 解析为批量删除结果
   */
  public async batchDeleteMedia(options: BatchOperationOptions): Promise<BceResponse<{ results: any[] }>> {
    return this.sendRequest('DELETE', '/v1/media/batch', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaIds: options.mediaIds }),
      config: options.config
    });
  }

  // --- 搜索 ---

  /**
   * 搜索媒体文件
   * @param options 搜索选项
   * @returns Promise 解析为搜索结果
   */
  public async searchMedia(options: SearchOptions = {}): Promise<BceResponse<{ media: MediaInfo[] }>> {
    const params = u.pick(options, 'keyword', 'mediaType', 'startTime', 'endTime', 'maxKeys', 'marker');

    return this.sendRequest('GET', '/v1/media/search', {
      params: params,
      config: options.config
    });
  }

  // --- 统计信息 ---

  /**
   * 获取媒体统计信息
   * @param options 选项
   * @returns Promise 解析为统计信息
   */
  public async getStatistics(options: MediaClientOptions = {}): Promise<BceResponse<any>> {
    return this.sendRequest('GET', '/v1/statistics', {
      config: options.config
    });
  }

  // --- 回调管理 ---

  /**
   * 设置回调配置
   * @param callbackUrl 回调地址
   * @param options 选项
   * @returns Promise 解析为设置结果
   */
  public async setCallback(callbackUrl: string, options: MediaClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('PUT', '/v1/callback', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callbackUrl: callbackUrl }),
      config: options.config
    });
  }

  /**
   * 获取回调配置
   * @param options 选项
   * @returns Promise 解析为回调配置
   */
  public async getCallback(options: MediaClientOptions = {}): Promise<BceResponse<{ callbackUrl: string }>> {
    return this.sendRequest('GET', '/v1/callback', {
      config: options.config
    });
  }

  /**
   * 删除回调配置
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteCallback(options: MediaClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', '/v1/callback', {
      config: options.config
    });
  }
}