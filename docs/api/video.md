# Video API

视频解析和下载相关接口文档,支持多平台视频链接解析。

## 支持的平台

- 斗鱼 (douyu)
- 虎牙 (huya)
- B 站视频 (bilibili)
- B 站直播录像 (bilibiliLive)
- 快手 (kuaishou)

## 解析视频信息

解析视频链接,获取视频标题、分 P、清晰度等信息。

**接口地址:** `POST /video/parse`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| url    | string | 是   | 视频链接 |

**支持的链接格式:**

- 斗鱼: `https://v.douyu.com/show/xxx`
- 虎牙: `https://www.huya.com/video/play/1043151558.html`
- B 站视频: `https://www.bilibili.com/video/BVxxx`
- B 站直播录像: `https://live.bilibili.com/123456`
- 快手: `https://www.kuaishou.com/playback/xxx`

**请求示例:**

```json
{
  "url": "https://www.bilibili.com/video/BV1xx411c7mD"
}
```

**响应示例:**

```json
{
  "videoId": "BV1xx411c7mD",
  "platform": "bilibili",
  "title": "视频标题",
  "resolutions": [
    {
      "value": "highest",
      "label": "最高"
    },
    {
      "value": "80",
      "label": "1080P 高清"
    }
  ],
  "parts": [
    {
      "name": "P1",
      "partId": "123456",
      "isEditing": false,
      "extra": {
        "bvid": "BV1xx411c7mD"
      }
    }
  ]
}
```

**响应字段:**

| 字段名            | 类型    | 说明                      |
| ----------------- | ------- | ------------------------- |
| videoId           | string  | 视频 ID                   |
| platform          | string  | 平台标识                  |
| title             | string  | 视频标题                  |
| resolutions       | array   | 可用清晰度列表            |
| parts             | array   | 视频分 P 列表             |
| parts[].name      | string  | 分 P 名称                 |
| parts[].partId    | string  | 分 P ID                   |
| parts[].isEditing | boolean | 是否正在编辑(预留字段)    |
| parts[].extra     | object  | 额外信息,不同平台内容不同 |

## 下载视频

下载指定的视频到本地。

**接口地址:** `POST /video/download`

**请求参数:**

| 参数名     | 类型    | 必填 | 说明                                   |
| ---------- | ------- | ---- | -------------------------------------- |
| id         | string  | 是   | 视频分 P ID                            |
| platform   | string  | 是   | 平台标识                               |
| savePath   | string  | 是   | 保存路径                               |
| filename   | string  | 是   | 文件名                                 |
| resolution | string  | 否   | 清晰度,默认 "highest"                  |
| danmu      | boolean | 否   | 是否下载弹幕(部分平台支持)             |
| override   | boolean | 否   | 是否覆盖已存在的文件                   |
| onlyAudio  | boolean | 否   | 是否仅下载音频(仅 B 站视频支持)        |
| extra      | object  | 否   | 额外参数,不同平台需要不同的 extra 字段 |

**不同平台的 extra 字段:**

### 斗鱼 (douyu)

```json
{
  "decodeData": "...",
  "user_name": "主播名",
  "room_id": "房间号",
  "room_title": "直播间标题",
  "live_start_time": "2024-01-01T00:00:00.000Z",
  "video_start_time": "2024-01-01T00:00:00.000Z"
}
```

### B 站视频 (bilibili)

```json
{
  "bvid": "BV1xx411c7mD"
}
```

### B 站直播录像 (bilibiliLive)

```json
{
  "liveKey": "123456",
  "startTime": 1704067200,
  "endTime": 1704070800,
  "uid": 123456789
}
```

### 快手 (kuaishou)

```json
{
  "url": "https://xxx.m3u8"
}
```

**请求示例:**

```json
{
  "id": "123456",
  "platform": "bilibili",
  "savePath": "D:/videos",
  "filename": "test.mp4",
  "resolution": "80",
  "danmu": true,
  "override": false,
  "extra": {
    "bvid": "BV1xx411c7mD"
  }
}
```

**响应:** HTTP 200 表示下载任务已开始

## 视频订阅管理

管理视频订阅任务,自动检测并下载新视频。

### 解析订阅信息

解析视频链接以获取可订阅的信息。

**接口地址:** `POST /video/sub/parse`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| url    | string | 是   | 视频链接 |

**请求示例:**

```json
{
  "url": "https://www.bilibili.com/video/BV1xx411c7mD"
}
```

### 添加订阅

添加一个新的视频订阅。

**接口地址:** `POST /video/sub/add`

**请求参数:**

| 参数名   | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| name     | string | 是   | 订阅名称 |
| platform | string | 是   | 平台标识 |
| subId    | string | 是   | 订阅 ID  |

**请求示例:**

```json
{
  "name": "我的订阅",
  "platform": "bilibili",
  "subId": "123456"
}
```

### 删除订阅

删除指定的视频订阅。

**接口地址:** `POST /video/sub/remove`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 订阅 ID |

**请求示例:**

```json
{
  "id": "sub_123"
}
```

### 更新订阅

更新订阅信息。

**接口地址:** `POST /video/sub/update`

**请求参数:**

| 参数名   | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| id       | string | 是   | 订阅 ID  |
| name     | string | 是   | 订阅名称 |
| platform | string | 是   | 平台标识 |
| subId    | string | 是   | 订阅标识 |

**请求示例:**

```json
{
  "id": "sub_123",
  "name": "更新后的名称",
  "platform": "bilibili",
  "subId": "123456"
}
```

### 获取订阅列表

获取所有视频订阅。

**接口地址:** `GET /video/sub/list`

**请求参数:** 无

**响应示例:**

```json
[
  {
    "id": "sub_123",
    "name": "我的订阅",
    "platform": "bilibili",
    "subId": "123456"
  }
]
```

### 检查订阅更新

检查指定订阅是否有新视频。

**接口地址:** `POST /video/sub/check`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 订阅 ID |

**请求示例:**

```json
{
  "id": "sub_123"
}
```

## 错误处理

常见错误响应:

- `url is required`: 缺少 url 参数
- `id is required`: 缺少 id 参数
- `请输入正确的xxx视频链接`: 视频链接格式不正确
- `解析失败`: 无法解析视频信息
- `暂不支持该链接/平台`: 不支持的平台或链接格式
- `无法找到对应的流`: 无法获取视频流地址

::: tip 提示
视频下载为异步操作,调用接口后会立即返回,下载进度需要通过其他方式查询。
:::
