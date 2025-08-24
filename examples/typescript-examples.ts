/**
 * @file examples/typescript-examples.ts
 * @author TypeScript 重构团队
 * @description TypeScript 使用示例，展示 bce-sdk-js 的 TypeScript 特性
 */

import BosClient from '../src/bos_client';
import VodClient from '../src/vod_client';
import BccClient from '../src/bcc_client';
import CfcClient from '../src/cfc_client';
import SesClient from '../src/ses_client';
import OcrClient from '../src/ocr_client';

// 导入类型定义
import type { 
  BceConfig, 
  BceResponse 
} from '../src/types/common';

import {
  StorageClass,
  ObjectAcl
} from '../src/bos/types';

import type {
  BucketAcl,
  ListObjectsResponse,
  PutObjectOptions,
  BosObject
} from '../src/bos/types';

import {
  InstanceType,
  CreateInstanceOptions,
  ListInstancesResponse
} from '../src/bcc_client';

import {
  Runtime,
  CreateFunctionOptions,
  InvocationResult
} from '../src/cfc_client';

import type {
  SendMailOptions
} from '../src/ses_client';

import {
  OcrLanguage
} from '../src/ocr_client';

// ==================== 基础配置示例 ====================

/**
 * 基础 BCE 配置示例
 * TypeScript 提供完整的类型提示和检查
 */
const bceConfig: BceConfig = {
  endpoint: 'https://bos.baidubce.com',
  credentials: {
    ak: process.env.BCE_ACCESS_KEY || 'your-access-key',
    sk: process.env.BCE_SECRET_KEY || 'your-secret-key'
  },
  region: 'bj', // TypeScript 会提示可用的区域
  protocol: 'https', // TypeScript 会限制为 'http' | 'https'
  timeout: 30000
};

// ==================== BOS 客户端使用示例 ====================

/**
 * BOS 存储服务使用示例
 * 展示完整的类型安全和智能提示
 */
class BosExample {
  private bosClient: BosClient;

  constructor(config: BceConfig) {
    this.bosClient = new BosClient(config);
  }

  /**
   * 列举存储桶示例
   * 返回类型自动推断为 Promise<BceResponse<any>>
   */
  async listBuckets(): Promise<BceResponse<any>> {
    try {
      const response = await this.bosClient.listBuckets();
      console.log('存储桶列表:', response.body);
      return response;
    } catch (error) {
      console.error('列举存储桶失败:', error);
      throw error;
    }
  }

  /**
   * 列举对象示例
   * 使用类型化的选项参数
   */
  async listObjects(bucketName: string): Promise<BceResponse<ListObjectsResponse>> {
    const options = {
      maxKeys: 100,
      prefix: 'test/', // 可选的前缀过滤
      delimiter: '/'    // 可选的分隔符
    };

    const response = await this.bosClient.listObjects(bucketName, options);
    
    // TypeScript 知道 response.body 的确切结构
    const objects: BosObject[] = response.body.contents;
    
    objects.forEach((obj: BosObject) => {
      console.log(`对象: ${obj.key}, 大小: ${obj.size}, 存储类型: ${obj.storageClass}`);
    });

    return response;
  }

  /**
   * 上传对象示例
   * 使用强类型的选项参数
   */
  async uploadObject(
    bucketName: string, 
    objectKey: string, 
    data: string | Buffer
  ): Promise<BceResponse<any>> {
    // TypeScript 提供完整的选项类型提示
    const options: PutObjectOptions = {
      'Content-Type': 'text/plain',
      'x-bce-object-acl': ObjectAcl.PUBLIC_READ, // 枚举类型提供智能补全
      'x-bce-storage-class': StorageClass.STANDARD, // 枚举类型提供智能补全
      'x-bce-forbid-overwrite': 'true' // TypeScript 确保值类型正确
    };

    return await this.bosClient.putObject(bucketName, objectKey, data, options);
  }

  /**
   * 批量操作示例
   * 展示类型化的批量处理
   */
  async batchUpload(
    bucketName: string, 
    files: Array<{ key: string; data: string | Buffer; contentType?: string }>
  ): Promise<BceResponse<any>[]> {
    const uploadPromises = files.map(file => {
      const options: PutObjectOptions = {
        'Content-Type': file.contentType || 'application/octet-stream'
      };
      
      return this.bosClient.putObject(bucketName, file.key, file.data, options);
    });

    return Promise.all(uploadPromises);
  }
}

// ==================== BCC 云服务器使用示例 ====================

/**
 * BCC 云服务器使用示例
 */
class BccExample {
  private bccClient: BccClient;

  constructor(config: BceConfig) {
    this.bccClient = new BccClient(config);
  }

