# Intro

原项目：https://github.com/WhiteMinds/HuYaRecorder

这是 [biliLive-tools](https://github.com/renmu123/biliLive-tools) 的一个平台插件，为其支持了虎牙平台录制

# 安装

**建议所有录制器和manager包都升级到最新版，我不会对兼容性做过多考虑**

`npm i @bililive-tools/huya-recorder @bililive-tools/manager`

# 使用

```ts
import { createRecorderManager } from "@bililive-tools/manager";
import { provider } from "@bililive-tools/huya-recorder";

const manager = createRecorderManager({ providers: [provider] });
manager.addRecorder({
  providerId: provider.id,
  channelId: "7734200",
  quality: 0,
  streamPriorities: [],
  sourcePriorities: [],
});

// 录制前请设置好ffmepg的环境变量，或手动指定，具体见`@bililive-tools/manager`文档
manager.startCheckLoop();
```

## 参数

```ts
interface Options {
  channelId: string; // 直播间ID，具体解析见文档，也可自行解析
  quality: number; // 见画质参数
  qualityRetry?: number; // 画质匹配重试次数, -1为强制匹配画质，0为自动配置，正整数为最大匹配次数
  streamPriorities: []; // 废弃
  sourcePriorities: []; // 按提供的源优先级去给CDN列表排序，并过滤掉不在优先级配置中的源，在未匹配到的情况下会优先使用TX的CDN，具体参数见 CDN 参数
  formatPriorities?: string[]; // 支持，`flv`和`hls` 参数，默认为['flv','hls']
  disableAutoCheck?: boolean; // 为 true 时 manager 将跳过自动检查
  segment?: number; // 分段参数，单位分钟
  disableProvideCommentsWhenRecording?: boolean; // 禁用弹幕录制
  saveGiftDanma?: boolean; // 保存礼物弹幕
  saveCover?: boolean; // 保存封面
  api?: "auto" | "mp" | "web"; // 默认为auto，在星秀区使用mp接口，其他使用web接口，你也可以强制指定
  videoFormat?: "auto"; // 视频格式： "auto", "ts", "mkv" ，auto模式下, 分段使用 "ts"，不分段使用 "mp4"
  recorderType?: "ffmpeg" | "mesio"; // 底层录制器，使用mesio时videoFormat参数无效
}
```

### 画质

| 画质     | 值    |
| -------- | ----- |
| 2K HDR   | 14100 |
| 2K       | 14000 |
| HDR(10M) | 4200  |
| 原画     | 0     |
| 蓝光20M  | 20000 |
| 蓝光10M  | 10000 |
| 蓝光8M   | 8000  |
| 蓝光4M   | 4000  |
| 超清     | 2000  |
| 流畅     | 500   |

### CDN

不同直播间可能支持的cdn并不一致

| 画质                       | 值   |
| -------------------------- | ---- |
| 阿里                       | AL   |
| 腾讯                       | TX   |
| 华为                       | HW   |
| 火山                       | HS   |
| 网宿                       | WS   |
| 阿里13                     | AL13 |
| 腾讯15                     | TX15 |
| 华为16                     | HW16 |
| 不知道是啥(可能是虎牙自建) | HYZJ |

### 流格式

hls 可能并不适合 mp 的 api，也许你能找到可以使用的cdn

支持 hls 和 flv

## 直播间ID解析

解析出真实直播间ID

```ts
import { provider } from "@bililive-tools/huya-recorder";

const url = "https://www.huya.com/910323";
const { id } = await provider.resolveChannelInfoFromURL(url);
```

# 协议

与原项目保存一致为 LGPL
