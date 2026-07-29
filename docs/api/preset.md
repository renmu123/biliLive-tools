# Preset API

预设管理相关接口文档,用于管理弹幕、视频上传和 FFmpeg 预设配置。

## 弹幕预设

### 数据结构

| 参数名                     | 类型               | 说明                                                                     |
| -------------------------- | ------------------ | ------------------------------------------------------------------------ |
| resolution                 | [number, number]   | 弹幕画面分辨率，格式为 [宽, 高]，单位为像素                              |
| scrolltime                 | number             | 滚动弹幕通过时间，单位为秒                                               |
| fixtime                    | number             | 固定弹幕停留时间，单位为秒                                               |
| density                    | number             | 弹幕密度，0=无限，-1=不重叠，-2=自定义条数                               |
| customDensity              | number             | 自定义弹幕条数，仅 density=-2 时生效                                     |
| fontname                   | string             | 字体名称                                                                 |
| fontsize                   | number             | 基础字体大小，单位为像素                                                 |
| opacity100                 | number             | 文字不透明度，百分比（0-100）                                            |
| outline                    | number             | 描边宽度                                                                 |
| outline-blur               | number             | 描边模糊半径                                                             |
| outline-opacity-percentage | number             | 描边不透明度，百分比（0-100）                                            |
| shadow                     | number             | 阴影宽度                                                                 |
| displayarea                | number             | 全部弹幕显示区域（0-1，比例）                                            |
| scrollarea                 | number             | 滚动弹幕显示区域（0-1，比例）                                            |
| bold                       | boolean            | 是否加粗字体                                                             |
| showusernames              | boolean            | 是否显示用户名                                                           |
| saveblocked                | boolean            | 是否保存被屏蔽的弹幕                                                     |
| showmsgbox                 | boolean            | 是否显示礼物框                                                           |
| msgboxsize                 | [number, number]   | 礼物框尺寸 [宽, 高]                                                      |
| msgboxpos                  | [number, number]   | 礼物框位置 [X, Y]                                                        |
| msgboxfontsize             | number             | 礼物框文字大小                                                           |
| msgboxduration             | number             | 礼物框持续时间，单位为秒                                                 |
| giftminprice               | number             | 礼物最小价值，单位为 RMB                                                 |
| blockmode                  | string[]           | 按类型屏蔽弹幕，可选值包括 R2L、L2R、TOP、BOTTOM、SPECIAL、COLOR、REPEAT |
| statmode                   | string[]           | 调试统计模式，可选值包括 TABLE、HISTOGRAM                                |
| resolutionResponsive       | boolean            | 是否自适应视频分辨率                                                     |
| fontSizeResponsive         | boolean            | 是否自适应分辨率字体大小                                                 |
| fontSizeResponsiveParams   | [number, number][] | 字体大小自适应参数，每项为 [分辨率高度, 字体大小]，高度递增且不能重复    |
| blacklist                  | string             | 弹幕屏蔽规则，英文逗号分隔，支持关键词、UID、用户名、正则表达式          |
| filterFunction             | string             | 自定义弹幕过滤函数，字符串形式                                           |
| blacklist-regex            | boolean            | 屏蔽规则是否启用正则表达式模式                                           |
| line-spacing               | number             | 弹幕行间距                                                               |
| top-margin                 | number             | 弹幕顶部间距                                                             |
| bottom-margin              | number             | 弹幕底部间距                                                             |
| timeshift                  | number             | 弹幕时间偏移，单位为秒                                                   |

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

**请求示例:**

```json
{
  "name": "高清预设",
  "config": {
    "resolution": [1920, 1080],
    "scrolltime": 10,
    "fixtime": 4,
    "density": -1,
    "fontname": "Microsoft YaHei",
    "fontsize": 42,
    "opacity100": 80,
    "outline": 2,
    "shadow": 1,
    "bold": true,
    "showusernames": false,
    "fontSizeResponsive": false,
    "fontSizeResponsiveParams": []
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

### 数据结构

| 参数名            | 类型           | 说明                                                    |
| ----------------- | -------------- | ------------------------------------------------------- |
| title             | string         | 稿件标题,限制 80 字,会去除首尾空格                      |
| partTitleTemplate | string         | 分 P 标题模板                                           |
| desc              | string         | 稿件简介,最多 250 字                                    |
| tid               | number         | 投稿分区 ID                                             |
| tag               | string[]       | 标签数组,不能为空且不能超过 10 个                       |
| copyright         | `1\|2`         | 版权声明,`1` 为自制,`2` 为转载                          |
| source            | string         | 转载来源,`copyright=2` 时通常需要提供                   |
| dynamic           | string         | 空间动态                                                |
| cover             | string         | 封面,可为文件名或绝对路径                               |
| dolby             | `0\|1`         | 是否开启杜比                                            |
| hires             | `0\|1`         | 是否开启 Hi-Res                                         |
| noReprint         | `0\|1`         | 自制声明,`0` 允许转载,`1` 禁止转载                      |
| watermark         | `0\|1`         | 是否添加水印                                            |
| openElec          | `0\|1`         | 是否开启充电面板                                        |
| closeDanmu        | `0\|1`         | 是否关闭弹幕                                            |
| closeReply        | `0\|1`         | 是否关闭评论                                            |
| selectiionReply   | `0\|1`         | 是否开启精选评论,`0` 开启,`1` 关闭                      |
| seasonId          | `number\|null` | 合集 ID                                                 |
| sectionId         | number         | 小节 ID                                                 |
| uid               | `number\|null` | 创建该预设的 B 站 UID                                   |
| recreate          | `1\|-1`        | 是否允许二创                                            |
| no_disturbance    | `0\|1`         | 是否推送到动态,`0` 推送,`1` 不推送                      |
| autoComment       | boolean        | 是否自动评论                                            |
| commentTop        | boolean        | 是否将自动评论置顶                                      |
| comment           | string         | 自动评论内容                                            |
| topic_id          | number         | 话题 ID                                                 |
| topic_name        | `string\|null` | 话题名称                                                |
| mission_id        | number         | 活动任务 ID                                             |
| is_only_self      | `0\|1`         | 是否仅自己可见                                          |
| space_hidden      | `1\| 2`        | 是否在个人空间投稿列表中隐藏                            |
| human_type2       | number         | 新分区 ID                                               |
| dtime             | number         | 定时发布时间,10 位秒级时间戳,需晚于当前提交时间 7200 秒 |
| sortByCid         | number[]       | 按指定 cid 顺序上传分 P                                 |

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
      "tag": ["游戏", "实况"],
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

**config 类型:** `#sym:BiliupConfig`

**请求示例:**

```json
{
  "name": "游戏实况预设",
  "config": {
    "title": "{{roomName}}-{{now}}",
    "desc": "直播录播",
    "tid": 171,
    "tag": ["游戏", "直播录播"],
    "copyright": 1,
    "dolby": 0,
    "hires": 0,
    "noReprint": 1
  }
}
```

### 更新视频上传预设

更新指定的视频上传预设。

**接口地址:** `PUT /preset/video/:id`

**路径参数:**

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| id     | string | 是   | 预设 ID |

**请求参数:** 与创建接口相同

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
