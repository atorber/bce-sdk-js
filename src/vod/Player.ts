/**
 * @file src/vod/Player.ts
 * @author leeight
 */

import * as util from 'util';
import * as u from 'underscore';

import BceBaseClient from '../bce_base_client';
import * as helper from '../helper';

// Import types
import type {BceResponse} from '../types/common';
import type {VodClientConfig, PlayerConfig, GetPlayableUrlResponse, GetPlayerCodeResponse} from './types';

/**
 * 音视频播放器服务接口
 * https://cloud.baidu.com/doc/VOD/API.html#.E6.92.AD.E6.94.BE.E5.99.A8.E6.9C.8D.E5.8A.A1.E6.8E.A5.E5.8F.A3
 */
export default class Player extends BceBaseClient {
  private _mediaId: string | null = null;

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
   * 查询媒资分发信息
   *
   * @param transcodingPresetName 转码模板名称
   * @returns Promise 解析为播放地址信息
   */
  public async delivery(transcodingPresetName?: string): Promise<BceResponse<GetPlayableUrlResponse>> {
    if (!this._mediaId) {
      throw new Error('Media ID is required. Call setMediaId() first.');
    }

    const url = this._buildUrl(this._mediaId, 'delivery');
    const params = u.pick(
      {
        transcodingPresetName: transcodingPresetName
      },
      (value: any) => value !== undefined && value !== null
    );

    const response = await this.sendRequest('GET', url, {params: params});

    // 处理响应格式
    if (response.body.success === true) {
      response.body = response.body.result;
    }

    return response;
  }

  /**
   * 查询媒资播放代码
   *
   * @param options 配置参数
   * @returns Promise 解析为播放器代码信息
   */
  public async code(options: PlayerConfig): Promise<BceResponse<GetPlayerCodeResponse>> {
    if (!this._mediaId) {
      throw new Error('Media ID is required. Call setMediaId() first.');
    }

    const url = this._buildUrl(this._mediaId, 'code');
    const params = u.extend(
      {
        // required
        width: 100,
        height: 100,
        autostart: true,
        ak: null,

        // optional
        transcodingPresetName: null
      },
      options
    );

    const filteredParams = u.pick(params, helper.omitNull);

    const response = await this.sendRequest('GET', url, {params: filteredParams});

    // 处理播放器代码解码
    const codes = response.body.codes;
    if (Array.isArray(codes)) {
      for (let i = 0; i < codes.length; i++) {
        const item = codes[i];
        if (item.codeType === 'html') {
          item.sourceCode = Buffer.from(item.sourceCode, 'base64').toString('utf-8');
          break;
        }
      }
    }

    return response;
  }
}
