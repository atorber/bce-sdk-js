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
 * @file strings.ts
 * @author leeight
 */

/** URL 编码映射表 */
const kEscapedMap: Record<string, string> = {
  '!': '%21',
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A',
} as const;

/**
 * 规范化字符串，进行 URL 编码
 * @param string 要编码的字符串
 * @param encodingSlash 是否编码斜杠，默认为 true
 * @returns 编码后的字符串
 */
export function normalize(string: string, encodingSlash?: boolean): string {
  let result = encodeURIComponent(string);
  result = result.replace(/[!'\(\)\*]/g, ($1: string) => {
    return kEscapedMap[$1] || $1;
  });

  if (encodingSlash === false) {
    result = result.replace(/%2F/gi, '/');
  }

  return result;
}

/**
 * 去除字符串首尾空白字符
 * @param string 要处理的字符串
 * @returns 去除空白后的字符串
 */
export function trim(string?: string | null): string {
  return (string || '').replace(/^\s+|\s+$/g, '');
}

/**
 * 判断字符串是否以指定后缀结尾
 * @param string 要检查的字符串
 * @param suffix 后缀字符串
 * @returns 是否以指定后缀结尾
 */
export function hasSuffix(string?: string | null, suffix?: string | null): boolean {
  if (!suffix) {
    return true;
  }

  if (!string) {
    return false;
  }

  const len = suffix.length;
  return len > 0 && string.lastIndexOf(suffix) === string.length - len;
}

// 为向后兼容保留 CommonJS 导出
export default {
  normalize,
  trim,
  hasSuffix,
};