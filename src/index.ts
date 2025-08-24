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
 * @file src/index.ts
 * @author leeight,mudio
 */

import * as q from 'q';
import * as crypto from './crypto';
import * as strings from './strings';
import STS from './sts';
import Auth from './auth';
import MimeType from './mime.types';
import * as Base64 from './base64';

import HttpClient from './http_client';
import BceBaseClient from './bce_base_client';

import BosClient from './bos_client';
import BcsClient from './bcs_client';
import BccClient from './bcc_client';
import SesClient from './ses_client';
import QnsClient from './qns_client';
import LssClient from './lss_client';
import MctClient from './mct_client';
import FaceClient from './face_client';
import OCRClient from './ocr_client';
import MediaClient from './media_client';
import VodClient from './vod_client';
import DocClient from './doc_client';
import TsdbDataClient from './tsdb_data_client';
import TsdbAdminClient from './tsdb_admin_client';
import CfcClient from './cfc_client';
import IoTClient from './iot_client';
import AihcClient from './aihc_client';

// 获取版本信息
const packageJson = require('../package.json');

// CommonJS 兼容导出
export const Q = q;
export const version = packageJson.version;
export { crypto };
export { strings };
export { STS };
export { Auth };
export { MimeType };
export { Base64 };

export { HttpClient };
export { BceBaseClient };

export { BosClient };
export { BcsClient };
export { BccClient };
export { SesClient };
export { QnsClient };
export { LssClient };
export { MctClient };
export { FaceClient };
export { OCRClient };
export { MediaClient };
export { VodClient };
export { DocClient };
export { TsdbDataClient };
export { TsdbAdminClient };
export { CfcClient };
export { IoTClient };
export { AihcClient };

// 默认导出（主要用于 ES Module 用户）
export default {
  Q,
  version,
  crypto,
  strings,
  STS,
  Auth,
  MimeType,
  Base64,
  HttpClient,
  BceBaseClient,
  BosClient,
  BcsClient,
  BccClient,
  SesClient,
  QnsClient,
  LssClient,
  MctClient,
  FaceClient,
  OCRClient,
  MediaClient,
  VodClient,
  DocClient,
  TsdbDataClient,
  TsdbAdminClient,
  CfcClient,
  IoTClient,
  AihcClient
};

// 类型导出
export * from './types/common';
export * from './bos/types';
export * from './vod/types';