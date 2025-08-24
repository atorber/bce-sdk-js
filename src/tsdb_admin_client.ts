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
 * @file src/tsdb_admin_client.ts
 * @author leeight
 */

import * as u from 'underscore';
import BceBaseClient from './bce_base_client';
import type { BceConfig, BceResponse } from './types/common';

// ==================== 类型定义 ====================

/** TSDB Admin 客户端选项 */
interface TsdbAdminClientOptions {
  config?: Partial<BceConfig>;
}

/** 数据库状态 */
type DatabaseStatus = 'CREATING' | 'RUNNING' | 'PAUSED' | 'DELETING' | 'DELETED' | 'ERROR';

/** 数据库配置 */
interface DatabaseConfig {
  /** 数据库名称 */
  databaseName: string;
  /** 描述 */
  description?: string;
  /** 存储类型 */
  storageType?: 'STANDARD' | 'COLD';
  /** 数据保留时间（天） */
  dataRetentionDays?: number;
  /** 客户端Token */
  clientToken?: string;
}

/** 数据库信息 */
interface DatabaseInfo {
  /** 数据库名称 */
  databaseName: string;
  /** 描述 */
  description?: string;
  /** 状态 */
  status: DatabaseStatus;
  /** 存储类型 */
  storageType: string;
  /** 数据保留时间（天） */
  dataRetentionDays: number;
  /** 创建时间 */
  createTime: string;
  /** 最后修改时间 */
  lastModifyTime: string;
  /** 端点信息 */
  endpoint: {
    /** 公网端点 */
    publicEndpoint: string;
    /** 内网端点 */
    intranetEndpoint: string;
  };
  /** 存储大小（字节） */
  storageSize?: number;
  /** 数据点数量 */
  dataPointCount?: number;
}

/** 标签配置 */
interface TagConfig {
  /** 标签键 */
  tagKey: string;
  /** 标签值 */
  tagValue: string;
}

/** 用户配置 */
interface UserConfig {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 权限 */
  privilege: 'READ' | 'WRITE' | 'ADMIN';
  /** 描述 */
  description?: string;
}

/** 用户信息 */
interface UserInfo {
  /** 用户名 */
  username: string;
  /** 权限 */
  privilege: string;
  /** 描述 */
  description?: string;
  /** 创建时间 */
  createTime: string;
}

/** 列表选项 */
interface ListOptions extends TsdbAdminClientOptions {
  /** 最大返回数量 */
  maxKeys?: number;
  /** 分页标记 */
  marker?: string;
}

/** 监控指标 */
interface Metric {
  /** 指标名称 */
  metricName: string;
  /** 数据点数量 */
  dataPointCount: number;
  /** 最后写入时间 */
  lastWriteTime: string;
  /** 标签信息 */
  tags: Record<string, string>;
}

/**
 * TSDB Admin 时序数据库管理客户端
 */
