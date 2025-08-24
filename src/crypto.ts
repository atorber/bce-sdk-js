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
 * @file src/crypto.ts
 * @author leeight
 */

import * as fs from 'fs';
import * as crypto from 'crypto';
import { Readable } from 'stream';

/** 支持的字符编码类型 */
export type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex';

/** 支持的摘要输出格式 */
export type DigestEncoding = 'base64' | 'base64url' | 'hex' | 'binary';

/**
 * 计算数据的 MD5 哈希值
 * @param data 要计算哈希的数据
 * @param enc 输入数据的编码方式
 * @param digest 输出摘要的格式
 * @returns MD5 哈希值
 */
export function md5sum(data: string | Buffer, enc?: BufferEncoding, digest?: DigestEncoding): string {
  let bufferData: Buffer;
  
  if (!Buffer.isBuffer(data)) {
    bufferData = Buffer.from(data, enc || 'utf8');
  } else {
    bufferData = data;
  }

  const md5 = crypto.createHash('md5');
  md5.update(bufferData);

  return md5.digest(digest || 'base64');
}

/**
 * 计算流的 MD5 哈希值
 * @param stream 可读流
 * @param digest 输出摘要的格式
 * @returns Promise，解析为 MD5 哈希值
 */
export function md5stream(stream: Readable, digest?: DigestEncoding): Promise<string> {
  return new Promise((resolve, reject) => {
    const md5 = crypto.createHash('md5');
    
    stream.on('data', (chunk: Buffer) => {
      md5.update(chunk);
    });
    
    stream.on('end', () => {
      resolve(md5.digest(digest || 'base64'));
    });
    
    stream.on('error', (error: Error) => {
      reject(error);
    });
  });
}

/**
 * 计算文件的 MD5 哈希值
 * @param filename 文件路径
 * @param digest 输出摘要的格式
 * @returns Promise，解析为 MD5 哈希值
 */
export function md5file(filename: string, digest?: DigestEncoding): Promise<string> {
  return md5stream(fs.createReadStream(filename), digest);
}

/**
 * 计算 Blob 对象的 MD5 哈希值（仅在浏览器环境中可用）
 * @param blob Blob 对象
 * @param digest 输出摘要的格式
 * @returns Promise，解析为 MD5 哈希值
 */
export function md5blob(blob: Blob, digest?: DigestEncoding): Promise<string> {
  return new Promise((resolve, reject) => {
    // 检查浏览器环境
    if (typeof FileReader === 'undefined') {
      reject(new Error('FileReader is not available in this environment'));
      return;
    }

    const reader = new FileReader();
    
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read blob'));
    };
    
    reader.onloadend = (e: ProgressEvent<FileReader>) => {
      if (e.target?.readyState === FileReader.DONE) {
        const content = e.target.result;
        if (content instanceof ArrayBuffer) {
          const buffer = Buffer.from(content);
          const md5 = md5sum(buffer, undefined, digest);
          resolve(md5);
        } else {
          reject(new Error('Failed to read blob as ArrayBuffer'));
        }
      }
    };
    
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * 创建 HMAC 签名
 * @param algorithm 哈希算法
 * @param key 密钥
 * @param data 要签名的数据
 * @param encoding 输出编码
 * @returns HMAC 签名
 */
export function hmac(
  algorithm: string,
  key: string | Buffer,
  data: string | Buffer,
  encoding: DigestEncoding = 'base64'
): string {
  const hmacInstance = crypto.createHmac(algorithm, key);
  hmacInstance.update(data);
  return hmacInstance.digest(encoding);
}

/**
 * 创建 SHA256 哈希
 * @param data 要哈希的数据
 * @param encoding 输出编码
 * @returns SHA256 哈希值
 */
export function sha256(data: string | Buffer, encoding: DigestEncoding = 'hex'): string {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest(encoding);
}

/**
 * 生成随机字符串
 * @param length 字符串长度
 * @param encoding 输出编码
 * @returns 随机字符串
 */
export function randomString(length: number = 16, encoding: DigestEncoding = 'hex'): string {
  const bytes = Math.ceil(length / 2);
  return crypto.randomBytes(bytes).toString(encoding).slice(0, length);
}

// 为向后兼容保留 CommonJS 导出
export default {
  md5sum,
  md5stream,
  md5file,
  md5blob,
  hmac,
  sha256,
  randomString,
};