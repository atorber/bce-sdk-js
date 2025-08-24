// 注意：使用模拟端点避免在测试中进行实际网络调用
// 实际的网络测试应该在集成测试环境中进行
global.__config__ = {
  bos: {
    endpoint: 'https://mock.example.com', // 使用模拟端点
    bucket: 'mock-test-bucket',
    ak: 'mock-access-key',
    sk: 'mock-secret-key'
  },
  sts: {
    endpoint: 'https://mock-sts.example.com', // 使用模拟端点
    ak: 'mock-access-key',
    sk: 'mock-secret-key'
  }
};
