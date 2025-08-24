/**
 * @file test/types/type-tests.ts
 * @author TypeScript 重构团队
 * @description TypeScript 类型定义测试
 * 
 * 这个文件包含了类型级别的测试，确保我们的类型定义是正确的。
 * 它使用 TypeScript 的类型检查来验证类型兼容性和正确性。
 */

import { expectType, expectNotType, expectAssignable, expectNotAssignable } from 'tsd';

// 导入所有需要测试的类型
import type { 
  BceConfig, 
  BceResponse, 
  Credentials, 
  HttpMethod,
  HttpHeaders,
  Region
} from '../../src/types/common';

import type {
  StorageClass,
  BucketAcl,
  ObjectAcl,
  BosObject,
  ListObjectsResponse,
  PutObjectOptions,
  GetObjectOptions,
  CopyObjectOptions
} from '../../src/bos/types';

import type {
  MediaStatus,
  MediaInfo,
  VodClientConfig
} from '../../src/vod/types';

import type {
  TestConfig,
  ServiceTestConfig,
  TestCase,
  ApiTestCase
} from '../../src/types/test';

// 导入实际的类
import BceBaseClient from '../../src/bce_base_client';
import BosClient from '../../src/bos_client';
import VodClient from '../../src/vod_client';
import BccClient from '../../src/bcc_client';
import CfcClient from '../../src/cfc_client';
import SesClient from '../../src/ses_client';
import OcrClient from '../../src/ocr_client';

// ==================== 基础类型测试 ====================

describe('Basic Types', () => {
  it('should have correct credential types', () => {
    const credentials: Credentials = {
      ak: 'access-key',
      sk: 'secret-key'
    };

    expectType<string>(credentials.ak);
    expectType<string>(credentials.sk);
  });

  it('should have correct BCE config types', () => {
    const config: BceConfig = {
      endpoint: 'https://example.com',
      credentials: {
        ak: 'ak',
        sk: 'sk'
      }
    };

    expectType<string>(config.endpoint);
    expectType<Credentials>(config.credentials);
    expectAssignable<BceConfig>({
      endpoint: 'test',
      credentials: { ak: 'ak', sk: 'sk' },
      region: 'bj',
      protocol: 'https',
      timeout: 5000
    });
  });

  it('should have correct HTTP method types', () => {
    expectAssignable<HttpMethod>('GET');
    expectAssignable<HttpMethod>('POST');
    expectAssignable<HttpMethod>('PUT');
    expectAssignable<HttpMethod>('DELETE');
    expectAssignable<HttpMethod>('HEAD');
    
    // @ts-expect-error - invalid HTTP method
    expectNotAssignable<HttpMethod>('INVALID');
  });

  it('should have correct region types', () => {
    expectAssignable<Region>('bj');
    expectAssignable<Region>('gz');
    expectAssignable<Region>('su');
    expectAssignable<Region>('hk');
    expectAssignable<Region>('fwh');
    expectAssignable<Region>('bd');
    expectAssignable<Region>('fsh');
    
    // @ts-expect-error - invalid region
    expectNotAssignable<Region>('invalid-region');
  });
});

// ==================== BOS 类型测试 ====================

describe('BOS Types', () => {
  it('should have correct storage class enum', () => {
    expectAssignable<StorageClass>(StorageClass.STANDARD);
    expectAssignable<StorageClass>(StorageClass.STANDARD_IA);
    expectAssignable<StorageClass>(StorageClass.ARCHIVE);
    expectAssignable<StorageClass>(StorageClass.COLD);
  });

  it('should have correct ACL types', () => {
    expectAssignable<BucketAcl>(BucketAcl.PRIVATE);
    expectAssignable<BucketAcl>(BucketAcl.PUBLIC_READ);
    expectAssignable<BucketAcl>(BucketAcl.PUBLIC_READ_WRITE);

    expectAssignable<ObjectAcl>(ObjectAcl.PRIVATE);
    expectAssignable<ObjectAcl>(ObjectAcl.PUBLIC_READ);
    expectAssignable<ObjectAcl>(ObjectAcl.PUBLIC_READ_WRITE);
  });

  it('should have correct BOS object structure', () => {
    const bosObject: BosObject = {
      key: 'test-key',
      lastModified: '2024-01-01T00:00:00Z',
      eTag: '"etag"',
      size: 1024,
      storageClass: StorageClass.STANDARD
    };

    expectType<string>(bosObject.key);
    expectType<string>(bosObject.lastModified);
    expectType<string>(bosObject.eTag);
    expectType<number>(bosObject.size);
    expectType<StorageClass>(bosObject.storageClass);
  });

  it('should have correct put object options', () => {
    const options: PutObjectOptions = {
      'Content-Type': 'application/json',
      'Content-Length': 1024,
      'x-bce-object-acl': ObjectAcl.PUBLIC_READ,
      'x-bce-storage-class': StorageClass.STANDARD_IA
    };

    expectType<string | undefined>(options['Content-Type']);
    expectType<number | undefined>(options['Content-Length']);
    expectType<ObjectAcl | undefined>(options['x-bce-object-acl']);
    expectType<StorageClass | undefined>(options['x-bce-storage-class']);
  });

  it('should have correct list objects response', () => {
    const response: ListObjectsResponse = {
      name: 'bucket-name',
      maxKeys: 1000,
      isTruncated: false,
      contents: []
    };

    expectType<string>(response.name);
    expectType<number>(response.maxKeys);
    expectType<boolean>(response.isTruncated);
    expectType<BosObject[]>(response.contents);
  });
});

