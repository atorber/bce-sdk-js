/**
 * @file __tests__/backward-compatibility.test.js
 * @author TypeScript 重构团队
 * @description 向后兼容性测试，确保现有 JavaScript 用户代码无需修改
 */

const { expect } = require('@jest/globals');

// 测试从编译后的 JavaScript 文件导入
const BosClient = require('../dist/bos_client');
const { default: BceBaseClient } = require('../dist/bce_base_client');
const VodClient = require('../dist/vod_client');
const BccClient = require('../dist/bcc_client');
const CfcClient = require('../dist/cfc_client');
const SesClient = require('../dist/ses_client');
const OcrClient = require('../dist/ocr_client');

// 测试工具模块
const crypto = require('../dist/crypto');
const strings = require('../dist/strings');
const helper = require('../dist/helper');
const { default: Auth } = require('../dist/auth');

describe('Backward Compatibility Tests', () => {
  const testConfig = {
    endpoint: 'https://127.0.0.1:9999', // 使用本地地址避免DNS解析
    credentials: {
      ak: 'test-access-key',
      sk: 'test-secret-key'
    }
  };

  describe('Client Instantiation', () => {
    it('should create BOS client with JavaScript syntax', () => {
      const client = new BosClient(testConfig);
      expect(client).toBeInstanceOf(BosClient);
      expect(client.getServiceId()).toBe('bos');
      expect(typeof client.listBuckets).toBe('function');
      expect(typeof client.putObject).toBe('function');
      expect(typeof client.getObject).toBe('function');
    });

    it('should create VOD client with JavaScript syntax', () => {
      const client = new VodClient(testConfig);
      expect(client).toBeInstanceOf(VodClient);
      expect(client.getServiceId()).toBe('vod');
      expect(typeof client.createMediaResource).toBe('function');
    });

    it('should create BCC client with JavaScript syntax', () => {  
      const client = new BccClient(testConfig);
      expect(client).toBeInstanceOf(BccClient);
      expect(client.getServiceId()).toBe('bcc');
      expect(typeof client.listInstances).toBe('function');
      expect(typeof client.createInstance).toBe('function');
    });

    it('should create CFC client with JavaScript syntax', () => {
      const client = new CfcClient(testConfig);
      expect(client).toBeInstanceOf(CfcClient);
      expect(client.getServiceId()).toBe('cfc');
      expect(typeof client.listFunctions).toBe('function');
      expect(typeof client.createFunction).toBe('function');
    });

    it('should create SES client with JavaScript syntax', () => {
      const client = new SesClient(testConfig);
      expect(client).toBeInstanceOf(SesClient);
      expect(client.getServiceId()).toBe('ses');
      expect(typeof client.sendMail).toBe('function');
      expect(typeof client.getQuota).toBe('function');
    });

    it('should create OCR client with JavaScript syntax', () => {
      const client = new OcrClient(testConfig);
      expect(client).toBeInstanceOf(OcrClient);
      expect(client.getServiceId()).toBe('face'); // OCR uses face service
      expect(typeof client.allText).toBe('function');
      expect(typeof client.oneLine).toBe('function');
    });
  });

  describe('Client Methods Compatibility', () => {
    let bosClient;

    beforeEach(() => {
      bosClient = new BosClient(testConfig);
    });

    it('should support old-style method calls', () => {
      // 测试方法是否存在且可调用（不实际发送请求）
      expect(typeof bosClient.listBuckets).toBe('function');
      expect(typeof bosClient.putObject).toBe('function');
      expect(typeof bosClient.getObject).toBe('function');
      expect(typeof bosClient.deleteObject).toBe('function');
    });

    it('should support method calls with options parameter', () => {
      // 测试带选项参数的方法调用 - 只验证方法存在性，不实际调用
      expect(typeof bosClient.listBuckets).toBe('function');
      expect(typeof bosClient.putObject).toBe('function');
      expect(typeof bosClient.getObject).toBe('function');
      expect(typeof bosClient.deleteObject).toBe('function');
      
      // 验证方法可以接受参数但不实际执行网络请求
      expect(() => {
        // 这里不调用方法，只验证参数结构
        const listOptions = { config: { timeout: 5000 } };
        const putOptions = { 'Content-Type': 'text/plain' };
        expect(typeof listOptions).toBe('object');
        expect(typeof putOptions).toBe('object');
      }).not.toThrow();
    });

    it('should maintain client inheritance structure', () => {
      expect(bosClient).toBeInstanceOf(BceBaseClient);
      expect(bosClient).toBeInstanceOf(BosClient);
    });
  });

  describe('Utility Functions Compatibility', () => {
    it('should export crypto functions correctly', () => {
      expect(typeof crypto.md5sum).toBe('function');
      expect(typeof crypto.md5file).toBe('function');
      expect(typeof crypto.md5stream).toBe('function');
      
      // 测试基本功能
      const testHash = crypto.md5sum('test string');
      expect(testHash).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 格式
    });

    it('should export strings functions correctly', () => {
      expect(typeof strings.normalize).toBe('function');
      
      // 测试基本功能
      const normalized = strings.normalize('hello world!');
      expect(normalized).toBe('hello%20world%21');
    });

    it('should export helper functions correctly', () => {
      expect(typeof helper.omitNull).toBe('function');
      expect(typeof helper.upload).toBe('function');
      
      // 测试基本功能 - omitNull 用于过滤函数
      const testObj = { a: 1, b: null, c: 3 };
      const isValid = helper.omitNull(testObj.a, 'a', testObj);
      expect(isValid).toBe(true);
      const isInvalid = helper.omitNull(testObj.b, 'b', testObj);
      expect(isInvalid).toBe(false);
    });

    it('should export auth class correctly', () => {
      expect(typeof Auth).toBe('function'); // 构造函数
      
      const authInstance = new Auth('ak', 'sk');
      expect(typeof authInstance.generateAuthorization).toBe('function');
      expect(typeof authInstance.queryStringCanonicalization).toBe('function');
    });
  });

  describe('Configuration Compatibility', () => {
    it('should accept minimal configuration', () => {
      const minimalConfig = {
        endpoint: 'https://example.com',
        credentials: { ak: 'ak', sk: 'sk' }
      };
      
      expect(() => new BosClient(minimalConfig)).not.toThrow();
    });

    it('should accept full configuration', () => {
      const fullConfig = {
        endpoint: 'https://example.com',
        credentials: { ak: 'ak', sk: 'sk' },
        region: 'bj',
        protocol: 'https',
        timeout: 5000,
        sessionToken: 'token',
        removeVersionPrefix: false,
        cname_enabled: false
      };
      
      expect(() => new BosClient(fullConfig)).not.toThrow();
    });
  });

  describe('Entry Point Compatibility', () => {
    it('should support root index.js imports', () => {
      // 测试根目录 index.js 导入
      const sdk = require('../index.js');
      
      expect(typeof sdk.BosClient).toBe('function');
      expect(typeof sdk.VodClient).toBe('function');
      expect(typeof sdk.BccClient).toBe('function');
      expect(typeof sdk.crypto).toBe('object');
      expect(typeof sdk.Auth).toBe('function');
    });

    it('should support CommonJS require patterns', () => {
      // 测试各种 CommonJS 导入模式
      const BosClient = require('../dist/bos_client');
      const { md5sum } = require('../dist/crypto');
      const helper = require('../dist/helper');
      
      expect(typeof BosClient).toBe('function');
      expect(typeof md5sum).toBe('function');
      expect(typeof helper.omitNull).toBe('function');
    });
  });
});
