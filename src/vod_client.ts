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
 * @file src/vod_client.ts
 * @author zhouhua
 */

import * as util from 'util';
import * as u from 'underscore';
import * as url from 'url';

import BceBaseClient from './bce_base_client';
import BosClient from './bos_client';
import * as helper from './helper';
import Media from './vod/Media';
import Notification from './vod/Notification';
import Player from './vod/Player';
import PresetGroup from './vod/PresetGroup';
import Statistic from './vod/Statistic';
import StrategyGroup from './vod/StrategyGroup';

// Import types
import type { BceResponse } from './types/common';
import type {
  VodClientConfig,
  MediaInfo,
  CreateMediaResourceResponse,
  GetMediaResourceResponse,
  ListMediaResourceResponse,
  UpdateMediaResourceResponse,
  DeleteMediaResourceResponse,
  ListMediaOptions,
  GetPlayableUrlResponse,
  GetPlayerCodeResponse,
  PlayerConfig,
  ApplyMediaResponse,
  GetDownloadUrlResponse
} from './vod/types';

/**
 * VOD音视频点播服务
 *
 * @see https://bce.baidu.com/doc/VOD/API.html#API.E6.8E.A5.E5.8F.A3
 */
export default class VodClient extends BceBaseClient {
  /**
   * 构造函数
   * @param config VOD 客户端配置
   */
  constructor(config: VodClientConfig) {
    super(config, 'vod', true);
  }

  // --- 媒资管理方法 ---

  /**
   * 创建媒资并上传文件
   * 
   * @param title 媒资标题
   * @param description 媒资描述
   * @param blob 文件数据
   * @param options 额外选项
   * @returns Promise 解析为创建结果
   */
  public async createMediaResource(
    title: string,
    description: string,
    blob: File | Blob | Buffer,
    options?: any
  ): Promise<CreateMediaResourceResponse> {
    const self = this;
    const protocol = url.parse(this.config.endpoint).protocol || 'https:';
    const mediaClient = new Media(this.config as VodClientConfig);
    
    // 申请媒资
    const applyResponse = await mediaClient.apply((this.config as VodClientConfig).mode);
    
    // 创建 BOS 客户端进行文件上传
    const bosClient = new BosClient({
      endpoint: protocol + '//' + applyResponse.body.host,
      credentials: self.config.credentials,
      sessionToken: self.config.sessionToken
    });
    
    // 转发进度事件
    bosClient.on('progress', function (evt) {
      self.emit('progress', evt);
    });
    
    // 上传文件
    await helper.upload(
      bosClient,
      applyResponse.body.sourceBucket,
      applyResponse.body.sourceKey,
      blob,
      options
    );
    
    // 处理媒资
    return mediaClient.process(title, u.extend({ description: description }, options));
  }

  /**
   * 获取媒资信息
   * 
   * @param mediaId 媒资ID
   * @returns Promise 解析为媒资信息
   */
  public async getMediaResource(mediaId: string): Promise<GetMediaResourceResponse> {
    return new Media(this.config as VodClientConfig).setMediaId(mediaId).get();
  }

  /**
   * 查询媒资列表
   * 
   * @param options 查询选项
   * @returns Promise 解析为媒资列表
   */
  public async listMediaResource(options?: ListMediaOptions): Promise<ListMediaResourceResponse> {
    return new Media(this.config as VodClientConfig).list(options);
  }

  /**
   * 查询媒资列表（别名）
   * 
   * @param options 查询选项
   * @returns Promise 解析为媒资列表
   */
  public async listMediaResources(options?: ListMediaOptions): Promise<ListMediaResourceResponse> {
    return this.listMediaResource(options);
  }

  /**
   * 更新媒资信息
   * 
   * @param mediaId 媒资ID
   * @param title 新标题
   * @param description 新描述
   * @returns Promise 解析为更新结果
   */
  public async updateMediaResource(
    mediaId: string,
    title: string,
    description?: string
  ): Promise<UpdateMediaResourceResponse> {
    return new Media(this.config as VodClientConfig).setMediaId(mediaId).update(title, description);
  }

