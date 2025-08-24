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
 * @file src/bcc_client.ts
 * @author leeight
 */

import * as u from 'underscore';
import debugLib from 'debug';

import BceBaseClient from './bce_base_client';

// Import types
import type { BceConfig, BceResponse } from './types/common';

const debug = debugLib('bce-sdk:BccClient');

// ==================== BCC 类型定义 ====================

/** 实例类型 */
export enum InstanceType {
  /** 微型 */
  MICRO = 'MICRO',
  /** 小型 */
  SMALL = 'SMALL', 
  /** 中型 */
  MEDIUM = 'MEDIUM',
  /** 大型 */
  LARGE = 'LARGE',
  /** 超大型 */
  XLARGE = 'XLARGE',
  /** 超超大型 */
  XXLARGE = 'XXLARGE',
}

/** 镜像类型 */
export enum ImageType {
  /** 全部 */
  ALL = 'All',
  /** 系统镜像 */
  SYSTEM = 'System',
  /** 自定义镜像 */
  CUSTOM = 'Custom',
  /** 集成镜像 */
  INTEGRATION = 'Integration',
}

/** 网络类型 */
export enum NetworkType {
  /** VPC */
  VPC = 'vpc',
  /** 经典网络 */
  CLASSIC = 'classic',
}

/** 实例状态 */
export enum InstanceStatus {
  /** 运行中 */
  RUNNING = 'Running',
  /** 已停止 */
  STOPPED = 'Stopped',
  /** 启动中 */
  STARTING = 'Starting',
  /** 停止中 */
  STOPPING = 'Stopping',
  /** 创建中 */
  CREATING = 'Creating',
}

/** 云磁盘创建模型 */
export interface CreateCdsModel {
  /** 云磁盘大小（GB） */
  sizeInGB: number;
  /** 存储类型 */
  storageType?: string;
}

/** 实例信息 */
export interface InstanceInfo {
  /** 实例ID */
  instanceId: string;
  /** 实例名称 */
  instanceName?: string;
  /** 实例类型 */
  instanceType: InstanceType;
  /** 镜像ID */
  imageId: string;
  /** 实例状态 */
  status: InstanceStatus;
  /** 内网IP */
  internalIp?: string;
  /** 公网IP */
  publicIp?: string;
  /** 创建时间 */
  createTime: string;
  /** 过期时间 */
  expireTime?: string;
}

/** 镜像信息 */
export interface ImageInfo {
  /** 镜像ID */
  imageId: string;
  /** 镜像名称 */
  imageName: string;
  /** 镜像类型 */
  imageType: ImageType;
  /** 操作系统 */
  osName: string;
  /** 镜像大小 */
  imageSize?: number;
  /** 创建时间 */
  createTime?: string;
}

/** 套餐信息 */
export interface PackageInfo {
  /** 实例类型 */
  instanceType: InstanceType;
  /** CPU核数 */
  cpuCount: number;
  /** 内存大小（GB） */
  memoryCapacityInGB: number;
  /** 本地磁盘大小（GB） */
  localDiskSizeInGB: number;
  /** 价格信息 */
  pricing?: any;
}

/** 创建实例参数 */
export interface CreateInstanceOptions {
  /** 实例类型 */
  instanceType: InstanceType;
  /** 镜像ID */
  imageId: string;
  /** 本地磁盘大小（GB） */
  localDiskSizeInGB?: number;
  /** 云磁盘列表 */
  createCdsList?: CreateCdsModel[];
  /** 网络带宽（Mbps） */
  networkCapacityInMbps?: number;
  /** 购买数量 */
  purchaseCount?: number;
  /** 实例名称 */
  name?: string;
  /** 管理员密码 */
  adminPass?: string;
  /** 网络类型 */
  networkType?: NetworkType;
  /** Noah节点 */
  noahNode?: string;
}

/** BCC 客户端选项 */
export interface BccClientOptions {
  /** 配置 */
  config?: Partial<BceConfig>;
}

/** 列举实例选项 */
export interface ListInstancesOptions extends BccClientOptions {
  /** 最大返回数量 */
  maxKeys?: number;
  /** 标记 */
  marker?: string;
}

