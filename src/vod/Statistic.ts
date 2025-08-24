/**
 * @file src/vod/Statistic.ts
 * @author leeight
 */

import BceBaseClient from '../bce_base_client';
import type {BceResponse} from '../types/common';
import type {VodClientConfig, StatisticData, StatisticOptions} from './types';

/**
 * 统计接口
 */
export default class Statistic extends BceBaseClient {
  constructor(config: VodClientConfig) {
    super(config, 'vod', false);
  }

  private _buildUrl(...extraPaths: string[]): string {
    let baseUrl = '/v1/statistic';
    if (extraPaths.length) {
      baseUrl += '/' + extraPaths.join('/');
    }
    return baseUrl;
  }

  public async get(options: StatisticOptions): Promise<BceResponse<{statistics: StatisticData[]}>> {
    const url = this._buildUrl();
    return this.sendRequest('GET', url, {params: options});
  }
}
