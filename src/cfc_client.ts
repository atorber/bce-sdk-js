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
 * @file src/cfc_client.ts
 * @author marspanda
 */

import * as u from 'underscore';
import * as strings from './strings';
import debugLib from 'debug';

import BceBaseClient from './bce_base_client';

// Import types
import type { BceConfig, BceResponse } from './types/common';

const debug = debugLib('bce-sdk:CfcClient');

// ==================== CFC 类型定义 ====================

/** 函数运行时 */
export enum Runtime {
  /** Node.js 6.11 */
  NODEJS_6_11 = 'nodejs6.11',
  /** Node.js 8.5 */
  NODEJS_8_5 = 'nodejs8.5',
  /** Node.js 10.16 */
  NODEJS_10_16 = 'nodejs10.16',
  /** Node.js 12.13 */
  NODEJS_12_13 = 'nodejs12.13',
  /** Python 2.7 */
  PYTHON_2_7 = 'python2.7',
  /** Python 3.6 */
  PYTHON_3_6 = 'python3.6',
  /** Java 8 */
  JAVA_8 = 'java8',
  /** PHP 7.2 */
  PHP_7_2 = 'php7.2',
}

/** 调用类型 */
export enum InvocationType {
  /** 同步调用 */
  REQUEST_RESPONSE = 'RequestResponse',
  /** 异步调用 */
  EVENT = 'Event',
  /** 调试调用 */
  DRY_RUN = 'DryRun',
}

/** 日志类型 */
export enum LogType {
  /** 无日志 */
  NONE = 'None',
  /** 尾部日志 */
  TAIL = 'Tail',
}

/** 函数状态 */
export enum FunctionState {
  /** 活跃 */
  ACTIVE = 'Active',
  /** 待发布 */
  PENDING = 'Pending',
  /** 不活跃 */
  INACTIVE = 'Inactive',
  /** 失败 */
  FAILED = 'Failed',
}

/** 代码配置 */
export interface CodeConfiguration {
  /** 代码包（base64编码） */
  ZipFile?: string;
  /** 是否发布版本 */
  Publish?: boolean;
  /** 是否测试运行 */
  DryRun?: boolean;
}

/** 环境变量配置 */
export interface EnvironmentConfiguration {
  /** 变量映射 */
  Variables: Record<string, string>;
}

/** 函数配置 */
export interface FunctionConfiguration {
  /** 函数描述 */
  Description?: string;
  /** 超时时间（秒） */
  Timeout?: number;
  /** 函数名 */
  FunctionName: string;
  /** 处理器 */
  Handler: string;
  /** 运行时 */
  Runtime: Runtime;
  /** 内存大小（MB） */
  MemorySize?: number;
  /** 环境变量 */
  Environment?: EnvironmentConfiguration;
}

/** 创建函数参数 */
export interface CreateFunctionOptions extends FunctionConfiguration {
  /** 代码配置 */
  Code: CodeConfiguration;
}

/** 函数信息 */
export interface FunctionInfo extends FunctionConfiguration {
  /** 函数ARN */
  FunctionArn: string;
  /** 版本 */
  Version: string;
  /** 最后修改时间 */
  LastModified: string;
  /** 代码大小 */
  CodeSize: number;
  /** 代码SHA256 */
  CodeSha256: string;
  /** 函数状态 */
  State: FunctionState;
  /** 状态原因 */
  StateReason?: string;
  /** 状态原因代码 */
  StateReasonCode?: string;
  /** 最后更新状态 */
  LastUpdateStatus?: string;
  /** 最后更新状态原因 */
  LastUpdateStatusReason?: string;
  /** 最后更新状态原因代码 */
  LastUpdateStatusReasonCode?: string;
}

/** 版本信息 */
export interface VersionInfo {
  /** 版本号 */
  Version: string;
  /** 函数ARN */
  FunctionArn: string;
  /** 描述 */
  Description?: string;
  /** 最后修改时间 */
  LastModified: string;
}

/** 别名信息 */
export interface AliasInfo {
  /** 别名ARN */
  AliasArn: string;
  /** 别名名称 */
  Name: string;
  /** 函数版本 */
  FunctionVersion: string;
  /** 描述 */
  Description?: string;
}

/** 触发器信息 */
export interface TriggerInfo {
  /** 触发器类型 */
  Type: string;
  /** 资源 */
  Resource: string;
  /** 状态 */
  Status: string;
  /** 数据 */
  Data: any;
}

