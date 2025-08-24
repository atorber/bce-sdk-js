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
 * @file src/bts_client.ts
 * @author leeight
 */

import * as u from 'underscore';
import BceBaseClient from './bce_base_client';
import type { BceConfig, BceResponse } from './types/common';

// ==================== 类型定义 ====================

/** BTS 客户端选项 */
interface BtsClientOptions {
  config?: Partial<BceConfig>;
}

/** 表状态 */
type TableStatus = 'CREATING' | 'ACTIVE' | 'UPDATING' | 'DELETING';

/** 数据类型 */
type AttributeType = 'S' | 'N' | 'B'; // String, Number, Binary

/** 键类型 */
type KeyType = 'HASH' | 'RANGE';

/** 属性定义 */
interface AttributeDefinition {
  /** 属性名称 */
  attributeName: string;
  /** 属性类型 */
  attributeType: AttributeType;
}

/** 键架构 */
interface KeySchema {
  /** 属性名称 */
  attributeName: string;
  /** 键类型 */
  keyType: KeyType;
}

/** 预配吞吐量 */
interface ProvisionedThroughput {
  /** 读取容量单位 */
  readCapacityUnits: number;
  /** 写入容量单位 */
  writeCapacityUnits: number;
}

/** 表配置 */
interface TableConfig {
  /** 表名称 */
  tableName: string;
  /** 属性定义列表 */
  attributeDefinitions: AttributeDefinition[];
  /** 键架构列表 */
  keySchema: KeySchema[];
  /** 预配吞吐量 */
  provisionedThroughput: ProvisionedThroughput;
}

/** 表信息 */
interface TableInfo {
  /** 表名称 */
  tableName: string;
  /** 表状态 */
  tableStatus: TableStatus;
  /** 属性定义列表 */
  attributeDefinitions: AttributeDefinition[];
  /** 键架构列表 */
  keySchema: KeySchema[];
  /** 预配吞吐量 */
  provisionedThroughput: ProvisionedThroughput;
  /** 创建时间 */
  creationDateTime: string;
  /** 表大小（字节） */
  tableSizeBytes: number;
  /** 项目数量 */
  itemCount: number;
}

/** 属性值 */
interface AttributeValue {
  /** 字符串值 */
  S?: string;
  /** 数字值 */
  N?: string;
  /** 二进制值 */
  B?: Buffer;
  /** 字符串列表 */
  SS?: string[];
  /** 数字列表 */
  NS?: string[];
  /** 二进制列表 */
  BS?: Buffer[];
  /** 布尔值 */
  BOOL?: boolean;
  /** 空值 */
  NULL?: boolean;
  /** 列表 */
  L?: AttributeValue[];
  /** 映射 */
  M?: Record<string, AttributeValue>;
}

/** 项目（记录） */
interface Item {
  [attributeName: string]: AttributeValue;
}

/** 键 */
interface Key {
  [attributeName: string]: AttributeValue;
}

/** 放置项目选项 */
interface PutItemOptions extends BtsClientOptions {
  /** 表名称 */
  tableName: string;
  /** 项目 */
  item: Item;
  /** 条件表达式 */
  conditionExpression?: string;
  /** 表达式属性名称 */
  expressionAttributeNames?: Record<string, string>;
  /** 表达式属性值 */
  expressionAttributeValues?: Record<string, AttributeValue>;
  /** 返回值 */
  returnValues?: 'NONE' | 'ALL_OLD';
}

/** 获取项目选项 */
interface GetItemOptions extends BtsClientOptions {
  /** 表名称 */
  tableName: string;
  /** 键 */
  key: Key;
  /** 投影表达式 */
  projectionExpression?: string;
  /** 表达式属性名称 */
  expressionAttributeNames?: Record<string, string>;
  /** 一致性读取 */
  consistentRead?: boolean;
}

/** 更新项目选项 */
interface UpdateItemOptions extends BtsClientOptions {
  /** 表名称 */
  tableName: string;
  /** 键 */
  key: Key;
  /** 更新表达式 */
  updateExpression: string;
  /** 条件表达式 */
  conditionExpression?: string;
  /** 表达式属性名称 */
  expressionAttributeNames?: Record<string, string>;
  /** 表达式属性值 */
  expressionAttributeValues?: Record<string, AttributeValue>;
  /** 返回值 */
  returnValues?: 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW';
}

