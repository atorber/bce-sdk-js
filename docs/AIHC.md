# AIHC服务

# 资源池
## 资源池详情
### 描述
获取百舸资源池列表的接口

### 请求结构
```bash
GET /api/v1/resourcepools/{resourcePoolId}
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Path参数 | 标识资源池的唯一标识符 |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 是否必须 | 说明 |
| --- | --- | --- | --- |
| requestId | String | 是 | 请求 ID, 用于标识请求的唯一ID |
| result | [ResourcePoolInfoResult](AIHC/API参考/附录.md#ResourcePoolInfoResult) | 是 | 请求返回的结果对象 |


### 返回示例
```json
{
  "requestId": "b2d6ed8e-25b2-40fd-81a1-27239c7dbdfb",
  "result": {
    "resourcePool": {
      "metadata": {
        "createdAt": "2024-06-07T12:07:10Z",
        "name": "baige-pfsl1",
        "id": "cce-9c2b8j9n",
        "updatedAt": "2024-06-19T07:44:07Z"
      },
      "spec": {
        "k8sVersion": "1.20.8",
        "associatedCpromIds": null,
        "associatedPfsId": "pfs-7xWeAt",
        "createdBy": "zhanghuan12",
        "description": "",
        "forbidDelete": true,
        "region": "bj"
      },
      "status": {
        "gpuCount": {
          "total": 16,
          "used": 16
        },
        "nodeCount": {
          "total": 2,
          "used": 2
        },
        "phase": "running"
      }
    }
  }
}
```

## 资源池列表
### 描述
获取指定资源池的详细信息，包括资源池元数据、状态、节点总数、空闲节点数、GPU总数、空闲卡数等

### 请求结构
```plain
GET /api/v1/resourcepools
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| orderBy | String | 否 | Query 参数 | 集群查询排序字段，可选 [clusterName, clusterID, createdAt]，默认值为 clusterAt |
| order | String | 否 | Query 参数 | 排序方式，可选 [asc, desc]，asc 为升序，desc 为降序，默认值为 desc |
| pageNo | Integer | 否 | Query 参数 | 页码，默认值为1 |
| pageSize | Integer | 否 | Query 参数 | 单页结果数，默认值为10 |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 是否必须 | 说明 |
| --- | --- | --- | --- |
| requestId | String | 是 | 请求ID |
| result | [ResourcePoolListResult](AIHC/API参考/附录.md#ResourcePoolListResult) | 是 | 请求成功时的响应结果 |


### 返回示例
```json
{
  "requestId": "120007d6-d64a-4056-be3b-e675527ea1f2",
  "result": {
    "resourcePools": [
      {
        "metadata": {
          "createdAt": "2024-01-24T10:51:44+08:00",
          "name": "demo",
          "id": "cce-xxxxx",
          "updatedAt": "2024-04-18T15:41:21+08:00"
        },
        "spec": {
          "k8sVersion": "1.20.8",
          "associatedCpromIDs": [
            "cprom-u02v1w7bj3j0b"
          ],
          "associatedPfsID": "pfs-pxE6jz",
          "createdBy": "weibingcheng",
          "description": "",
          "forbidDelete": true,
          "region": "bj"
        },
        "status": {
          "gpuCount": {
            "total": 1,
            "used": 0
          },
          "nodeCount": {
            "total": 6,
            "used": 5
          },
          "phase": "running"
        }
      },
      {
        "metadata": {
          "createdAt": "2023-05-27T17:06:38+08:00",
          "name": "aihc-test",
          "uid": "cce-6zwnp4zf",
          "updatedAt": "2024-05-15T19:59:18+08:00"
        },
        "spec": {
          "k8sVersion": "1.22.5",
          "associatedCpromIDs": null,
          "associatedPfsID": "pfs-pxE6jz",
          "createdBy": "",
          "description": "百舸灰度测试集群-don't delete",
          "forbidDelete": true,
          "region": "bj"
        },
        "status": {
          "gpuCount": {
            "total": 4,
            "used": 0
          },
          "nodeCount": {
            "total": 6,
            "used": 5
          },
          "phase": "running"
        }
      }
    ],
    "totalCount": 9
  }
}
```

## 资源池节点列表
### 描述
获取指定资源池列表，及对应节点基本信息、GPU使用量等

### 请求结构
```plain
GET /api/v1/resourcepools/{resourcePoolId}/nodes
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Path参数 | 标识资源池的唯一标识符 |
| result | [ResourcePoolNodeResult](AIHC/API参考/附录.md#ResourcePoolNodeResult) | 是 | 请求成功时的响应结果 |  |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 是否必须 | 说明 |
| --- | --- | --- | --- |
| requestId | String | 是 | 请求ID |
| result | Object | 是 | 请求成功时的响应结果 |
| nodes | Object | 是 | 节点模型 |
| pageNo | Integer | 是 | 页面序号，默认为1 |
| pageSize | Integer | 是 | 单页返回的数量，默认为10 |
| orderBy | String | 是 | 排序字段，默认为createdAt |
| order | String | 是 | 排序方式，desc为逆序，asc为顺序，默认为逆序 |
| total | Number | 是 | 总记录数 |


### 返回示例
```json
{
  "requestId": "822092d2-e4ec-4b29-8015-ad809d660a39",
  "result": {
    "total": 3,
    "nodes": [
      {
        "chargingType": "Postpaid",
        "gpuAllocated": 0,
        "gpuTotal": 0,
        "gpuType": "",
        "instanceID": "cce-gm1vwbke-oi6ymus3",
        "instanceName ": "cce-9iv03gmg-8jmisp2d",
        "intervention": "unintervened",
        "nodeName": "192.168.12.38",
        "statusPhase": "running",
        "zone": "zoneF",
        "region": "bj"
      },
      {
        "chargingType": "Postpaid",
        "gpuAllocated": 0,
        "gpuTotal": 0,
        "gpuType": "",
        "instanceID": "cce-gm1vwbke-nq73ktdc",
        "instanceName ": "cce-gm1vwbke-nq73ktdc",
        "intervention": "tainted",
        "nodeName": "192.168.12.147",
        "statusPhase": "ready_scheduling_disabled",
        "zone": "zoneF",
        "region": "bj"
      },
      {
        "chargingType": "Postpaid",
        "gpuAllocated": 8,
        "gpuTotal": 8,
        "gpuType": "nTeslaA800-80G",
        "instanceID": "cce-gm1vwbke-zb9askrv",
        "instanceName ": "cce-gm1vwbke-zb9askrv",
        "intervention": "unintervened",
        "nodeName": "",
        "statusPhase": "create_failed",
        "zone": "",
        "region": ""
      }
    ]
  }
}
```

## 队列创建
### 描述
创建资源池队列

### 请求结构
```plain
POST /api/v1/resourcepools/{resourcePoolId}/queue
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Path参数 | 标识资源池的唯一标识符 |
| description | String | 否 | RequestBody参数 | 队列描述 |
| name | String | 是 | RequestBody参数 | 队列名称 |
| queueType | String | 否 | RequestBody参数 | 队列类型，当前支持regular |
| parentQueue | String | 否 | RequestBody参数 | 父队列，默认root |
| deserved | Object | 否 | RequestBody参数 | 队列可以申请的资源配额数量，包括共享型与独占型GPU资源配额 |
| guarantee | Object | 否 | RequestBody参数 | 队列预留的资源配额，包含独占型GPU资源配额 |
| capability | Object | 否 | RequestBody参数 | 队列在上线时可用的资源配额，包含独占型、共享型与抢占型GPU资源配额 |
| disableOversell | Boolean | 否 | RequestBody参数 | 超发开关，队列是否允许超发，默认为false |
| reclaimable | Boolean | 否 | RequestBody参数 | 被抢占开关，队列资源是否可被抢占，默认为false |
| nodes | Object | 否 | RequestBody 参数 | 物理队列绑定节点的信息;     注意合法性：NodeNames 数量要小于等于 Nodecount 数量 |
| queueingStrategy | String | 否 | RequestBody 参数 | 调度策略：StrictFIFO（FIFO 策略） or BestEffortFIFO（遍历策略） |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 是否必须 | 说明 |
| --- | --- | --- | --- |
| requestId | String | 是 | 请求ID |
| result | [QueueResult](AIHC/API参考/附录.md#QueueResult) | 是 | 请求成功时的响应结果 |


### 请求示例
```plain
{
  "description": "This is a test queue",
  "deserved": {
    "cpu": 10,
    "gpu": 2,
    "memory": 20
  },
  "name": "demo",
  "parentQueue": "root",
  "queueType": "Regular",
  "disableOversell": false
}
```

### 返回示例
```plain
{
    "result": {
        "queueName": "def1"
    },
    "requestID": "524eef70-c7fc-4b78-84a4-bd949a757be2"
}
```

## 队列列表
### 描述
获取队列列表，包含队列详情

### 请求结构
```plain
GET /api/v1/resourcepools/{resourcePoolId}/queue
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Path参数 | 标识资源池的唯一标识符 |
| orderBy | String | 否 | Query 参数 | 集群查询排序字段，目前仅支持通过创建时间(createdTime)排序 |
| order | String | 否 | Query 参数 | 排序方式，可选 [asc, desc]，asc 为升序，desc 为降序，默认值为 desc |
| pageNo | Integer | 否 | Query 参数 | 页码，默认值为1 |
| pageSize | Integer | 否 | Query 参数 | 单页结果数，默认值为10 |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 是否必须 | 说明 |
| --- | --- | --- | --- |
| requestId | String | 是 | 请求ID |
| result | [QueueListResult](AIHC/API参考/附录.md#QueueListResult) | 是 | 请求成功时的响应结果 |


### 返回示例
```json
{
  "result": {
    "total": 3,
    "queues": [
      {
        "createdTime": "2024-06-05T09:09:32Z",
        "name": "63a9f0ea7bb98050796b649e85481845",
        "nameSpace": "",
        "parentQueue": "63a9f0ea7bb98050796b649e85481845",
        "queueType": "Regular",
        "state": "Open",
        "reclaimable": true,
        "capability": {
          "cce.baidubce.com/eni": "2",
          "cce.baidubce.com/ip": "512",
          "cpu": "136",
          "ephemeral-storage": "392812923001",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          "memory": "573173870592",
          "pods": "512"
        },
        "allocated": {
          "cpu": "0",
          "memory": "0"
        },
        "disableOversell": false
      },
      {
        "createdTime": "2024-06-05T09:09:28Z",
        "name": "default",
        "nameSpace": "",
        "parentQueue": "63a9f0ea7bb98050796b649e85481845",
        "queueType": "Elastic",
        "state": "Open",
        "reclaimable": true,
        "allocated": {
          "cpu": "0",
          "memory": "0"
        },
        "disableOversell": false
      }
    ]
  },
  "requestID": "65b3909e-0711-42f4-b120-e1436e3a1c57"
}
```

## 队列删除
### 描述
删除指定队列

### 请求结构
```plain
DELETE /api/v1/resourcepools/{resourcePoolId}/queue/{queueName}
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Path 参数 | 标识资源池的唯一标识符 |
| queueName | String | 是 | Path 参数 | 特定队列设置的名称 |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 是否必须 | 说明 |
| --- | --- | --- | --- |
| requestID | String | 是 | 请求ID |
| result | [QueueResult](AIHC/API参考/附录.md#QueueResult) | 是 | 请求成功时的响应结果 |


### 返回示例
```json
{
  "result": {
    "queueName": "demo"
  },
  "requestID": "504d5733-c6b1-44fe-8d0a-15eb97388ae4"
}
```

## 队列更新
### 描述
更新队列资源配额、超发、抢占配置

### 请求结构
```plain
PUT /api/v1/resourcepools/{resourcePoolId}/queue/{queueName}
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Path 参数 | 标识资源池的唯一标识符 |
| queueName | String | 是 | Path 参数 | 特定队列设置的名称 |
| description | String | 否 | RequestBody 参数 | 队列描述 |
| queueType | String | 否 | RequestBody 参数 | 队列类型，当前支持regular |
| deserved | Object | 否 | RequestBody 参数 | 队列可以申请的资源配额数量，包括共享型与独占型GPU资源配额 |
| guarantee | Object | 否 | RequestBody 参数 | 队列预留的资源配额，包含独占型GPU资源配额 |
| capability | Object | 否 | RequestBody 参数 | 队列在上线时可用的资源配额，包含独占型、共享型与抢占型GPU资源配额 |
| disableOversell | Boolean | 否 | RequestBody 参数 | 超发开关，队列是否允许超发，默认为false |
| reclaimable | Boolean | 否 | RequestBody 参数 | 被抢占开关，队列资源是否可被抢占，默认为false |
| nodes | Object | 否 | RequestBody 参数 | 物理队列绑定节点的信息,合法性同队列创建 |
| guarantee | Object | 否 | RequestBody 参数 | 队列预留独占型GPU资源配额 |
| queueingStrategy | String | 否 | RequestBody 参数 | 调度策略：StrictFIFO（FIFO 策略） or BestEffortFIFO（遍历策略） |


### 返回头域
除公共头域外，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 是否必须 | 说明 |
| --- | --- | --- | --- |
| requestId | String | 是 | 请求ID |
| result | [QueueResult](AIHC/API参考/附录.md#QueueResult) | 是 | 请求成功时的响应结果 |


### 请求示例
```json
{
  "description": "This is a test",
  "disableOversell": true,
  "guarantee": {
    "cpu": 3,
    "memory": 6
  },
  "deserved": {
    "cpu": 5,
    "memory": 10
  },
  "capability": {
    "cpu": 5,
    "memory": 10
  }
}
```

### 返回示例
```json
{
  "result": {
    "queueName": "demo"
  },
  "requestID": "cf293451-89e0-43e2-a673-dd2d2aa8433a"
}
```

## 队列详情
### 描述
获取指定队列详情，包括队列基本信息以及资源使用量等

### 请求结构
```plain
GET /api/v1/resourcepools/{resourcePoolId}/queue/{queueName}
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Path 参数 | 标识资源池的唯一标识符 |
| queueName | String | 是 | Path 参数 | 特定队列设置的名称 |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 是否必须 | 说明 |
| --- | --- | --- | --- |
| requestId | String | 是 | 请求 ID, 用于标识请求的唯一ID |
| result | [QueueInfoResult](AIHC/API参考/附录.md#QueueInfoResult) | 是 | 请求返回的结果对象 |


### 返回示例
```json
{
  "result": {
    "queue": {
      "createdTime": "2024-07-16T12:27:57Z",
      "description": "This is a test",
      "name": "dddddddd",
      "parentQueue": "63a9f0ea7bb98050796b649e85481845",
      "queueType": "Regular",
      "state": "Open",
      "reclaimable": false,
      "deserved": {
        "cpu": "5",
        "memory": "10"
      },
      "disableOversell": false
    }
  },
  "requestID": "ab78f741-a05a-4346-a8f7-13302b6e6604"
}
```

# 分布式训练
## 创建训练任务
### 描述
创建一个创建任务到集群中运行。可以指定数据源配置、启动命令以及任务运行的每个节点的计算资源配置等信息。

### 请求结构
```plain
POST /api/v1/aijobs
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Query参数 | 标识资源池的唯一标识符 |
| name | String | 是 | Body参数 | 名称 |
| queue | String | 否 | Body参数 | 训练任务所属队列，默认为default队列 |
| jobFramework | String | 否 | Body参数 | 分布式框架，只支持 PyTorchJob，默认值：PyTorchJob |
| jobSpec | [JobSpec](AIHC/API参考/附录.md#JobSpec) | 是 | Body参数 | 训练任务配置 |
| faultTolerance | Boolean | 否 | Body参数 | 是否开启容错， 默认值为 关闭 |
| labels | Array of [Label](AIHC/API参考/附录.md#Label) | 否 | Body参数 | 训练任务标签，默认包含：   1. aijob.cce.baidubce.com/create-from-aihcp-api: "true"   2. aijob.cce.baidubce.com/ai-user-id: {accoutId}   3. aijob.cce.baidubce.com/ai-user-name: {userName} |
| priority | String | 否 | Body参数 | 调度优先级，支持高（high）、中（normal）、低（low），默认值：normal |
| datasources | Array of  [Datasource](AIHC/API参考/附录.md#Datasource) | 否 | Body参数 | 数据源配置，当前支持PFS |
| enableBccl | Boolean | 否 | Body参数 | 是否开启BCCL自动注入，默认值为关闭。当前开启条件:   1.实例数大于等于 2    2.每个实例占整机 8 卡    3.任务开启 RDMA    4.卡型号为A800/HPAS |
| faultToleranceConfig | [faultToleranceConfig](AIHC/API参考/附录.md#faultToleranceConfig) | 否 | Body参数 | 容错高级配置（自定义hang检测） |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 是否必须 | 说明 |
| --- | --- | --- | --- |
| requestId | String | 是 | 请求ID |
| result | [JobResult](AIHC/API参考/附录.md#JobResult) | 是 | 成功请求时的任务信息 |


### 请求示例
```json
{
  "queue": "default",
  "priority": "normal",
  "jobFramework": "PyTorchJob",
  "name": "test-api-llama2-7b-4",
  "jobSpec": {
    "command": "#! /bin/bash\n\nROOT_DIR=/workspace/Megatron-LM/examples\n# 数据集及CHECKPOINT的PATH可按需替换成用户自定义路径\nDATA_PATH=/mnt/cluster/Train/megatron_llama/pile_llama_test/pile-llama_text_document\nCHECKPOINT_LOAD_PATH=/mnt/cluster/Train/megatron_llama2/megatron_llama2_7b_checkpoint_tp1_pp1_dp8_zero1_fp16/\nCHECKPOINT_SAVE_PATH=/mnt/cluster/Train/megatron_llama2/megatron_llama2_7b_checkpoint_tp1_pp1_dp8_zero1_fp16/\nTOKENIZER_PATH=/mnt/cluster/Train/megatron_llama/llama_tokenizer/tokenizer.model\nTENSORBOARD_PATH=/mnt/cluster/test-llama2-7b/ts\n\nGPUS_PER_NODE=8\n\nDISTRIBUTED_ARGS=\"--nproc_per_node $GPUS_PER_NODE --nnodes $WORLD_SIZE --node_rank $RANK --master_addr $MASTER_ADDR --master_port $MASTER_PORT\"\n\nLLAMA2_7B_ARGS=\"--tensor-model-parallel-size 1 \\\n                --pipeline-model-parallel-size 1 \\\n                --num-layers 32 \\\n                --hidden-size 4096 \\\n                --ffn-hidden-size 11008 \\\n                --num-attention-heads 32 \\\n                --micro-batch-size 1 \\\n                --global-batch-size 128 \\\n                --seq-length 4096 \\\n                --max-position-embeddings 4096 \\\n                --lr 0.0003 \\\n                --min-lr 1.0e-5 \\\n                --clip-grad 1.0 \\\n                --weight-decay 1e-2 \\\n                --optimizer adam \\\n                --adam-beta1 0.9 \\\n                --adam-beta2 0.95 \\\n                --adam-eps 1e-05 \\\n                --train-iters 500000 \\\n                --lr-decay-iters 320000 \\\n                --lr-decay-style cosine \\\n                --lr-warmup-fraction .01 \\\n                --no-async-tensor-model-parallel-allreduce \\\n                --tokenizer-type LLaMASentencePieceTokenizer \\\n                --tokenizer-model $TOKENIZER_PATH \\\n                --activation-func swiglu \\\n                --use-rotary-position-embeddings \\\n                --rmsnorm-epsilon 1e-5 \\\n                --no-position-embedding \\\n                --disable-bias-linear \\\n                --attention-dropout 0 \\\n                --hidden-dropout 0 \\\n                --embedding-dropout 0 \\\n                --use-distributed-optimizer \\\n                --untie-embeddings-and-output-weights \\\n                --use-flash-attn \\\n                --initial-loss-scale 16 \\\n                --sequence-parallel \\\n                --fused-rmsnorm \\\n                --fp16\"\n\nOUTPUT_ARGS=\"--log-interval 1 \\\n             --save-interval 50000 \\\n             --eval-interval 1000 \\\n             --eval-iters 10\"\n\nOTHER_ARGS=\"--data-path $DATA_PATH \\\n            --data-impl mmap \\\n            --split 949,50,1 \\\n            --save $CHECKPOINT_SAVE_PATH \\\n            --load $CHECKPOINT_LOAD_PATH \\\n            --tensorboard-dir ${TENSORBOARD_PATH} \\\n            --distributed-backend nccl\"\n\nPYTHONPATH=\"$ROOT_DIR/..\":\"$ROOT_DIR/../megatron/fused_kernels\":$PYTHONPATH \\\n            python -m torch.distributed.launch $DISTRIBUTED_ARGS \\\n            $ROOT_DIR/../pretrain_llama.py \\\n            $LLAMA2_7B_ARGS \\\n            $OUTPUT_ARGS \\\n            $OTHER_ARGS",
    "image": "registry.baidubce.com/aihc-aiak/aiak-megatron:ubuntu20.04-cu11.8-torch1.14.0-py38_v1.2.7.12_release",
    "replicas": 1,
    "resources": [
      {
        "name": "baidu.com/a800_80g_cgpu",
        "quantity": 8
      }
    ],
    "enableRDMA": true,
    "envs": [
      {
        "name": "CUDA_DEVICE_MAX_CONNECTIONS",
        "value": "1"
      }
    ]
  },
  "datasources": [
    {
      "type": "pfs",
      "name": "pfs-7xWeAt",
      "mountPath": "/mnt/cluster"
    }
  ]
}
```

### 返回示例
```json
{
  "requestId": "31a7a2f7-78c1-4169-b150-c888d9f72be8",
  "result": {
    "jobId": "pytorchjob-265e535d-7bec-4b68-88bb-08faa4247504",
    "jobName": "api-create-py-test-2"
  }
}
```

## 查询训练任务列表
### 描述
获取指定资源池的任务列表

+ 支持指定队列查询
+ 支持按时间正序、倒序排序
+ 支持分页

### 请求结构
```plain
GET /api/v1/aijobs
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Query 参数 | 标识资源池的唯一标识符 |
| queue | String | 否 | Query 参数 | 参数为空或为all时，输出全量任务列表，不为空时为指定任务列表，默认输出全部 |
| orderBy | String | 否 | Query 参数 | 排序字段，支持createdAt，finishedAt，默认为createdAt |
| order | String | 否 | Query 参数 | 排序方式，可选 [asc, desc]，asc 为升序，desc 为降序，默认值为 desc |
| pageNo | String | 否 | Query 参数 | 请求分页参数，表示第几页 |
| pageSize | String | 否 | Query 参数 | 单页结果数，默认值为10 |


### 返回头域
除公共头域外，无其他特殊头域。

### 返回参数
| 参数名称 | 类型 | 说明 |
| --- | --- | --- |
| requestId | String | 请求ID，用于标识每个请求的唯一性 |
| result | Array of  [JobListResult](AIHC/API参考/附录.md#JobListResult) | 成功请求时的返回结果 |


### 返回示例
```json
{
    "requestId": "1341d000-533a-4522-b549-3ec24d050cff",
    "result": {
        "total": 9,
        "jobs": [
            {
                "jobId": "mpijob-3f19fcd8-7f6f-40c8-9f36-77d1365c8d15",
                "name": "api-create-mpi-test-2",
                "resourcePoolId": "cce-6zwnp4zf",
                "command": "mpirun -x UCX_NET_DEVICES=mlx5_1:1 -x LD_LIBRARY_PATH -x NCCL_IB_DISABLE=0 -x NCCL_DEBUG=INFO /workspace/nccl-tests/build/all_reduce_perf -b 32M -e 1G -f 2 -g 1 -n 200",
                "createdAt": "2024-07-16T08:33:43Z",
                "finishedAt": "",
                "datasources": [
                    {
                        "type": "emptydir",
                        "mountPath": "/dev/shm",
                        "name": "devshm",
                        "options": {
                            "medium": "Memory",
                            "sizeLimit": 10,
                            "readOnly": false
                        }
                    }
                ],
                "enableFaultTolerance": false,
                "labels": [
                    {
                        "key": "aijob.cce.baidubce.com/openapi-jobid",
                        "value": "mpijob-3f19fcd8-7f6f-40c8-9f36-77d1365c8d15"
                    },
                    {
                        "key": "aijob.cce.baidubce.com/ai-user-id",
                        "value": "d3b41668287b45358a8e6d428da3c824"
                    },
                    {
                        "key": "aijob.cce.baidubce.com/ai-user-name",
                        "value": "zhanghuan12"
                    },
                    {
                        "key": "aijob.cce.baidubce.com/create-from-aihcp",
                        "value": "true"
                    },
                    {
                        "key": "aijob.cce.baidubce.com/create-from-aihcp-api",
                        "value": "true"
                    }
                ],
                "priority": "normal",
                "queue": "default",
                "status": "Created",
                "image": "registry.baidubce.com/cce-ai-native/pytorch:23.10-py3-nccl-tests",
                "resources": [
                    {
                        "name": "cpu",
                        "quantity": 1.1
                    },
                    {
                        "name": "rdma/hca",
                        "quantity": 1
                    },
                    {
                        "name": "baidu.com/a100_80g_cgpu",
                        "quantity": 8
                    }
                ],
                "enableRDMA": true,
                "queueingSequence": 1,
            }
        ],
        "orderBy": "createdAt",
        "order": "desc",
        "pageNo": 1,
        "pageSize": 1
    }
}
```

## 查询训练任务详情
### 描述
获取一个训练任务的详细信息。

### 请求结构
```plain
GET /api/v1/aijobs/{jobId}
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Query 参数 | 标识资源池的唯一标识符 |
| jobId | String | 是 | Path 参数 | 训练任务ID |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 说明 |
| --- | --- | --- |
| requestId | String | 请求ID |
| result | [JobInfoResult](AIHC/API参考/附录.md#JobInfoResult) | 成功请求时的返回结果 |


### 返回示例
```json
{
    "result": {
        "jobId": "pytorchjob-19d38d07-3e04-49ef-8428-d792881fc5fa",
        "name": "job-test-3",
        "resourcePoolId": "cce-6zwnp4zf",
        "command": "python -m torch.distributed.run /workspace/examples/imagenet.py --arch=resnet18 --epochs=100 --batch-size=32 --workers=0 /workspace/data/tiny-imagenet-200",
        "createdAt": "2024-07-16T17:20:04Z",
        "finishedAt": "",
        "datasources": [],
        "enableFaultTolerance": true,
        "labels": [
            {
                "key": "aaaaa",
                "value": "bbbb"
            },
            {
                "key": "aijob.cce.baidubce.com/create-from-aihcp-api",
                "value": "true"
            },
            {
                "key": "aijob.cce.baidubce.com/openapi-jobid",
                "value": "pytorchjob-19d38d07-3e04-49ef-8428-d792881fc5fa"
            }
        ],
        "priority": "normal",
        "queue": "default",
        "status": "Running",
        "image": "registry.baidubce.com/cce-ai-native/cy-pytorch-mnist:etcd",
        "resources": [
            {
                "name": "cpu",
                "quantity": 1
            }
        ],
        "enableRDMA": false,
        "queueingSequence": 1,
        "podList": {
            "listMeta": {
                "totalItems": 1
            },
            "pods": [
                {
                    "PodIP": "10.11.3.106",
                    "nodeName": "192.168.12.46",
                    "objectMeta": {
                        "annotations": {
                            "aijob.cce.baidubce.com/fault-tolerance-enabled": "true",
                            "aijob.cce.baidubce.com/openapi-jobid": "pytorchjob-19d38d07-3e04-49ef-8428-d792881fc5fa",
                            "aijob.cce.baidubce.com/raw-request": "{\"name\":\"job-test-3\",\"namespace\":\"default\",\"queue\":\"default\",\"priority\":\"normal\",\"oversell\":false,\"faultTolerance\":true,\"command\":\"python -m torch.distributed.run /workspace/examples/imagenet.py --arch=resnet18 --epochs=100 --batch-size=32 --workers=0 /workspace/data/tiny-imagenet-200\",\"datasources\":[],\"jobFramework\":\"PyTorchJob\",\"jobDistributed\":false,\"jobSpec\":{\"Master\":{\"replicas\":1,\"restartPolicy\":\"Never\",\"image\":\"registry.baidubce.com/cce-ai-native/cy-pytorch-mnist:etcd\",\"tag\":\"\",\"resource\":{\"cpu\":1},\"env\":{\"AIHC_JOB_NAME\":\"job-test-3\",\"AIHC_TENSORBOARD_LOG_PATH\":\"\",\"LOGLEVEL\":\"DEBUG\",\"NCCL_DEBUG\":\"INFO\"},\"command\":\"python -m torch.distributed.run /workspace/examples/imagenet.py --arch=resnet18 --epochs=100 --batch-size=32 --workers=0 /workspace/data/tiny-imagenet-200\",\"args\":\"\",\"postStart\":\"\",\"preStop\":\"\"}},\"imagePullSecrets\":null,\"imagePullSecretUsername\":\"\",\"imagePullSecretPassword\":\"\",\"labels\":{\"aaaaa\":\"bbbb\",\"aijob.cce.baidubce.com/create-from-aihcp-api\":\"true\"},\"annotations\":null,\"nodeSelector\":null,\"autoCreatePVC\":true,\"hostNetwork\":false,\"isCopyJob\":false,\"sourceJobName\":\"\",\"workloadType\":\"PyTorchJob\",\"pfsId\":\"\"}",
                            "cce-workload-kind": "PyTorchJob",
                            "cce-workload-name": "job-test-3",
                            "prometheus.io/path": "/metrics",
                            "prometheus.io/port": "9101",
                            "prometheus.io/scrape": "true",
                            "scheduling.k8s.io/group-name": "job-test-3",
                            "scheduling.k8s.io/job-enable-oversell": "false",
                            "volcano.sh/task-spec": "master"
                        },
                        "creationTimestamp": "2024-07-16T17:20:04Z",
                        "labels": {
                            "aaaaa": "bbbb",
                            "aijob.cce.baidubce.com/create-from-aihcp-api": "true",
                            "aijob.cce.baidubce.com/openapi-jobid": "pytorchjob-19d38d07-3e04-49ef-8428-d792881fc5fa",
                            "training.kubeflow.org/job-name": "job-test-3",
                            "training.kubeflow.org/job-role": "master",
                            "training.kubeflow.org/operator-name": "pytorchjob-controller",
                            "training.kubeflow.org/replica-index": "0",
                            "training.kubeflow.org/replica-type": "master"
                        },
                        "name": "job-test-3-master-0",
                        "namespace": "default",
                        "ownerReferences": [
                            {
                                "apiVersion": "kubeflow.org/v1",
                                "kind": "PyTorchJob",
                                "name": "job-test-3",
                                "uid": "b3212c83-ca27-4989-a346-bed704eba7eb",
                                "controller": true,
                                "blockOwnerDeletion": true
                            }
                        ]
                    },
                    "podStatus": {
                        "podPhase": "Running",
                        "status": "Running"
                    },
                    "replicaType": "master",
                    "restartCount": 0,
                    "envs": [
                        {
                            "name": "LOGLEVEL",
                            "value": "DEBUG"
                        },
                        {
                            "name": "AIHC_JOB_NAME",
                            "value": "job-test-3"
                        },
                        {
                            "name": "NCCL_DEBUG",
                            "value": "INFO"
                        },
                        {
                            "name": "AIHC_TENSORBOARD_LOG_PATH",
                            "value": ""
                        },
                        {
                            "name": "BCCL_BUS_BW_CALCULATE_MODE",
                            "value": "Agg"
                        },
                        {
                            "name": "BCCL_PROFILING_FILE",
                            "value": "/var/logs/bccl/busbw.cal.%h.%p"
                        },
                        {
                            "name": "BCCL_UNIX_SOCKET_PATH",
                            "value": "/var/logs/bccl"
                        },
                        {
                            "name": "BCCL_TRACE_HANG_SIGNAL",
                            "value": "10"
                        },
                        {
                            "name": "PYTHONUNBUFFERED",
                            "value": "0"
                        },
                        {
                            "name": "MASTER_PORT",
                            "value": "23456"
                        },
                        {
                            "name": "MASTER_ADDR",
                            "value": "job-test-3-master-0"
                        },
                        {
                            "name": "WORLD_SIZE",
                            "value": "1"
                        },
                        {
                            "name": "RANK",
                            "value": "0"
                        },
                        {
                            "name": "NVIDIA_VISIBLE_DEVICES",
                            "value": "void"
                        }
                    ]
                }
            ]
        }
    },
    "requestId": "4a516705-9c97-4e32-9473-c783ec85bec4"
}
```

## 删除训练任务
### 描述
删除一个的任务。

### 请求结构
```plain
DELETE /api/v1/aijobs/{jobId}
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Query参数 | 标识资源池的唯一标识符 |
| jobId | String | 是 | Path 参数 | 训练任务ID |


### 返回头域
除公共头域外，无其他特殊头域。

### 返回参数
| 参数名称 | 类型 | 说明 |
| --- | --- | --- |
| requestId | String | 请求ID |
| result | [JobResult](AIHC/API参考/附录.md#JobResult) | 成功请求时的返回结果 |


### 返回示例
```plain
{
  "requestId": "e17cbc2c-3202-46fa-88ad-a3c86362e764",
  "result": {
    "jobId": "pytorchjob-7f5da650-6d67-4078-9f3c-d1a9cdfcdbe6",
    "jobName": "demo-job"
  }
}
```

## 更新训练任务
### 描述
更新训练任务相关配置，目前仅支持更新任务优先级。

### 请求结构
```plain
PUT /api/v1/aijobs/{jobId}
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Query参数 | 标识资源池的唯一标识符 |
| jobId | String | 是 | Path 参数 | 训练任务ID |
| priority | String | 是 | Body 参数 | 训练任务ID |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 说明 |
| --- | --- | --- |
| result | [JobResult](AIHC/API参考/附录.md#JobResult) | 成功请求时的返回结果 |
| requestId | String | 请求ID，用于标译每个请求的唯一性 |


### 请求示例
```plain
{
  "priority": "normal"
}
```

### 返回示例
```plain
{
  "requestId": "d87a1e37-bfe0-49dc-88b1-79bea8dabcaa",
  "result": {
    "jobId": "pytorchjob-26e495bf-dea8-4178-9034-698d3cee6e50"
  }
}
```

## 查询训练任务事件
### 描述
获取一个任务系统事件。

### 请求结构
```plain
GET /api/v1/aijobs/{jobId}/events
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Query 参数 | 标识资源池的唯一标识符 |
| jobId | String | 是 | Path 参数 | 训练任务ID |
| jobFramework | String | 是 | Query 参数 | 训练任务框架类型，当前支持 "PyTorchJob" |
| startTime | String | 否 | Query 参数 | 获取任务事件的起始时间，默认为任务创建时间 |
| endTime | String | 否 | Query 参数 | 获取任务事件的结束时间，默认为 now |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 说明 |
| --- | --- | --- |
| events | Array of  [Event](AIHC/API参考/附录.md#event) | 事件列表 |
| total | Number | 事件的总数 |


### 返回示例
```json
{
  "events": [
    {
      "reason": "JobTerminated",
      "message": "Job has been terminated. Deleting PodGroup",
      "firstTimestamp": "2024-07-15 16:52:50 +0000 UTC",
      "lastTimestamp": "2024-07-15 16:52:50 +0000 UTC",
      "count": 4,
      "type": "Normal"
    },
    {
      "reason": "SuccessfulDeletePodGroup",
      "message": "Deleted PodGroup: test-api-llama2-7b-4",
      "firstTimestamp": "2024-07-15 16:52:50 +0000 UTC",
      "lastTimestamp": "2024-07-15 16:52:50 +0000 UTC",
      "count": 4,
      "type": "Normal"
    },
    {
      "reason": "ExitedWithCode",
      "message": "Pod: default.test-api-llama2-7b-4-master-0 exited with code 1",
      "firstTimestamp": "2024-07-15 16:52:41 +0000 UTC",
      "lastTimestamp": "2024-07-15 16:52:50 +0000 UTC",
      "count": 2,
      "type": "Normal"
    },
    {
      "reason": "FailedToStartFaultTolerance",
      "message": "Pytorchjob: test-api-llama2-7b-4，  failed to start fault tolerance。Reason：check all nodes are healthy。",
      "firstTimestamp": "2024-07-15 16:52:50 +0000 UTC",
      "lastTimestamp": "2024-07-15 16:52:50 +0000 UTC",
      "count": 1,
      "type": "Warning"
    },
    {
      "reason": "JobFailed",
      "message": "PyTorchJob test-api-llama2-7b-4 is failed because 1 Master replica(s) failed.",
      "firstTimestamp": "2024-07-15 16:52:50 +0000 UTC",
      "lastTimestamp": "2024-07-15 16:52:50 +0000 UTC",
      "count": 1,
      "type": "Normal"
    },
    {
      "reason": "Error",
      "message": "Error pod test-api-llama2-7b-4-master-0 container pytorch exitCode: 1 terminated message: ",
      "firstTimestamp": "2024-07-15 16:52:41 +0000 UTC",
      "lastTimestamp": "2024-07-15 16:52:41 +0000 UTC",
      "count": 1,
      "type": "Warning"
    },
    {
      "reason": "SuccessfulCreateService",
      "message": "Created service: test-api-llama2-7b-4-master-0",
      "firstTimestamp": "2024-07-15 12:47:04 +0000 UTC",
      "lastTimestamp": "2024-07-15 12:47:04 +0000 UTC",
      "count": 1,
      "type": "Normal"
    },
    {
      "reason": "SuccessfulCreatePod",
      "message": "Created pod: test-api-llama2-7b-4-master-0",
      "firstTimestamp": "2024-07-15 12:47:04 +0000 UTC",
      "lastTimestamp": "2024-07-15 12:47:04 +0000 UTC",
      "count": 1,
      "type": "Normal"
    }
  ],
  "total": 8
}
```

## 查询训练任务日志
### 描述
获取一个任务中某个pod的日志。

### 请求结构
```plain
GET /api/v1/aijobs/{jobId}/pods/{podName}/logs
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Query 参数 | 标识资源池的唯一标识符 |
| jobId | String | 是 | Path 参数 | 训练任务ID |
| podName | String | 是 | Path 参数 | 训练任务节点名称 |
| startTime | String | 否 | Query 参数 | 日志的起始时间，unix时间戳；未设置则返回 Pod 从启动以来的所有日志。 |
| maxLines | String | 否 | Query 参数 | 日志的最大行数；未设置则返回 Pod 从启动以来的所有日志。 |
| chunk | String | 否 | Query 参数 | 输出日志按着chunk数进行汇聚，例如将10行日志为1条记录，默认0，表示所有行作为1条记录返回 |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 是否必须 | 说明 |
| --- | --- | --- | --- |
| requestId | String | 是 | 请求ID |
| result | [LogResult](AIHC/API参考/附录.md#LogResult) | 是 | 成功请求时的返回结果 |


### 返回示例
```json
{
  "requestId": "3eef4ea1-974a-4faf-b91a-ecc74dade579",
  "result": {
    "jobId": "pytorch-524a69ac-b272-4427-8288-a161397d2742",
    "podName": "gl2-b5394-xy65-master-0",
    "logs": [
      "/usr/local/lib/python3.8/dist-packages/torch/distributed/launch.py:180: FutureWarning: The module torch.distributed.launch is deprecated\nand will be removed in future. Use torchrun.\nNote that --use_env is set by default in torchrun.\nIf your script expects `--local_rank` argument to be set, please\nchange it to read from `os.environ['LOCAL_RANK']` instead. See \nhttps://pytorch.org/docs/stable/distributed.html#launch-utility for \nfurther instructions\n\n  warnings.warn(\nWARNING:torch.distributed.run:\n*****************************************\nSetting OMP_NUM_THREADS environment variable for each process to be 1 in default, to avoid your system being overloaded, please further tune the variable for optimal performance in your application as needed. \n*****************************************\nusing world size: 16, data-parallel-size: 16, tensor-model-parallel size: 1, pipeline-model-parallel size: 1,\nWARNING: overriding default arguments for tokenizer_type:GalacticaHFTokenizer                        with tokenizer_type:GalacticaHFTokenizer\nusing torch.float16 for parameters ...\n------------------------ arguments ------------------------\n  abort_on_unmet_fused_kernel_constraints ......... False\n"
    ]
  }
}
```

## 查询训练任务Pod事件
### 描述
获取任务某个Pod的系统事件

### 请求结构
```plain
GET /api/v1/aijobs/{jobId}/pods/{podName}/events
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| jobId | String | 是 | Path 参数 | 训练任务ID |
| podName | String | 是 | Path 参数 | 训练任务节点名称 |
| jobFramework | String | 是 | Query 参数 | 训练任务框架类型，当前支持 "PyTorchJob" 和 "MPIJob" |
| resourcePoolId | String | 是 | Query 参数 | 标识资源池的唯一标识符 |
| startTime | String | 否 | Query 参数 | 任务pod事件的起始时间，默认为 Pod 创建时间 |
| endTime | String | 否 | Query 参数 | 任务pod事件的结束时间，默认为 now |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 说明 |
| --- | --- | --- |
| requestId | String | 请求ID |
| result | [PodEventResult](AIHC/API参考/附录.md#PodEventResult) | 成功请求时的返回结果 |


### 返回示例
```json
{
  "events": [
    {
      "reason": "Started",
      "message": "Started container ftagent",
      "firstTimestamp": "2024-07-16 02:36:10 +0000 UTC",
      "lastTimestamp": "2024-07-16 02:36:10 +0000 UTC",
      "count": 1,
      "type": "Normal"
    },
    {
      "reason": "Pulled",
      "message": "Successfully pulled image \"registry.baidubce.com/cce-plugin-pro/ftagent:v1.6.16\" in 83.42021ms",
      "firstTimestamp": "2024-07-16 02:36:10 +0000 UTC",
      "lastTimestamp": "2024-07-16 02:36:10 +0000 UTC",
      "count": 1,
      "type": "Normal"
    },
    {
      "reason": "Started",
      "message": "Started container pytorch",
      "firstTimestamp": "2024-07-16 02:36:10 +0000 UTC",
      "lastTimestamp": "2024-07-16 02:36:10 +0000 UTC",
      "count": 1,
      "type": "Normal"
    },
    {
      "reason": "Created",
      "message": "Created container ftagent",
      "firstTimestamp": "2024-07-16 02:36:10 +0000 UTC",
      "lastTimestamp": "2024-07-16 02:36:10 +0000 UTC",
      "count": 1,
      "type": "Normal"
    },
    {
      "reason": "Pulling",
      "message": "Pulling image \"registry.baidubce.com/cce-plugin-pro/ftagent:v1.6.16\"",
      "firstTimestamp": "2024-07-16 02:36:10 +0000 UTC",
      "lastTimestamp": "2024-07-16 02:36:10 +0000 UTC",
      "count": 1,
      "type": "Normal"
    },
    {
      "reason": "Created",
      "message": "Created container pytorch",
      "firstTimestamp": "2024-07-16 02:36:08 +0000 UTC",
      "lastTimestamp": "2024-07-16 02:36:08 +0000 UTC",
      "count": 1,
      "type": "Normal"
    },
    {
      "reason": "Pulled",
      "message": "Successfully pulled image \"registry.baidubce.com/aihc-aiak/aiak-megatron:ubuntu20.04-cu11.8-torch1.14.0-py38_v1.2.7.12_release\" in 301.668397ms",
      "firstTimestamp": "2024-07-16 02:36:08 +0000 UTC",
      "lastTimestamp": "2024-07-16 02:36:08 +0000 UTC",
      "count": 1,
      "type": "Normal"
    },
    {
      "reason": "Pulling",
      "message": "Pulling image \"registry.baidubce.com/aihc-aiak/aiak-megatron:ubuntu20.04-cu11.8-torch1.14.0-py38_v1.2.7.12_release\"",
      "firstTimestamp": "2024-07-16 02:36:08 +0000 UTC",
      "lastTimestamp": "2024-07-16 02:36:08 +0000 UTC",
      "count": 1,
      "type": "Normal"
    },
    {
      "reason": "Scheduled",
      "message": "Successfully assigned default/test-api-llama2-7b-4-master-0 to 192.168.12.179",
      "firstTimestamp": "2024-07-16 02:36:07 +0000 UTC",
      "lastTimestamp": "2024-07-16 02:36:07 +0000 UTC",
      "count": 1,
      "type": "Normal"
    }
  ],
  "total": 9
}
```

## 停止训练任务
### 描述
停止一个运行中的任务。

### 请求结构
```plain
POST /api/v1/aijobs/{jobId}/stop
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| resourcePoolId | String | 是 | Query 参数 | 标识资源池的唯一标识符 |
| jobId | String | 是 | Path 参数 | 训练任务ID |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 参数名称 | 类型 | 说明 |
| --- | --- | --- |
| requestId | String | 请求ID |
| result | [JobResult](AIHC/API参考/附录.md#JobResult) | 成功请求时的返回结果 |


### 返回示例
```json
{
  "requestId": "3a6f1ab0-8522-45e5-b439-2b5d6da7a2ec",
  "result": {
    "jobId": "pytorchjob-265e535d-7bec-4b68-88bb-08faa4247504"
  }
}
```

## 查询训练任务监控
### 描述
查询指定任务的监控数据的指标类型

### 请求结构
```plain
GET /api/v1/aijobs/{jobId}/metrics
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| jobId | String | 是 | Path 参数 | 训练任务ID |
| resourcePoolId | String | 是 | Query 参数 | 标识资源池的唯一标识符 |
| startTime | String | 否 | Query 参数 | 可选,且默认为最短可能时间 |
| endTime | String | 否 | Query 参数 | 可选,默认为最大可能时间 |
| timeStep | String | 否 | Query 参数 | 返回监控数据的时间间隔，默认值是 5 分钟。 |
| metricType | String | 是 | Query 参数 | 查询监控数据的指标类型，取值如下：   GpuUsage：GPU 使用率。   GpuMemoryUsage：GPU Memory 使用率。   CpuUsage：CPU 使用率。   MemoryUsage：Memory 使用率。   DiskReadRate：磁盘读取速率，单位为 bytes/s。   DiskWriteRate：磁盘写入速率，单位为 bytes/s。   RDMASendDataRate: rdma 发送数据速度，单位为 bytes/s。   RDMARecvDataRate: rdma 接收数据速度，单位为 bytes/s。   PCIESendDataRate: pcie 发送数据速度，单位为 bytes/s。   PCIERecvDataRate: pcie 接收数据速度，单位为 bytes/s。   NVLinkSendDataRate: nvlink 发送数据速度，单位为 bytes/s。   NVLinkRecvDataRate: nvlink 接收数据速度，单位为 bytes/s。   GpuTemperature: gpu 温度。单位为摄氏度。   GpuPowerUsage: gpu 功率。单位为瓦w。   GpuPipeTensorUsage: gpu pipe tensor 使用率。   RDMAHealth: rdma 健康状态。   RDMASendErrorRate: rdma 发送端丢包率，单位为 个/s。   RDMARecvErrorRate: rdma 接收端丢包率，单位为 个/s。   RDMASendPacketsRate: rdma 发包率，单位为 个/s。   RDMARecvPacketsRate: rdma 收包率，单位为 个/s。   CpuTime: cpu 使用量。   MemoryAllocation: mem 使用量，单位为 bytes。 |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 名称 | 类型 | 说明 |
| --- | --- | --- |
| requestId | String | 请求ID |
| result | [MetricsResult](AIHC/API参考/附录.md#MetricsResult) | 返回结果 |


### 返回示例
```json
{
  "requestId": "string",
  "result": {
    "jobId": "string",
    "podMetrics": [
      {
        "podName": "string",
        "metrics": [
          {
            "time": null,
            "value": null
          }
        ]
      }
    ]
  }
}
```

## 查询训练任务所在节点列表
### 描述
查询训练任务所在节点的名称

### 请求结构
```plain
GET /api/v1/aijobs/{jobID}/nodes
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| jobId | String | 是 | Path 参数 | 训练任务ID |
| resourcePoolId | String | 是 | Query 参数 | 标识资源池的唯一标识符 |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 名称 | 类型 | 必选 | 说明 |
| --- | --- | --- | --- |
| requestId | String | 是 | 请求ID |
| result | [NodeResult](AIHC/API参考/附录.md#NodeResult) | 是 | 返回结果 |


### 返回示例
```json
{
  "requestId": "string",
  "result": {
    "jobID": "",
    "nodeName": []
  }
}
```

## 获取训练任务WebTerminal地址
### 描述
获取训练任务中指定容器的web Terminal

### 请求结构
```plain
GET /api/v1/aijobs/{jobId}/pods/{podName}/webterminal
Host:aihc.bj.baidubce.com
Authorization:authorization string
ContentType: application/json    
```

### 请求头域
除公共头域外，无其它特殊头域。

### 请求参数
| 参数名称 | 类型 | 是否必须 | 参数位置 | 说明 |
| --- | --- | --- | --- | --- |
| jobId | String | 是 | Path 参数 | 训练任务ID |
| podName | String | 是 | Path 参数 | 训练任务节点名称 |
| resourcePoolId | String | 是 | Query 参数 | 标识资源池的唯一标识符 |
| handshakeTimeoutSecond | String | 否 | Query 参数 | 连接超时参数，仅在建立连接时使用，单位秒，默认值30，最小值1 |
| pingTimeoutSecond | String | 否 | Query 参数 | 心跳超时参数，单位秒，默认值900，最小值1，最大值3600 |


### 返回头域
除公共头域，无其它特殊头域。

### 返回参数
| 名称 | 类型 | 说明 |
| --- | --- | --- |
| requestId | String | 请求ID |
| result | [WebTerminalResult](AIHC/API参考/附录.md#EebTerminalResult) | 返回结果 |


### 返回示例
```json
{
  "requestId": "2f2d2ab7-2c8e-45fd-a562-8bbded9ef77f",
  "result": {
    "WebTerminalUrl": "wss://cce-webshell-bj.bce.baidu.com/api/v1/containerwebshell/establish/ppsurbh9ro763fmyx1ueaws6une8ek5mg3t3tt268ta8gmayngaf4ziw66fzu10iq1r4clpxuif547ux6p93vt98d0v24e9t5rm29qofxsti41lt1wntydhr7pkx8cyt?handshakeTimeoutSecond=30&pingTimeoutSecond=900"
  }
}
```
