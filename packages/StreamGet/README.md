# stream-get

直播平台链接解析器 - 支持 Bilibili、DouYin、DouYu、HuYa 等平台的流地址解析。

## 特性

- 🎯 **统一接口** - 提供一致的 API 调用方式
- 🔌 **平台特定** - 支持针对特定平台的定制化调用
- 🌐 **代理支持** - 内置 HTTP/HTTPS/SOCKS5 代理支持
- 🔒 **类型安全** - 完整的 TypeScript 类型定义
- 🎨 **原生质量** - 保留平台原生的质量标识，不做额外映射

## 安装

```bash
pnpm add stream-get
```

## 使用方式

### 1. 通用解析（自动检测平台）

```typescript
import { StreamParser } from "stream-get";

const parser = new StreamParser({
  proxy: "http://127.0.0.1:7890", // 可选：配置代理
  timeout: 15000, // 可选：请求超时
});

// 自动检测并解析
const result = await parser.parse("https://live.bilibili.com/123");

console.log(result.liveInfo.title);
console.log(result.liveInfo.owner);
console.log(result.sources[0].streams[0].url);

// 检测平台
const platform = parser.detectPlatform("https://live.douyin.com/456");
console.log(platform); // 'douyin'

// 列出支持的平台
const platforms = parser.listPlatforms();
console.log(platforms); // ['bilibili', 'douyin', 'douyu', 'huya']
```

### 2. 平台特定调用

```typescript
import { BilibiliParser } from "stream-get";

const biliParser = new BilibiliParser({
  cookie: "your_cookie_here",
  proxy: {
    uri: "socks5://127.0.0.1:1080",
    token: "auth_token", // 可选
  },
});

// 获取直播信息
const liveInfo = await biliParser.getLiveInfo("123");
console.log(liveInfo.title);
console.log(liveInfo.living); // 是否在播

// 获取流地址
const sources = await biliParser.getStreams("123", {
  qn: 10000, // Bilibili 平台特定参数
});

sources.forEach((source) => {
  console.log(`线路: ${source.name}`);
  source.streams.forEach((stream) => {
    console.log(`  画质: ${stream.qualityDesc} (qn: ${stream.quality})`);
    console.log(`  地址: ${stream.url}`);
  });
});

// 完整解析
const fullResult = await biliParser.parse("https://live.bilibili.com/123");
```

### 3. 其他平台

```typescript
import { DouyinParser, DouyuParser, HuyaParser } from "stream-get";

// 抖音
const dyParser = new DouyinParser({ proxy: "http://127.0.0.1:7890" });
const dyResult = await dyParser.parse("https://live.douyin.com/456");
console.log(dyResult.sources[0].streams[0].quality); // 'origin', 'uhd', 'hd' 等

// 斗鱼
const douyuParser = new DouyuParser();
const douyuResult = await douyuParser.parse("https://www.douyu.com/789");
console.log(douyuResult.sources[0].streams[0].quality); // rate: 0, 2, 3, 4, 8

// 虎牙
const huyaParser = new HuyaParser();
const huyaResult = await huyaParser.parse("https://www.huya.com/abc");
console.log(huyaResult.sources[0].streams[0].quality); // bitRate 值
```

## API 文档

### StreamParser

通用解析器，自动检测平台。

#### 方法

- `parse(urlOrRoomId, opts?)` - 解析直播间，返回完整信息
- `detectPlatform(url)` - 检测 URL 对应的平台
- `getLiveInfo(platform, roomId, opts?)` - 获取直播间信息
- `getStreams(platform, roomId, opts?)` - 获取流地址
- `listPlatforms()` - 列出所有支持的平台

### PlatformParser

平台特定解析器基类，所有平台解析器继承此类。

#### 方法

- `matchURL(url)` - 判断 URL 是否匹配该平台
- `extractRoomId(url)` - 从 URL 提取房间 ID
- `getLiveInfo(roomId, opts?)` - 获取直播间信息
- `getStreams(roomId, opts?)` - 获取流地址
- `parse(urlOrRoomId, opts?)` - 完整解析

### 类型定义

```typescript
interface LiveInfo {
  platform: string;
  roomId: string;
  living: boolean;
  title: string;
  owner: string;
  avatar?: string;
  cover?: string;
  liveStartTime?: Date;
  [key: string]: any; // 平台特定字段
}

interface StreamInfo<Q = any> {
  url: string;
  quality: Q; // 平台原生质量
  qualityDesc: string;
  format: string;
  [key: string]: any;
}

interface SourceInfo<Q = any> {
  name: string;
  streams: StreamInfo<Q>[];
  [key: string]: any;
}

interface ParseResult<Q = any> {
  liveInfo: LiveInfo;
  sources: SourceInfo<Q>[];
}
```

### 代理配置

```typescript
interface ProxyConfig {
  uri: string;  // 'http://127.0.0.1:7890', 'socks5://127.0.0.1:1080'
  token?: string;
}

// 简写形式
proxy: 'http://127.0.0.1:7890'

// 完整形式
proxy: {
  uri: 'socks5://127.0.0.1:1080',
  token: 'auth_token'
}
```

## 支持的平台

- ✅ **Bilibili** - 完整实现
- 🚧 **DouYin** - 开发中
- 🚧 **DouYu** - 开发中
- 🚧 **HuYa** - 开发中

## 平台特定特性

### Bilibili

- 保留原生 `qn` 画质值（10000, 20000, 30000 等）
- 支持 Cookie 获取高画质
- 支持多种协议（http_stream, http_hls）和编码（avc, hevc）

### DouYin

- 保留原生画质标识（'origin', 'uhd', 'hd', 'sd', 'ld'）
- 支持负载均衡模式
- 支持短链接解析

### DouYu

- 保留原生 `rate` 值（0, 2, 3, 4, 8）
- 内置签名函数

### HuYa

- 保留原生 `bitRate` 值
- 支持多 API 模式（auto/web/mp/wup）

## 错误处理

```typescript
import {
  StreamGetError,
  UnsupportedPlatformError,
  RoomNotFoundError,
  NotLivingError,
  NetworkError,
  ParseError,
} from "stream-get";

try {
  const result = await parser.parse(url);
} catch (error) {
  if (error instanceof UnsupportedPlatformError) {
    console.log("不支持的平台");
  } else if (error instanceof RoomNotFoundError) {
    console.log("房间不存在");
  } else if (error instanceof NotLivingError) {
    console.log("未开播");
  } else if (error instanceof NetworkError) {
    console.log("网络错误");
  } else if (error instanceof ParseError) {
    console.log("解析错误");
  }
}
```

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 测试
pnpm test

# 监听模式
pnpm watch
```

## 感谢

- [Streamget](https://github.com/ihmily/streamget) - Python 的直播间解析库，本项目受其启发

## License

MIT
