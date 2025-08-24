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
 * @file src/ocr_client.ts
 * @author leeight
 */

import debugLib from 'debug';

import BceBaseClient from './bce_base_client';

// Import types
import type { BceConfig, BceResponse } from './types/common';

const debug = debugLib('bce-sdk:OCRClient');

// ==================== OCR 类型定义 ====================

/** OCR 语言类型 */
export enum OcrLanguage {
  /** 中文 */
  CHINESE = 'CHN',
  /** 英文 */
  ENGLISH = 'ENG',
  /** 日文 */
  JAPANESE = 'JAP',
  /** 韩文 */
  KOREAN = 'KOR',
}

/** OCR 识别结果 */
export interface OcrResult {
  /** 识别的文本 */
  words: string;
  /** 置信度 */
  confidence: number;
  /** 位置信息 */
  location?: {
    /** 左上角X坐标 */
    left: number;
    /** 左上角Y坐标 */
    top: number;
    /** 宽度 */
    width: number;
    /** 高度 */
    height: number;
  };
}

/** OCR 识别响应 */
export interface OcrResponse {
  /** 识别结果列表 */
  words_result: OcrResult[];
  /** 识别结果数量 */
  words_result_num: number;
  /** 日志ID */
  log_id?: number;
}

/** OCR 请求体 */
export interface OcrRequestBody {
  /** Base64编码的图片数据 */
  base64?: string;
  /** BOS路径 */
  bosPath?: string;
  /** 语言类型 */
  language?: OcrLanguage;
}

/** OCR 客户端选项 */
export interface OcrClientOptions {
  /** 配置 */
  config?: Partial<BceConfig>;
}

/**
 * OCR service client for Baidu Optical Character Recognition
 *
 * @see http://gollum.baidu.com/bceocrapi
 */
export default class OcrClient extends BceBaseClient {
  /**
   * 构造函数
   * 
   * @param config OCR 客户端配置
   */
  constructor(config: BceConfig) {
    super(config, 'face', true);
  }

  // --- OCR 识别方法 ---

  /**
   * 内部API调用方法
   * 
   * @param url API路径
   * @param data 图片数据（Buffer或BOS路径）
   * @param language 识别语言
   * @param options 选项参数
   * @returns Promise 解析为识别结果
   */
  private async _apiCall(
    url: string,
    data: Buffer | string,
    language?: OcrLanguage,
    options: OcrClientOptions = {}
  ): Promise<BceResponse<OcrResponse>> {
    debug('url = %j, data = %j, language = %j, options = %j', url, data, language, options);

    const body: OcrRequestBody = {};
    
    if (Buffer.isBuffer(data)) {
      body.base64 = data.toString('base64');
    } else {
      body.bosPath = data;
    }

    if (language) {
      body.language = language;
    }

    return this.sendRequest('POST', url, {
      body: JSON.stringify(body),
      config: options.config
    });
  }

  /**
   * 识别所有文本
   * 
   * @param data 图片数据（Buffer或BOS路径）
   * @param language 识别语言
   * @param options 选项参数
   * @returns Promise 解析为识别结果
   */
  public async allText(
    data: Buffer | string,
    language?: OcrLanguage,
    options: OcrClientOptions = {}
  ): Promise<BceResponse<OcrResponse>> {
    return this._apiCall('/v1/recognize/text', data, language, options);
  }

  /**
   * 识别单行文本
   * 
   * @param data 图片数据（Buffer或BOS路径）
   * @param language 识别语言
   * @param options 选项参数
   * @returns Promise 解析为识别结果
   */
  public async oneLine(
    data: Buffer | string,
    language?: OcrLanguage,
    options: OcrClientOptions = {}
  ): Promise<BceResponse<OcrResponse>> {
    return this._apiCall('/v1/recognize/line', data, language, options);
  }

  /**
   * 识别单个字符
   * 
   * @param data 图片数据（Buffer或BOS路径）
   * @param language 识别语言
   * @param options 选项参数
   * @returns Promise 解析为识别结果
   */
  public async singleCharacter(
    data: Buffer | string,
    language?: OcrLanguage,
    options: OcrClientOptions = {}
  ): Promise<BceResponse<OcrResponse>> {
    return this._apiCall('/v1/recognize/character', data, language, options);
  }
}

// CommonJS 兼容导出
module.exports = OcrClient;
module.exports.default = OcrClient;