export default class TsdbAdminClient extends BceBaseClient {
  /**
   * 构造函数
   * @param config TSDB Admin 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'tsdb', true);
  }

  // --- 数据库管理 ---

  /**
   * 创建数据库
   * @param config 数据库配置
   * @param options 选项
   * @returns Promise 解析为创建结果
   */
  public async createDatabase(config: DatabaseConfig, options: TsdbAdminClientOptions = {}): Promise<BceResponse<DatabaseInfo>> {
    const body = u.pick(config, 'databaseName', 'description', 'storageType', 'dataRetentionDays', 'clientToken');

    return this.sendRequest('POST', '/v1/database', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 获取数据库信息
   * @param databaseName 数据库名称
   * @param options 选项
   * @returns Promise 解析为数据库信息
   */
  public async getDatabase(databaseName: string, options: TsdbAdminClientOptions = {}): Promise<BceResponse<DatabaseInfo>> {
    return this.sendRequest('GET', `/v1/database/${databaseName}`, {
      config: options.config
    });
  }

  /**
   * 列出数据库
   * @param options 列表选项
   * @returns Promise 解析为数据库列表
   */
  public async listDatabases(options: ListOptions = {}): Promise<BceResponse<{ databases: DatabaseInfo[] }>> {
    const params = u.pick(options, 'maxKeys', 'marker');

    return this.sendRequest('GET', '/v1/database', {
      params: params,
      config: options.config
    });
  }

  /**
   * 更新数据库
   * @param databaseName 数据库名称
   * @param updates 更新配置
   * @param options 选项
   * @returns Promise 解析为更新结果
   */
  public async updateDatabase(
    databaseName: string,
    updates: Partial<Pick<DatabaseConfig, 'description' | 'dataRetentionDays'>>,
    options: TsdbAdminClientOptions = {}
  ): Promise<BceResponse<DatabaseInfo>> {
    return this.sendRequest('PUT', `/v1/database/${databaseName}`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      config: options.config
    });
  }

  /**
   * 删除数据库
   * @param databaseName 数据库名称
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteDatabase(databaseName: string, options: TsdbAdminClientOptions = {}): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/database/${databaseName}`, {
      config: options.config
    });
  }

  // --- 用户管理 ---

  /**
   * 创建数据库用户
   * @param databaseName 数据库名称
   * @param userConfig 用户配置
   * @param options 选项
   * @returns Promise 解析为创建结果
   */
  public async createUser(
    databaseName: string,
    userConfig: UserConfig,
    options: TsdbAdminClientOptions = {}
  ): Promise<BceResponse<UserInfo>> {
    const body = u.pick(userConfig, 'username', 'password', 'privilege', 'description');

    return this.sendRequest('POST', `/v1/database/${databaseName}/user`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 获取用户信息
   * @param databaseName 数据库名称
   * @param username 用户名
   * @param options 选项
   * @returns Promise 解析为用户信息
   */
  public async getUser(
    databaseName: string,
    username: string,
    options: TsdbAdminClientOptions = {}
  ): Promise<BceResponse<UserInfo>> {
    return this.sendRequest('GET', `/v1/database/${databaseName}/user/${username}`, {
      config: options.config
    });
  }

  /**
   * 列出数据库用户
   * @param databaseName 数据库名称
   * @param options 选项
   * @returns Promise 解析为用户列表
   */
  public async listUsers(databaseName: string, options: TsdbAdminClientOptions = {}): Promise<BceResponse<{ users: UserInfo[] }>> {
    return this.sendRequest('GET', `/v1/database/${databaseName}/user`, {
      config: options.config
    });
  }

  /**
   * 更新用户
   * @param databaseName 数据库名称
   * @param username 用户名
   * @param updates 更新配置
   * @param options 选项
   * @returns Promise 解析为更新结果
   */
  public async updateUser(
    databaseName: string,
    username: string,
    updates: Partial<Pick<UserConfig, 'password' | 'privilege' | 'description'>>,
    options: TsdbAdminClientOptions = {}
  ): Promise<BceResponse<UserInfo>> {
    return this.sendRequest('PUT', `/v1/database/${databaseName}/user/${username}`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      config: options.config
    });
  }

  /**
   * 删除用户
   * @param databaseName 数据库名称
   * @param username 用户名
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteUser(
    databaseName: string,
    username: string,
    options: TsdbAdminClientOptions = {}
  ): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/database/${databaseName}/user/${username}`, {
      config: options.config
    });
  }

  // --- 监控和统计 ---

  /**
   * 获取数据库统计信息
   * @param databaseName 数据库名称
   * @param options 选项
   * @returns Promise 解析为统计信息
   */
  public async getDatabaseStatistics(databaseName: string, options: TsdbAdminClientOptions = {}): Promise<BceResponse<any>> {
    return this.sendRequest('GET', `/v1/database/${databaseName}/statistics`, {
      config: options.config
    });
  }

  /**
   * 获取指标列表
   * @param databaseName 数据库名称
   * @param options 选项
   * @returns Promise 解析为指标列表
   */
  public async getMetrics(databaseName: string, options: TsdbAdminClientOptions = {}): Promise<BceResponse<{ metrics: Metric[] }>> {
    return this.sendRequest('GET', `/v1/database/${databaseName}/metric`, {
      config: options.config
    });
  }

  /**
   * 获取标签列表
   * @param databaseName 数据库名称
   * @param metricName 指标名称
   * @param options 选项
   * @returns Promise 解析为标签列表
   */
  public async getTags(
    databaseName: string,
    metricName: string,
    options: TsdbAdminClientOptions = {}
  ): Promise<BceResponse<{ tags: Record<string, string[]> }>> {
    return this.sendRequest('GET', `/v1/database/${databaseName}/metric/${metricName}/tag`, {
      config: options.config
    });
  }

  // --- 备份管理 ---

  /**
   * 创建数据库备份
   * @param databaseName 数据库名称
   * @param backupName 备份名称
   * @param options 选项
   * @returns Promise 解析为备份结果
   */
  public async createBackup(
    databaseName: string,
    backupName: string,
    options: TsdbAdminClientOptions = {}
  ): Promise<BceResponse<any>> {
    return this.sendRequest('POST', `/v1/database/${databaseName}/backup`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupName: backupName }),
      config: options.config
    });
  }

  /**
   * 列出备份
   * @param databaseName 数据库名称
   * @param options 选项
   * @returns Promise 解析为备份列表
   */
  public async listBackups(databaseName: string, options: TsdbAdminClientOptions = {}): Promise<BceResponse<{ backups: any[] }>> {
    return this.sendRequest('GET', `/v1/database/${databaseName}/backup`, {
      config: options.config
    });
  }

  /**
   * 删除备份
   * @param databaseName 数据库名称
   * @param backupId 备份ID
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteBackup(
    databaseName: string,
    backupId: string,
    options: TsdbAdminClientOptions = {}
  ): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', `/v1/database/${databaseName}/backup/${backupId}`, {
      config: options.config
    });
  }
}