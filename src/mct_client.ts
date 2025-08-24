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
 * @file src/mct_client.ts
 * @author leeight
 */

import * as u from 'underscore';
import BceBaseClient from './bce_base_client';
import type { BceConfig, BceResponse } from './types/common';

// ==================== 类型定义 ====================

/** MCT 客户端选项 */
interface MctClientOptions {
  config?: Partial<BceConfig>;
}

/** 作业状态 */
type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

/** 输入源配置 */
interface SourceConfig {
  /** 源类型 */
  sourceType: 'URL' | 'BOS';
  /** 源地址 */
  source: string;
  /** BOS 配置（当 sourceType 为 BOS 时） */
  bosConfig?: {
    bucket: string;
    key: string;
  };
}

/** 输出配置 */
interface TargetConfig {
  /** 目标类型 */
  targetType: 'BOS';
  /** BOS 配置 */
  bosConfig: {
    bucket: string;
    key: string;
  };
}

/** 转码配置 */
interface TranscodingConfig {
  /** 容器格式 */
  container?: string;
  /** 视频配置 */
  video?: {
    /** 编码器 */
    codec?: string;
    /** 码率（kbps） */
    bitrate?: number;
    /** 分辨率宽度 */
    width?: number;
    /** 分辨率高度 */
    height?: number;
    /** 帧率 */
    frameRate?: number;
  };
  /** 音频配置 */
  audio?: {
    /** 编码器 */
    codec?: string;
    /** 码率（kbps） */
    bitrate?: number;
    /** 采样率 */
    sampleRate?: number;
    /** 声道数 */
    channels?: number;
  };
}

/** 水印配置 */
interface WatermarkConfig {
  /** 水印类型 */
  type: 'image' | 'text';
  /** 图片水印配置 */
  image?: {
    /** 图片源 */
    source: string;
    /** 位置 */
    position: {
      x: number;
      y: number;
    };
    /** 透明度 */
    opacity?: number;
  };
  /** 文字水印配置 */
  text?: {
    /** 文字内容 */
    content: string;
    /** 字体大小 */
    fontSize?: number;
    /** 字体颜色 */
    fontColor?: string;
    /** 位置 */
    position: {
      x: number;
      y: number;
    };
  };
}

/** 创建作业选项 */
interface CreateJobOptions extends MctClientOptions {
  /** 作业类型 */
  type: 'transcode' | 'thumbnail' | 'watermark';
  /** 输入源 */
  source: SourceConfig;
  /** 输出目标 */
  target: TargetConfig;
  /** 转码配置 */
  transcoding?: TranscodingConfig;
  /** 水印配置 */
  watermark?: WatermarkConfig;
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
  /** 通知配置 */
  notification?: {
    endpoint: string;
  };
}

/** 作业信息 */
interface JobInfo {
  /** 作业ID */
  jobId: string;
  /** 作业类型 */
  type: string;
  /** 状态 */
  status: JobStatus;
  /** 输入源 */
  source: SourceConfig;
  /** 输出目标 */
  target: TargetConfig;
  /** 创建时间 */
  createTime: string;
  /** 开始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
  /** 进度百分比 */
  progress?: number;
  /** 错误信息 */
  error?: {
    code: string;
    message: string;
  };
}

/** 列表选项 */
interface ListJobsOptions extends MctClientOptions {
  /** 最大返回数量 */
  maxKeys?: number;
  /** 分页标记 */
  marker?: string;
  /** 状态过滤 */
  status?: JobStatus;
  /** 类型过滤 */
  type?: string;
}

/** 预设配置 */
interface PresetConfig {
  /** 预设名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 容器格式 */
  container: string;
  /** 转码配置 */
  transcoding: TranscodingConfig;
}

/**
 * MCT (Media Content Transcoding) 媒体处理服务客户端
 */
