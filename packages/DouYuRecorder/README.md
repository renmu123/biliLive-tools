# Intro

原项目：https://github.com/WhiteMinds/DouYuRecorder

这是 [biliLive-tools](https://github.com/renmu123/biliLive-tools) 的一个平台插件，为其支持了斗鱼平台录制

# 安装

**建议所有录制器和manager包都升级到最新版，我不会对兼容性做过多考虑**

`npm i @bililive-tools/douyu-recorder @bililive-tools/manager`

# 使用

```ts
import { createRecorderManager } from "@bililive-tools/manager";
import { provider } from "@bililive-tools/douyu-recorder";

const manager = createRecorderManager({ providers: [provider] });
manager.addRecorder({
  providerId: provider.id,
  channelId: "74751",
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
  source?: string; // 指定 cdn，见文档，不传为自动
  streamPriorities: []; // 废弃
  sourcePriorities: []; // 废弃
  disableAutoCheck?: boolean; // 为 true 时 manager 将跳过自动检查
  segment?: number; // 分段参数，单位分钟
  titleKeywords?: string; // 禁止录制的标题关键字，英文逗号分开多个
  disableProvideCommentsWhenRecording?: boolean; // 禁用弹幕录制
  saveGiftDanma?: boolean; // 保存礼物弹幕
  saveSCDanma?: boolean; // 保存高能弹幕
  useServerTimestamp?: boolean; // 控制弹幕是否使用服务端时间戳，默认为true，斗鱼服务端时间戳只对文字弹幕生效，礼物等不生效
  saveCover?: boolean; // 保存封面
  videoFormat?: "auto"; // 视频格式： "auto", "ts", "mkv" ，auto模式下, 分段使用 "ts"，不分段使用 "mp4"
  onlyAudio?: boolean; // 只录制音频，默认为否
  recorderType?: "ffmpeg" | "mesio"; // 底层录制器，使用mesio时videoFormat参数无效
}
```

### 画质

遗漏了部分画质，有了解的可以提PR

| 画质   | 值  |
| ------ | --- |
| 原画   | 0   |
| 蓝光8M | 8   |
| 蓝光4M | 4   |
| 超清   | 3   |
| 高清   | 2   |

## 直播间ID解析

解析出真实直播间ID

```ts
import { provider } from "@bililive-tools/douyu-recorder";

const url = "https://www.douyu.com/2140934";
const { id } = await provider.resolveChannelInfoFromURL(url);
```

## cdn

在 `cdn=auto` 且 `recorderType=mesio` 时，默认使用 `hw-h5` 线路

如果有更多线路或者错误，请发issue

| 线路   | 值        |
| ------ | --------- |
| 自动   | auto      |
| 线路1  | scdnctshh |
| 线路4  | tctc-h5   |
| 线路5  | tct-h5    |
| 线路6  | ali-h5    |
| 线路7  | hw-h5     |
| 线路13 | hs-h5     |

# 协议

与原项目保存一致为 LGPL