/** 获取镜像选项 */
export interface GetImagesOptions extends BccClientOptions {
  /** 最大返回数量 */
  maxKeys?: number;
  /** 标记 */
  marker?: string;
  /** 镜像类型 */
  imageType?: ImageType;
}

// ==================== 响应类型 ====================

/** 列举实例响应 */
export interface ListInstancesResponse {
  /** 实例列表 */
  instances: InstanceInfo[];
  /** 是否截断 */
  isTruncated: boolean;
  /** 下一个标记 */
  nextMarker?: string;
}

/** 获取镜像响应 */
export interface GetImagesResponse {
  /** 镜像列表 */
  images: ImageInfo[];
  /** 是否截断 */
  isTruncated: boolean;
  /** 下一个标记 */
  nextMarker?: string;
}

/** 获取套餐响应 */
export interface GetPackagesResponse {
  /** 套餐列表 */
  packages: PackageInfo[];
}

/** 创建实例响应 */
export interface CreateInstanceResponse {
  /** 实例ID列表 */
  instanceIds: string[];
}

/** VNC URL 响应 */
export interface GetVNCUrlResponse {
  /** VNC URL */
  vncUrl: string;
}

/** 客户端令牌响应 */
export interface ClientTokenResponse {
  /** 客户端令牌 */
  token: string;
}

/**
 * BCC service client for Baidu Cloud Compute
 * 
 * 内网API地址：http://api.bcc.bce-sandbox.baidu.com
 * 沙盒API地址：http://bcc.bce-api.baidu.com
 *
 * @see http://gollum.baidu.com/BceDocumentation/BccOpenAPI#简介
 */
export default class BccClient extends BceBaseClient {
  /**
   * 构造函数
   * 
   * @param config BCC 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'bcc', true);
  }

  // --- 实例管理方法 ---

  /**
   * 列举实例
   * 
   * @param options 选项参数
   * @returns Promise 解析为实例列表
   */
  public async listInstances(options: ListInstancesOptions = {}): Promise<BceResponse<ListInstancesResponse>> {
    const params = u.extend(
      { maxKeys: 1000 },
      u.pick(options, 'maxKeys', 'marker')
    );

    return this.sendRequest('GET', '/v1/instance', {
      params: params,
      config: options.config
    });
  }

  /**
   * 获取套餐信息
   * 
   * @param options 选项参数
   * @returns Promise 解析为套餐信息
   */
  public async getPackages(options: BccClientOptions = {}): Promise<BceResponse<GetPackagesResponse>> {
    return this.sendRequest('GET', '/v1/instance/price', {
      config: options.config
    });
  }

  /**
   * 获取镜像列表
   * 
   * @param options 选项参数
   * @returns Promise 解析为镜像列表
   */
  public async getImages(options: GetImagesOptions = {}): Promise<BceResponse<GetImagesResponse>> {
    const params = u.extend(
      { maxKeys: 1000, imageType: ImageType.ALL },
      u.pick(options, 'maxKeys', 'marker', 'imageType')
    );

    return this.sendRequest('GET', '/v1/image', {
      config: options.config,
      params: params
    });
  }

  /**
   * 创建实例
   * 
   * @param instanceOptions 实例创建参数
   * @param options 选项参数
   * @returns Promise 解析为创建结果
   */
  public async createInstance(
    instanceOptions: CreateInstanceOptions,
    options: BccClientOptions = {}
  ): Promise<BceResponse<CreateInstanceResponse>> {
    const tokenResponse = await this.getClientToken();
    const clientToken = tokenResponse.body.token;
    
    const params = { clientToken };

    debug('createInstance, params = %j, body = %j', params, instanceOptions);

    return this.sendRequest('POST', '/v1/instance', {
      config: options.config,
      params: params,
      body: JSON.stringify(instanceOptions)
    });
  }

  /**
   * 获取实例详情
   * 
   * @param instanceId 实例ID
   * @param options 选项参数
   * @returns Promise 解析为实例详情
   */
  public async getInstance(instanceId: string, options: BccClientOptions = {}): Promise<BceResponse<InstanceInfo>> {
    return this.sendRequest('GET', `/v1/instance/${instanceId}`, {
      config: options.config
    });
  }

