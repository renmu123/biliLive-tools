# Intro

原项目：https://github.com/WhiteMinds/BilibiliRecorder

这是 [biliLive-tools](https://github.com/renmu123/biliLive-tools) 的一个平台插件，为其支持了 Bilibili 平台录制

# 安装

**建议所有录制器和manager包都升级到最新版，我不会对兼容性做过多考虑**

`npm i @bililive-tools/bilibili-recorder @bililive-tools/manager`

# 使用

```ts
import { createRecorderManager } from "@bililive-tools/manager";
import { provider } from "@bililive-tools/bilibili-recorder";

const manager = createRecorderManager({ providers: [provider] });
manager.addRecorder({
  providerId: provider.id,
  channelId: "7734200",
  quality: 10000,
  streamPriorities: [],
  sourcePriorities: [],
});

// 录制前请设置好ffmepg的环境变量，或手动指定，具体见`@bililive-tools/manager`文档
manager.startCheckLoop();
```

## 参数

```ts
interface Options {
  channelId: string; // 长直播间ID，具体解析见文档，也可自行解析
  quality: number; // 见画质参数
  qualityRetry?: number; // 画质匹配重试次数, -1为强制匹配画质，0为自动配置，正整数为最大匹配次数
  streamPriorities: []; // 废弃
  sourcePriorities: []; // 废弃
  disableAutoCheck?: boolean; // 为 true 时 manager 将跳过自动检查
  segment?: number; // 分段参数，单位分钟
  disableProvideCommentsWhenRecording?: boolean; // 禁用弹幕录制
  saveGiftDanma?: boolean; // 保存礼物弹幕，包含舰长
  saveSCDanma?: boolean; // 保存SC
  useServerTimestamp?: boolean; // 控制弹幕是否使用服务端时间戳，默认为true
  saveCover?: boolean; // 保存封面
  auth?: string; // 登录所需cookie
  uid?: number; // cookie所有者uid，用于弹幕录制
  formatName?: FormatName; // 见 formatName 参数
  codecName?: CodecName; // 见 CodecName 参数
  useM3U8Proxy?: boolean; // 是否使用m3u8代理，由于hls及fmp4存在一个小时超时时间，需自行实现代理避免
  m3u8ProxyUrl?: string; // 代理链接，文档待补充
  videoFormat?: "auto"; // 视频格式： "auto", "ts", "mkv" ，auto模式下, 分段使用 "ts"，不分段使用 "mp4"
  onlyAudio?: boolean; // 只录制音频，默认为否
  recorderType?: "ffmpeg" | "mesio"; // 底层录制器，使用mesio时videoFormat参数无效
}
```

### 画质

B站录制高画质需要登录，在无法匹配到画质时，会优先使用高画质

| 画质 | 值    |
| ---- | ----- |
| 杜比 | 30000 |
| 4K   | 20000 |
| 原画 | 10000 |
| 蓝光 | 400   |
| 超清 | 250   |
| 高清 | 150   |
| 流畅 | 80    |

### formatName

用于控制flv，hls(ts)，hls(fmp4)

能否录制flv下的hevc和你的ffmpeg版本有关

| 解释        | 值        |
| ----------- | --------- |
| 等于flv     | auto      |
| 优先使用flv | flv       |
| 优先使用hls | hls       |
| 只使用fmp4  | fmp4      |
| 只使用flv   | flv_only  |
| 只使用hls   | hls_only  |
| 只使用fmp4  | fmp4_only |

### CodecName

用于控制使用avc还是hevc

| 解释         | 值        |
| ------------ | --------- |
| 等于avc      | auto      |
| 优先使用avc  | avc       |
| 优先使用hevc | hevc      |
| 只使用avc    | avc_only  |
| 只使用hevc   | hevc_only |

## 直播间ID解析

解析出长直播间ID

```ts
import { provider } from "@bililive-tools/bilibili-recorder";

const url = "https://live.bilibili.com/5055636";
const { id } = await provider.resolveChannelInfoFromURL(url);
```

# 协议

与原项目保存一致为 LGPL