/** 删除项目选项 */
interface DeleteItemOptions extends BtsClientOptions {
  /** 表名称 */
  tableName: string;
  /** 键 */
  key: Key;
  /** 条件表达式 */
  conditionExpression?: string;
  /** 表达式属性名称 */
  expressionAttributeNames?: Record<string, string>;
  /** 表达式属性值 */
  expressionAttributeValues?: Record<string, AttributeValue>;
  /** 返回值 */
  returnValues?: 'NONE' | 'ALL_OLD';
}

/** 扫描选项 */
interface ScanOptions extends BtsClientOptions {
  /** 表名称 */
  tableName: string;
  /** 过滤表达式 */
  filterExpression?: string;
  /** 投影表达式 */
  projectionExpression?: string;
  /** 表达式属性名称 */
  expressionAttributeNames?: Record<string, string>;
  /** 表达式属性值 */
  expressionAttributeValues?: Record<string, AttributeValue>;
  /** 限制数量 */
  limit?: number;
  /** 独占开始键 */
  exclusiveStartKey?: Key;
  /** 一致性读取 */
  consistentRead?: boolean;
}

/** 查询选项 */
interface QueryOptions extends BtsClientOptions {
  /** 表名称 */
  tableName: string;
  /** 键条件表达式 */
  keyConditionExpression: string;
  /** 过滤表达式 */
  filterExpression?: string;
  /** 投影表达式 */
  projectionExpression?: string;
  /** 表达式属性名称 */
  expressionAttributeNames?: Record<string, string>;
  /** 表达式属性值 */
  expressionAttributeValues?: Record<string, AttributeValue>;
  /** 限制数量 */
  limit?: number;
  /** 独占开始键 */
  exclusiveStartKey?: Key;
  /** 一致性读取 */
  consistentRead?: boolean;
  /** 扫描向前 */
  scanIndexForward?: boolean;
}

/** 批量获取请求 */
interface BatchGetRequest {
  /** 键列表 */
  keys: Key[];
  /** 投影表达式 */
  projectionExpression?: string;
  /** 表达式属性名称 */
  expressionAttributeNames?: Record<string, string>;
  /** 一致性读取 */
  consistentRead?: boolean;
}

/** 批量写入请求 */
interface BatchWriteRequest {
  /** 放置请求列表 */
  putRequests?: Array<{ item: Item }>;
  /** 删除请求列表 */
  deleteRequests?: Array<{ key: Key }>;
}

/**
 * BTS (Baidu Table Storage) 表格存储服务客户端
 */
