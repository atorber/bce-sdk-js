/**
 * @file src/vod/Media.ts
 * @author leeight
 */

import * as util from 'util';
import * as u from 'underscore';
import debugLib from 'debug';

import BceBaseClient from '../bce_base_client';
import * as helper from '../helper';
import Statistic from './Statistic';

// Import types
import type {BceConfig, BceResponse} from '../types/common';
import type {
  MediaInfo,
  ApplyMediaResponse,
  ProcessMediaOptions,
  ListMediaOptions,
  ListMediaResponse,
  UpdateMediaOptions,
  GetDownloadUrlOptions,
  GetDownloadUrlResponse,
  TranscodingMode,
  VodClientConfig
} from './types';

const debug = debugLib('bce-sdk:VodClient.Media');

/**
 * 音视频媒资接口
 * https://cloud.baidu.com/doc/VOD/API.html#.E9.9F.B3.E8.A7.86.E9.A2.91.E5.AA.92.E8.B5.84.E6.8E.A5.E5.8F.A3
 */
export default class Media extends BceBaseClient {
  private _mediaId: string | null = null;
  private _sourceBucket: string | null = null;
  private _sourceKey: string | null = null;
  private _host: string | null = null;

  /**
   * 构造函数
   * @param config VOD 客户端配置
   */
  constructor(config: VodClientConfig) {
    super(config, 'vod', false);
  }

  /**
   * 设置媒资ID
   * @param mediaId 媒资ID
   * @returns 当前实例
   */
  public setMediaId(mediaId: string): this {
    this._mediaId = mediaId;
    return this;
  }

  /**
   * 构建请求URL
   * @param extraPaths 额外路径段
   * @returns 构建的URL
   */
  private _buildUrl(...extraPaths: string[]): string {
    let baseUrl = '/v1/media';

    if (extraPaths.length) {
      baseUrl += '/' + extraPaths.join('/');
    }

    return baseUrl;
  }

  // --- API 方法 ---

  /**
   * 申请媒资
   *
   * @param mode 提供"no_transcoding"说明要申请一个不转码的媒资；提供NULL/""/其他值说明申请一个普通的转码媒资
   * @returns Promise 解析为申请响应
   */
  public async apply(mode?: TranscodingMode): Promise<BceResponse<ApplyMediaResponse>> {
    const url = this._buildUrl();
    const options = {
      params: {
        apply: '',
        mode: mode || ''
      }
    };

    const response = await this.sendRequest('POST', url, options);

    // 保存申请结果
    this._mediaId = response.body.mediaId;
    this._sourceBucket = response.body.sourceBucket;
    this._sourceKey = response.body.sourceKey;
    this._host = response.body.host;

    return response;
  }

  /**
   * 处理媒资
   *
   * @param title 媒资标题
   * @param options 额外的媒资属性
   * @returns Promise 解析为处理响应
   */
  public async process(title: string, options?: ProcessMediaOptions): Promise<BceResponse<MediaInfo>> {
    if (!this._mediaId) {
      throw new Error('Media ID is required. Call apply() first or setMediaId().');
    }

    const url = this._buildUrl(this._mediaId);
    const payload = u.extend(
      {
        title: title,
        description: null,
        sourceExtension: null,
        transcodingPresetGroupName: null
      },
      options
    );

    const filteredPayload = u.pick(payload, helper.omitNull);

    return this.sendRequest('POST', url, {
      params: {
        process: ''
      },
      body: JSON.stringify(filteredPayload)
    });
  }

  /**
   * 停用指定媒资，仅对 PUBLISHED 状态的媒资有效
   *
   * @param mediaId 媒资ID，可选，默认使用当前实例的媒资ID
   * @returns Promise 解析为停用响应
   */
  public async disable(mediaId?: string): Promise<BceResponse<void>> {
    const targetMediaId = mediaId || this._mediaId;
    if (!targetMediaId) {
      throw new Error('Media ID is required.');
    }

    const url = this._buildUrl(targetMediaId);
    return this.sendRequest('PUT', url, {
      params: {
        disable: ''
      }
    });
  }

  /**
   * 恢复指定媒资，仅对 DISABLED 状态的媒资有效
   *
   * @param mediaId 媒资ID，可选，默认使用当前实例的媒资ID
   * @returns Promise 解析为恢复响应
   */
  public async resume(mediaId?: string): Promise<BceResponse<void>> {
    const targetMediaId = mediaId || this._mediaId;
    if (!targetMediaId) {
      throw new Error('Media ID is required.');
    }

    const url = this._buildUrl(targetMediaId);
    return this.sendRequest('PUT', url, {
      params: {
        publish: ''
      }
    });
  }

