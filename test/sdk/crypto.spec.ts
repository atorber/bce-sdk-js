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
 * @file test/sdk/crypto.spec.ts
 * @author leeight
 */

import * as path from 'path';
import * as fs from 'fs';
import { expect } from '@jest/globals';

import * as crypto from '../../src/crypto';

describe('crypto', () => {
  describe('md5sum', () => {
    it('should generate correct MD5 hash for string', () => {
      const result = crypto.md5sum('hello world');
      expect(result).toBe('XrY7u+Ae7tCTyyK7j1rNww==');
    });

    it('should generate correct MD5 hash for empty string', () => {
      const result = crypto.md5sum('');
      expect(result).toBe('1B2M2Y8AsgTpgAmY7PhCfg==');
    });

    it('should generate correct MD5 hash for Buffer', () => {
      const buffer = Buffer.from('hello world', 'utf8');
      const result = crypto.md5sum(buffer);
      expect(result).toBe('XrY7u+Ae7tCTyyK7j1rNww==');
    });

    it('should handle unicode characters', () => {
      const result = crypto.md5sum('测试中文');
      expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 format
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = crypto.md5sum('test1');
      const hash2 = crypto.md5sum('test2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('md5file', () => {
    const testFilePath = path.join(__dirname, '..', 'Makefile');

    it('should generate MD5 hash for existing file', async () => {
      // Skip if file doesn't exist
      if (!fs.existsSync(testFilePath)) {
        console.warn(`Test file ${testFilePath} does not exist, skipping test`);
        return;
      }

      const md5sum = await crypto.md5file(testFilePath);
      expect(md5sum).toBe('yRK9tU4xvtCYzRI7VHTRhg==');
    });

    it('should reject for non-existent file', async () => {
      const nonExistentFile = path.join(__dirname, 'non-existent-file.txt');
      
      await expect(crypto.md5file(nonExistentFile)).rejects.toThrow();
    });

    it('should handle empty file', async () => {
      // Create a temporary empty file for testing
      const tempFile = path.join(__dirname, 'temp-empty-file.txt');
      fs.writeFileSync(tempFile, '');
      
      try {
        const md5sum = await crypto.md5file(tempFile);
        expect(md5sum).toBe('1B2M2Y8AsgTpgAmY7PhCfg=='); // MD5 of empty content
      } finally {
        // Clean up
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should handle binary files', async () => {
      // Create a temporary binary file
      const tempFile = path.join(__dirname, 'temp-binary-file.bin');
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE]);
      fs.writeFileSync(tempFile, binaryData);
      
      try {
        const md5sum = await crypto.md5file(tempFile);
        expect(md5sum).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 format
        
        // Verify it matches md5sum of the same data
        const directMd5 = crypto.md5sum(binaryData);
        expect(md5sum).toBe(directMd5);
      } finally {
        // Clean up
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('md5stream', () => {
    it('should generate MD5 hash from readable stream', async () => {
      const currentFile = __filename;
      const fp = fs.createReadStream(currentFile, { start: 0, end: 99 });
      const buffer = fs.readFileSync(currentFile).slice(0, 100);
      
      const streamMd5 = await crypto.md5stream(fp);
      const bufferMd5 = crypto.md5sum(buffer);
      
      expect(streamMd5).toBe(bufferMd5);
    });

    it('should handle empty stream', async () => {
      const tempFile = path.join(__dirname, 'temp-empty-stream.txt');
      fs.writeFileSync(tempFile, '');
      
      try {
        const stream = fs.createReadStream(tempFile);
        const md5sum = await crypto.md5stream(stream);
        expect(md5sum).toBe('1B2M2Y8AsgTpgAmY7PhCfg=='); // MD5 of empty content
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should handle stream errors', async () => {
      const nonExistentFile = path.join(__dirname, 'non-existent-stream.txt');
      const stream = fs.createReadStream(nonExistentFile);
      
      await expect(crypto.md5stream(stream)).rejects.toThrow();
    });

    it('should handle large streams efficiently', async () => {
      // Create a temporary large file (1MB)
      const tempFile = path.join(__dirname, 'temp-large-file.txt');
      const largeContent = 'A'.repeat(1024 * 1024); // 1MB of 'A's
      fs.writeFileSync(tempFile, largeContent);
      
      try {
        const stream = fs.createReadStream(tempFile);
        const streamMd5 = await crypto.md5stream(stream);
        const directMd5 = crypto.md5sum(largeContent);
        
        expect(streamMd5).toBe(directMd5);
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should handle partial stream reading', async () => {
      const tempFile = path.join(__dirname, 'temp-partial-stream.txt');
      const content = 'This is a test file for partial reading';
      fs.writeFileSync(tempFile, content);
      
      try {
        // Read only first 10 bytes
        const stream = fs.createReadStream(tempFile, { start: 0, end: 9 });
        const streamMd5 = await crypto.md5stream(stream);
        const partialContent = content.slice(0, 10);
        const directMd5 = crypto.md5sum(partialContent);
        
        expect(streamMd5).toBe(directMd5);
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle very long strings efficiently', () => {
      const longString = 'x'.repeat(1000000); // 1MB string
      const startTime = Date.now();
      const result = crypto.md5sum(longString);
      const duration = Date.now() - startTime;
      
      expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should produce consistent results', () => {
      const input = 'consistent test input';
      const results = Array.from({ length: 10 }, () => crypto.md5sum(input));
      
      // All results should be identical
      results.forEach(result => {
        expect(result).toBe(results[0]);
      });
    });

    it('should handle different data types correctly', () => {
      const stringInput = 'test';
      const bufferInput = Buffer.from('test', 'utf8');
      
      const stringResult = crypto.md5sum(stringInput);
      const bufferResult = crypto.md5sum(bufferInput);
      
      expect(stringResult).toBe(bufferResult);
    });
  });
});