  /**
   * 创建实例示例
   * 使用强类型的实例配置
   */
  async createInstance(): Promise<BceResponse<any>> {
    const instanceConfig: CreateInstanceOptions = {
      instanceType: InstanceType.SMALL, // 枚举提供类型安全
      imageId: 'image-12345',
      name: 'my-test-instance',
      purchaseCount: 1
    };

    return await this.bccClient.createInstance(instanceConfig);
  }

  /**
   * 列举实例示例
   */
  async listInstances(): Promise<BceResponse<ListInstancesResponse>> {
    const response = await this.bccClient.listInstances({
      maxKeys: 50
    });

    // TypeScript 提供完整的响应体类型
    response.body.instances.forEach(instance => {
      console.log(`实例 ${instance.instanceId}: ${instance.status}`);
    });

    return response;
  }
}

// ==================== CFC 函数计算使用示例 ====================

/**
 * CFC 函数计算使用示例
 */
class CfcExample {
  private cfcClient: CfcClient;

  constructor(config: BceConfig) {
    this.cfcClient = new CfcClient(config);
  }

  /**
   * 创建函数示例
   */
  async createFunction(): Promise<BceResponse<any>> {
    const functionConfig: CreateFunctionOptions = {
      FunctionName: 'my-test-function',
      Runtime: Runtime.NODEJS_12_13, // 枚举提供运行时选项
      Handler: 'index.handler',
      Description: 'TypeScript 示例函数',
      MemorySize: 256,
      Timeout: 30,
      Code: {
        ZipFile: 'base64-encoded-zip-content'
      }
    };

    return await this.cfcClient.createFunction(functionConfig);
  }

  /**
   * 调用函数示例
   */
  async invokeFunction(functionName: string, payload: any): Promise<BceResponse<InvocationResult>> {
    return await this.cfcClient.invoke(functionName, payload, {
      logType: 'Tail' as any // 请求日志
    });
  }
}

// ==================== SES 邮件服务使用示例 ====================

/**
 * SES 简单邮件服务使用示例
 */
class SesExample {
  private sesClient: SesClient;

  constructor(config: BceConfig) {
    this.sesClient = new SesClient(config);
  }

  /**
   * 发送邮件示例
   * 使用类型化的邮件选项
   */
  async sendEmail(): Promise<BceResponse<any>> {
    const mailOptions: SendMailOptions = {
      from: 'noreply@example.com',
      to: ['user1@example.com', 'user2@example.com'], // 支持数组类型
      cc: 'manager@example.com',
      subject: 'TypeScript SDK 测试邮件',
      text: '这是一封使用 TypeScript SDK 发送的测试邮件',
      html: '<h1>TypeScript SDK</h1><p>测试邮件内容</p>'
    };

    return await this.sesClient.sendMail(mailOptions);
  }
}

// ==================== OCR 识别服务使用示例 ====================

/**
 * OCR 光学字符识别使用示例
 */
class OcrExample {
  private ocrClient: OcrClient;

  constructor(config: BceConfig) {
    this.ocrClient = new OcrClient(config);
  }

  /**
   * 文本识别示例
   */
  async recognizeText(imageData: Buffer): Promise<BceResponse<any>> {
    return await this.ocrClient.allText(
      imageData, 
      OcrLanguage.CHINESE // 枚举提供语言选项
    );
  }
}

// ==================== 综合使用示例 ====================

/**
 * 综合使用示例
 * 展示多个服务的协同使用
 */
class ComprehensiveExample {
  private bosClient: BosClient;
  private sesClient: SesClient;
  private ocrClient: OcrClient;

  constructor(config: BceConfig) {
    this.bosClient = new BosClient(config);
    this.sesClient = new SesClient(config);
    this.ocrClient = new OcrClient(config);
  }