/** 调用结果 */
export interface InvocationResult {
  /** 状态码 */
  StatusCode: number;
  /** 执行时间 */
  ExecutedVersion?: string;
  /** 日志结果 */
  LogResult?: string;
  /** 负载数据 */
  Payload?: any;
}

/** CFC 客户端选项 */
export interface CfcClientOptions {
  /** 配置 */
  config?: Partial<BceConfig>;
}

/** 列举函数选项 */
export interface ListFunctionsOptions extends CfcClientOptions {
  /** 标记 */
  Marker?: string;
  /** 最大条目数 */
  MaxItems?: number;
}

/** 函数调用选项 */
export interface InvokeFunctionOptions extends CfcClientOptions {
  /** 限定符（版本或别名） */
  Qualifier?: string;
  /** 调用类型 */
  invocationType?: InvocationType;
  /** 日志类型 */
  logType?: LogType;
  /** 日志包含在响应体中 */
  logToBody?: boolean;
}

/** 获取函数选项 */
export interface GetFunctionOptions extends CfcClientOptions {
  /** 限定符（版本或别名） */
  Qualifier?: string;
}

/** 列举版本选项 */
export interface ListVersionsOptions extends CfcClientOptions {
  /** 标记 */
  Marker?: string;
  /** 最大条目数 */
  MaxItems?: number;
}

/** 创建别名选项 */
export interface CreateAliasOptions {
  /** 函数版本 */
  FunctionVersion: string;
  /** 别名名称 */
  Name: string;
  /** 描述 */
  Description?: string;
}

/** 创建触发器选项 */
export interface CreateTriggerOptions {
  /** 目标 */
  Target: string;
  /** 触发器类型 */
  Type: string;
  /** 资源 */
  Resource: string;
  /** 状态 */
  Status?: string;
  /** 数据 */
  Data?: any;
}

// ==================== 响应类型 ====================

/** 列举函数响应 */
export interface ListFunctionsResponse {
  /** 函数列表 */
  Functions: FunctionInfo[];
  /** 下一个标记 */
  NextMarker?: string;
  /** 是否截断 */
  IsTruncated: boolean;
}

/** 列举版本响应 */
export interface ListVersionsResponse {
  /** 版本列表 */
  Versions: VersionInfo[];
  /** 下一个标记 */
  NextMarker?: string;
  /** 是否截断 */
  IsTruncated: boolean;
}

/** 列举别名响应 */
export interface ListAliasesResponse {
  /** 别名列表 */
  Aliases: AliasInfo[];
  /** 下一个标记 */
  NextMarker?: string;
  /** 是否截断 */
  IsTruncated: boolean;
}

/** 列举触发器响应 */
export interface ListTriggersResponse {
  /** 触发器列表 */
  Triggers: TriggerInfo[];
}

/**
 * CFC service client for Baidu Cloud Function Compute
 *
 * @see https://cloud.baidu.com/doc/CFC/API.html
 */
export default class CfcClient extends BceBaseClient {
  /**
   * 构造函数
   * 
   * @param config CFC 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'cfc', true);
  }

  // --- 函数管理方法 ---

  /**
   * 列举函数
   * 
   * @param options 选项参数
   * @returns Promise 解析为函数列表
   */
  public async listFunctions(options: ListFunctionsOptions = {}): Promise<BceResponse<ListFunctionsResponse>> {
    const params = u.pick(options, 'Marker', 'MaxItems');
    debug('params', params);
    
    return this.sendRequest('GET', '/v1/functions', {
      params: params,
      config: options.config
    });
  }

  /**
   * 创建函数
   * 
   * @param functionConfig 函数创建配置
   * @param options 选项参数
   * @returns Promise 解析为创建结果
   */
  public async createFunction(
    functionConfig: CreateFunctionOptions,
    options: CfcClientOptions = {}
  ): Promise<BceResponse<FunctionInfo>> {
    debug('createFunction, body = %j', functionConfig);

    return this.sendRequest('POST', '/v1/functions', {
      params: {},
      body: JSON.stringify(functionConfig),
      config: options.config
    });
  }

