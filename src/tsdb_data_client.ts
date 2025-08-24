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
 * @file src/tsdb_data_client.ts
 * @author leeight
 */

import * as u from 'underscore';
import BceBaseClient from './bce_base_client';
import type { BceConfig, BceResponse } from './types/common';

// ==================== 类型定义 ====================

/** TSDB Data 客户端选项 */
interface TsdbDataClientOptions {
  config?: Partial<BceConfig>;
}

/** 数据点 */
interface DataPoint {
  /** 指标名称 */
  metric: string;
  /** 标签 */
  tags?: Record<string, string>;
  /** 时间戳（毫秒） */
  timestamp: number;
  /** 数值 */
  value: number;
}

/** 写入选项 */
interface WriteOptions extends TsdbDataClientOptions {
  /** 数据库名称 */
  database: string;
  /** 是否等待写入完成 */
  waitForCompletion?: boolean;
}

/** 查询条件 */
interface QueryCondition {
  /** 指标名称 */
  metric: string;
  /** 标签过滤器 */
  tags?: Record<string, string | string[]>;
  /** 聚合函数 */
  aggregator?: 'sum' | 'avg' | 'max' | 'min' | 'count' | 'stddev';
  /** 分组标签 */
  groupBy?: string[];
  /** 下采样配置 */
  downsample?: {
    /** 时间间隔 */
    interval: string;
    /** 聚合函数 */
    aggregator: 'sum' | 'avg' | 'max' | 'min' | 'count';
  };
  /** 速率计算 */
  rate?: boolean;
}

/** 查询选项 */
interface QueryOptions extends TsdbDataClientOptions {
  /** 数据库名称 */
  database: string;
  /** 开始时间（Unix 时间戳，秒） */
  start: number;
  /** 结束时间（Unix 时间戳，秒） */
  end?: number;
  /** 查询条件列表 */
  queries: QueryCondition[];
  /** 时区 */
  timezone?: string;
  /** 是否显示详细信息 */
  showTSUIDs?: boolean;
}

/** 查询结果数据点 */
interface QueryResultDataPoint {
  /** 时间戳（毫秒） */
  timestamp: number;
  /** 数值 */
  value: number;
}

/** 查询结果 */
interface QueryResult {
  /** 指标名称 */
  metric: string;
  /** 标签 */
  tags: Record<string, string>;
  /** 聚合的标签 */
  aggregatedTags?: string[];
  /** 数据点 */
  dps: QueryResultDataPoint[];
  /** TSUID */
  tsuid?: string;
}

/** 删除选项 */
interface DeleteOptions extends TsdbDataClientOptions {
  /** 数据库名称 */
  database: string;
  /** 指标名称 */
  metric: string;
  /** 标签过滤器 */
  tags?: Record<string, string>;
  /** 开始时间（Unix 时间戳，秒） */
  start?: number;
  /** 结束时间（Unix 时间戳，秒） */
  end?: number;
}

/** 批量写入数据 */
interface BatchWriteData {
  /** 数据点列表 */
  datapoints: DataPoint[];
}

/** 聚合查询选项 */
interface AggregateQueryOptions extends TsdbDataClientOptions {
  /** 数据库名称 */
  database: string;
  /** 指标名称 */
  metric: string;
  /** 标签过滤器 */
  tags?: Record<string, string>;
  /** 开始时间（Unix 时间戳，秒） */
  start: number;
  /** 结束时间（Unix 时间戳，秒） */
  end?: number;
  /** 聚合函数 */
  aggregator: 'sum' | 'avg' | 'max' | 'min' | 'count' | 'stddev';
  /** 时间间隔 */
  interval?: string;
}

/** 时间序列信息 */
interface TimeSeriesInfo {
  /** 时间序列唯一标识 */
  tsuid: string;
  /** 指标名称 */
  metric: string;
  /** 标签 */
  tags: Record<string, string>;
  /** 创建时间 */
  createTime: number;
  /** 最后写入时间 */
  lastWriteTime: number;
  /** 数据点数量 */
  dataPointCount: number;
}

/**
 * TSDB Data 时序数据库数据客户端
 */
export default class TsdbDataClient extends BceBaseClient {
  /**
   * 构造函数
   * @param config TSDB Data 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'tsdb', true);
  }

  // --- 数据写入 ---

  /**
   * 写入单个数据点
   * @param datapoint 数据点
   * @param options 写入选项
   * @returns Promise 解析为写入结果
   */
  public async writeDatapoint(datapoint: DataPoint, options: WriteOptions): Promise<BceResponse<any>> {
    return this.writeDatapoints([datapoint], options);
  }

