# Intro

原项目：https://github.com/WhiteMinds/LiveAutoRecord

这是 [biliLive-tools](https://github.com/renmu123/biliLive-tools) 的一个平台插件，支持管理录播

# 安装

**建议所有录制器和manager包都升级到最新版，我不会对兼容性做过多考虑**

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
  savePathRule: "D:\\录制\\{platforme}}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}", // 保存路径，占位符见文档，支持 [ejs](https://ejs.co/) 模板引擎
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

### 函数

### addRecorder

添加录制器，具体参数见各录制插件

### removeRecorder

移除录制器

### startCheckLoop

开启自动监听

### stopCheckLoop

停止自动监听

### startRecord

手动开启录制

### stopRecord

手动开启录制

### setFFMPEGPath

设置ffmpeg可执行路径

```ts
import { setFFMPEGPath } from "@bililive-tools/manager";

setFFMPEGPath("ffmpeg.exe");
```

## savePathRule 占位符参数

默认值为 `{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}`

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

### RecorderProgress

ffmpeg录制相关数据

### RecoderLiveStart

直播开始，**并非录制开始，同一场直播不会重复触发**

# 协议

与原项目保存一致为 LGPL