// ==================== VOD 类型测试 ====================

describe('VOD Types', () => {
  it('should have correct media status enum', () => {
    expectAssignable<MediaStatus>(MediaStatus.RUNNING);
    expectAssignable<MediaStatus>(MediaStatus.PUBLISHED);
    expectAssignable<MediaStatus>(MediaStatus.DISABLED);
    expectAssignable<MediaStatus>(MediaStatus.FAILED);
  });

  it('should have correct media info structure', () => {
    const mediaInfo: MediaInfo = {
      mediaId: 'media-123',
      title: 'Test Media',
      status: MediaStatus.PUBLISHED,
      type: 'video' as any, // Using 'as any' for compatibility
      createTime: '2024-01-01T00:00:00Z',
      updateTime: '2024-01-01T00:00:00Z'
    };

    expectType<string>(mediaInfo.mediaId);
    expectType<string>(mediaInfo.title);
    expectType<MediaStatus>(mediaInfo.status);
  });

  it('should have correct VOD client config', () => {
    const config: VodClientConfig = {
      endpoint: 'https://vod.baidubce.com',
      credentials: {
        ak: 'ak',
        sk: 'sk'
      },
      mode: 'no_transcoding' as any
    };

    expectType<string>(config.endpoint);
    expectType<Credentials>(config.credentials);
  });
});

// ==================== 测试类型测试 ====================

describe('Test Types', () => {
  it('should have correct service test config', () => {
    const serviceConfig: ServiceTestConfig = {
      endpoint: 'https://test.example.com',
      credentials: {
        ak: 'test-ak',
        sk: 'test-sk'
      }
    };

    expectType<string>(serviceConfig.endpoint);
    expectType<{ ak: string; sk: string; }>(serviceConfig.credentials);
  });

  it('should have correct test case structure', () => {
    const testCase: TestCase = {
      name: 'test case',
      description: 'test description',
      skip: false,
      timeout: 5000
    };

    expectType<string>(testCase.name);
    expectType<string | undefined>(testCase.description);
    expectType<boolean | undefined>(testCase.skip);
    expectType<number | undefined>(testCase.timeout);
  });

  it('should have correct API test case structure', () => {
    const apiTest: ApiTestCase = {
      name: 'API test',
      method: 'GET',
      path: '/api/test',
      params: { key: 'value' },
      expectedStatusCode: 200
    };

    expectType<string>(apiTest.name);
    expectType<string>(apiTest.method);
    expectType<string>(apiTest.path);
    expectType<Record<string, any> | undefined>(apiTest.params);
    expectType<number | undefined>(apiTest.expectedStatusCode);
  });
});

// ==================== 客户端类型测试 ====================

