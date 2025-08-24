// Jest 设置文件 - 无网络版本
// 该文件为测试提供模拟配置，确保不会进行任何网络调用

global.__config__ = {
  bos: {
    endpoint: 'https://localhost:9999', // 使用本地地址避免DNS解析
    bucket: 'mock-test-bucket',
    ak: 'mock-access-key',
    sk: 'mock-secret-key'
  },
  sts: {
    endpoint: 'https://localhost:9999', // 使用本地地址避免DNS解析
    ak: 'mock-access-key',
    sk: 'mock-secret-key'
  }
};

// 模拟网络模块以防止实际的网络调用
const mockResponse = {
  statusCode: 200,
  headers: {},
  body: JSON.stringify({ success: true })
};

// 如果有其他模块尝试进行网络调用，会被这些模拟拦截
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ success: true }),
  text: () => Promise.resolve('mock response')
});

console.log('Jest setup (no-network): 已配置模拟网络环境');