/**
 * @file src/vod/Notification.ts
 * @author leeight
 */

import BceBaseClient from '../bce_base_client';

// Import types
import type {BceResponse} from '../types/common';
import type {VodClientConfig, NotificationConfig} from './types';

/**
 * 音视频通知接口
 * https://cloud.baidu.com/doc/VOD/API.html#.E9.80.9A.E7.9F.A5.E6.8E.A5.E5.8F.A3
 */
export default class Notification extends BceBaseClient {
  /**
   * 构造函数
   * @param config VOD 客户端配置
   */
  constructor(config: VodClientConfig) {
    super(config, 'vod', false);
  }

  /**
   * 构建请求URL
   * @param extraPaths 额外路径段
   * @returns 构建的URL
   */
  private _buildUrl(...extraPaths: string[]): string {
    let baseUrl = '/v1/notification';

    if (extraPaths.length) {
      baseUrl += '/' + extraPaths.join('/');
    }

    return baseUrl;
  }

  // --- API 方法 ---

  /**
   * 创建通知
   *
   * @param name 通知名称
   * @param endpoint 通知端点
   * @returns Promise 解析为创建响应
   */
  public async create(name: string, endpoint: string): Promise<BceResponse<NotificationConfig>> {
    const url = this._buildUrl();
    const payload = {
      name: name,
      endpoint: endpoint
    };

    return this.sendRequest('POST', url, {
      body: JSON.stringify(payload)
    });
  }

  /**
   * 查询通知
   *
   * @param name 通知名称
   * @returns Promise 解析为通知信息
   */
  public async get(name: string): Promise<BceResponse<NotificationConfig>> {
    const url = this._buildUrl(name);
    return this.sendRequest('GET', url);
  }

  /**
   * 通知列表
   *
   * @returns Promise 解析为通知列表
   */
  public async listAll(): Promise<BceResponse<{notifications: NotificationConfig[]}>> {
    const url = this._buildUrl();
    return this.sendRequest('GET', url);
  }

  /**
   * 删除通知
   *
   * @param name 通知名称
   * @returns Promise 解析为删除响应
   */
  public async remove(name: string): Promise<BceResponse<void>> {
    const url = this._buildUrl(name);
    return this.sendRequest('DELETE', url);
  }
}
