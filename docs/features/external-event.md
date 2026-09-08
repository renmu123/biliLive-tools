# 外部事件

此功能可以用于在本系统之外实现更多的自动化

每个事件都会以 HTTP POST 请求（JSON Payload） 的形式发送。

## 结构

| 字段    | 类型   | 说明                 |
| ------- | ------ | -------------------- |
| id      | string | 事件唯一标识（UUID） |
| version | number | 版本，当前为1        |
| time    | string | ISO时间              |
| type    | string | 事件类型             |
| data    | object | 事件相关数据         |

## 任务事件

类型：`task`

包含 ffmpeg、上传、下载、同步等任务生命周期监听。

### 事件模型

`type` 固定为 `task`，在 `event` 中区分具体子事件。

| 字段       | 类型   | 必填 | 说明                                                                          |
| ---------- | ------ | ---- | ----------------------------------------------------------------------------- |
| event      | string | 是   | 子事件类型，见下表                                                            |
| taskId     | string | 是   | 任务 ID                                                                       |
| taskType   | string | 否   | 任务类型（如 `ffmpeg`、`biliUpload`、`biliDownload`、`sync`）                 |
| status     | string | 是   | 当前状态（`pending`、`running`、`paused`、`completed`、`error`、`cancelled`） |
| message    | string | 否   | 进度或状态说明                                                                |
| error      | string | 否   | 错误信息，仅失败事件存在                                                      |
| startedAt  | string | 否   | 开始时间（ISO），已开始任务可带                                               |
| endedAt    | string | 否   | 结束时间（ISO），结束类事件可带                                               |
| durationMs | number | 否   | 运行时长（毫秒），结束类事件可带                                              |
| extra      | object | 否   | 任务扩展字段（透传）                                                          |

建议消费者通过 `taskId` 做幂等去重，通过 `id + version` 做协议兼容。

### 子事件类型

| 类型        | 说明     |
| ----------- | -------- |
| task-start  | 任务开始 |
| task-pause  | 任务暂停 |
| task-resume | 任务恢复 |
| task-end    | 任务完成 |
| task-error  | 任务失败 |
| task-cancel | 任务取消 |

### 示例

任务开始：

```json
{
  "id": "9c8ab2b1-bd9c-4a6c-bd77-5a58ed8f8d84",
  "version": 1,
  "time": "2026-05-27T08:31:22.463Z",
  "type": "task",
  "data": {
    "event": "task-start",
    "taskId": "f4e4d63f-a4e0-4dd6-8f39-8bf6e6f9f6bd",
    "taskType": "ffmpeg",
    "status": "running",
    "startedAt": "2026-05-27T08:31:22.460Z"
  }
}
```

任务失败：

```json
{
  "id": "0e455412-22a2-460f-bb5b-54f5f0f31d95",
  "version": 1,
  "time": "2026-05-27T08:36:41.020Z",
  "type": "task",
  "data": {
    "event": "task-error",
    "taskId": "f4e4d63f-a4e0-4dd6-8f39-8bf6e6f9f6bd",
    "taskType": "ffmpeg",
    "status": "error",
    "error": "ffmpeg exited with code 1",
    "startedAt": "2026-05-27T08:31:22.460Z",
    "endedAt": "2026-05-27T08:36:41.010Z",
    "durationMs": 318550
  }
}
```

任务完成：

```json
{
  "id": "2360d4ca-5239-4860-9f4f-e066aa5f47a8",
  "version": 1,
  "time": "2026-05-27T08:36:41.020Z",
  "type": "task",
  "data": {
    "event": "task-end",
    "taskId": "f4e4d63f-a4e0-4dd6-8f39-8bf6e6f9f6bd",
    "taskType": "ffmpeg",
    "status": "completed",
    "startedAt": "2026-05-27T08:31:22.460Z",
    "endedAt": "2026-05-27T08:36:41.010Z",
    "durationMs": 318550
  }
}
```

## 录制事件

### 录制开始

