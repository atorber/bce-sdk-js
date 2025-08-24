import type {Config} from '@jest/types';
import {defaults} from 'jest-config';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: {
    name: '@baiducloud/sdk (No Network)',
    color: 'yellowBright'
  },
  verbose: true,
  testMatch: ['**/__tests__/**/(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: [...defaults.testPathIgnorePatterns, '/test/'],
  moduleFileExtensions: ['js', 'ts'],
  setupFiles: ['./__tests__/jest.setup.no-network.js'],
  // 禁用网络相关的测试
  testNamePattern: '^(?!.*Network Tests)',
  // 模拟网络模块
  moduleNameMapping: {
    '^http$': '<rootDir>/__tests__/mocks/http.js',
    '^https$': '<rootDir>/__tests__/mocks/https.js'
  }
};

export default config;