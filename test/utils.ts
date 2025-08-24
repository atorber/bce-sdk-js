/**
 * @file test/utils.ts
 * @author TypeScript 重构团队
 * @description 测试工具函数库
 */

import * as crypto from 'crypto';
import type { TestUtils, TestValidationFunction, TestCleanupFunction } from '../src/types/test';

/**
 * 测试工具函数类
 */
export class TestUtilsImpl implements TestUtils {
  /**
   * 生成指定长度的随机字符串
   * @param length 字符串长度
   * @returns 随机字符串
   */
  public generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成测试存储桶名称
   * @returns 测试存储桶名称
   */
  public generateTestBucketName(): string {
    const timestamp = Date.now();
    const random = this.generateRandomString(8);
    return `test-bucket-${timestamp}-${random}`.toLowerCase();
  }

  /**
   * 生成测试对象键
   * @returns 测试对象键
   */
  public generateTestObjectKey(): string {
    const timestamp = Date.now();
    const random = this.generateRandomString(8);
    return `test-object-${timestamp}-${random}`;
  }

  /**
   * 创建指定大小的测试文件内容
   * @param size 文件大小（字节）
   * @returns 文件内容 Buffer
   */
  public createTestFile(size: number): Buffer {
    return crypto.randomBytes(size);
  }

  /**
   * 等待指定时间
   * @param ms 等待时间（毫秒）
   * @returns Promise
   */
  public async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * 重试执行函数
   * @param fn 要执行的函数
   * @param maxRetries 最大重试次数
   * @param delay 重试间隔（毫秒）
   * @returns Promise<T>
   */
  public async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries) {
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError!;
  }
}

/**
 * 测试工具实例
 */
export const testUtils = new TestUtilsImpl();

/**
 * 测试断言工具函数
 */
