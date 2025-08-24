/**
 * @file src/vod/PresetGroup.ts
 * @author leeight
 */

import BceBaseClient from '../bce_base_client';
import type {BceResponse} from '../types/common';
import type {VodClientConfig, PresetGroup} from './types';

/**
 * 转码预设组接口
 */
export default class PresetGroupClient extends BceBaseClient {
  constructor(config: VodClientConfig) {
    super(config, 'vod', false);
  }

  private _buildUrl(...extraPaths: string[]): string {
    let baseUrl = '/v1/preset';
    if (extraPaths.length) {
      baseUrl += '/' + extraPaths.join('/');
    }
    return baseUrl;
  }

  public async list(): Promise<BceResponse<{presetGroups: PresetGroup[]}>> {
    const url = this._buildUrl();
    return this.sendRequest('GET', url);
  }

  public async get(name: string): Promise<BceResponse<PresetGroup>> {
    const url = this._buildUrl(name);
    return this.sendRequest('GET', url);
  }
}
