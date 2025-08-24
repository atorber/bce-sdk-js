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
 * @file test/sdk/auth.spec.ts
 * @author leeight
 */

import { expect } from '@jest/globals';

import Auth from '../../src/auth';
import * as strings from '../../src/strings';

describe('Auth', () => {
  describe('queryStringCanonicalization', () => {
    it('should canonicalize query string correctly', () => {
      const auth = new Auth('ak', 'sk');

      const params = {
        A: 'A',
        B: null,
        C: ''
      };
      
      const result = auth.queryStringCanonicalization(params);
      expect(result).toBe('A=A&B=&C=');
    });

    it('should handle empty params', () => {
      const auth = new Auth('ak', 'sk');
      const result = auth.queryStringCanonicalization({});
      expect(result).toBe('');
    });

    it('should handle undefined values', () => {
      const auth = new Auth('ak', 'sk');
      const params = {
        A: 'value',
        B: undefined,
        C: 'another'
      };
      
      const result = auth.queryStringCanonicalization(params);
      expect(result).toBe('A=value&B=&C=another');
    });
  });

  describe('uriCanonicalization', () => {
    it('should normalize URI correctly', () => {
      const result = strings.normalize('!\'()*this is an example for 测试');
      expect(result).toBe('%21%27%28%29%2Athis%20is%20an%20example%20for%20%E6%B5%8B%E8%AF%95');
    });

    it('should handle empty string', () => {
      const result = strings.normalize('');
      expect(result).toBe('');
    });

    it('should handle special characters', () => {
      const result = strings.normalize('hello world!@#$%^&*()');
      expect(result).toBe('hello%20world%21%40%23%24%25%5E%26%2A%28%29');
    });
  });

  describe('headersCanonicalization', () => {
    it('should canonicalize headers correctly without Content-MD5', () => {
      const auth = new Auth('ak', 'sk');

      const headers = {
        'Host': 'localhost',
        'x-bce-a': 'a/b:c',
        'C': ''
      };

      const [canonicalHeaders, signedHeaders] = auth.headersCanonicalization(headers);
      
      expect(signedHeaders).toEqual(['host', 'x-bce-a']);
      expect(canonicalHeaders).toBe('host:localhost\nx-bce-a:a%2Fb%3Ac');
    });

    it('should canonicalize headers correctly with Content-MD5', () => {
      const auth = new Auth('ak', 'sk');

      const headers = {
        'Host': 'localhost',
        'x-bce-a': 'a/b:c',
        'C': '',
        'Content-MD5': 'MD5'
      };

      const [canonicalHeaders, signedHeaders] = auth.headersCanonicalization(headers);
      
      expect(signedHeaders).toEqual(['content-md5', 'host', 'x-bce-a']);
      expect(canonicalHeaders).toBe('content-md5:MD5\nhost:localhost\nx-bce-a:a%2Fb%3Ac');
    });

    it('should handle empty headers', () => {
      const auth = new Auth('ak', 'sk');
      const [canonicalHeaders, signedHeaders] = auth.headersCanonicalization({});
      
      expect(signedHeaders).toEqual([]);
      expect(canonicalHeaders).toBe('');
    });

    it('should ignore non-BCE headers except Content-* and Host', () => {
      const auth = new Auth('ak', 'sk');

      const headers = {
        'Host': 'localhost',
        'User-Agent': 'test-agent',
        'Custom-Header': 'value',
        'x-bce-test': 'bce-value',
        'Content-Type': 'application/json'
      };

      const [canonicalHeaders, signedHeaders] = auth.headersCanonicalization(headers);
      
      expect(signedHeaders).toEqual(['content-type', 'host', 'x-bce-test']);
    });
  });

  describe('generateAuthorization', () => {
    it('should generate correct authorization signature', () => {
      const auth = new Auth('my_ak', 'my_sk');

      const method = 'PUT';
      const uri = '/v1/bucket/object1';
      const params = {
        A: null,
        b: '',
        C: 'd'
      };
      const headers = {
        'Host': 'bce.baidu.com',
        'abc': '123',
        'x-bce-meta-key1': 'ABC'
      };

      const signature = auth.generateAuthorization(method, uri, params, headers, 1402639056);
      
      expect(signature).toBe(
        'bce-auth-v1/my_ak/2014-06-13T05:57:36Z/1800/host;x-bce-meta-key1/' +
        '80c9672aca2ea9af4bb40b9a8ff458d72df94e97d550840727f3a929af271d25'
      );
    });

    it('should generate correct authorization signature with custom expiration', () => {
      const auth = new Auth('my_ak', 'my_sk');

      const method = 'PUT';
      const uri = '/v1/bucket/object1';
      const params = {
        A: null,
        b: '',
        C: 'd'
      };
      const headers = {
        'Host': 'bce.baidu.com',
        'abc': '123',
        'x-bce-meta-key1': 'ABC'
      };

      const signature = auth.generateAuthorization(method, uri, params, headers, 1402639056, 1800);
      
      expect(signature).toBe(
        'bce-auth-v1/my_ak/2014-06-13T05:57:36Z/1800/host;x-bce-meta-key1/' +
        '80c9672aca2ea9af4bb40b9a8ff458d72df94e97d550840727f3a929af271d25'
      );
    });

    it('should generate correct authorization for DELETE request', () => {
      const auth = new Auth('my_ak', 'my_sk');

      const method = 'DELETE';
      const uri = '/v1/test-bucket1361199862';
      const params = {};
      const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': 0,
        'User-Agent': 'This is the user-agent'
      };

      const signature = auth.generateAuthorization(method, uri, params, headers, 1402639056, 1800);
      
      expect(signature).toBe(
        'bce-auth-v1/my_ak/2014-06-13T05:57:36Z/1800/content-length;content-type/' +
        'c9386b15d585960ae5e6972f73ed92a9a682dc81025480ba5b41206d3e489822'
      );
    });

    it('should handle different timestamp formats', () => {
      const auth = new Auth('test_ak', 'test_sk');

      const method = 'GET';
      const uri = '/';
      const params = {};
      const headers = { 'Host': 'example.com' };

      // Test with current timestamp
      const currentTime = Math.floor(Date.now() / 1000);
      const signature1 = auth.generateAuthorization(method, uri, params, headers, currentTime);
      
      expect(signature1).toMatch(/^bce-auth-v1\/test_ak\/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\/1800\/host\//);
      
      // Test with different timestamp
      const differentTime = currentTime + 3600; // 1 hour later
      const signature2 = auth.generateAuthorization(method, uri, params, headers, differentTime);
      
      expect(signature1).not.toBe(signature2);
    });

    it('should handle empty parameters and headers', () => {
      const auth = new Auth('test_ak', 'test_sk');

      const signature = auth.generateAuthorization('GET', '/', {}, {}, 1402639056);
      
      expect(signature).toMatch(/^bce-auth-v1\/test_ak\/2014-06-13T05:57:36Z\/1800\/\/[a-f0-9]{64}$/);
    });

    it('should be case-sensitive for headers', () => {
      const auth = new Auth('test_ak', 'test_sk');

      const headers1 = { 'Host': 'example.com', 'X-BCE-Test': 'value' };
      const headers2 = { 'host': 'example.com', 'x-bce-test': 'value' };

      const sig1 = auth.generateAuthorization('GET', '/', {}, headers1, 1402639056);
      const sig2 = auth.generateAuthorization('GET', '/', {}, headers2, 1402639056);
      
      // Should produce the same signature after canonicalization
      expect(sig1).toBe(sig2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid input gracefully', () => {
      const auth = new Auth('', '');
      
      expect(() => {
        auth.generateAuthorization('GET', '/', {}, {}, 0);
      }).not.toThrow();
    });

    it('should handle very long strings', () => {
      const auth = new Auth('a'.repeat(1000), 'b'.repeat(1000));
      const longHeaders = {
        'Host': 'c'.repeat(1000),
        'x-bce-long': 'd'.repeat(1000)
      };
      
      expect(() => {
        auth.generateAuthorization('GET', '/', {}, longHeaders, 1402639056);
      }).not.toThrow();
    });

    it('should handle unicode characters in headers', () => {
      const auth = new Auth('ak', 'sk');
      const headers = {
        'Host': 'example.com',
        'x-bce-unicode': '测试中文'
      };
      
      expect(() => {
        auth.generateAuthorization('GET', '/', {}, headers, 1402639056);
      }).not.toThrow();
    });
  });
});