  /**
   * 停用媒资
   * 
   * @param mediaId 媒资ID
   * @param options 选项
   * @returns Promise 解析为停用结果
   */
  public async stopMediaResource(mediaId: string, options?: any): Promise<BceResponse<void>> {
    return new Media(this.config as VodClientConfig).setMediaId(mediaId).disable();
  }

  /**
   * 发布媒资
   * 
   * @param mediaId 媒资ID
   * @param options 选项
   * @returns Promise 解析为发布结果
   */
  public async publishMediaResource(mediaId: string, options?: any): Promise<BceResponse<void>> {
    return new Media(this.config as VodClientConfig).setMediaId(mediaId).resume();
  }

  /**
   * 删除媒资
   * 
   * @param mediaId 媒资ID
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteMediaResource(mediaId: string, options?: any): Promise<DeleteMediaResourceResponse> {
    return new Media(this.config as VodClientConfig).setMediaId(mediaId).remove();
  }

  // --- 播放相关方法 ---

  /**
   * 获取播放地址
   * 
   * @param mediaId 媒资ID
   * @param transcodingPresetName 转码预设名称
   * @returns Promise 解析为播放地址
   */
  public async getPlayableUrl(
    mediaId: string,
    transcodingPresetName?: string
  ): Promise<BceResponse<GetPlayableUrlResponse>> {
    return new Player(this.config as VodClientConfig).setMediaId(mediaId).delivery(transcodingPresetName);
  }

  /**
   * 获取下载地址
   * 
   * @param mediaId 媒资ID
   * @param expiredInSeconds 过期时间（秒）
   * @returns Promise 解析为下载地址
   */
  public async getDownloadUrl(
    mediaId: string,
    expiredInSeconds?: number
  ): Promise<BceResponse<GetDownloadUrlResponse>> {
    return new Media(this.config as VodClientConfig).getDownloadUrl(mediaId, expiredInSeconds);
  }

  /**
   * 获取播放器代码
   * 
   * @param mediaId 媒资ID
   * @param width 播放器宽度
   * @param height 播放器高度
   * @param autoStart 是否自动播放
   * @param options 额外选项
   * @returns Promise 解析为播放器代码
   */
  public async getPlayerCode(
    mediaId: string,
    width: number,
    height: number,
    autoStart: boolean,
    options?: Partial<PlayerConfig>
  ): Promise<BceResponse<GetPlayerCodeResponse>> {
    const playerConfig: PlayerConfig = u.extend({
      ak: this.config.credentials.ak,
      width: width,
      height: height,
      autostart: autoStart
    }, options);

    return new Player(this.config as VodClientConfig).setMediaId(mediaId).code(playerConfig);
  }

  // --- 内部方法 ---

  /**
   * 生成媒资ID
   * 
   * @returns Promise 解析为申请结果
   */
  public async _generateMediaId(): Promise<BceResponse<ApplyMediaResponse>> {
    return new Media(this.config as VodClientConfig).apply();
  }

  /**
   * 创建媒资（内部使用）
   * 
   * @param mediaId 媒资ID
   * @param title 标题
   * @param description 描述
   * @param options 选项
   * @returns Promise 解析为创建结果
   */
  public async _createMediaResource(
    mediaId: string,
    title: string,
    description: string,
    options?: any
  ): Promise<BceResponse<MediaInfo>> {
    return new Media(this.config as VodClientConfig)
      .setMediaId(mediaId)
      .process(title, u.extend({ description: description }, options));
  }

  // --- 静态属性（向后兼容） ---
  public static Media = Media;
  public static Notification = Notification;
  public static Player = Player;
  public static PresetGroup = PresetGroup;
  public static Statistic = Statistic;
  public static StrategyGroup = StrategyGroup;
}

// CommonJS 兼容导出
module.exports = VodClient;
module.exports.default = VodClient;