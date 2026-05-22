**剩余的自己抓去吧**

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

## 视频处理

### 读取视频元数据

读取视频文件的元数据信息。

**接口地址:** `POST /task/videoMeta`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明         |
| ------ | ------ | ---- | ------------ |
| file   | string | 是   | 视频文件路径 |

**请求示例:**

```json
{
  "file": "D:/videos/test.mp4"
}
```

### 检查视频合并兼容性

检查多个视频是否可以直接合并。

**接口地址:** `POST /task/checkMergeVideos`

**请求参数:**

| 参数名      | 类型     | 必填 | 说明             |
| ----------- | -------- | ---- | ---------------- |
| inputVideos | string[] | 是   | 视频文件路径数组 |

**请求示例:**

```json
{
  "inputVideos": ["D:/videos/part1.mp4", "D:/videos/part2.mp4"]
}
```

### 合并视频

合并多个视频文件。

**接口地址:** `POST /task/mergeVideo`

**请求参数:**

| 参数名      | 类型     | 必填 | 说明             |
| ----------- | -------- | ---- | ---------------- |
| inputVideos | string[] | 是   | 视频文件路径数组 |
| options     | object   | 是   | 合并选项         |

**options 字段:**

| 参数名             | 类型    | 必填 | 说明                       |
| ------------------ | ------- | ---- | -------------------------- |
| output             | string  | 否   | 输出文件路径               |
| saveOriginPath     | boolean | 是   | 是否保存到原始路径         |
| keepFirstVideoMeta | boolean | 是   | 是否保留第一个视频的元数据 |

**请求示例:**

```json
{
  "inputVideos": ["D:/videos/part1.mp4", "D:/videos/part2.mp4"],
  "options": {
    "output": "D:/videos/merged.mp4",
    "saveOriginPath": false,
    "keepFirstVideoMeta": true
  }
}
```

**响应示例:**

```json
{
  "taskId": "task_123"
}
```

### 视频转码

对视频进行转码处理。

**接口地址:** `POST /task/transcode`

**请求参数:**

| 参数名        | 类型   | 必填 | 说明         |
| ------------- | ------ | ---- | ------------ |
| input         | string | 是   | 输入文件路径 |
| outputName    | string | 是   | 输出文件名   |
| ffmpegOptions | object | 是   | FFmpeg 选项  |
| options       | object | 是   | 转码选项     |

**options 字段:**

| 参数名       | 类型    | 必填 | 说明                                             |
| ------------ | ------- | ---- | ------------------------------------------------ |
| override     | boolean | 否   | 是否覆盖已存在的文件                             |
| removeOrigin | boolean | 否   | 是否删除原始文件                                 |
| savePath     | string  | 否   | 保存路径(支持绝对路径和相对路径)                 |
| saveType     | 1 \| 2  | 是   | 保存类型: 1-保存到原始文件夹, 2-保存到特定文件夹 |

**请求示例:**

```json
{
  "input": "D:/videos/input.mp4",
  "outputName": "output.mp4",
  "ffmpegOptions": {
    "codec": "h264"
  },
  "options": {
    "saveType": 1,
    "override": false
  }
}
```

### 视频切片

对视频进行切片处理。

**接口地址:** `POST /task/cut`

**请求参数:**

| 参数名        | 类型   | 必填 | 说明        |
| ------------- | ------ | ---- | ----------- |
| files         | object | 是   | 文件信息    |
| output        | string | 是   | 输出路径    |
| options       | object | 是   | 切片选项    |
| ffmpegOptions | object | 是   | FFmpeg 选项 |

**请求示例:**

```json
{
  "files": {
    "videoPath": "D:/videos/input.mp4",
    "startTime": 0,
    "endTime": 60
  },
  "output": "D:/videos/output.mp4",
  "options": {},
  "ffmpegOptions": {}
}
```

### 字幕烧录

将字幕烧录到视频中。

**接口地址:** `POST /task/burn`

**请求参数:**

| 参数名  | 类型   | 必填 | 说明         |
| ------- | ------ | ---- | ------------ |
| files   | object | 是   | 文件信息     |
| output  | string | 是   | 输出文件路径 |
| options | object | 是   | 烧录选项     |

**options 支持上传选项:**