export class TestAssertions {
  /**
   * 断言两个值相等
   * @param actual 实际值
   * @param expected 期望值
   * @param message 错误消息
   */
  public static equal<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${expected}, but got ${actual}`
      );
    }
  }

  /**
   * 断言两个对象深度相等
   * @param actual 实际值
   * @param expected 期望值
   * @param message 错误消息
   */
  public static deepEqual<T>(actual: T, expected: T, message?: string): void {
    const actualStr = JSON.stringify(actual, null, 2);
    const expectedStr = JSON.stringify(expected, null, 2);
    
    if (actualStr !== expectedStr) {
      throw new Error(
        message || `Expected\n${expectedStr}\nbut got\n${actualStr}`
      );
    }
  }

  /**
   * 断言两个值不相等
   * @param actual 实际值
   * @param expected 期望值
   * @param message 错误消息
   */
  public static notEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual === expected) {
      throw new Error(
        message || `Expected values to be different, but both are ${actual}`
      );
    }
  }

  /**
   * 断言值为真
   * @param value 要检查的值
   * @param message 错误消息
   */
  public static ok(value: any, message?: string): void {
    if (!value) {
      throw new Error(
        message || `Expected truthy value, but got ${value}`
      );
    }
  }

  /**
   * 断言函数抛出错误
   * @param fn 要执行的函数
   * @param error 期望的错误类型或消息
   * @param message 断言消息
   */
  public static throws(
    fn: () => void,
    error?: string | RegExp | Function,
    message?: string
  ): void {
    let thrownError: Error | undefined;
    
    try {
      fn();
    } catch (e) {
      thrownError = e as Error;
    }
    
    if (!thrownError) {
      throw new Error(message || 'Expected function to throw an error');
    }
    
    if (error) {
      if (typeof error === 'string') {
        if (!thrownError.message.includes(error)) {
          throw new Error(
            `Expected error message to contain "${error}", but got "${thrownError.message}"`
          );
        }
      } else if (error instanceof RegExp) {
        if (!error.test(thrownError.message)) {
          throw new Error(
            `Expected error message to match ${error}, but got "${thrownError.message}"`
          );
        }
      } else if (typeof error === 'function') {
        if (!(thrownError instanceof error)) {
          throw new Error(
            `Expected error to be instance of ${error.name}, but got ${thrownError.constructor.name}`
          );
        }
      }
    }
  }

  /**
   * 断言 Promise 被拒绝
   * @param promise 要检查的 Promise
   * @param error 期望的错误类型或消息
   * @param message 断言消息
   */
  public static async rejects(
    promise: Promise<any>,
    error?: string | RegExp | Function,
    message?: string
  ): Promise<void> {
    let thrownError: Error | undefined;
    
    try {
      await promise;
    } catch (e) {
      thrownError = e as Error;
    }
    
    if (!thrownError) {
      throw new Error(message || 'Expected promise to be rejected');
    }
    
    if (error) {
      if (typeof error === 'string') {
        if (!thrownError.message.includes(error)) {
          throw new Error(
            `Expected error message to contain "${error}", but got "${thrownError.message}"`
          );
        }
      } else if (error instanceof RegExp) {
        if (!error.test(thrownError.message)) {
          throw new Error(
            `Expected error message to match ${error}, but got "${thrownError.message}"`
          );
        }
      } else if (typeof error === 'function') {
        if (!(thrownError instanceof error)) {
          throw new Error(
            `Expected error to be instance of ${error.name}, but got ${thrownError.constructor.name}`
          );
        }
      }
    }
  }
}

/**
 * 环境变量验证工具
 */
export class EnvironmentValidator {
  /**
   * 验证必需的环境变量是否存在
   * @param requiredVars 必需的环境变量列表
   * @returns 验证结果
   */
  public static validateRequiredVars(requiredVars: string[]): { 
    valid: boolean; 
    missing: string[]; 
  } {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * 获取环境变量，如果不存在则抛出错误
   * @param varName 环境变量名
   * @returns 环境变量值
   */
  public static getRequiredEnvVar(varName: string): string {
    const value = process.env[varName];
    if (!value) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
    return value;
  }
}

/**
 * 测试数据生成器
 */
export class TestDataGenerator {
  /**
   * 生成测试用户信息
   * @returns 用户信息
   */
  public static generateTestUser() {
    return {
      id: testUtils.generateRandomString(32),
      name: `test-user-${testUtils.generateRandomString(8)}`,
      email: `test-${testUtils.generateRandomString(8)}@example.com`
    };
  }

  /**
   * 生成测试文件信息
   * @returns 文件信息
   */
  public static generateTestFileInfo() {
    return {
      name: `test-file-${testUtils.generateRandomString(8)}.txt`,
      size: Math.floor(Math.random() * 1024 * 1024), // 0-1MB
      type: 'text/plain'
    };
  }

  /**
   * 生成测试 API 响应
   * @param data 响应数据
   * @returns API 响应格式
   */
  public static generateApiResponse<T>(data: T) {
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'x-bce-request-id': testUtils.generateRandomString(32)
      },
      body: data
    };
  }
}

/**
 * 测试清理管理器
 */
export class TestCleanupManager {
  private cleanupFunctions: TestCleanupFunction[] = [];

  /**
   * 添加清理函数
   * @param cleanupFn 清理函数
   */
  public addCleanup(cleanupFn: TestCleanupFunction): void {
    this.cleanupFunctions.push(cleanupFn);
  }

  /**
   * 执行所有清理函数
   */
  public async cleanup(): Promise<void> {
    const errors: Error[] = [];
    
    for (const cleanupFn of this.cleanupFunctions.reverse()) {
      try {
        await cleanupFn();
      } catch (error) {
        errors.push(error as Error);
      }
    }
    
    this.cleanupFunctions = [];
    
    if (errors.length > 0) {
      console.warn('Some cleanup functions failed:', errors);
    }
  }
}

/**
 * 性能测试工具
 */
export class PerformanceTestUtils {
  /**
   * 测量函数执行时间
   * @param fn 要测量的函数
   * @returns 执行结果和时间
   */
  public static async measureExecutionTime<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    
    return { result, duration };
  }

  /**
   * 执行压力测试
   * @param fn 要测试的函数
   * @param concurrency 并发数
   * @param totalRequests 总请求数
   * @returns 测试结果
   */
  public static async stressTest<T>(
    fn: () => Promise<T>,
    concurrency: number,
    totalRequests: number
  ): Promise<{
    totalDuration: number;
    averageDuration: number;
    successCount: number;
    failureCount: number;
    errors: Error[];
  }> {
    const startTime = Date.now();
    const errors: Error[] = [];
    let successCount = 0;
    let failureCount = 0;

    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < totalRequests; i++) {
      const promise = fn()
        .then(() => {
          successCount++;
        })
        .catch((error) => {
          failureCount++;
          errors.push(error);
        });
      
      promises.push(promise);
      
      // 控制并发数
      if (promises.length >= concurrency) {
        await Promise.all(promises);
        promises.length = 0;
      }
    }
    
    // 等待剩余的请求完成
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    
    const totalDuration = Date.now() - startTime;
    const averageDuration = totalDuration / totalRequests;
    
    return {
      totalDuration,
      averageDuration,
      successCount,
      failureCount,
      errors
    };
  }
}

// 导出所有工具类
export {
  TestDataGenerator as DataGenerator,
  TestCleanupManager as CleanupManager,
  PerformanceTestUtils as PerformanceUtils,
  EnvironmentValidator as EnvValidator
};