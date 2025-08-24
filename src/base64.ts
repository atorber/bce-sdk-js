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
 * @file src/base64.ts
 * @author lurunze
 */

/** 运行环境类型 */
type Environment = 'Node.js' | 'Browser' | 'Unknown environment';

/**
 * 获取当前运行环境
 * @returns 环境类型
 */
function getEnv(): Environment {
  if (typeof global !== 'undefined') {
    return 'Node.js';
  } else if (typeof window !== 'undefined') {
    return 'Browser';
  } else {
    return 'Unknown environment';
  }
}

/**
 * URL安全的Base64编码
 * 将输入字符串编码为URL安全的Base64格式
 * 
 * @param inputStr 输入字符串或对象
 * @returns URL安全的Base64编码字符串
 */
export function urlEncode(inputStr: string | any): string {
  const env = getEnv();
  let base64Str = inputStr && typeof inputStr === 'string' ? inputStr : JSON.stringify(inputStr);

  if (env === 'Node.js') {
    const buffer = Buffer.from(base64Str, 'utf8');
    base64Str = buffer.toString('base64');
  } else if (env === 'Browser') {
    base64Str = (window as any).btoa(base64Str);
  }

  return base64Str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * URL安全的Base64解码
 * 将URL安全的Base64字符串解码为原始字符串
 * 
 * @param inputStr URL安全的Base64编码字符串
 * @returns 解码后的字符串
 */
export function urlDecode(inputStr: string): string {
  const env = getEnv();
  let result = (inputStr && typeof inputStr === 'string' ? inputStr : '')
    .replace(/\-/g, '+')
    .replace(/\_/g, '/');

  if (env === 'Node.js') {
    result = Buffer.from(result, 'base64').toString('utf-8');
  } else if (env === 'Browser') {
    result = (window as any).atob(result);
  }

  return result;
}

/**
 * 标准Base64编码
 * 
 * @param inputStr 输入字符串
 * @returns Base64编码字符串
 */
export function encode(inputStr: string): string {
  const env = getEnv();
  
  if (env === 'Node.js') {
    return Buffer.from(inputStr, 'utf8').toString('base64');
  } else if (env === 'Browser') {
    return (window as any).btoa(inputStr);
  }
  
  throw new Error('Unsupported environment for Base64 encoding');
}

/**
 * 标准Base64解码
 * 
 * @param inputStr Base64编码字符串
 * @returns 解码后的字符串
 */
export function decode(inputStr: string): string {
  const env = getEnv();
  
  if (env === 'Node.js') {
    return Buffer.from(inputStr, 'base64').toString('utf-8');
  } else if (env === 'Browser') {
    return (window as any).atob(inputStr);
  }
  
  throw new Error('Unsupported environment for Base64 decoding');
}

// 默认导出对象保持向后兼容性
const Base64 = {
  urlEncode,
  urlDecode,
  encode,
  decode
};

export default Base64;