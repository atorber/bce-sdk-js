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
 * @file src/qns_client.ts
 * @author leeight
 */

import * as u from 'underscore';
import BceBaseClient from './bce_base_client';
import type { BceConfig, BceResponse } from './types/common';

// ==================== 类型定义 ====================

/** QNS 客户端选项 */
interface QnsClientOptions {
  config?: Partial<BceConfig>;
}

/** Topic 创建选项 */
interface TopicCreateOptions {
  /** 延迟时间（秒） */
  delayInSeconds?: number;
  /** 最大消息大小（字节） */
  maximumMessageSizeInBytes?: number;
  /** 消息保留时间（秒） */
  messageRetentionPeriodInSeconds?: number;
}

/** 消息内容 */
interface MessageContent {
  /** 消息体 */
  messageBody: string;
  /** 延迟时间（0-3600秒） */
  delayInSeconds?: number;
}

/** 列表选项 */
interface ListOptions {
  /** 标记 */
  marker?: string;
  /** 最大记录数 */
  maxRecords?: number;
}

/** 订阅创建选项 */
interface SubscriptionCreateOptions {
  /** 接收消息等待时间（1-20秒） */
  receiveMessageWaitTimeInSeconds?: number;
  /** 主题名称 */
  topic?: string;
  /** 可见性超时时间（1-43200秒） */
  visibilityTimeoutInSeconds?: number;
  /** 推送配置 */
  pushConfig?: {
    pushType: string;
    endpoint: string;
  };
}

/** 推送配置 */
interface PushConfig {
  pushType: string;
  endpoint: string;
}

/**
 * QNS Topic 服务 API
 */
export class Topic extends BceBaseClient {
  private _account: string;
  private _name: string;

  /**
   * 构造函数
   * @param config QNS 客户端配置
   * @param account 主题账户
   * @param name 主题名称
   */
  constructor(config: BceConfig, account: string, name: string) {
    super(config, 'qns', true);
    this._account = account;
    this._name = name;
  }

  /**
   * 构建 URL
   * @returns URL 路径
   */
  private _buildUrl(): string {
    return `/v1/${this._account}/topic/${this._name}`;
  }

  /**
   * 创建主题
   * @param options 创建选项
   * @returns Promise 解析为创建结果
   */
  public async create(options: TopicCreateOptions = {}): Promise<BceResponse<any>> {
    const params = u.pick(options, 'delayInSeconds', 'maximumMessageSizeInBytes', 'messageRetentionPeriodInSeconds');

    return this.sendRequest('PUT', this._buildUrl(), {
      body: JSON.stringify(params)
    });
  }

  /**
   * 删除主题
   * @returns Promise 解析为删除结果
   */
  public async remove(): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', this._buildUrl());
  }

  /**
   * 获取主题信息
   * @returns Promise 解析为主题信息
   */
  public async get(): Promise<BceResponse<any>> {
    return this.sendRequest('GET', this._buildUrl());
  }

  /**
   * 更新主题
   * @param options 更新选项
   * @returns Promise 解析为更新结果
   */
  public async update(options: TopicCreateOptions = {}): Promise<BceResponse<any>> {
    const params = u.pick(options, 'delayInSeconds', 'maximumMessageSizeInBytes', 'messageRetentionPeriodInSeconds');

    return this.sendRequest('PUT', this._buildUrl(), {
      headers: {
        'If-Match': '*'
      },
      body: JSON.stringify(params)
    });
  }

  /**
   * 发送消息到主题
   * 单个请求不超过256KB，单次发送的消息个数不超过1000
   * @param messages 需要发送的消息内容
   * @returns Promise 解析为发送结果
   */
  public async sendMessages(messages: Array<string | MessageContent>): Promise<BceResponse<any>> {
    const url = this._buildUrl() + '/message';

    const formattedMessages = u.map(messages, (item) => {
      if (typeof item === 'string') {
        return {
          messageBody: item
        };
      }
      return item;
    });

    return this.sendRequest('POST', url, {
      body: JSON.stringify({ messages: formattedMessages })
    });
  }

  /**
   * 列出主题
   * @param options 列表选项
   * @returns Promise 解析为主题列表
   */
  public async list(options: ListOptions = {}): Promise<BceResponse<any>> {
    const params = u.pick(options, 'marker', 'maxRecords');
    const url = `/v1/${this._account}/topic`;
    
    return this.sendRequest('GET', url, {
      params: params
    });
  }

  /**
   * 创建订阅
   * @param subscriptionName 订阅名称
   * @param options 订阅选项
   * @returns Promise 解析为创建结果
   */
  public async createSubscription(subscriptionName: string, options: SubscriptionCreateOptions = {}): Promise<BceResponse<any>> {
    const subscription = new Subscription(this.config, this._account, subscriptionName);

    if (!options.topic) {
      options.topic = this._name;
    }

    return subscription.create(options);
  }
}

