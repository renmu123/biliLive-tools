# Intro

原项目：https://github.com/WhiteMinds/HuYaRecorder

这是 [biliLive-tools](https://github.com/renmu123/biliLive-tools) 的一个平台插件，为其支持了虎牙平台录制

# 安装

`npm i @bililive-tools/huya-recorder @bililive-tools/manager`

# 使用

```ts
import { createRecorderManager } from "@bililive-tools/manager";
import { provider } from "@bililive-tools/huya-recorder";

const manager = createRecorderManager({ providers: [provider] });
manager.addRecorder({
  providerId: provider.id,
  channelId: "7734200",
  quality: "highest",
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
  qualityRetry?: number; // 画质匹配重试次数
  streamPriorities: []; // 废弃
  sourcePriorities: []; // 废弃
  disableAutoCheck?: boolean; // 为 true 时 manager 将跳过自动检查
  segment?: number; // 分段参数
  disableProvideCommentsWhenRecording?: boolean; // 禁用弹幕录制
  saveGiftDanma?: boolean; // 保存礼物弹幕
  saveCover?: boolean; // 保存封面
}
```

### 画质

相对画质

| 画质 | 值      |
| ---- | ------- |
| 最高 | highest |
| 高   | high    |
| 中等 | medium  |
| 低   | low     |
| 最低 | lowest  |

## 直播间ID解析

解析出真实直播间ID

```ts
import { provider } from "@bililive-tools/huya-recorder";

const url = "https://www.huya.com/910323";
const { id } = await provider.resolveChannelInfoFromURL(url);
```

# 协议

与原项目保存一致为 LGPL
