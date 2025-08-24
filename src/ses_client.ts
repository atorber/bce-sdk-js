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
 * @file src/ses_client.ts
 * @author leeight
 */

import * as fs from 'fs';
import * as path from 'path';

import BceBaseClient from './bce_base_client';

// Import types
import type { BceConfig, BceResponse } from './types/common';

// ==================== SES 类型定义 ====================

/** 字符集类型 */
export enum Charset {
  /** UTF-8 */
  UTF8 = 1,
  /** GBK */
  GBK = 2,
}

/** 邮件优先级 */
export enum Priority {
  /** 低优先级 */
  LOW = 0,
  /** 普通优先级 */
  NORMAL = 1,
  /** 高优先级 */
  HIGH = 2,
}

/** 发件人信息 */
export interface EmailAddress {
  /** 邮箱地址 */
  addr: string;
  /** 显示名称 */
  name?: string;
}

/** 邮件来源 */
export interface MailSource {
  /** 发件人邮箱 */
  from: string;
  /** 发件人名称 */
  name: string;
}

/** 邮件目标 */
export interface MailDestination {
  /** 收件人列表 */
  to_addr: Array<{ addr: string }>;
  /** 抄送列表 */
  cc_addr: Array<{ addr: string }>;
  /** 密送列表 */
  bcc_addr: Array<{ addr: string }>;
}

/** 邮件主题 */
export interface MailSubject {
  /** 字符集 */
  charset: Charset;
  /** 主题内容 */
  data: string;
}

/** 邮件内容 */
export interface MailContent {
  /** 字符集 */
  charset: Charset;
  /** 内容数据 */
  data: string;
}

/** 邮件消息体 */
export interface MailMessage {
  /** 纯文本内容 */
  text: MailContent;
  /** HTML内容 */
  html: MailContent;
}

/** 附件文件数据 */
export interface AttachmentFileData {
  /** Base64编码的文件数据 */
  data: string;
}

/** 邮件附件 */
export interface MailAttachment {
  /** 文件名 */
  file_name: string;
  /** 文件数据 */
  file_data: AttachmentFileData;
}

/** 完整邮件结构 */
export interface Mail {
  /** 发件人 */
  source: MailSource;
  /** 收件人 */
  destination: MailDestination;
  /** 主题 */
  subject: MailSubject;
  /** 优先级 */
  priority: Priority;
  /** 消息体 */
  message: MailMessage;
  /** 附件列表 */
  attachments: MailAttachment[];
}

/** 发送邮件请求 */
export interface SendMailRequest {
  /** 邮件内容 */
  mail: Mail;
}

/** 邮件配额信息 */
export interface QuotaInfo {
  /** 每日发送限制 */
  maxSendPerDay?: string;
  /** 每秒发送限制 */
  maxSendPerSecond?: string;
  /** 已使用的今日发送量 */
  usedToday?: string;
}

/** 验证邮箱信息 */
export interface VerifiedEmailInfo {
  /** 邮箱地址 */
  email: string;
  /** 验证状态 */
  status: string;
  /** 创建时间 */
  createTime?: string;
}

/** 发送邮件选项 */
export interface SendMailOptions {
  /** 发件人（字符串或对象） */
  from: string | EmailAddress;
  /** 收件人（字符串或数组） */
  to: string | string[];
  /** 抄送（字符串或数组） */
  cc?: string | string[];
  /** 密送（字符串或数组） */
  bcc?: string | string[];
  /** 邮件主题 */
  subject: string;
  /** 纯文本内容 */
  text?: string;
  /** HTML内容 */
  html?: string;
  /** 附件列表（文件路径或附件对象） */
  attachments?: (string | MailAttachment)[];
}

/** SES 客户端选项 */
export interface SesClientOptions {
  /** 配置 */
  config?: Partial<BceConfig>;
}

// ==================== 响应类型 ====================

/** 获取所有验证邮箱响应 */
export interface GetAllVerifiedEmailsResponse {
  /** 验证邮箱列表 */
  verifiedEmails: VerifiedEmailInfo[];
}

/** 发送邮件响应 */
export interface SendMailResponse {
  /** 消息ID */
  messageId: string;
}

/**
 * SES service client for Baidu Simple Email Service
 */
export default class SesClient extends BceBaseClient {
  /**
   * 构造函数
   * 
   * @param config SES 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'ses', true);
  }

  // --- 验证邮箱管理方法 ---

  /**
   * 添加验证邮箱
   * 
   * @param email 邮箱地址
   * @param options 选项参数
   * @returns Promise 解析为操作结果
   */
  public async addVerifiedEmail(email: string, options: SesClientOptions = {}): Promise<BceResponse<void>> {
    const url = `/v1/verifiedEmail/${encodeURIComponent(email)}`;
    return this.sendRequest('PUT', url, {
      config: options.config
    });
  }

