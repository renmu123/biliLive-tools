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

| 功能     | ffmpeg | mesio        | 录播姬引擎 |
| -------- | ------ | ------------ | ---------- |
| FLV 录制 | ✅     | ✅           | ✅         |
| HLS 录制 | ✅     | ✅           | ❌         |
| 时长分段 | ✅     | ✅           | ✅         |
| 只音频   | ✅     | ✅           | ❌         |
| 容器支持 | 多种   | 跟随链接容器 | flv        |
| FLV 修复 | ❌     | ✅           | ✅         |

::: tip 提示
当选择不支持的配置时，会自动尝试使用 FFmpeg 进行录制。
:::

## 快速开始

### 添加直播间

1. 打开"直播录制"页面
2. 点击"添加直播间"
3. 输入直播间地址
4. 配置录制参数
5. 点击"确定"

## 配置选项

### 基础配置

#### 直播间链接

- B站：`https://live.bilibili.com/房间号`
- 斗鱼：`https://www.douyu.com/房间号`
- 虎牙：`https://www.huya.com/房间号`
- 抖音房间号：`https://live.douyin.com/房间号`
- 抖音号：`https://wwww.douyin.com/user/xxxxx`

::: warning
抖音号可能会被修改，请尽量使用房间号进行添加
:::

#### 画质

根据平台不同，支持不同的画质选项

::: tip 提示
B站登录Cookie后可以解锁更高画质。
:::

### 高级配置

#### 只音频

只录制音频流，节省存储空间和带宽。

适用场景：

- 电台直播
- 纯音乐直播
- 不需要视频画面的直播

#### 时长分段

按时长自动分段，避免单个文件过大。

可选时长：30分钟、1小时、2小时、4小时、8小时

#### 文件命名规则

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

示例：`{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}`

::: tip 高级用法
支持 [ejs](https://ejs.co/) 模板引擎，可以实现更复杂的命名逻辑。

例如，为不同平台配置不同存储路径：

```
<% if (platform=='斗鱼') { %>C<% } %><% if (platform!='斗鱼') { %>D<% } %>:\录制\{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}
```

:::

#### 检查间隔

设置检查直播状态的时间间隔，默认60秒。

::: warning 注意
间隔过短可能导致被平台风控。建议添加大量直播间时增加间隔。
:::

## Webhook集成

录制完成后可以自动发送到Webhook进行处理。

1. 打开"直播间配置"
2. 启用"发送至Webhook"
3. 在"设置" -> "Webhook"中配置处理规则

查看 [Webhook文档](./webhook.md) 了解详细配置。

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

### 录制电台直播时帧数过低？

如果需要压制弹幕，请手动指定帧数参数。

### 分辨率变化后不会切割？

设计如此。如果播放器不支持多分辨率，请使用 VLC 播放器。

或者尝试使用 `mesio` 或录播姬录制器。

### Q: 抖音双屏录播如何分割主画面？

假设已开启"双屏直播流选项"，主画面分辨率为 1920x1080。

在 `ffmpeg设置` 的 `视频滤镜` 中输入：

```
crop=1920:1080:0:0;$origin
```

这会分离出主画面，副画面同理。

### API接口选择

抖音提供多种API接口，可以根据情况选择：

| 接口类型         | 说明                                     |
| ---------------- | ---------------------------------------- |
| web直播间接口    | 效果不错                                 |
| mobile直播间接口 | 不易风控，无验证码，海外IP可能无法使用   |
| 直播间web解析    | 易风控，有验证码，单个接口1M流量         |
| 用户web解析      | 不易风控，海外IP无法使用，单个接口1M流量 |
| 负载均衡         | 使用负载均衡算法来分摊防止风控           |
| 随机             | 从几个接口里挑一个                       |

::: tip 提示
`mobile直播间接口` 及 `用户web解析` 只对 `3.1.0` 及之后添加的直播间有效。
:::

### 抖音风控怎么办？

1. 调大检查间隔
2. 修改“并发数”为1
3. 调大“等待时间”为1000ms
4. 修改使用的api接口

### 录制页面为什么显示“检查错误”

可能的原因有两种：

1. 你被风控了，如果其他同平台的主播也如此显示，那绝大概率就是风控了
2. 根据你的配置要求，无法找到可用的直播流

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
