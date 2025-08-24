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
 * @file src/lss_client.ts
 * @author leeight
 */

import * as u from 'underscore';
import BceBaseClient from './bce_base_client';
import type { BceConfig, BceResponse } from './types/common';

// ==================== 类型定义 ====================

/** LSS 客户端选项 */
interface LssClientOptions {
  config?: Partial<BceConfig>;
}

/** 直播流配置 */
interface StreamOptions {
  /** 流名称 */
  name?: string;
  /** 描述 */
  description?: string;
  /** 域名 */
  domain?: string;
  /** 播放协议 */
  playProtocol?: string[];
  /** 录制配置 */
  recording?: RecordingConfig;
  /** 截图配置 */
  thumbnail?: ThumbnailConfig;
}

/** 录制配置 */
interface RecordingConfig {
  /** 是否启用录制 */
  enabled?: boolean;
  /** 录制格式 */
  format?: 'hls' | 'mp4';
  /** 存储桶 */
  bucket?: string;
  /** 存储路径 */
  path?: string;
}

/** 截图配置 */
interface ThumbnailConfig {
  /** 是否启用截图 */
  enabled?: boolean;
  /** 截图间隔（秒） */
  interval?: number;
  /** 存储桶 */
  bucket?: string;
  /** 存储路径 */
  path?: string;
}

/** 流信息 */
interface StreamInfo {
  /** 流ID */
  streamId: string;
  /** 流名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 状态 */
  status: 'READY' | 'ONGOING' | 'PAUSED' | 'DISABLED';
  /** 创建时间 */
  createTime: string;
  /** 推流地址 */
  publishUrl?: string;
  /** 播放地址 */
  playUrls?: {
    rtmp?: string;
    hls?: string;
    flv?: string;
  };
}

/** 列表选项 */
interface ListOptions extends LssClientOptions {
  /** 最大返回数量 */
  maxKeys?: number;
  /** 分页标记 */
  marker?: string;
  /** 状态过滤 */
  status?: 'READY' | 'ONGOING' | 'PAUSED' | 'DISABLED';
}

/** 统计信息 */
interface StreamStatistics {
  /** 流ID */
  streamId: string;
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime?: string;
  /** 观看人数 */
  viewerCount?: number;
  /** 流量（字节） */
  traffic?: number;
  /** 时长（秒） */
  duration?: number;
}

/**
 * LSS (Live Streaming Service) 直播流服务客户端
 */