  /**
   * 图片处理工作流示例
   * 1. 从 BOS 下载图片
   * 2. 使用 OCR 识别文字
   * 3. 通过邮件发送结果
   */
  async processImageWorkflow(
    bucketName: string, 
    imageKey: string, 
    notifyEmail: string
  ): Promise<void> {
    try {
      // 1. 从 BOS 下载图片
      console.log('正在下载图片...');
      const imageResponse = await this.bosClient.getObject(bucketName, imageKey);
      const imageData = imageResponse.body as unknown as Buffer;

      // 2. OCR 文字识别
      console.log('正在进行 OCR 识别...');
      const ocrResponse = await this.ocrClient.allText(imageData, OcrLanguage.CHINESE);
      const recognizedText = ocrResponse.body.words_result
        .map((item: any) => item.words)
        .join('\n');

      // 3. 发送邮件通知
      console.log('正在发送邮件通知...');
      await this.sesClient.sendMail({
        from: 'noreply@example.com',
        to: notifyEmail,
        subject: `图片 ${imageKey} 的 OCR 识别结果`,
        text: `识别到的文字内容：\n\n${recognizedText}`,
        html: `<h2>图片 OCR 识别结果</h2>
               <p><strong>图片:</strong> ${imageKey}</p>
               <h3>识别内容:</h3>
               <pre>${recognizedText}</pre>`
      });

      console.log('工作流处理完成!');
    } catch (error) {
      console.error('工作流处理失败:', error);
      
      // 发送错误通知邮件
      await this.sesClient.sendMail({
        from: 'noreply@example.com',
        to: notifyEmail,
        subject: '图片处理失败通知',
        text: `图片 ${imageKey} 处理过程中发生错误: ${error}`
      });
      
      throw error;
    }
  }
}

// ==================== 高级类型使用示例 ====================

/**
 * 接口扩展示例
 */
interface CustomBosOptions {
  /** 自定义元数据 */
  customMetadata?: Record<string, string>;
  /** 重试次数 */
  retryCount?: number;
  /** 基础 BOS 选项 */
  bosOptions?: PutObjectOptions;
}

/**
 * 高级 TypeScript 特性使用示例
 */
class AdvancedTypeExample {
  /**
   * 泛型方法示例
   * 展示如何使用泛型处理不同类型的响应
   */
  async processResponse<T>(
    client: BosClient,
    operation: () => Promise<BceResponse<T>>
  ): Promise<T> {
    try {
      const response = await operation();
      
      // TypeScript 知道 response.body 的类型是 T
      return response.body;
    } catch (error) {
      console.error('操作失败:', error);
      throw error;
    }
  }

  /**
   * 联合类型使用示例
   */
  async uploadData(
    client: BosClient,
    bucketName: string,
    key: string,
    data: string | Buffer | Blob // 联合类型
  ): Promise<void> {
    let contentType: string;
    let uploadData: string | Buffer;
    
    // TypeScript 类型守卫
    if (typeof data === 'string') {
      contentType = 'text/plain';
      uploadData = data;
    } else if (Buffer.isBuffer(data)) {
      contentType = 'application/octet-stream';
      uploadData = data;
    } else if (data instanceof Blob) {
      contentType = data.type || 'application/octet-stream';
      // 将 Blob 转换为 Buffer
      uploadData = Buffer.from(await data.arrayBuffer());
    } else {
      throw new Error('不支持的数据类型');
    }

    await client.putObject(bucketName, key, uploadData, {
      'Content-Type': contentType
    });
  }

  async uploadWithCustomOptions(
    client: BosClient,
    bucketName: string,
    key: string,
    data: string | Buffer,
    options: CustomBosOptions
  ): Promise<BceResponse<any>> {
    // 将自定义元数据转换为 BOS 元数据格式
    const bosOptions: PutObjectOptions = { ...options.bosOptions };
    
    if (options.customMetadata) {
      Object.entries(options.customMetadata).forEach(([key, value]) => {
        bosOptions[`x-bce-meta-${key}`] = value;
      });
    }

    return await client.putObject(bucketName, key, data, bosOptions);
  }
}

// ==================== 实际使用示例 ====================

/**
 * 实际使用示例
 * 演示如何在真实项目中使用 TypeScript SDK
 */
async function main() {
  // 初始化配置
  const config: BceConfig = {
    endpoint: 'https://bos.baidubce.com',
    credentials: {
      ak: process.env.BCE_ACCESS_KEY!,
      sk: process.env.BCE_SECRET_KEY!
    },
    region: 'bj'
  };

  // 创建客户端实例
  const bosExample = new BosExample(config);
  const bccExample = new BccExample(config);
  const cfcExample = new CfcExample(config);

  try {
    // 使用 BOS 服务
    console.log('=== BOS 服务示例 ===');
    await bosExample.listBuckets();
    await bosExample.uploadObject('my-bucket', 'test.txt', 'Hello TypeScript!');

    // 使用 BCC 服务
    console.log('=== BCC 服务示例 ===');
    await bccExample.listInstances();

    // 使用 CFC 服务
    console.log('=== CFC 服务示例 ===');
    await cfcExample.createFunction();

  } catch (error) {
    console.error('示例执行出错:', error);
  }
}

// 导出示例类供其他模块使用
export {
  BosExample,
  BccExample,
  CfcExample,
  SesExample,
  OcrExample,
  ComprehensiveExample,
  AdvancedTypeExample
};

// 如果直接运行此文件则执行主函数
if (require.main === module) {
  main().catch(console.error);
}