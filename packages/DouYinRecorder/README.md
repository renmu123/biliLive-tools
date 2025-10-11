# Intro

原项目：https://github.com/WhiteMinds/DouYinRecorder

这是 [biliLive-tools](https://github.com/renmu123/biliLive-tools) 的一个平台插件，为其支持了抖音平台录制

# 安装

`npm i @bililive-tools/douyin-recorder @bililive-tools/manager`

# 使用

```ts
import { createRecorderManager } from "@bililive-tools/manager";
import { provider } from "@bililive-tools/douyin-recorder";

const manager = createRecorderManager({ providers: [provider] });
manager.addRecorder({
  providerId: provider.id,
  channelId: "203641303310",
  quality: "origin",
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
  quality: string; // 见画质参数
  qualityRetry?: number; // 画质匹配重试次数, -1为强制匹配画质，0为自动配置，正整数为最大匹配次数
  streamPriorities: []; // 废弃
  sourcePriorities: []; // 废弃
  formatPriorities?: string[]; // 支持，`flv`和`hls` 参数，默认为['flv','hls']
  disableAutoCheck?: boolean; // 为 true 时 manager 将跳过自动检查
  segment?: number; // 分段参数，单位分钟
  disableProvideCommentsWhenRecording?: boolean; // 禁用弹幕录制
  saveGiftDanma?: boolean; // 保存礼物弹幕
  saveCover?: boolean; // 保存封面
  videoFormat?: "auto"; // 视频格式： "auto", "ts", "mkv" ，auto模式下, 分段使用 "ts"，不分段使用 "mp4"
  useServerTimestamp?: boolean; // 控制弹幕是否使用服务端时间戳，默认为true
  doubleScreen?: boolean; // 是否使用双屏直播流，开启后如果是双屏直播，那么就使用拼接的流，默认为true
  recorderType?: "auto" | "ffmpeg" | "mesio"; // 底层录制器，使用mesio时videoFormat参数无效
  auth?: string; // 传递cookie
  uid?: string; // 参数为 sec_user_uid 参数
  api?: "web" | "webHTML" | "mobile" | "userHTML"; // 使用不同的接口，具体区别见文档
}
```

## 画质

遗漏了部分画质，有了解的可以提PR

| 画质                   | 值          |
| ---------------------- | ----------- |
| 原画                   | origin      |
| 蓝光                   | uhd         |
| 超清                   | hd          |
| 高清                   | sd          |
| 标清                   | ld          |
| 音频流                 | ao          |
| 真原画(音频流中获取的) | real_origin |

## 直播间ID解析

解析出真实直播间ID

```ts
import { provider } from "@bililive-tools/douyin-recorder";

const url = "https://live.douyin.com/203641303310";
// 同样支持解析 https://v.douyin.com/DpfoBLAXoHM/, https://www.douyin.com/user/MS4wLjABAAAAE2ebAEBniL_0rF0vIDV4vCpdcH5RxpYBovopAURblNs
const { id } = await provider.resolveChannelInfoFromURL(url);
```

## 不同请求接口的区别

| 接口                                                  | 描述             | 备注                                     |
| ----------------------------------------------------- | ---------------- | ---------------------------------------- |
| `https://live.douyin.com/webcast/room/web/enter`      | web直播间接口    | 效果不错                                 |
| `https://webcast.amemv.com/webcast/room/reflow/info/` | mobile直播间接口 | 易风控，无验证码，海外IP可能无法使用     |
| `https://live.douyin.com/${webRoomId}`                | 直播间web解析    | 易风控，有验证码，单个接口1M流量         |
| `https://www.douyin.com/user/${secUserId}`            | 用户web解析      | 不易风控，海外IP无法使用，单个接口1M流量 |

# 协议

与原项目保存一致为 LGPL