  /**
   * 获取所有验证邮箱
   * 
   * @param options 选项参数
   * @returns Promise 解析为验证邮箱列表
   */
  public async getAllVerifiedEmails(options: SesClientOptions = {}): Promise<BceResponse<GetAllVerifiedEmailsResponse>> {
    const url = '/v1/verifiedEmail';
    return this.sendRequest('GET', url, {
      config: options.config
    });
  }

  /**
   * 获取验证邮箱信息
   * 
   * @param email 邮箱地址
   * @param options 选项参数
   * @returns Promise 解析为验证邮箱信息
   */
  public async getVerifiedEmail(email: string, options: SesClientOptions = {}): Promise<BceResponse<VerifiedEmailInfo>> {
    const url = `/v1/verifiedEmail/${encodeURIComponent(email)}`;
    return this.sendRequest('GET', url, {
      config: options.config
    });
  }

  /**
   * 删除验证邮箱
   * 
   * @param email 邮箱地址
   * @param options 选项参数
   * @returns Promise 解析为操作结果
   */
  public async deleteVerifiedEmail(email: string, options: SesClientOptions = {}): Promise<BceResponse<void>> {
    const url = `/v1/verifiedEmail/${encodeURIComponent(email)}`;
    return this.sendRequest('DELETE', url, {
      config: options.config
    });
  }

  // --- 配额管理方法 ---

  /**
   * 获取发送配额
   * 
   * @param options 选项参数
   * @returns Promise 解析为配额信息
   */
  public async getQuota(options: SesClientOptions = {}): Promise<BceResponse<QuotaInfo>> {
    const url = '/v1/quota';
    return this.sendRequest('GET', url, {
      config: options.config
    });
  }

  /**
   * 设置发送配额
   * 
   * @param quota 配额信息
   * @param options 选项参数
   * @returns Promise 解析为操作结果
   */
  public async setQuota(quota: QuotaInfo, options: SesClientOptions = {}): Promise<BceResponse<void>> {
    const url = '/v1/quota';
    
    // 将数字转换为字符串（API要求）
    const quotaStrings: Record<string, string> = {};
    Object.keys(quota).forEach((key) => {
      const value = (quota as any)[key];
      quotaStrings[key] = value.toString();
    });

    return this.sendRequest('PUT', url, {
      body: JSON.stringify(quotaStrings),
      config: options.config
    });
  }

  // --- 邮件发送方法 ---

  /**
   * 发送邮件
   * 
   * @param mailOptions 邮件选项
   * @param options 选项参数
   * @returns Promise 解析为发送结果
   */
  public async sendMail(mailOptions: SendMailOptions, options: SesClientOptions = {}): Promise<BceResponse<SendMailResponse>> {
    // 处理发件人信息
    const source: MailSource = { from: '', name: '' };
    
    if (typeof mailOptions.from === 'string') {
      source.from = mailOptions.from;
      source.name = mailOptions.from.indexOf('@') !== -1 
        ? mailOptions.from.split('@')[0] 
        : '';
    } else if (mailOptions.from && mailOptions.from.addr) {
      source.from = mailOptions.from.addr;
      source.name = mailOptions.from.name 
        ? mailOptions.from.name
        : mailOptions.from.addr.indexOf('@') !== -1 
          ? mailOptions.from.addr.split('@')[0] 
          : '';
    }

    // 处理收件人列表
    const to = Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to];
    const cc = mailOptions.cc ? (Array.isArray(mailOptions.cc) ? mailOptions.cc : [mailOptions.cc]) : [];
    const bcc = mailOptions.bcc ? (Array.isArray(mailOptions.bcc) ? mailOptions.bcc : [mailOptions.bcc]) : [];

    // 处理邮件内容
    const subject = mailOptions.subject;
    const text = mailOptions.text || '';
    const html = mailOptions.html || '';

    // 处理附件
    const attachments = (mailOptions.attachments || []).map((item) => {
      if (typeof item === 'string') {
        return {
          file_name: path.basename(item),
          file_data: {
            data: fs.readFileSync(item).toString('base64')
          }
        };
      }
      return item;
    });

    // 构建邮件请求
    const mailRequest: SendMailRequest = {
      mail: {
        source: source,
        destination: {
          to_addr: to.map(addr => ({ addr })),
          cc_addr: cc.map(addr => ({ addr })),
          bcc_addr: bcc.map(addr => ({ addr }))
        },
        subject: {
          charset: Charset.UTF8,
          data: subject
        },
        priority: Priority.NORMAL,
        message: {
          text: {
            charset: Charset.UTF8,
            data: text
          },
          html: {
            charset: Charset.UTF8,
            data: html
          }
        },
        attachments: attachments
      }
    };

    const url = '/v1/email';
    return this.sendRequest('POST', url, {
      body: JSON.stringify(mailRequest),
      config: options.config
    });
  }
}

// CommonJS 兼容导出
module.exports = SesClient;
module.exports.default = SesClient;