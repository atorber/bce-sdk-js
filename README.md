# Baidu Cloud Engine JavaScript SDK 三方版

[![Build Status](https://travis-ci.org/baidubce/bce-sdk-js.svg?branch=master)](https://travis-ci.org/baidubce/bce-sdk-js)
[![NPM version](https://img.shields.io/npm/v/@baiducloud/sdk.svg?style=flat)](https://www.npmjs.com/package/@baiducloud/sdk)
[![Coverage Status](https://coveralls.io/repos/github/baidubce/bce-sdk-js/badge.svg?branch=master)](https://coveralls.io/github/baidubce/bce-sdk-js?branch=master)

## 🎉 TypeScript 重构完成！

该 SDK 已完成 **TypeScript 重构**，提供完整的类型安全和智能代码补全功能：

- ✅ **100+ TypeScript 接口和枚举**
- ✅ **严格类型检查**，零编译错误
- ✅ **完全向后兼容**，现有 JavaScript 代码无需修改
- ✅ **双包发布**支持（CommonJS + ES Modules）
- ✅ **17/17 兼容性测试**通过

查看详细重构报告：[TYPESCRIPT_MIGRATION.md](./TYPESCRIPT_MIGRATION.md)

文档地址：<https://baidubce.github.io/bce-sdk-js/>

## 通过 NPM 安装

```shell
npm i @atorber/baiducloud-sdk
```

## TypeScript 使用示例

```typescript
import { BosClient, BceConfig, PutObjectOptions, StorageClass } from '@atorber/baiducloud-sdk';

const config: BceConfig = {
  endpoint: 'https://bos.baidubce.com',
  credentials: {
    ak: 'your-access-key',
    sk: 'your-secret-key'
  }
};

const client = new BosClient(config);

// 完整的类型提示和检查
const options: PutObjectOptions = {
  'Content-Type': 'image/jpeg',
  'x-bce-storage-class': StorageClass.STANDARD
};

await client.putObject('bucket-name', 'key', fileData, options);
```

## JavaScript 使用（完全兼容）

```javascript
const { BosClient } = require('@atorber/baiducloud-sdk');

// 现有代码完全兼容，无需修改
const client = new BosClient(config);
await client.putObject('bucket-name', 'key', fileData);
```

## 通过 CDN 引用

`${version}`处使用版本号替换，比如`1.0.0-rc.37`

```html
<script src="https://bce.bdstatic.com/lib/@baiducloud/sdk/${version}/baidubce-sdk.bundle.min.js"></script>
```

## 发布

```bash
# 检查已发布版本号
npm view @baiducloud/sdk versions

# 更新版本号
# <version> -- 指定的版本号
npm version <version> --git-tag-version false

# 编译（注意：pack指令已废弃）
npm run build

git add -u .
git commit -m "bump: <version>"

# 发布测试版本
npm publish --tag beta --registry=https://registry.npmjs.org
# 发布正式版本
npm publish

# 发布到CDN
npm run publish:bos
```

## 更新日志

### 2024-8-24

- ✨ **重大更新：TypeScript 重构完成**
  - 完整的 TypeScript 类型定义（100+ 接口和枚举）
  - 严格类型检查，无编译错误
  - 完全向后兼容，现有 JavaScript 代码无需修改
  - 双包发布支持（CommonJS + ES Modules）
  - 17/17 兼容性测试通过
- 🔧 新增 TypeScript 示例和文档
- ⚙️ 优化构建配置和开发工具链

### 2024-8-31

- 支持AIHC相关API