  /**
   * 启动实例
   * 
   * @param instanceId 实例ID
   * @param options 选项参数
   * @returns Promise 解析为操作结果
   */
  public async startInstance(instanceId: string, options: BccClientOptions = {}): Promise<BceResponse<void>> {
    const params = { start: '' };

    return this.sendRequest('PUT', `/v1/instance/${instanceId}`, {
      params: params,
      config: options.config
    });
  }

  /**
   * 停止实例
   * 
   * @param instanceId 实例ID
   * @param options 选项参数
   * @returns Promise 解析为操作结果
   */
  public async stopInstance(instanceId: string, options: BccClientOptions = {}): Promise<BceResponse<void>> {
    const params = { stop: '' };

    return this.sendRequest('PUT', `/v1/instance/${instanceId}`, {
      params: params,
      config: options.config
    });
  }

  /**
   * 重启实例
   * 
   * @param instanceId 实例ID
   * @param options 选项参数
   * @returns Promise 解析为操作结果
   */
  public async restartInstance(instanceId: string, options: BccClientOptions = {}): Promise<BceResponse<void>> {
    const params = { reboot: '' };

    return this.sendRequest('PUT', `/v1/instance/${instanceId}`, {
      params: params,
      config: options.config
    });
  }

  /**
   * 删除实例
   * 
   * @param instanceId 实例ID
   * @param options 选项参数
   * @returns Promise 解析为操作结果
   */
  public async deleteInstance(instanceId: string, options: BccClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/instance/${instanceId}`, {
      config: options.config
    });
  }

  /**
   * 获取VNC URL
   * 
   * @param instanceId 实例ID
   * @param options 选项参数
   * @returns Promise 解析为VNC URL
   */
  public async getVNCUrl(instanceId: string, options: BccClientOptions = {}): Promise<BceResponse<GetVNCUrlResponse>> {
    return this.sendRequest('GET', `/v1/instance/${instanceId}/vnc`, {
      config: options.config
    });
  }

  // --- 工具方法 ---

  /**
   * 获取客户端令牌
   * 
   * @returns Promise 解析为客户端令牌
   */
  private async getClientToken(): Promise<BceResponse<ClientTokenResponse>> {
    return this.sendRequest('GET', '/v1/token', {});
  }

  /**
   * 修改实例管理员密码 (未实现)
   * 
   * @param instanceId 实例ID
   * @param newPassword 新密码
   * @param options 选项参数
   * @returns Promise 解析为操作结果
   */
  public async changeInstanceAdminPassword(
    instanceId: string,
    newPassword: string,
    options: BccClientOptions = {}
  ): Promise<BceResponse<void>> {
    throw new Error('changeInstanceAdminPassword method not implemented');
  }

  /**
   * 重建实例 (未实现)
   * 
   * @param instanceId 实例ID
   * @param imageId 新镜像ID
   * @param options 选项参数
   * @returns Promise 解析为操作结果
   */
  public async rebuildInstance(
    instanceId: string,
    imageId: string,
    options: BccClientOptions = {}
  ): Promise<BceResponse<void>> {
    throw new Error('rebuildInstance method not implemented');
  }

  /**
   * 加入安全组 (未实现)
   * 
   * @param instanceId 实例ID
   * @param securityGroupId 安全组ID
   * @param options 选项参数
   * @returns Promise 解析为操作结果
   */
  public async joinSecurityGroup(
    instanceId: string,
    securityGroupId: string,
    options: BccClientOptions = {}
  ): Promise<BceResponse<void>> {
    throw new Error('joinSecurityGroup method not implemented');
  }

  /**
   * 离开安全组 (未实现)
   * 
   * @param instanceId 实例ID
   * @param securityGroupId 安全组ID
   * @param options 选项参数
   * @returns Promise 解析为操作结果
   */
  public async leaveSecurityGroup(
    instanceId: string,
    securityGroupId: string,
    options: BccClientOptions = {}
  ): Promise<BceResponse<void>> {
    throw new Error('leaveSecurityGroup method not implemented');
  }
}

// CommonJS 兼容导出
module.exports = BccClient;
module.exports.default = BccClient;