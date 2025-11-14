# Preset API

预设管理相关接口文档,用于管理弹幕、视频上传和 FFmpeg 预设配置。

## 弹幕预设

### 获取弹幕预设列表

获取所有弹幕预设配置。

**接口地址:** `GET /preset/danmu`

**请求参数:** 无

**响应示例:**

```json
[
  {
    "id": "preset_1",
    "name": "默认预设",
    "config": {
      "resolution": [1920, 1080],
      "scrolltime": 8,
      "fontname": "Microsoft YaHei",
      "fontsize": 38
    }
  }
]
```

### 获取单个弹幕预设

获取指定 ID 的弹幕预设详情。

**接口地址:** `GET /preset/danmu/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 预设 ID |

### 创建弹幕预设

创建新的弹幕预设。

**接口地址:** `POST /preset/danmu`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| name   | string | 是   | 预设名称 |
| config | object | 是   | 预设配置 |

**config 常用字段:**

| 参数名     | 类型     | 说明            |
| ---------- | -------- | --------------- |
| resolution | number[] | 分辨率 [宽, 高] |
| scrolltime | number   | 滚动时间(秒)    |
| fontname   | string   | 字体名称        |
| fontsize   | number   | 字体大小        |
| opacity    | number   | 不透明度(0-1)   |
| outline    | number   | 描边宽度        |
| shadow     | number   | 阴影深度        |

**请求示例:**

```json
{
  "name": "高清预设",
  "config": {
    "resolution": [1920, 1080],
    "scrolltime": 10,
    "fontname": "Microsoft YaHei",
    "fontsize": 42,
    "opacity": 0.8,
    "outline": 2,
    "shadow": 1
  }
}
```

### 更新弹幕预设

更新指定的弹幕预设。

**接口地址:** `PUT /preset/danmu/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 预设 ID |

**请求参数:** 与创建接口相同

### 删除弹幕预设

删除指定的弹幕预设。

**接口地址:** `DELETE /preset/danmu/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 预设 ID |

## 视频上传预设

用于 B 站视频上传的预设配置管理。

### 获取视频上传预设列表

获取所有视频上传预设。

**接口地址:** `GET /preset/video`

**请求参数:** 无

**响应示例:**

```json
[
  {
    "id": "preset_1",
    "name": "游戏视频预设",
    "config": {
      "title": "视频标题",
      "desc": "视频简介",
      "tid": 17,
      "tag": "游戏,实况",
      "copyright": 1
    }
  }
]
```

### 获取单个视频上传预设

获取指定 ID 的视频上传预设详情。

**接口地址:** `GET /preset/video/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 预设 ID |

### 创建视频上传预设

创建新的视频上传预设。

**接口地址:** `POST /preset/video`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| name   | string | 是   | 预设名称 |
| config | object | 是   | 上传配置 |

**config 常用字段:**

| 参数名     | 类型   | 说明                           |
| ---------- | ------ | ------------------------------ |
| title      | string | 视频标题                       |
| desc       | string | 视频简介                       |
| tid        | number | 分区 ID                        |
| tag        | string | 标签,多个标签用逗号分隔        |
| copyright  | number | 版权声明: 1-自制, 2-转载       |
| source     | string | 转载来源(转载时必填)           |
| cover      | string | 封面图片 URL                   |
| no_reprint | number | 是否允许转载: 0-允许, 1-不允许 |
| open_elec  | number | 是否开启充电: 0-关闭, 1-开启   |

**请求示例:**

```json
{
  "name": "游戏实况预设",
  "config": {
    "title": "{{roomName}}-{{now}}",
    "desc": "直播录播",
    "tid": 171,
    "tag": "游戏,直播录播",
    "copyright": 1,
    "no_reprint": 1
  }
}
```

::: tip 模板变量
配置中可以使用模板变量:

- `{{roomName}}`: 直播间名称
- `{{now}}`: 当前时间
- `{{date}}`: 当前日期
- `{{time}}`: 当前时间
  :::

### 更新视频上传预设

更新指定的视频上传预设。

**接口地址:** `PUT /preset/video/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 预设 ID |

**请求参数:** 与创建接口相同

::: warning 注意
`dtime` 字段会被自动过滤,不需要在请求中包含。
:::

### 删除视频上传预设

删除指定的视频上传预设。

**接口地址:** `DELETE /preset/video/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 预设 ID |

## FFmpeg 预设

用于视频处理的 FFmpeg 参数预设管理。

### 获取 FFmpeg 预设列表

获取所有 FFmpeg 预设。

**接口地址:** `GET /preset/ffmpeg`

**请求参数:** 无

**响应示例:**

```json
[
  {
    "id": "preset_1",
    "name": "H.264 高质量",
    "config": {
      "encoder": "libx264",
      "preset": "slow",
      "crf": 18
    }
  }
]
```

### 获取 FFmpeg 预设选项

获取可用的 FFmpeg 预设选项和参数说明。

**接口地址:** `GET /preset/ffmpeg/options`

**请求参数:** 无

**响应示例:**

```json
{
  "encoders": ["libx264", "libx265", "h264_nvenc"],
  "presets": ["ultrafast", "fast", "medium", "slow", "veryslow"],
  "pixelFormats": ["yuv420p", "yuv444p"]
}
```

### 获取单个 FFmpeg 预设

获取指定 ID 的 FFmpeg 预设详情。

**接口地址:** `GET /preset/ffmpeg/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 预设 ID |

### 创建 FFmpeg 预设

创建新的 FFmpeg 预设。

**接口地址:** `POST /preset/ffmpeg`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明        |
| ------ | ------ | ---- | ----------- |
| name   | string | 是   | 预设名称    |
| config | object | 是   | FFmpeg 配置 |

**config 常用字段:**

| 参数名       | 类型   | 说明                                        |
| ------------ | ------ | ------------------------------------------- |
| encoder      | string | 编码器(如 libx264, libx265, h264_nvenc)     |
| preset       | string | 编码速度预设(ultrafast/fast/medium/slow 等) |
| crf          | number | 恒定质量因子(0-51,越小质量越好)             |
| bitrate      | string | 比特率(如 "5000k")                          |
| fps          | number | 帧率                                        |
| resolution   | string | 分辨率(如 "1920x1080")                      |
| pixelFormat  | string | 像素格式(如 "yuv420p")                      |
| audioCodec   | string | 音频编码器(如 "aac", "mp3")                 |
| audioBitrate | string | 音频比特率(如 "192k")                       |

**请求示例:**

```json
{
  "name": "H.265 高质量",
  "config": {
    "encoder": "libx265",
    "preset": "slow",
    "crf": 20,
    "pixelFormat": "yuv420p",
    "audioCodec": "aac",
    "audioBitrate": "192k"
  }
}
```

### 更新 FFmpeg 预设

更新指定的 FFmpeg 预设。

**接口地址:** `PUT /preset/ffmpeg/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 预设 ID |

**请求参数:** 与创建接口相同

### 删除 FFmpeg 预设

删除指定的 FFmpeg 预设。

**接口地址:** `DELETE /preset/ffmpeg/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 预设 ID |

## 通用响应

所有创建、更新、删除操作成功时,通常返回更新后的预设对象或成功状态。

## 错误处理

常见错误响应:

- `预设不存在`: 指定的预设 ID 不存在
- `名称不能为空`: 预设名称为空
- `配置格式错误`: 配置参数格式不正确

::: tip 使用建议

- 弹幕预设用于 XML 转 ASS 时的样式配置
- 视频上传预设用于 B 站视频上传时的元数据配置
- FFmpeg 预设用于视频转码、压制等处理任务
  :::
