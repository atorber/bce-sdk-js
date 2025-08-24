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
 * @file src/face_client.ts
 * @author leeight
 */

import * as u from 'underscore';
import debugLib from 'debug';
import BceBaseClient from './bce_base_client';
import type { BceConfig, BceResponse } from './types/common';

const debug = debugLib('bce-sdk:FaceClient');

// ==================== 类型定义 ====================

/** Face 客户端选项 */
interface FaceClientOptions {
  config?: Partial<BceConfig>;
}

/** 应用信息 */
interface App {
  appId: string;
  name: string;
  createTime: string;
}

/** 分组信息 */
interface Group {
  groupName: string;
  createTime: string;
  personCount: number;
}

/** 人员信息 */
interface Person {
  personName: string;
  groupName: string;
  createTime: string;
  faceCount: number;
}

/** 人脸数据 */
interface Face {
  bosPath?: string;
  base64?: string;
}

/** 识别结果 */
interface IdentifyResult {
  personName: string;
  score: number;
}

/** 验证结果 */
interface VerifyResult {
  score: number;
  isMatch: boolean;
}

/** 列出人员的选项 */
interface ListPersonsOptions extends FaceClientOptions {
  groupName?: string;
}

/**
 * 人脸识别API客户端
 *
 * @see http://gollum.baidu.com/bcefaceapi
 */
export default class FaceClient extends BceBaseClient {
  /**
   * 构造函数
   * @param config Face 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'face', true);
  }

  // --- 应用管理 ---

  /**
   * 创建应用
   * @param options 选项
   * @returns Promise 解析为应用信息
   */
  public async createApp(options: FaceClientOptions = {}): Promise<BceResponse<App>> {
    const url = '/v1/app';
    return this.sendRequest('POST', url, {
      config: options.config
    });
  }

  /**
   * 列出应用
   * @param options 选项
   * @returns Promise 解析为应用列表
   */
  public async listApps(options: FaceClientOptions = {}): Promise<BceResponse<{ apps: App[] }>> {
    const url = '/v1/app';
    return this.sendRequest('GET', url, {
      config: options.config
    });
  }

  // --- 分组管理 ---

  /**
   * 创建分组
   * @param appId 应用ID
   * @param groupName 分组名称
   * @param options 选项
   * @returns Promise 解析为创建结果
   */
  public async createGroup(appId: string, groupName: string, options: FaceClientOptions = {}): Promise<BceResponse<Group>> {
    const url = `/v1/app/${appId}/group`;
    return this.sendRequest('POST', url, {
      body: JSON.stringify({ groupName: groupName }),
      config: options.config
    });
  }

  /**
   * 删除分组
   * @param appId 应用ID
   * @param groupName 分组名称
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteGroup(appId: string, groupName: string, options: FaceClientOptions = {}): Promise<BceResponse<void>> {
    const url = `/v1/app/${appId}/group/${groupName}`;
    return this.sendRequest('DELETE', url, {
      config: options.config
    });
  }

  /**
   * 获取分组信息
   * @param appId 应用ID
   * @param groupName 分组名称
   * @param options 选项
   * @returns Promise 解析为分组信息
   */
  public async getGroup(appId: string, groupName: string, options: FaceClientOptions = {}): Promise<BceResponse<Group>> {
    const url = `/v1/app/${appId}/group/${groupName}`;
    return this.sendRequest('GET', url, {
      config: options.config
    });
  }

  /**
   * 列出分组
   * @param appId 应用ID
   * @param options 选项
   * @returns Promise 解析为分组列表
   */
  public async listGroups(appId: string, options: FaceClientOptions = {}): Promise<BceResponse<{ groups: Group[] }>> {
    const url = `/v1/app/${appId}/group`;
    return this.sendRequest('GET', url, {
      config: options.config
    });
  }

  // --- 人员管理 ---