export default class MctClient extends BceBaseClient {
  /**
   * 构造函数
   * @param config MCT 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'mct', true);
  }

  // --- 作业管理 ---

  /**
   * 创建媒体处理作业
   * @param options 作业选项
   * @returns Promise 解析为作业信息
   */
  public async createJob(options: CreateJobOptions): Promise<BceResponse<JobInfo>> {
    const body = u.pick(options, 'type', 'source', 'target', 'transcoding', 'watermark', 'thumbnail', 'notification');

    return this.sendRequest('POST', '/v1/job', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 获取作业信息
   * @param jobId 作业ID
   * @param options 选项
   * @returns Promise 解析为作业信息
   */
  public async getJob(jobId: string, options: MctClientOptions = {}): Promise<BceResponse<JobInfo>> {
    return this.sendRequest('GET', `/v1/job/${jobId}`, {
      config: options.config
    });
  }

  /**
   * 列出作业
   * @param options 列表选项
   * @returns Promise 解析为作业列表
   */
  public async listJobs(options: ListJobsOptions = {}): Promise<BceResponse<{ jobs: JobInfo[] }>> {
    const params = u.pick(options, 'maxKeys', 'marker', 'status', 'type');

    return this.sendRequest('GET', '/v1/job', {
      params: params,
      config: options.config
    });
  }

  /**
   * 取消作业
   * @param jobId 作业ID
   * @param options 选项
   * @returns Promise 解析为取消结果
   */
  public async cancelJob(jobId: string, options: MctClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/job/${jobId}`, {
      config: options.config
    });
  }

  // --- 预设管理 ---

  /**
   * 创建转码预设
   * @param preset 预设配置
   * @param options 选项
   * @returns Promise 解析为创建结果
   */
  public async createPreset(preset: PresetConfig, options: MctClientOptions = {}): Promise<BceResponse<PresetConfig>> {
    return this.sendRequest('POST', '/v1/preset', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset),
      config: options.config
    });
  }

  /**
   * 获取预设信息
   * @param presetName 预设名称
   * @param options 选项
   * @returns Promise 解析为预设信息
   */
  public async getPreset(presetName: string, options: MctClientOptions = {}): Promise<BceResponse<PresetConfig>> {
    return this.sendRequest('GET', `/v1/preset/${presetName}`, {
      config: options.config
    });
  }

  /**
   * 列出预设
   * @param options 选项
   * @returns Promise 解析为预设列表
   */
  public async listPresets(options: MctClientOptions = {}): Promise<BceResponse<{ presets: PresetConfig[] }>> {
    return this.sendRequest('GET', '/v1/preset', {
      config: options.config
    });
  }

  /**
   * 更新预设
   * @param presetName 预设名称
   * @param preset 预设配置
   * @param options 选项
   * @returns Promise 解析为更新结果
   */
  public async updatePreset(presetName: string, preset: Partial<PresetConfig>, options: MctClientOptions = {}): Promise<BceResponse<PresetConfig>> {
    return this.sendRequest('PUT', `/v1/preset/${presetName}`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset),
      config: options.config
    });
  }

  /**
   * 删除预设
   * @param presetName 预设名称
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deletePreset(presetName: string, options: MctClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/preset/${presetName}`, {
      config: options.config
    });
  }

  // --- 队列管理 ---

  /**
   * 获取队列信息
   * @param options 选项
   * @returns Promise 解析为队列信息
   */
  public async getQueue(options: MctClientOptions = {}): Promise<BceResponse<{ queueName: string; status: string }>> {
    return this.sendRequest('GET', '/v1/queue', {
      config: options.config
    });
  }

  // --- 统计信息 ---

  /**
   * 获取统计信息
   * @param startTime 开始时间（ISO 8601格式）
   * @param endTime 结束时间（ISO 8601格式）
   * @param options 选项
   * @returns Promise 解析为统计信息
   */
  public async getStatistics(
    startTime: string,
    endTime: string,
    options: MctClientOptions = {}
  ): Promise<BceResponse<any>> {
    return this.sendRequest('GET', '/v1/statistics', {
      params: {
        startTime: startTime,
        endTime: endTime
      },
      config: options.config
    });
  }
}