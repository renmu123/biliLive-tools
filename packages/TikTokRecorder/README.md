# TikTok Recorder

这是 biliLive-tools 的 TikTok 录制器，直播信息和流地址由
`@bililive-tools/stream-get` 提供。

```ts
import { createRecorderManager } from "@bililive-tools/manager";
import { provider } from "@bililive-tools/tiktok-recorder";

const manager = createRecorderManager({ providers: [provider] });
manager.addRecorder({
  providerId: provider.id,
  channelId: "example",
  quality: "origin",
  streamPriorities: [],
  sourcePriorities: [],
  disableProvideCommentsWhenRecording: true,
});
manager.startCheckLoop();
```

支持标准链接 `https://www.tiktok.com/@example/live`，并支持：

- `quality`: `origin`、`uhd`、`hd`、`sd`、`ld`、`ao`。
- `formatPriorities`: `flv`、`hls` 的优先级。
- `codecName`: `auto`、`avc`、`hevc`、`avc_only`、`hevc_only`。
- `api`: `auto`、`app`、`web`。
- `auth`: TikTok Cookie。
- `proxy`: HTTP、HTTPS 或 SOCKS5 代理（用于 API 请求与直播流下载；HTTP/HTTPS 代理也用于弹幕连接）。

TikTok 弹幕支持录制普通评论，并在连接断开后自动重连。
