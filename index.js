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
 * @file index.js
 * @author leeight,mudio
 */

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
 * @file index.js
 * @author leeight,mudio
 */

// 检查是否在构建环境中（browserify）
if (typeof process !== 'undefined' && process.env.BROWSERIFY_BUILDING) {
  // 在浏览器构建过程中，直接使用编译后的输出
  module.exports = require('./dist/index.js');
} else {
  // 在 Node.js 环境中，检查编译输出是否存在
  try {
    module.exports = require('./dist/index.js');
  } catch (err) {
    // 如果编译输出不存在，提示用户构建
    console.error('TypeScript 输出文件不存在，请先运行: npm run build:cjs');
    throw err;
  }
}
