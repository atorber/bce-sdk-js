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
 * @file src/wm_stream.ts
 * @author leeight
 */

import { Writable } from 'stream';

/**
 * Writable Memory Stream
 * 
 * 可写内存流，可以用作 HTTP 客户端的输出流。
 * 数据会被存储在内存中的 Buffer 数组中。
 */
export default class WMStream extends Writable {
  /** 存储数据的 Buffer 数组 */
  public store: Buffer[] = [];

  /**
   * 构造函数
   * 
   * @param options 流选项
   */
  constructor(options?: any) {
    super(options);
    this.store = [];
  }

  /**
   * 写入数据的内部实现
   * 
   * @param chunk 要写入的数据块
   * @param encoding 编码类型
   * @param callback 完成回调
   */
  public override _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
    this.store.push(buffer);
    callback();
  }

  /**
   * 获取所有存储的数据作为单个 Buffer
   * 
   * @returns 合并后的 Buffer
   */
  public getBuffer(): Buffer {
    return Buffer.concat(this.store);
  }

  /**
   * 获取所有存储的数据作为字符串
   * 
   * @param encoding 字符编码，默认为 'utf8'
   * @returns 字符串内容
   */
  public getString(encoding: BufferEncoding = 'utf8'): string {
    return this.getBuffer().toString(encoding);
  }

  /**
   * 获取存储的数据总长度
   * 
   * @returns 数据总字节数
   */
  public getLength(): number {
    return this.store.reduce((total, buffer) => total + buffer.length, 0);
  }

  /**
   * 清空存储的数据
   */
  public clear(): void {
    this.store = [];
  }

  /**
   * 获取所有 Buffer 的副本
   * 
   * @returns Buffer 数组的副本
   */
  public getBuffers(): Buffer[] {
    return [...this.store];
  }
}