describe('Client Types', () => {
  it('should have correct base client inheritance', () => {
    const baseClient = new BceBaseClient({
      endpoint: 'https://example.com',
      credentials: { ak: 'ak', sk: 'sk' }
    }, 'test', false);

    expectType<BceBaseClient>(baseClient);
    expectType<string>(baseClient.getServiceId());
    expectType<boolean>(baseClient.isRegionSupported());
  });

  it('should have correct BOS client methods', () => {
    const bosClient = new BosClient({
      endpoint: 'https://bos.baidubce.com',
      credentials: { ak: 'ak', sk: 'sk' }
    });

    expectType<BosClient>(bosClient);
    
    // Test method signatures
    const listBucketsPromise = bosClient.listBuckets();
    expectType<Promise<BceResponse<any>>>(listBucketsPromise);

    const putObjectPromise = bosClient.putObject('bucket', 'key', 'data');
    expectType<Promise<BceResponse<any>>>(putObjectPromise);
  });

  it('should have correct VOD client methods', () => {
    const vodClient = new VodClient({
      endpoint: 'https://vod.baidubce.com',
      credentials: { ak: 'ak', sk: 'sk' }
    });

    expectType<VodClient>(vodClient);
    
    // Test method signatures would go here
    // expectType<Promise<BceResponse<any>>>(vodClient.someMethod());
  });

  it('should have correct BCC client methods', () => {
    const bccClient = new BccClient({
      endpoint: 'https://bcc.baidubce.com',
      credentials: { ak: 'ak', sk: 'sk' }
    });

    expectType<BccClient>(bccClient);
    
    const listInstancesPromise = bccClient.listInstances();
    expectType<Promise<BceResponse<any>>>(listInstancesPromise);
  });

  it('should have correct CFC client methods', () => {
    const cfcClient = new CfcClient({
      endpoint: 'https://cfc.baidubce.com',
      credentials: { ak: 'ak', sk: 'sk' }
    });

    expectType<CfcClient>(cfcClient);
    
    const listFunctionsPromise = cfcClient.listFunctions();
    expectType<Promise<BceResponse<any>>>(listFunctionsPromise);
  });

  it('should have correct SES client methods', () => {
    const sesClient = new SesClient({
      endpoint: 'https://ses.baidubce.com',
      credentials: { ak: 'ak', sk: 'sk' }
    });

    expectType<SesClient>(sesClient);
    
    const getQuotaPromise = sesClient.getQuota();
    expectType<Promise<BceResponse<any>>>(getQuotaPromise);
  });

  it('should have correct OCR client methods', () => {
    const ocrClient = new OcrClient({
      endpoint: 'https://ocr.baidubce.com',
      credentials: { ak: 'ak', sk: 'sk' }
    });

    expectType<OcrClient>(ocrClient);
    
    const allTextPromise = ocrClient.allText('test-data');
    expectType<Promise<BceResponse<any>>>(allTextPromise);
  });
});

// ==================== 响应类型测试 ====================

describe('Response Types', () => {
  it('should have correct BCE response structure', () => {
    const response: BceResponse<{ test: string }> = {
      body: { test: 'value' },
      http_headers: {
        'content-type': 'application/json',
        'x-bce-request-id': 'request-id'
      },
      metadata: {
        httpStatusCode: 200,
        requestId: 'request-id'
      }
    };

    expectType<{ test: string }>(response.body);
    expectType<Record<string, string>>(response.http_headers);
    expectType<{ httpStatusCode: number; requestId: string }>(response.metadata);
  });

  it('should support generic response types', () => {
    const stringResponse: BceResponse<string> = {
      body: 'test',
      http_headers: {},
      metadata: { httpStatusCode: 200, requestId: 'id' }
    };

    const numberResponse: BceResponse<number> = {
      body: 123,
      http_headers: {},
      metadata: { httpStatusCode: 200, requestId: 'id' }
    };

    expectType<string>(stringResponse.body);
    expectType<number>(numberResponse.body);
  });
});

// ==================== 类型兼容性测试 ====================

describe('Type Compatibility', () => {
  it('should maintain backward compatibility with JavaScript usage', () => {
    // 测试 JavaScript 风格的使用是否仍然兼容
    const config = {
      endpoint: 'https://example.com',
      credentials: {
        ak: 'ak',
        sk: 'sk'
      }
    };

    expectAssignable<BceConfig>(config);
  });

  it('should support optional properties correctly', () => {
    const minimalConfig: BceConfig = {
      endpoint: 'https://example.com',
      credentials: { ak: 'ak', sk: 'sk' }
    };

    const fullConfig: BceConfig = {
      endpoint: 'https://example.com',
      credentials: { ak: 'ak', sk: 'sk' },
      region: 'bj',
      protocol: 'https',
      timeout: 5000,
      sessionToken: 'token'
    };

    expectAssignable<BceConfig>(minimalConfig);
    expectAssignable<BceConfig>(fullConfig);
  });

  it('should handle union types correctly', () => {
    const data: string | Buffer = 'test-string';
    const data2: string | Buffer = Buffer.from('test-buffer');

    expectAssignable<string | Buffer>(data);
    expectAssignable<string | Buffer>(data2);
  });
});