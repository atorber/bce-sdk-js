/**
 * @file src/vod/StrategyGroup.ts
 * @author leeight
 */

import BceBaseClient from '../bce_base_client';
import type {BceResponse} from '../types/common';
import type {VodClientConfig} from './types';

/**
 * 策略组接口
 */
export default class StrategyGroup extends BceBaseClient {
  constructor(config: VodClientConfig) {
    super(config, 'vod', false);
  }

  private _buildUrl(...extraPaths: string[]): string {
    let baseUrl = '/v1/strategy';
    if (extraPaths.length) {
      baseUrl += '/' + extraPaths.join('/');
    }
    return baseUrl;
  }

  public async list(): Promise<BceResponse<any>> {
    const url = this._buildUrl();
    return this.sendRequest('GET', url);
  }

  public async get(name: string): Promise<BceResponse<any>> {
    const url = this._buildUrl(name);
    return this.sendRequest('GET', url);
  }
}
