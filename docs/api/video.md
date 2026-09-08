## 视频处理

### 读取视频元数据

读取视频文件的元数据信息，如时长、编码器等。

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

| 参数名             | 类型    | 必填 | 说明                                                   |
| ------------------ | ------- | ---- | ------------------------------------------------------ |
| output             | string  | 否   | 输出文件路径                                           |
| saveOriginPath     | boolean | 是   | 是否保存到原始路径，如果该参数为true，output将不会生效 |
| keepFirstVideoMeta | boolean | 是   | 是否保留第一个视频的元数据                             |

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

| 参数名        | 类型   | 必填 | 说明                                     |
| ------------- | ------ | ---- | ---------------------------------------- |
| input         | string | 是   | 输入文件路径                             |
| outputName    | string | 是   | 输出文件名                               |
| ffmpegOptions | object | 是   | FFmpeg 选项，从[preset](./preset.md)获取 |
| options       | object | 是   | 转码选项                                 |

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

### 歌曲识别

截取指定视频时间段的音频并进行歌曲识别。接口会先提取音频片段，再返回识别到的歌曲名；如果启用了歌词优化，也可能返回歌词 SRT。

**接口地址:** `POST /ai/song-recognize`

**请求参数:**

| 参数名    | 类型   | 必填 | 说明                     |
| --------- | ------ | ---- | ------------------------ |
| file      | string | 是   | 完整视频文件路径         |
| startTime | number | 是   | 音频提取开始时间，单位秒 |
| endTime   | number | 是   | 音频提取结束时间，单位秒 |

**请求示例:**

```json
{
  "file": "D:/videos/test.mp4",
  "startTime": 30,
  "endTime": 75
}
```

**响应示例:**

```json
{
  "name": "Shape of You",
  "lyrics": "1\n00:00:30,000 --> 00:00:33,000\nThe club isn't the best place to find a lover\n"
}
```

**响应字段说明:**

| 参数名 | 类型   | 必返 | 说明                                  |
| ------ | ------ | ---- | ------------------------------------- |
| name   | string | 否   | 识别到的歌曲名称                      |
| lyrics | string | 否   | 歌词字幕 SRT 内容，仅在生成歌词时返回 |

**错误响应示例:**

```json
{
  "error": "参数错误，必须包含 file、startTime 和 endTime 字段"
}
```

### 字幕识别

对视频文件或指定时间段进行字幕识别，返回 SRT 字幕内容。

**接口地址:** `POST /ai/subtitle`

**请求参数:**

| 参数名    | 类型    | 必填 | 说明                                               |
| --------- | ------- | ---- | -------------------------------------------------- |
| file      | string  | 是   | 完整视频文件路径                                   |
| modelId   | string  | 是   | 预留字段，当前实现实际读取 AI 配置中的字幕识别模型 |
| startTime | number  | 否   | 开始时间，单位秒                                   |
| endTime   | number  | 否   | 结束时间，单位秒                                   |
| offset    | number  | 否   | 时间偏移量，单位秒                                 |
| song      | boolean | 否   | 是否按音乐场景识别，影响 ASR 过滤策略              |

当同时传入 `startTime` 和 `endTime` 时，接口会先提取该时间范围内的音频片段，再进行识别。

**请求示例:**

```json
{
  "file": "D:/videos/test.mp4",
  "startTime": 0,
  "endTime": 20,
  "offset": 0,
  "song": false
}
```

**响应示例:**

```json
{
  "srt": "1\n00:00:00,000 --> 00:00:02,100\n大家好\n\n2\n00:00:02,100 --> 00:00:04,800\n欢迎来到直播间\n"
}
```

**响应字段说明:**

| 参数名 | 类型   | 必返 | 说明                  |
| ------ | ------ | ---- | --------------------- |
| srt    | string | 是   | 识别出的 SRT 字幕内容 |

**错误响应示例:**

缺少文件参数时：

```json
{
  "error": "参数错误，必须包含 file 字段"
}
```

未配置字幕识别模型或识别失败时：

```json
{
  "error": "字幕识别失败"
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
