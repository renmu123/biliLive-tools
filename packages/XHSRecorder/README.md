# Intro

这是 [biliLive-tools](https://github.com/renmu123/biliLive-tools) 的一个平台插件，为其支持了小红书平台录制，**小红书平台不支持自动监控，每场直播需要修改链接**

# 安装

**建议所有录制器和manager包都升级到最新版，我不会对兼容性做过多考虑**

`npm i @bililive-tools/xhs-recorder @bililive-tools/manager`

# 使用

```ts
import { createRecorderManager } from "@bililive-tools/manager";
import { provider } from "@bililive-tools/xhs-recorder";

const manager = createRecorderManager({ providers: [provider] });
manager.addRecorder({
  providerId: provider.id,
  channelId: "570180068897685033",
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
  quality: 0; // 见画质参数
  qualityRetry?: number; // 画质匹配重试次数, -1为强制匹配画质，0为自动配置，正整数为最大匹配次数
  streamPriorities: []; // 废弃
  titleKeywords?: string; // 禁止录制的标题关键字，英文逗号分开多个
  formatPriorities?: string[]; // 支持，`flv`和`hls` 参数，默认为['flv','hls']
  disableAutoCheck?: boolean; // 为 true 时 manager 将跳过自动检查
  segment?: number | string; // 分段参数，单位分钟，如果以"B","KB","MB","GB"结尾，会尝试使用文件大小分段，仅推荐在使用mesio录制引擎时使用
  videoFormat?: "auto"; // 视频格式： "auto", "ts", "mkv" ，auto模式下, 分段使用 "ts"，不分段使用 "mp4"
  recorderType?: "auto" | "ffmpeg" | "mesio"; // 底层录制器，使用mesio时videoFormat参数无效
  debugLevel?: `verbose` | "basic"; // verbose参数时，录制器会输出更加详细的log
}
```

### 流格式

支持 hls 和 flv

## 直播间ID解析

解析出真实直播间ID

```ts
import { provider } from "@bililive-tools/xhs-recorder";

const url = "http://xhslink.com/m/5OUfMYyJsA";
// 或者 https://www.xiaohongshu.com/livestream/dynpath1OXiHRa1/570180068897685033?timestamp=1773127522447&share_source=share_link&share_source_id=&source=share_out_of_app&host_id=6893946800000000280368d1
const { id } = await provider.resolveChannelInfoFromURL(url);
```

# 协议

LGPL