  /**
   * 创建人员
   * @param appId 应用ID
   * @param groupName 分组名称
   * @param personName 人员名称
   * @param faces 人脸图片路径列表
   * @param options 选项
   * @returns Promise 解析为创建结果
   */
  public async createPerson(
    appId: string,
    groupName: string,
    personName: string,
    faces: string[],
    options: FaceClientOptions = {}
  ): Promise<BceResponse<Person>> {
    const faceData = faces.map((item) => ({
      bosPath: item
    }));

    debug('Create Person Faces = %j', faceData);

    const url = `/v1/app/${appId}/person`;
    return this.sendRequest('POST', url, {
      body: JSON.stringify({
        personName: personName,
        groupName: groupName,
        faces: faceData
      }),
      config: options.config
    });
  }

  /**
   * 删除人员
   * @param appId 应用ID
   * @param personName 人员名称
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deletePerson(appId: string, personName: string, options: FaceClientOptions = {}): Promise<BceResponse<void>> {
    const url = `/v1/app/${appId}/person/${personName}`;
    return this.sendRequest('DELETE', url, {
      config: options.config
    });
  }

  /**
   * 更新人员
   * @param appId 应用ID
   * @param personName 人员名称
   * @param faces 人脸图片路径列表
   * @param options 选项
   * @returns Promise 解析为更新结果
   */
  public async updatePerson(
    appId: string,
    personName: string,
    faces: string[],
    options: FaceClientOptions = {}
  ): Promise<BceResponse<Person>> {
    const faceData = faces.map((item) => ({
      bosPath: item
    }));

    const url = `/v1/app/${appId}/person/${personName}`;
    return this.sendRequest('PUT', url, {
      body: JSON.stringify({ faces: faceData }),
      config: options.config
    });
  }

  /**
   * 获取人员信息
   * @param appId 应用ID
   * @param personName 人员名称
   * @param options 选项
   * @returns Promise 解析为人员信息
   */
  public async getPerson(appId: string, personName: string, options: FaceClientOptions = {}): Promise<BceResponse<Person>> {
    const url = `/v1/app/${appId}/person/${personName}`;
    return this.sendRequest('GET', url, {
      config: options.config
    });
  }

  /**
   * 列出人员
   * @param appId 应用ID
   * @param options 选项
   * @returns Promise 解析为人员列表
   */
  public async listPersons(appId: string, options: ListPersonsOptions = {}): Promise<BceResponse<{ persons: Person[] }>> {
    const url = `/v1/app/${appId}/person`;
    const params = u.pick(options, 'groupName');
    return this.sendRequest('GET', url, {
      params: params,
      config: options.config
    });
  }

  // --- 人脸识别 ---

  /**
   * 人脸识别
   * @param appId 应用ID
   * @param groupName 分组名称
   * @param data 图片数据（Buffer 或 BOS 路径）
   * @param options 选项
   * @returns Promise 解析为识别结果
   */
  public async identify(
    appId: string,
    groupName: string,
    data: Buffer | string,
    options: FaceClientOptions = {}
  ): Promise<BceResponse<{ results: IdentifyResult[] }>> {
    let body: Face;
    
    if (Buffer.isBuffer(data)) {
      body = {
        base64: data.toString('base64')
      };
    } else {
      body = {
        bosPath: data
      };
    }

    const url = `/v1/app/${appId}/group/${groupName}`;
    return this.sendRequest('POST', url, {
      params: { identify: '' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 人脸验证
   * @param appId 应用ID
   * @param personName 人员名称
   * @param data 图片数据（Buffer 或 BOS 路径）
   * @param options 选项
   * @returns Promise 解析为验证结果
   */
  public async verify(
    appId: string,
    personName: string,
    data: Buffer | string,
    options: FaceClientOptions = {}
  ): Promise<BceResponse<VerifyResult>> {
    let body: Face;
    
    if (Buffer.isBuffer(data)) {
      body = {
        base64: data.toString('base64')
      };
    } else {
      body = {
        bosPath: data
      };
    }

    const url = `/v1/app/${appId}/person/${personName}`;
    return this.sendRequest('POST', url, {
      params: { verify: '' },
      body: JSON.stringify(body),
      config: options.config
    });
  }
}