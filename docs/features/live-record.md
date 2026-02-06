# 直播录制

biliLive-tools 支持 B站、斗鱼、虎牙、抖音四大平台的直播录制，包含弹幕和礼物信息。

初始实现由 [LiveAutoRecord](https://github.com/WhiteMinds/LiveAutoRecord) 拓展而来

## 支持平台

| 平台 | 弹幕 | 画质 | 线路 | Cookie | 流格式 | 流编码 | 只音频 | 付费直播 |
| ---- | ---- | ---- | ---- | ------ | ------ | ------ | ------ | -------- |
| 斗鱼 | ✅   | ✅   | ✅   | ❌     | ❌     | ❌     | ✅     | ❌       |
| B站  | ✅   | ✅   | ❌   | ✅     | ✅     | ✅     | ✅     | ❌       |
| 抖音 | ✅   | ✅   | ❌   | ✅     | ✅     | ❌     | ✅     | ❌       |
| 虎牙 | ✅   | ✅   | ✅   | ❌     | ❌     | ❌     | ❌     | ❌       |

### 功能说明

- **弹幕**：录制弹幕到XML文件
- **画质**：支持选择不同画质
- **线路**：支持选择不同CDN线路
- **流格式**：支持选择流格式（FLV/HLS等）
- **流编码**：支持选择视频编码
- **只音频**：只录制音频流

### 弹幕信息

- **B站**：弹幕、礼物、SC、舰长
- **斗鱼**：弹幕、礼物、高能弹幕
- **虎牙**：弹幕、礼物
- **抖音**：弹幕、礼物

## 录制器

biliLive-tools 提供三种录制器引擎：

| 功能     | FFmpeg | mesio        | 录播姬引擎 |
| -------- | ------ | ------------ | ---------- |
| FLV 录制 | ✅     | ✅           | ✅         |
| HLS 录制 | ✅     | ✅           | ❌         |
| 时长分段 | ✅     | ✅           | ✅         |
| 只音频   | ✅     | ✅           | ❌         |
| 容器支持 | 多种   | 跟随链接容器 | flv        |
| FLV 修复 | ❌     | ✅           | ✅         |

::: tip 提示
当选择到某录制器不支持的直播流时，会尽量自动尝试使用 FFmpeg 进行录制。
:::

### Mesio

项目地址：https://github.com/hua0512/rust-srec/tree/main/mesio-cli

### 录播姬引擎

项目地址：https://github.com/renmu123/BililiveRecorder

录播姬引擎是从录播姬项目中提取了FLV录制引擎，一些细节上并不与原项目相同

### 视频格式

| 名称 | 备注                                       |
| ---- | ------------------------------------------ |
| 自动 | 默认为ts，不存在分段是使用m4s              |
| MKV  |                                            |
| TS   |                                            |
| FLV  | 存在分辨率变化或参数变化会花屏，请尝试修复 |

## 配置选项

### 画质

根据平台不同，支持不同的画质选项，**并非你选择什么画质就一定会得到什么画质，非原画流都是服务端二压的，刚开播时并不会存在相关的流，请和`流匹配重试次数`搭配使用**

### 只音频

只录制音频流，节省存储空间和带宽。

适用场景：

- 电台直播
- 纯音乐直播
- 不需要视频画面的直播

### 时长分段

按时长自动分段，避免单个文件过大，以及缓解时间戳的偏移。

### 文件命名规则

自定义录制文件的命名规则，支持以下占位符：

- `{platform}` - 平台名称
- `{owner}` - 主播名称
- `{title}` - 直播标题
- `{year}` - 年份
- `{month}` - 月份
- `{date}` - 日期
- `{hour}` - 小时
- `{min}` - 分钟
- `{sec}` - 秒
- `{ms}` - 毫秒
- `{startTime}` - 分段开始时间，Date对象
- `{recordStartTime}` - 录制开始时间，Date对象
- `{liveStartTime}` - 直播开始时间，Date对象，抖音同录制开始时间

示例：`{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}`

::: tip 高级用法
支持 [ejs](https://ejs.co/) 模板引擎，可以实现更复杂的命名逻辑。

例如，为不同平台配置不同存储路径：

```
<% if (platform=='斗鱼') { %>C<% } %><% if (platform!='斗鱼') { %>D<% } %>:\录制\{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}
```

例如，将直播开始时间设置为文件夹

```
{platform}/{owner}/<%= recordStartTime.getFullYear() %>-<%= recordStartTime.getMonth()+1 %>-<%= recordStartTime.getDate() %>/{year}-{month}-{date} {hour}-{min}-{sec} {title}
```

:::

### 检查间隔

设置检查直播状态的时间间隔，默认60秒。

::: warning 注意
间隔过短可能导致被平台风控。建议添加大量直播间时增加间隔。
:::

### 录制结束立即重试

默认策略下，如果录制被中断，那么会在下一个检查周期时重新检查直播状态并重新开始录制，这种策略的问题就是一部分时间会被漏掉。

如果开启了该选项，且录制开始时间与结束时间相差在一分钟以上（某些平台下播会扔会有重复流），那么会立即进行一次检查。

### 禁止标题关键词

如果直播间标题包含这些关键词，则不会自动录制，多个关键词请用英文逗号分隔，或者使用正则表达式（如：/回放|录播/i），录制中的直播隔约每五分钟会查询接口检查，手动录制的不会被影响。

由于B站直播更改信息后发广播到弹幕，如果想实时检测，那么必须开启弹幕，当然也会比其他的实现省资源

### 监控时间段

此选项指得是仅在此时间段内进行**监控**，而非仅在该时间段内**录制**

## Webhook集成

录制完成后可以自动发送到Webhook进行处理。

1. 打开"直播间配置"
2. 启用"发送至Webhook"
3. 在"设置" -> "Webhook"中配置处理规则

查看 [Webhook文档](./webhook.md) 了解详细配置。

## 通知

**录制开始通知**选项为录制开始通知，并非直播开始通知，只是很多情况下这两者是等价的，但实际这两者并不相同，通知的设计是尽可能在录制开始时通知用户，但又不会因可能的网络问题而重复提醒，一般来说一场直播只会提醒一次。

**录制结束通知**选项为录制结束通知，并非直播开始通知，只是很多情况下这两者是等价的，但实际这两者并不相同，通知的设计是尽可能在录制结束时通知用户，会在一次录制结束后三分钟检查录制状态，如果为不在录制中状态，则进行通知

## 常见问题

### 录制如何转换为MP4？

1. 单个直播间配置打开"发送至webhook"
2. "设置" -> "Webhook" 打开webhook开关
3. "设置" -> "Webhook" -> "转封装为mp4" 打开开关

### 添加大量直播间后无法录制？

可能被平台风控：

1. 关闭软件等待风控解除
2. 减少直播间数量
3. 加大检查间隔
4. 检查网络和硬盘

### 电台直播压制弹幕时卡顿

由于视频帧数过低，压制会观看不流畅，请手动指定帧数参数，如在"ffmpeg配置"=>"额外输出参数"中指定`-r 60`。

### 分辨率变化后不会切割？

设计如此。如果播放器不支持多分辨率，请使用 VLC 播放器。

或者尝试使用 `mesio` 或录播姬录制器。

这会分离出主画面，副画面同理。

### UI界面中直播状态等参数未实时更新

获取此类相关数据需要从源站获取，可能带来大量的并发，数据并非实时获取，如果想要彻底关闭这种行为，可关闭“设置”-“UI界面”-“录制页面额外请求”开关。

### flv格式下无法播放或只有声音无画面

尝试使用最新版 potplayer 或转换为 MP4 格式

### 录制页面为什么显示“检查错误”

可能的原因有两种：

1. 你被风控了，如果其他同平台的主播也如此显示，那绝大概率就是风控了
2. 根据你的配置要求，无法找到可用的直播流

### 如何实现定时录制

参考 [API文档](../api/recorder.md)，定时调用开始和停止接口

### 其他录制软件推荐

| 名称                                                               | 备注                         | 协议       |
| ------------------------------------------------------------------ | ---------------------------- | ---------- |
| [录播姬](https://github.com/BililiveRecorder/BililiveRecorder)     | 录制B站flv流最稳的工具       | GPLV3      |
| [biliup](https://github.com/biliup/biliup)                         | 支持B站上传，弹幕            | MIT        |
| [DouyinLiveRecorder](https://github.com/ihmily/DouyinLiveRecorder) | 支持平台多，无GUI            | MIT        |
| [StreamCap](https://github.com/ihmily/StreamCap)                   | 支持平台多，有GUI            | Apache 2.0 |
| [DanmakuRender](https://github.com/SmallPeaches/DanmakuRender)     | 支持B站自动上传，弹幕，无GUI | 开源未知   |
| [bililive-go](https://github.com/bililive-go/bililive-go)          | 支持平台多，有GUI            | GPLV3      |
| [stream-rec](https://github.com/stream-rec/stream-rec)             | 自实现引擎，rclone同步       | MIT        |
| [oneliverec](https://www.oneliverec.cc/zh-cn/)                     | 支持的平台多                 | 闭源免费   |

## 相关资源

- [直播录制相关库](https://www.npmjs.com/package/@bililive-tools/manager)
- [B站录制](https://www.npmjs.com/package/@bililive-tools/bilibili-recorder)
- [斗鱼录制](https://www.npmjs.com/package/@bililive-tools/douyu-recorder)
- [虎牙录制](https://www.npmjs.com/package/@bililive-tools/huya-recorder)
- [抖音录制](https://www.npmjs.com/package/@bililive-tools/douyin-recorder)
- [虎牙弹幕监听](https://www.npmjs.com/package/huya-danma-listener)
- [抖音弹幕监听](https://www.npmjs.com/package/douyin-danma-listener)