  /**
   * 获取函数
   * 
   * @param functionName 函数名
   * @param options 选项参数
   * @returns Promise 解析为函数信息
   */
  public async getFunction(functionName: string, options: GetFunctionOptions = {}): Promise<BceResponse<FunctionInfo>> {
    const params = u.pick(options, 'Qualifier');
    
    return this.sendRequest('GET', `/v1/functions/${strings.normalize(functionName)}`, {
      params: params,
      config: options.config
    });
  }

  /**
   * 删除函数
   * 
   * @param functionName 函数名
   * @param options 选项参数
   * @returns Promise 解析为删除结果
   */
  public async deleteFunction(functionName: string, options: GetFunctionOptions = {}): Promise<BceResponse<void>> {
    const params = u.pick(options, 'Qualifier');
    
    return this.sendRequest('DELETE', `/v1/functions/${functionName}`, {
      params: params,
      config: options.config
    });
  }

  /**
   * 调用函数
   * 
   * @param functionName 函数名
   * @param payload 调用负载
   * @param options 选项参数
   * @returns Promise 解析为调用结果
   */
  public async invocations(
    functionName: string,
    payload: any,
    options: InvokeFunctionOptions = {}
  ): Promise<BceResponse<InvocationResult>> {
    const params = u.pick(options, 'Qualifier', 'invocationType', 'logType', 'logToBody');
    
    return this.sendRequest('POST', `/v1/functions/${strings.normalize(functionName)}/invocations`, {
      params: params,
      body: JSON.stringify(payload),
      config: options.config
    });
  }

  /**
   * 调用函数（别名）
   * 
   * @param functionName 函数名
   * @param payload 调用负载
   * @param options 选项参数
   * @returns Promise 解析为调用结果
   */
  public async invoke(
    functionName: string,
    payload: any,
    options: InvokeFunctionOptions = {}
  ): Promise<BceResponse<InvocationResult>> {
    return this.invocations(functionName, payload, options);
  }

  /**
   * 更新函数代码
   * 
   * @param functionName 函数名
   * @param codeConfig 代码配置
   * @param options 选项参数
   * @returns Promise 解析为更新结果
   */
  public async updateFunctionCode(
    functionName: string,
    codeConfig: CodeConfiguration,
    options: CfcClientOptions = {}
  ): Promise<BceResponse<FunctionInfo>> {
    return this.sendRequest('PUT', `/v1/functions/${functionName}/code`, {
      body: JSON.stringify(codeConfig),
      config: options.config
    });
  }

  /**
   * 获取函数配置
   * 
   * @param functionName 函数名
   * @param options 选项参数
   * @returns Promise 解析为函数配置
   */
  public async getFunctionConfiguration(
    functionName: string,
    options: GetFunctionOptions = {}
  ): Promise<BceResponse<FunctionConfiguration>> {
    const params = u.pick(options, 'Qualifier');
    
    return this.sendRequest('GET', `/v1/functions/${functionName}/configuration`, {
      params: params,
      config: options.config
    });
  }

  /**
   * 更新函数配置
   * 
   * @param functionName 函数名
   * @param configuration 函数配置
   * @param options 选项参数
   * @returns Promise 解析为更新结果
   */
  public async updateFunctionConfiguration(
    functionName: string,
    configuration: Partial<FunctionConfiguration>,
    options: CfcClientOptions = {}
  ): Promise<BceResponse<FunctionConfiguration>> {
    return this.sendRequest('PUT', `/v1/functions/${functionName}/configuration`, {
      body: JSON.stringify(configuration),
      config: options.config
    });
  }

  // --- 版本管理方法 ---

  /**
   * 列举函数版本
   * 
   * @param functionName 函数名
   * @param options 选项参数
   * @returns Promise 解析为版本列表
   */
  public async listVersionsByFunction(
    functionName: string,
    options: ListVersionsOptions = {}
  ): Promise<BceResponse<ListVersionsResponse>> {
    const params = u.pick(options, 'Marker', 'MaxItems');
    
    return this.sendRequest('GET', `/v1/functions/${functionName}/versions`, {
      params: params,
      config: options.config
    });
  }

  /**
   * 发布版本
   * 
   * @param functionName 函数名
   * @param description 版本描述
   * @param options 选项参数
   * @returns Promise 解析为版本信息
   */
  public async publishVersion(
    functionName: string,
    description?: string,
    options: CfcClientOptions = {}
  ): Promise<BceResponse<VersionInfo>> {
    const body: any = {};
    if (description != null) {
      body.Description = description;
    }
    
    return this.sendRequest('POST', `/v1/functions/${functionName}/versions`, {
      body: JSON.stringify(body),
      config: options.config
    });
  }