  /**
   * 删除指定媒资，对 RUNNING 状态的媒资无效
   *
   * @param mediaId 媒资ID，可选，默认使用当前实例的媒资ID
   * @returns Promise 解析为删除响应
   */
  public async remove(mediaId?: string): Promise<BceResponse<void>> {
    const targetMediaId = mediaId || this._mediaId;
    if (!targetMediaId) {
      throw new Error('Media ID is required.');
    }

    const url = this._buildUrl(targetMediaId);
    return this.sendRequest('DELETE', url);
  }

  /**
   * 查询指定媒资
   *
   * @param mediaId 媒资ID，可选，默认使用当前实例的媒资ID
   * @returns Promise 解析为媒资信息
   */
  public async get(mediaId?: string): Promise<BceResponse<MediaInfo>> {
    const targetMediaId = mediaId || this._mediaId;
    if (!targetMediaId) {
      throw new Error('Media ID is required.');
    }

    const url = this._buildUrl(targetMediaId);
    debug('url = %j', url);
    return this.sendRequest('GET', url);
  }

  /**
   * 查询指定媒资的部分信息
   *
   * @param mediaId 媒资ID，可选，默认使用当前实例的媒资ID
   * @param scope 查询范围，目前仅支持thumbnail
   * @param taskId 不同scope下的某个任务标识，目前当scope=thumbnail时，taskId分别可取default、second、wonderful
   * @returns Promise 解析为部分媒资信息
   */
  public async getPartInfo(mediaId?: string, scope?: string, taskId?: string): Promise<BceResponse<any>> {
    const targetMediaId = mediaId || this._mediaId;
    if (!targetMediaId) {
      throw new Error('Media ID is required.');
    }

    const url = this._buildUrl(targetMediaId);
    debug('url = %j', url);
    return this.sendRequest('GET', url, {
      params: {
        scope: scope,
        taskId: taskId
      }
    });
  }

  /**
   * 获取音视频媒资的源文件下载地址
   *
   * @param mediaId 媒资ID，可选，默认使用当前实例的媒资ID
   * @param expiredInSeconds 过期时间，单位(s)，默认1天
   * @returns Promise 解析为下载地址信息
   */
  public async getDownloadUrl(
    mediaId?: string,
    expiredInSeconds?: number
  ): Promise<BceResponse<GetDownloadUrlResponse>> {
    const targetMediaId = mediaId || this._mediaId;
    if (!targetMediaId) {
      throw new Error('Media ID is required.');
    }

    const expiredTime = expiredInSeconds || 60 * 60 * 24; // 默认1天
    const url = this._buildUrl(targetMediaId);

    return this.sendRequest('GET', url, {
      params: {
        sourcedownload: '',
        expiredInSeconds: expiredTime
      }
    });
  }

  /**
   * 查询媒资列表
   *
   * @param options 查询选项
   * @returns Promise 解析为媒资列表
   */
  public async list(options?: ListMediaOptions): Promise<BceResponse<ListMediaResponse>> {
    const url = this._buildUrl();
    const params: Record<string, any> = {};

    if (options) {
      if (options.status) {
        params.status = options.status;
      }
      if (options.begin) {
        params.begin = options.begin;
      }
      if (options.end) {
        params.end = options.end;
      }
      if (options.title) {
        params.title = options.title;
      }
      if (options.pageSize) {
        params.pageSize = options.pageSize;
      }
      if (options.marker) {
        params.marker = options.marker;
      }
    }

    return this.sendRequest('GET', url, {params});
  }

  /**
   * 更新媒资信息
   *
   * @param title 新标题
   * @param description 新描述
   * @param mediaId 媒资ID，可选，默认使用当前实例的媒资ID
   * @returns Promise 解析为更新响应
   */
  public async update(title: string, description?: string, mediaId?: string): Promise<BceResponse<MediaInfo>> {
    const targetMediaId = mediaId || this._mediaId;
    if (!targetMediaId) {
      throw new Error('Media ID is required.');
    }

    const url = this._buildUrl(targetMediaId);
    const payload: UpdateMediaOptions = {title};

    if (description !== undefined) {
      payload.description = description;
    }

    return this.sendRequest('PUT', url, {
      body: JSON.stringify(payload)
    });
  }

  /**
   * 查询媒资处理进度
   *
   * @param mediaId 媒资ID，可选，默认使用当前实例的媒资ID
   * @returns Promise 解析为处理进度信息
   */
  public async getProgress(mediaId?: string): Promise<BceResponse<any>> {
    const targetMediaId = mediaId || this._mediaId;
    if (!targetMediaId) {
      throw new Error('Media ID is required.');
    }

    const url = this._buildUrl(targetMediaId);
    return this.sendRequest('GET', url, {
      params: {
        progress: ''
      }
    });
  }

  /**
   * 获取统计信息
   *
   * @returns 统计实例
   */
  public getStatistic(): Statistic {
    return new Statistic(this.config);
  }
}