| 参数名        | 类型   | 必填 | 说明         |
| ------------- | ------ | ---- | ------------ |
| uploadOptions | object | 否   | B 站上传选项 |

**uploadOptions 字段:**

| 参数名 | 类型    | 必填 | 说明                    |
| ------ | ------- | ---- | ----------------------- |
| upload | boolean | 是   | 是否上传                |
| uid    | number  | 否   | B 站用户 UID            |
| aid    | number  | 否   | 稿件 ID(编辑稿件时使用) |
| config | object  | 是   | 上传配置                |

**请求示例:**

```json
{
  "files": {
    "videoPath": "D:/videos/input.mp4",
    "danmuPath": "D:/videos/danmu.ass"
  },
  "output": "D:/videos/output.mp4",
  "options": {
    "uploadOptions": {
      "upload": true,
      "uid": 123456789,
      "config": {}
    }
  }
}
```

### FLV 修复

修复损坏的 FLV 文件。

**接口地址:** `POST /task/flvRepair`

**请求参数:**

| 参数名  | 类型   | 必填 | 说明         |
| ------- | ------ | ---- | ------------ |
| input   | string | 是   | 输入文件路径 |
| output  | string | 是   | 输出文件路径 |
| options | object | 否   | 修复选项     |

**请求示例:**

```json
{
  "input": "D:/videos/broken.flv",
  "output": "D:/videos/repaired.flv",
  "options": {}
}
```

## 弹幕处理

### XML 弹幕转 ASS

将 XML 格式的弹幕转换为 ASS 字幕文件。

**接口地址:** `POST /task/convertXml2Ass`

**请求参数:**

| 参数名  | 类型   | 必填 | 说明          |
| ------- | ------ | ---- | ------------- |
| input   | string | 是   | 输入 XML 路径 |
| output  | string | 是   | 输出 ASS 路径 |
| preset  | object | 是   | 弹幕预设配置  |
| options | object | 否   | 转换选项      |

**options 字段:**

| 参数名       | 类型    | 必填 | 说明                         |
| ------------ | ------- | ---- | ---------------------------- |
| sync         | boolean | 否   | 是否同步等待任务完成         |
| removeOrigin | boolean | 否   | 是否删除原始文件(默认 false) |

**请求示例:**

```json
{
  "input": "D:/videos/danmu.xml",
  "output": "D:/videos/danmu.ass",
  "preset": {
    "resolution": [1920, 1080],
    "scrolltime": 8,
    "fontname": "Microsoft YaHei",
    "fontsize": 38
  },
  "options": {
    "sync": false,
    "removeOrigin": false
  }
}
```

**响应示例:**

```json
{
  "taskId": "task_123",
  "output": "D:/videos/danmu.ass"
}
```

如果 `sync` 为 `true`,会等待任务完成后返回最终输出路径。

## 虚拟录制

### 测试虚拟录制配置

测试虚拟录制配置是否正确。

**接口地址:** `POST /task/testVirtualRecord`

**请求参数:**

| 参数名     | 类型   | 必填 | 说明                     |
| ---------- | ------ | ---- | ------------------------ |
| config     | object | 是   | 虚拟录制配置             |
| folderPath | string | 是   | 文件夹路径               |
| startTime  | number | 否   | 开始时间(Unix 时间戳,秒) |

**config 字段(normal 模式):**

| 参数名 | 类型   | 必填 | 说明               |
| ------ | ------ | ---- | ------------------ |
| mode   | string | 是   | 模式,值为 "normal" |
| roomId | string | 是   | 直播间 ID          |

**config 字段(advance 模式):**

| 参数名      | 类型   | 必填 | 说明                 |
| ----------- | ------ | ---- | -------------------- |
| mode        | string | 是   | 模式,值为 "advance"  |
| roomIdRegex | string | 是   | 直播间 ID 正则表达式 |

**请求示例:**

```json
{
  "config": {
    "mode": "normal",
    "roomId": "123456"
  },
  "folderPath": "D:/records",
  "startTime": 1704067200
}
```

### 执行虚拟录制

执行虚拟录制任务。

**接口地址:** `POST /task/executeVirtualRecord`

**请求参数:** 与测试接口相同

**响应示例:**

```json
{
  "success": true,
  "message": "执行成功"
}
```
