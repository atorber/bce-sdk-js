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
 * @file src/multipart.ts
 * @author leeight
 */

import * as util from 'util';

/**
 * Multipart Form Data 编码器
 * 
 * 用于创建和编码 multipart/form-data 格式的数据，
 * 常用于文件上传等场景。
 */
export default class Multipart {
  /** 边界字符串 */
  private _boundary: string;
  
  /** 存储所有部分的 Buffer 数组 */
  private _parts: Buffer[] = [];

  /**
   * 构造函数
   * 
   * @param boundary multipart 边界字符串
   */
  constructor(boundary: string) {
    this._boundary = boundary;
    this._parts = [];
  }

  /**
   * 添加一个 multipart 部分
   * 
   * @param name 字段名称
   * @param data 字段数据（字符串或Buffer）
   * @param contentType 内容类型（可选）
   * @param filename 文件名（可选，用于文件上传）
   */
  public addPart(name: string, data: string | Buffer, contentType?: string, filename?: string): void {
    const part: Buffer[] = [];

    // 构建头部
    let header = `--${this._boundary}\r\nContent-Disposition: form-data; name="${name}"`;
    
    if (filename) {
      header += `; filename="${filename}"`;
    }
    
    if (contentType) {
      header += `\r\nContent-Type: ${contentType}`;
    }
    
    header += '\r\n\r\n';
    
    part.push(Buffer.from(header));

    // 添加数据
    if (Buffer.isBuffer(data)) {
      part.push(data);
      part.push(Buffer.from('\r\n'));
    } else if (typeof data === 'string') {
      part.push(Buffer.from(data + '\r\n'));
    } else {
      throw new Error('Invalid data type. Expected string or Buffer.');
    }

    this._parts.push(Buffer.concat(part));
  }

  /**
   * 添加文件字段
   * 
   * @param name 字段名称
   * @param data 文件数据
   * @param filename 文件名
   * @param contentType 内容类型
   */
  public addFile(name: string, data: Buffer, filename: string, contentType: string = 'application/octet-stream'): void {
    this.addPart(name, data, contentType, filename);
  }

  /**
   * 添加文本字段
   * 
   * @param name 字段名称
   * @param value 字段值
   */
  public addField(name: string, value: string): void {
    this.addPart(name, value);
  }

  /**
   * 编码所有部分为最终的 multipart 数据
   * 
   * @returns 编码后的 Buffer
   */
  public encode(): Buffer {
    const endBoundary = Buffer.from(`--${this._boundary}--`);
    
    return Buffer.concat([
      Buffer.concat(this._parts),
      endBoundary
    ]);
  }

  /**
   * 获取内容类型头
   * 
   * @returns Content-Type 头部值
   */
  public getContentType(): string {
    return `multipart/form-data; boundary=${this._boundary}`;
  }

  /**
   * 获取边界字符串
   * 
   * @returns 边界字符串
   */
  public getBoundary(): string {
    return this._boundary;
  }

  /**
   * 获取编码后的数据长度
   * 
   * @returns 数据长度（字节）
   */
  public getLength(): number {
    return this.encode().length;
  }

  /**
   * 清空所有部分
   */
  public clear(): void {
    this._parts = [];
  }

  /**
   * 获取部分数量
   * 
   * @returns 部分数量
   */
  public getPartCount(): number {
    return this._parts.length;
  }

  /**
   * 生成随机边界字符串
   * 
   * @returns 随机边界字符串
   */
  public static generateBoundary(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let boundary = '';
    
    for (let i = 0; i < 16; i++) {
      boundary += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `----formdata-bce-${boundary}`;
  }
}