类型：`record_start`

表示某个录制器开始录制直播。

#### 事件模型

| 字段     | 类型   | 必填 | 说明                             |
| -------- | ------ | ---- | -------------------------------- |
| roomId   | string | 是   | 房间号                           |
| platform | string | 是   | 平台标识，如 `Bilibili`、`DouYu` |
| title    | string | 否   | 当前直播标题                     |
| username | string | 否   | 主播名称                         |
| time     | string | 是   | 录制开始时间（ISO）              |
| liveId   | string | 是   | 录制ID,用于判定是否为同一场直播  |
| avatar   | string | 是   | 头像                             |
| cover    | string | 是   | 直播封面                         |

#### 示例

```json
{
  "id": "fd63e4b2-5669-4b8a-90f4-a93b1b6dcbcc",
  "version": 1,
  "time": "2026-05-27T12:00:00.000Z",
  "type": "live_start",
  "data": {
    "roomId": "123456",
    "platform": "Bilibili",
    "title": "深夜杂谈",
    "username": "主播A",
    "time": "2026-05-27T12:00:00.000Z"
  }
}
```

### 录制结束

类型：`record_end`

表示某个录制器结束录制。该事件关注直播录制状态，不对应具体文件。

#### 事件模型

| 字段     | 类型   | 必填 | 说明                            |
| -------- | ------ | ---- | ------------------------------- |
| roomId   | string | 是   | 房间号                          |
| platform | string | 是   | 平台标识                        |
| title    | string | 否   | 当前或最后一次直播标题          |
| username | string | 否   | 主播名称                        |
| time     | string | 是   | 录制结束时间（ISO）             |
| liveId   | string | 是   | 录制ID,用于判定是否为同一场直播 |
| avatar   | string | 是   | 头像                            |
| cover    | string | 是   | 直播封面                        |

#### 示例

```json
{
  "id": "f91eeb8b-95dd-4b18-936d-c3b7a04f5c3a",
  "version": 1,
  "time": "2026-05-27T15:36:41.020Z",
  "type": "live_end",
  "data": {
    "roomId": "123456",
    "platform": "Bilibili",
    "title": "深夜杂谈",
    "username": "主播A",
    "time": "2026-05-27T15:36:41.020Z"
  }
}
```

### 文件创建

类型：`file_created`

表示录制过程中创建了新的视频文件，通常用于分段录制开始时的通知。

#### 事件模型

| 字段     | 类型   | 必填 | 说明                                     |
| -------- | ------ | ---- | ---------------------------------------- |
| filePath | string | 是   | 视频文件绝对路径，文件创建结束后真实存在 |
| roomId   | string | 是   | 房间号/频道 ID                           |
| platform | string | 是   | 平台标识                                 |

#### 示例

```json
{
  "id": "72a65b40-7b4f-4fd1-b00d-fbca50476fdd",
  "version": 1,
  "time": "2026-05-27T12:03:12.000Z",
  "type": "file_created",
  "data": {
    "filePath": "D:/record/主播A/20260527_120312.flv",
    "roomId": "123456",
    "platform": "Bilibili"
  }
}
```

### 文件创建结束

类型：`file_completed`

表示一个录制文件已经写入完成，适合在自动转码、上传、归档前触发。

#### 事件模型

| 字段     | 类型   | 必填 | 说明                                     |
| -------- | ------ | ---- | ---------------------------------------- |
| filePath | string | 是   | 视频文件绝对路径，文件创建结束后真实存在 |
| roomId   | string | 是   | 房间号/频道 ID                           |
| platform | string | 是   | 平台标识                                 |

#### 示例

```json
{
  "id": "3a81165f-b9d4-4d1b-a9a0-0e59d84b7a74",
  "version": 1,
  "time": "2026-05-27T13:36:41.020Z",
  "type": "file_completed",
  "data": {
    "filePath": "D:/record/主播A/20260527_120312.flv",
    "roomId": "123456",
    "platform": "Bilibili"
  }
}
```