export default class BtsClient extends BceBaseClient {
  /**
   * 构造函数
   * @param config BTS 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'bts', true);
  }

  // --- 表管理 ---

  /**
   * 创建表
   * @param tableConfig 表配置
   * @param options 选项
   * @returns Promise 解析为表信息
   */
  public async createTable(tableConfig: TableConfig, options: BtsClientOptions = {}): Promise<BceResponse<TableInfo>> {
    return this.sendRequest('POST', '/v1/table', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tableConfig),
      config: options.config
    });
  }

  /**
   * 获取表信息
   * @param tableName 表名称
   * @param options 选项
   * @returns Promise 解析为表信息
   */
  public async describeTable(tableName: string, options: BtsClientOptions = {}): Promise<BceResponse<TableInfo>> {
    return this.sendRequest('GET', `/v1/table/${tableName}`, {
      config: options.config
    });
  }

  /**
   * 列出表
   * @param options 选项
   * @returns Promise 解析为表列表
   */
  public async listTables(options: BtsClientOptions = {}): Promise<BceResponse<{ tableNames: string[] }>> {
    return this.sendRequest('GET', '/v1/table', {
      config: options.config
    });
  }

  /**
   * 更新表
   * @param tableName 表名称
   * @param provisionedThroughput 预配吞吐量
   * @param options 选项
   * @returns Promise 解析为表信息
   */
  public async updateTable(
    tableName: string,
    provisionedThroughput: ProvisionedThroughput,
    options: BtsClientOptions = {}
  ): Promise<BceResponse<TableInfo>> {
    return this.sendRequest('PUT', `/v1/table/${tableName}`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provisionedThroughput: provisionedThroughput }),
      config: options.config
    });
  }

  /**
   * 删除表
   * @param tableName 表名称
   * @param options 选项
   * @returns Promise 解析为删除结果
   */
  public async deleteTable(tableName: string, options: BtsClientOptions = {}): Promise<BceResponse<TableInfo>> {
    return this.sendRequest('DELETE', `/v1/table/${tableName}`, {
      config: options.config
    });
  }

  // --- 项目操作 ---

  /**
   * 放置项目
   * @param options 放置选项
   * @returns Promise 解析为放置结果
   */
  public async putItem(options: PutItemOptions): Promise<BceResponse<{ attributes?: Item }>> {
    const body = u.pick(options, 
      'item', 'conditionExpression', 'expressionAttributeNames', 
      'expressionAttributeValues', 'returnValues'
    );

    return this.sendRequest('POST', `/v1/table/${options.tableName}/item`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 获取项目
   * @param options 获取选项
   * @returns Promise 解析为项目
   */
  public async getItem(options: GetItemOptions): Promise<BceResponse<{ item?: Item }>> {
    const body = u.pick(options, 
      'key', 'projectionExpression', 'expressionAttributeNames', 'consistentRead'
    );

    return this.sendRequest('POST', `/v1/table/${options.tableName}/item/get`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 更新项目
   * @param options 更新选项
   * @returns Promise 解析为更新结果
   */
  public async updateItem(options: UpdateItemOptions): Promise<BceResponse<{ attributes?: Item }>> {
    const body = u.pick(options, 
      'key', 'updateExpression', 'conditionExpression', 'expressionAttributeNames', 
      'expressionAttributeValues', 'returnValues'
    );

    return this.sendRequest('POST', `/v1/table/${options.tableName}/item/update`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 删除项目
   * @param options 删除选项
   * @returns Promise 解析为删除结果
   */
  public async deleteItem(options: DeleteItemOptions): Promise<BceResponse<{ attributes?: Item }>> {
    const body = u.pick(options, 
      'key', 'conditionExpression', 'expressionAttributeNames', 
      'expressionAttributeValues', 'returnValues'
    );

    return this.sendRequest('POST', `/v1/table/${options.tableName}/item/delete`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  // --- 查询和扫描 ---

  /**
   * 查询
   * @param options 查询选项
   * @returns Promise 解析为查询结果
   */
  public async query(options: QueryOptions): Promise<BceResponse<{ items: Item[]; lastEvaluatedKey?: Key; count: number }>> {
    const body = u.pick(options, 
      'keyConditionExpression', 'filterExpression', 'projectionExpression',
      'expressionAttributeNames', 'expressionAttributeValues', 'limit',
      'exclusiveStartKey', 'consistentRead', 'scanIndexForward'
    );

    return this.sendRequest('POST', `/v1/table/${options.tableName}/query`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 扫描
   * @param options 扫描选项
   * @returns Promise 解析为扫描结果
   */
  public async scan(options: ScanOptions): Promise<BceResponse<{ items: Item[]; lastEvaluatedKey?: Key; count: number }>> {
    const body = u.pick(options, 
      'filterExpression', 'projectionExpression', 'expressionAttributeNames',
      'expressionAttributeValues', 'limit', 'exclusiveStartKey', 'consistentRead'
    );

    return this.sendRequest('POST', `/v1/table/${options.tableName}/scan`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  // --- 批量操作 ---

  /**
   * 批量获取项目
   * @param requestItems 请求项目映射
   * @param options 选项
   * @returns Promise 解析为批量获取结果
   */
  public async batchGetItem(
    requestItems: Record<string, BatchGetRequest>,
    options: BtsClientOptions = {}
  ): Promise<BceResponse<{ responses: Record<string, Item[]>; unprocessedKeys?: Record<string, BatchGetRequest> }>> {
    return this.sendRequest('POST', '/v1/batchGetItem', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestItems: requestItems }),
      config: options.config
    });
  }

  /**
   * 批量写入项目
   * @param requestItems 请求项目映射
   * @param options 选项
   * @returns Promise 解析为批量写入结果
   */
  public async batchWriteItem(
    requestItems: Record<string, BatchWriteRequest>,
    options: BtsClientOptions = {}
  ): Promise<BceResponse<{ unprocessedItems?: Record<string, BatchWriteRequest> }>> {
    return this.sendRequest('POST', '/v1/batchWriteItem', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestItems: requestItems }),
      config: options.config
    });
  }
}