  /**
   * 批量写入数据点
   * @param datapoints 数据点列表
   * @param options 写入选项
   * @returns Promise 解析为写入结果
   */
  public async writeDatapoints(datapoints: DataPoint[], options: WriteOptions): Promise<BceResponse<any>> {
    const body: BatchWriteData = {
      datapoints: datapoints
    };

    const params: any = {};
    if (options.waitForCompletion) {
      params.sync = 'true';
    }

    return this.sendRequest('POST', `/v1/datapoint/${options.database}`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      params: params,
      config: options.config
    });
  }

  // --- 数据查询 ---

  /**
   * 查询数据
   * @param options 查询选项
   * @returns Promise 解析为查询结果
   */
  public async queryData(options: QueryOptions): Promise<BceResponse<QueryResult[]>> {
    const body = {
      start: options.start,
      end: options.end,
      queries: options.queries.map(query => ({
        metric: query.metric,
        tags: query.tags,
        aggregator: query.aggregator,
        groupBy: query.groupBy,
        downsample: query.downsample,
        rate: query.rate
      })),
      timezone: options.timezone,
      showTSUIDs: options.showTSUIDs
    };

    return this.sendRequest('POST', `/v1/datapoint/${options.database}/query`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 聚合查询
   * @param options 聚合查询选项
   * @returns Promise 解析为聚合结果
   */
  public async aggregateQuery(options: AggregateQueryOptions): Promise<BceResponse<any>> {
    const params = {
      metric: options.metric,
      start: options.start.toString(),
      end: options.end?.toString(),
      aggregator: options.aggregator,
      interval: options.interval,
      ...options.tags
    };

    return this.sendRequest('GET', `/v1/datapoint/${options.database}/aggregate`, {
      params: u.omit(params, (value) => value === undefined),
      config: options.config
    });
  }

  /**
   * 获取最新数据点
   * @param database 数据库名称
   * @param metric 指标名称
   * @param tags 标签过滤器
   * @param options 选项
   * @returns Promise 解析为最新数据点
   */
  public async getLatestDatapoint(
    database: string,
    metric: string,
    tags?: Record<string, string>,
    options: TsdbDataClientOptions = {}
  ): Promise<BceResponse<DataPoint[]>> {
    const params = {
      metric: metric,
      ...tags
    };

    return this.sendRequest('GET', `/v1/datapoint/${database}/latest`, {
      params: params,
      config: options.config
    });
  }

  // --- 数据删除 ---

  /**
   * 删除数据
   * @param options 删除选项
   * @returns Promise 解析为删除结果
   */
  public async deleteData(options: DeleteOptions): Promise<BceResponse<any>> {
    const body = {
      metric: options.metric,
      tags: options.tags,
      start: options.start,
      end: options.end
    };

    return this.sendRequest('DELETE', `/v1/datapoint/${options.database}`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u.omit(body, (value) => value === undefined)),
      config: options.config
    });
  }

  // --- 时间序列管理 ---

  /**
   * 获取时间序列信息
   * @param database 数据库名称
   * @param tsuid 时间序列唯一标识
   * @param options 选项
   * @returns Promise 解析为时间序列信息
   */
  public async getTimeSeries(
    database: string,
    tsuid: string,
    options: TsdbDataClientOptions = {}
  ): Promise<BceResponse<TimeSeriesInfo>> {
    return this.sendRequest('GET', `/v1/timeseries/${database}/${tsuid}`, {
      config: options.config
    });
  }

  /**
   * 搜索时间序列
   * @param database 数据库名称
   * @param metric 指标名称
   * @param tags 标签过滤器
   * @param options 选项
   * @returns Promise 解析为时间序列列表
   */
  public async searchTimeSeries(
    database: string,
    metric?: string,
    tags?: Record<string, string>,
    options: TsdbDataClientOptions = {}
  ): Promise<BceResponse<TimeSeriesInfo[]>> {
    const params = {
      metric: metric,
      ...tags
    };

    return this.sendRequest('GET', `/v1/timeseries/${database}/search`, {
      params: u.omit(params, (value) => value === undefined),
      config: options.config
    });
  }

  // --- 标签管理 ---

  /**
   * 获取指标列表
   * @param database 数据库名称
   * @param options 选项
   * @returns Promise 解析为指标列表
   */
  public async getMetrics(database: string, options: TsdbDataClientOptions = {}): Promise<BceResponse<string[]>> {
    return this.sendRequest('GET', `/v1/suggest/${database}/metrics`, {
      config: options.config
    });
  }

  /**
   * 获取标签键列表
   * @param database 数据库名称
   * @param metric 指标名称（可选）
   * @param options 选项
   * @returns Promise 解析为标签键列表
   */
  public async getTagKeys(
    database: string,
    metric?: string,
    options: TsdbDataClientOptions = {}
  ): Promise<BceResponse<string[]>> {
    const params = metric ? { metric: metric } : {};

    return this.sendRequest('GET', `/v1/suggest/${database}/tagKeys`, {
      params: params,
      config: options.config
    });
  }

  /**
   * 获取标签值列表
   * @param database 数据库名称
   * @param tagKey 标签键
   * @param metric 指标名称（可选）
   * @param options 选项
   * @returns Promise 解析为标签值列表
   */
  public async getTagValues(
    database: string,
    tagKey: string,
    metric?: string,
    options: TsdbDataClientOptions = {}
  ): Promise<BceResponse<string[]>> {
    const params = {
      tagKey: tagKey,
      ...(metric && { metric: metric })
    };

    return this.sendRequest('GET', `/v1/suggest/${database}/tagValues`, {
      params: params,
      config: options.config
    });
  }

  // --- 数据导入导出 ---

  /**
   * 导出数据
   * @param database 数据库名称
   * @param metric 指标名称
   * @param start 开始时间
   * @param end 结束时间
   * @param tags 标签过滤器
   * @param options 选项
   * @returns Promise 解析为导出结果
   */
  public async exportData(
    database: string,
    metric: string,
    start: number,
    end: number,
    tags?: Record<string, string>,
    options: TsdbDataClientOptions = {}
  ): Promise<BceResponse<any>> {
    const params = {
      metric: metric,
      start: start.toString(),
      end: end.toString(),
      ...tags
    };

    return this.sendRequest('GET', `/v1/datapoint/${database}/export`, {
      params: params,
      config: options.config
    });
  }
}