export default class LssClient extends BceBaseClient {
  /**
   * 构造函数
   * @param config LSS 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'lss', true);
  }

  // --- 流管理 ---

  /**
   * 创建直播流
   * @param options 流配置选项
   * @returns Promise 解析为创建结果
   */
  public async createStream(options: StreamOptions & LssClientOptions = {}): Promise<BceResponse<StreamInfo>> {
    const body = u.pick(options, 'name', 'description', 'domain', 'playProtocol', 'recording', 'thumbnail');

    return this.sendRequest('POST', '/v1/stream', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 获取流信息
   * @param streamId 流ID
   * @param options 选项
   * @returns Promise 解析为流信息
   */
  public async getStream(streamId: string, options: LssClientOptions = {}): Promise<BceResponse<StreamInfo>> {
    return this.sendRequest('GET', `/v1/stream/${streamId}`, {
      config: options.config
    });
  }

  /**
   * 更新流配置
   * @param streamId 流ID
   * @param options 更新选项
   * @returns Promise 解析为更新结果
   */
  public async updateStream(streamId: string, options: StreamOptions & LssClientOptions = {}): Promise<BceResponse<StreamInfo>> {
    const body = u.pick(options, 'name', 'description', 'recording', 'thumbnail');

    return this.sendRequest('PUT', `/v1/stream/${streamId}`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 删除流
   * @param streamId 流ID
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteStream(streamId: string, options: LssClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/stream/${streamId}`, {
      config: options.config
    });
  }

  /**
   * 列出流
   * @param options 列表选项
   * @returns Promise 解析为流列表
   */
  public async listStreams(options: ListOptions = {}): Promise<BceResponse<{ streams: StreamInfo[] }>> {
    const params = u.pick(options, 'maxKeys', 'marker', 'status');

    return this.sendRequest('GET', '/v1/stream', {
      params: params,
      config: options.config
    });
  }

  // --- 流控制 ---

  /**
   * 启动流
   * @param streamId 流ID
   * @param options 选项
   * @returns Promise 解析为启动结果
   */
  public async startStream(streamId: string, options: LssClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('PUT', `/v1/stream/${streamId}`, {
      params: { start: '' },
      config: options.config
    });
  }

  /**
   * 暂停流
   * @param streamId 流ID
   * @param options 选项
   * @returns Promise 解析为暂停结果
   */
  public async pauseStream(streamId: string, options: LssClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('PUT', `/v1/stream/${streamId}`, {
      params: { pause: '' },
      config: options.config
    });
  }

  /**
   * 恢复流
   * @param streamId 流ID
   * @param options 选项
   * @returns Promise 解析为恢复结果
   */
  public async resumeStream(streamId: string, options: LssClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('PUT', `/v1/stream/${streamId}`, {
      params: { resume: '' },
      config: options.config
    });
  }

  /**
   * 停止流
   * @param streamId 流ID
   * @param options 选项
   * @returns Promise 解析为停止结果
   */
  public async stopStream(streamId: string, options: LssClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('PUT', `/v1/stream/${streamId}`, {
      params: { stop: '' },
      config: options.config
    });
  }

  // --- 流统计 ---

  /**
   * 获取流统计信息
   * @param streamId 流ID
   * @param startTime 开始时间（ISO 8601格式）
   * @param endTime 结束时间（ISO 8601格式）
   * @param options 选项
   * @returns Promise 解析为统计信息
   */
  public async getStreamStatistics(
    streamId: string,
    startTime: string,
    endTime: string,
    options: LssClientOptions = {}
  ): Promise<BceResponse<StreamStatistics>> {
    return this.sendRequest('GET', `/v1/stream/${streamId}/statistics`, {
      params: {
        startTime: startTime,
        endTime: endTime
      },
      config: options.config
    });
  }

  // --- 域名管理 ---

  /**
   * 创建推流域名
   * @param domain 域名
   * @param options 选项
   * @returns Promise 解析为创建结果
   */
  public async createPushDomain(domain: string, options: LssClientOptions = {}): Promise<BceResponse<any>> {
    return this.sendRequest('POST', '/v1/domain/push', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domain }),
      config: options.config
    });
  }

  /**
   * 创建播放域名
   * @param domain 域名
   * @param options 选项
   * @returns Promise 解析为创建结果
   */
  public async createPlayDomain(domain: string, options: LssClientOptions = {}): Promise<BceResponse<any>> {
    return this.sendRequest('POST', '/v1/domain/play', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domain }),
      config: options.config
    });
  }

  /**
   * 列出域名
   * @param options 选项
   * @returns Promise 解析为域名列表
   */
  public async listDomains(options: LssClientOptions = {}): Promise<BceResponse<{ domains: any[] }>> {
    return this.sendRequest('GET', '/v1/domain', {
      config: options.config
    });
  }

  /**
   * 删除域名
   * @param domain 域名
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteDomain(domain: string, options: LssClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/domain/${domain}`, {
      config: options.config
    });
  }

  // --- 录制管理 ---

  /**
   * 获取录制列表
   * @param streamId 流ID
   * @param options 选项
   * @returns Promise 解析为录制列表
   */
  public async getRecordings(streamId: string, options: LssClientOptions = {}): Promise<BceResponse<{ recordings: any[] }>> {
    return this.sendRequest('GET', `/v1/stream/${streamId}/recording`, {
      config: options.config
    });
  }

  // --- 截图管理 ---

  /**
   * 获取截图列表
   * @param streamId 流ID
   * @param options 选项
   * @returns Promise 解析为截图列表
   */
  public async getThumbnails(streamId: string, options: LssClientOptions = {}): Promise<BceResponse<{ thumbnails: any[] }>> {
    return this.sendRequest('GET', `/v1/stream/${streamId}/thumbnail`, {
      config: options.config
    });
  }
}