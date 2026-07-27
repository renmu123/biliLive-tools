# Task API

任务管理相关接口文档,用于管理视频处理任务。

## 任务列表

获取所有任务列表,支持按类型、状态筛选以及分页。

**接口地址:** `GET /task`

**请求参数:**

| 参数名   | 类型   | 必填 | 说明                                                                                             |
| -------- | ------ | ---- | ------------------------------------------------------------------------------------------------ |
| type     | string | 否   | 任务类型筛选,可选值: `ffmpeg`、`danmu`、`bili`、`biliUpload`、`biliDownload`、`douyuDownload` 等 |
| status   | string | 否   | 任务状态筛选,例如: `waiting`、`running`、`paused`、`completed`、`error`                          |
| page     | number | 否   | 页码,从 1 开始。不传时默认返回第 1 页                                                            |
| pageSize | number | 否   | 每页条数。不传时默认返回当前筛选结果的全部数据                                                   |

**响应示例:**

```json
{
  "list": [
    {
      "taskId": "task_123",
      "type": "ffmpeg",
      "status": "running",
      "output": "D:/videos/output.mp4"
    }
  ],
  "runningTaskNum": 1,
  "pagination": {
    "total": 12,
    "page": 1,
    "pageSize": 10
  }
}
```

**响应字段:**

| 字段名              | 类型   | 说明                       |
| ------------------- | ------ | -------------------------- |
| list                | array  | 当前页任务列表             |
| runningTaskNum      | number | 当前筛选结果中的运行中数量 |
| pagination          | object | 分页信息                   |
| pagination.total    | number | 当前筛选结果总数           |
| pagination.page     | number | 当前页码                   |
| pagination.pageSize | number | 每页条数                   |

## 查询任务详情

获取指定任务的详细信息。

**接口地址:** `GET /task/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 任务 ID |

## 任务控制

### 暂停任务

暂停正在运行的任务。

**接口地址:** `POST /task/:id/pause`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 任务 ID |

### 恢复任务

恢复已暂停的任务。

**接口地址:** `POST /task/:id/resume`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 任务 ID |

### 终止任务

强制终止任务。

**接口地址:** `POST /task/:id/kill`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 任务 ID |

### 中断任务

中断任务执行。

**接口地址:** `POST /task/:id/interrupt`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 任务 ID |

### 重启任务

重新启动任务。

**接口地址:** `POST /task/:id/restart`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 任务 ID |

### 启动任务

启动待执行的任务。

**接口地址:** `POST /task/:id/start`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 任务 ID |

### 删除任务记录

删除任务记录(不删除文件)。

**接口地址:** `POST /task/:id/removeRecord`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 任务 ID |

### 删除任务文件

删除任务生成的文件。

**接口地址:** `POST /task/:id/removeFile`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 任务 ID |

**限制条件:**

- 任务状态必须是 `completed` 或 `error`
- 任务类型必须是 `ffmpeg`
- 文件必须存在

## 下载任务文件

获取任务生成的文件下载链接。

**接口地址:** `GET /task/:id/download`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 任务 ID |

**限制条件:**

- 任务类型必须是 `ffmpeg`
- 文件必须存在

**响应:** 返回文件 ID,可用于后续下载

## B 站上传相关

### 添加额外视频分 P

为 B 站上传任务添加额外的视频分 P。

**接口地址:** `POST /task/addExtraVideoTask`

**请求参数:**

| 参数名   | 类型   | 必填 | 说明      |
| -------- | ------ | ---- | --------- |
| taskId   | string | 是   | 任务 ID   |
| filePath | string | 是   | 视频路径  |
| partName | string | 是   | 分 P 名称 |

**请求示例:**

```json
{
  "taskId": "task_123",
  "filePath": "D:/videos/part2.mp4",
  "partName": "第二集"
}
```

### 编辑视频分 P 名称

修改视频分 P 的名称。

**接口地址:** `POST /task/editVideoPartName`

**请求参数:**

| 参数名   | 类型   | 必填 | 说明          |
| -------- | ------ | ---- | ------------- |
| taskId   | string | 是   | 任务 ID       |
| partName | string | 是   | 新的分 P 名称 |

**请求示例:**

```json
{
  "taskId": "task_123",
  "partName": "更新后的标题"
}
```

### 查询B站视频审核状态

查询B站视频审核状态

**接口地址:** `POST /task/queryVideoStatus`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| taskId | string | 是   | 任务 ID |

**请求示例:**

```json
{
  "taskId": "task_123"
}
```

**返回示例：**

```json
{
  "state": -50,
  "state_desc": "稿件仅自己可见"
}
```

### 批量删除任务

批量删除多个任务记录。

**接口地址:** `POST /task/removeBatch`

**请求参数:**

| 参数名 | 类型     | 必填 | 说明         |
| ------ | -------- | ---- | ------------ |
| ids    | string[] | 是   | 任务 ID 数组 |

**请求示例:**

```json
{
  "ids": ["task_123", "task_456"]
}
```

## 错误处理

常见错误响应:

- `任务不存在`: 指定的任务 ID 不存在
- `任务状态错误`: 任务状态不允许执行该操作
- `不支持的任务`: 该任务类型不支持当前操作
- `文件不存在`: 任务输出文件不存在
- `file is required`: 缺少必需的 file 参数
- `input and output are required`: 缺少输入或输出参数
- `inputVideos length must be greater than 1`: 合并视频数量不足
- `config is required`: 缺少配置参数
- `invalid mode`: 无效的模式

::: tip 提示
大部分任务是异步执行的,调用接口后会立即返回任务 ID,可以通过查询接口获取任务状态和进度。
:::