  // --- 别名管理方法 ---

  /**
   * 创建别名
   * 
   * @param functionName 函数名
   * @param aliasConfig 别名配置
   * @param options 选项参数
   * @returns Promise 解析为别名信息
   */
  public async createAlias(
    functionName: string,
    aliasConfig: CreateAliasOptions,
    options: CfcClientOptions = {}
  ): Promise<BceResponse<AliasInfo>> {
    return this.sendRequest('POST', `/v1/functions/${functionName}/aliases`, {
      body: JSON.stringify(aliasConfig),
      config: options.config
    });
  }

  /**
   * 获取别名
   * 
   * @param functionName 函数名
   * @param aliasName 别名名称
   * @param options 选项参数
   * @returns Promise 解析为别名信息
   */
  public async getAlias(
    functionName: string,
    aliasName: string,
    options: CfcClientOptions = {}
  ): Promise<BceResponse<AliasInfo>> {
    return this.sendRequest('GET', `/v1/functions/${functionName}/aliases/${aliasName}`, {
      config: options.config
    });
  }

  /**
   * 列举别名
   * 
   * @param functionName 函数名
   * @param options 选项参数
   * @returns Promise 解析为别名列表
   */
  public async listAliases(
    functionName: string,
    options: ListVersionsOptions = {}
  ): Promise<BceResponse<ListAliasesResponse>> {
    const params = u.pick(options, 'Marker', 'MaxItems');
    
    return this.sendRequest('GET', `/v1/functions/${functionName}/aliases`, {
      params: params,
      config: options.config
    });
  }

  /**
   * 删除别名
   * 
   * @param functionName 函数名
   * @param aliasName 别名名称
   * @param options 选项参数
   * @returns Promise 解析为删除结果
   */
  public async deleteAlias(
    functionName: string,
    aliasName: string,
    options: CfcClientOptions = {}
  ): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/functions/${functionName}/aliases/${aliasName}`, {
      config: options.config
    });
  }

  /**
   * 更新别名
   * 
   * @param functionName 函数名
   * @param aliasName 别名名称
   * @param aliasConfig 别名配置
   * @param options 选项参数
   * @returns Promise 解析为别名信息
   */
  public async updateAlias(
    functionName: string,
    aliasName: string,
    aliasConfig: Partial<CreateAliasOptions>,
    options: CfcClientOptions = {}
  ): Promise<BceResponse<AliasInfo>> {
    return this.sendRequest('PUT', `/v1/functions/${functionName}/aliases/${aliasName}`, {
      body: JSON.stringify(aliasConfig),
      config: options.config
    });
  }

  // --- 触发器管理方法 ---

  /**
   * 创建触发器
   * 
   * @param functionName 函数名
   * @param triggerConfig 触发器配置
   * @param options 选项参数
   * @returns Promise 解析为触发器信息
   */
  public async createTrigger(
    functionName: string,
    triggerConfig: CreateTriggerOptions,
    options: CfcClientOptions = {}
  ): Promise<BceResponse<TriggerInfo>> {
    return this.sendRequest('POST', `/v1/functions/${functionName}/triggers`, {
      body: JSON.stringify(triggerConfig),
      config: options.config
    });
  }

  /**
   * 列举触发器
   * 
   * @param functionName 函数名
   * @param options 选项参数
   * @returns Promise 解析为触发器列表
   */
  public async listTriggers(
    functionName: string,
    options: CfcClientOptions = {}
  ): Promise<BceResponse<ListTriggersResponse>> {
    return this.sendRequest('GET', `/v1/functions/${functionName}/triggers`, {
      config: options.config
    });
  }

  /**
   * 删除触发器
   * 
   * @param functionName 函数名
   * @param target 触发器目标
   * @param source 触发器源
   * @param options 选项参数
   * @returns Promise 解析为删除结果
   */
  public async deleteTrigger(
    functionName: string,
    target: string,
    source: string,
    options: CfcClientOptions = {}
  ): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/functions/${functionName}/triggers/${target}/${source}`, {
      config: options.config
    });
  }
}

// CommonJS 兼容导出
module.exports = CfcClient;
module.exports.default = CfcClient;