/**
 * QNS Subscription 服务 API
 */
export class Subscription extends BceBaseClient {
  private _account: string;
  private _name: string;

  /**
   * 构造函数
   * @param config QNS 客户端配置
   * @param account 订阅账户
   * @param name 订阅名称
   */
  constructor(config: BceConfig, account: string, name: string) {
    super(config, 'qns', true);
    this._account = account;
    this._name = name;
  }

  /**
   * 构建 URL
   * @returns URL 路径
   */
  private _buildUrl(): string {
    return `/v1/${this._account}/subscription/${this._name}`;
  }

  /**
   * 创建订阅
   * @param options 创建选项
   * @returns Promise 解析为创建结果
   */
  public async create(options: SubscriptionCreateOptions = {}): Promise<BceResponse<any>> {
    const params = u.pick(options, 
      'receiveMessageWaitTimeInSeconds',
      'topic',
      'visibilityTimeoutInSeconds',
      'pushConfig'
    );

    return this.sendRequest('PUT', this._buildUrl(), {
      body: JSON.stringify(params)
    });
  }

  /**
   * 删除订阅
   * @returns Promise 解析为删除结果
   */
  public async remove(): Promise<BceResponse<void>> {
    return this.sendRequest('DELETE', this._buildUrl());
  }

  /**
   * 获取订阅信息
   * @returns Promise 解析为订阅信息
   */
  public async get(): Promise<BceResponse<any>> {
    return this.sendRequest('GET', this._buildUrl());
  }

  /**
   * 更新订阅
   * @param options 更新选项
   * @returns Promise 解析为更新结果
   */
  public async update(options: SubscriptionCreateOptions = {}): Promise<BceResponse<any>> {
    const params = u.pick(options,
      'receiveMessageWaitTimeInSeconds',
      'visibilityTimeoutInSeconds',
      'pushConfig'
    );

    return this.sendRequest('PUT', this._buildUrl(), {
      headers: {
        'If-Match': '*'
      },
      body: JSON.stringify(params)
    });
  }

  /**
   * 接收消息
   * @param options 接收选项
   * @returns Promise 解析为消息
   */
  public async receiveMessages(options: { maxNumberOfMessages?: number } = {}): Promise<BceResponse<any>> {
    const url = this._buildUrl() + '/message';
    const params = u.pick(options, 'maxNumberOfMessages');

    return this.sendRequest('GET', url, {
      params: params
    });
  }

  /**
   * 删除消息
   * @param receiptHandle 消息句柄
   * @returns Promise 解析为删除结果
   */
  public async deleteMessage(receiptHandle: string): Promise<BceResponse<void>> {
    const url = this._buildUrl() + '/message';

    return this.sendRequest('DELETE', url, {
      params: { receiptHandle: receiptHandle }
    });
  }

  /**
   * 列出订阅
   * @param options 列表选项
   * @returns Promise 解析为订阅列表
   */
  public async list(options: ListOptions = {}): Promise<BceResponse<any>> {
    const params = u.pick(options, 'marker', 'maxRecords');
    const url = `/v1/${this._account}/subscription`;
    
    return this.sendRequest('GET', url, {
      params: params
    });
  }
}

/**
 * QNS 客户端（主要导出类）
 */
export default class QnsClient extends BceBaseClient {
  /**
   * 构造函数
   * @param config QNS 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'qns', true);
  }

  /**
   * 创建 Topic 实例
   * @param account 账户
   * @param name 主题名称
   * @returns Topic 实例
   */
  public createTopic(account: string, name: string): Topic {
    return new Topic(this.config, account, name);
  }

  /**
   * 创建 Subscription 实例
   * @param account 账户
   * @param name 订阅名称
   * @returns Subscription 实例
   */
  public createSubscription(account: string, name: string): Subscription {
    return new Subscription(this.config, account, name);
  }
}