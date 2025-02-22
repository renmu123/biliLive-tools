# Intro

原项目：https://github.com/WhiteMinds/LiveAutoRecord

这是 [biliLive-tools](https://github.com/renmu123/biliLive-tools) 的一个平台插件，支持管理录播

# 安装

`npm i @bililive-tools/manager`

## 支持的平台

| 平台 | 包名                                |
| ---- | ----------------------------------- |
| B站  | `@bililive-tools/bilibili-recorder` |
| 斗鱼 | `@bililive-tools/douyu-recorder`    |
| 虎牙 | `@bililive-tools/huya-recorder`     |

# 使用

以B站举例

```ts
import { createRecorderManager } from "@bililive-tools/manager";
import { provider } from "@bililive-tools/bilibili-recorder";

const manager = createRecorderManager({
  providers: [provider],
  savePathRule: "D:\\录制\\{platforme}}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}", // 保存路径，占位符见文档
  autoCheckInterval: 1000 * 60, // 自动检查间隔，单位秒
  autoRemoveSystemReservedChars: true, // 移除系统非法字符串
  biliBatchQuery: false, // B站检查使用批量接口
});

// 不同provider支持的参数不尽相同，具体见相关文档

manager.addRecorder({
  providerId: provider.id,
  channelId: "7734200",
  quality: 10000,
  streamPriorities: [],
  sourcePriorities: [],
});
manager.startCheckLoop();
```

## savePathRule 占位符参数

| 值          | 标签   |
| ----------- | ------ |
| {platform}  | 平台   |
| {channelId} | 房间号 |
| {remarks}   | 备注   |
| {owner}     | 主播名 |
| {title}     | 标题   |
| {year}      | 年     |
| {month}     | 月     |
| {date}      | 日     |
| {hour}      | 时     |
| {min}       | 分     |
| {sec}       | 秒     |

## 事件

### RecordStart

录制开始

### RecordStop

录制结束

### error

错误

### RecorderDebugLog

录制相关的log

### videoFileCreated

录制文件开始，如果开启分段，分段时会触发这两个事件，可以用来实现webhook

### videoFileCompleted

录制文件结束

# 协议

与原项目保存一致为 LGPL
