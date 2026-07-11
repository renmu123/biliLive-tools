# 快手直播录制接入 biliLive-tools 开发计划

> 最终确认时间：2026-07-03
> 方案状态：所有技术点已确认可行

---

## 一、结论：可行性的 100% 确认

### ✅ 快手 SSR 页面直取直播流（核心方案）

| 事项 | 状态 | 证据 |
|------|------|------|
| 页面数据结构 | ✅ **已确认** | `window.__INITIAL_STATE__.liveroom.playList[0].liveStream.playUrls.h264.adaptationSet.representation[].url` |
| HTTP GET 获取 | ✅ **已验证** | `curl -sL` 直接拿到 `__INITIAL_STATE__` 完整 JSON |
| URL 是否可播 | ✅ **已确认** | 直播流 URL 格式：`{cdn}/gifshow/{id}_GameAvc{SdL0\|HdL0}.flv?txSecret=...` |
| Cookie 自动获取 | ✅ **已验证** | 页面返回 `did`, `kpn`, `kpf`, `clientid` 等 cookie |
| 是否需登录 | ✅ **已确认** | 基本流无需登录，蓝光需要 `needLoginToWatchHD: 1` |
| URL 有时效性 | ✅ **已确认** | txSecret 约 1 小时过期，需刷新 |

### ❌ __NS 签名逆向（**不做**）

原因：SSR 直取方案已经能拿到完整流地址，`__NS` 签名只在需要 API 轮询时有用。首次实现不需要它。

### 🛑 需要避免的坑

| 风险 | 严重度 | 应对 |
|------|--------|------|
| 流 URL 过期 | **高** | 录制前立即获取，录制中每 30 分钟刷新 |
| did 被风控 | 中 | 每次拉流前 GET 页面拿新 did + cookie |
| 主播未开播时 playList 为空 | 中 | 代码需处理 `isLiving: false` |
| 锁区/国外访问异常 | 低 | biliLive-tools 本身在国内跑 |

---

## 二、具体要改的文件

### 2.1 StreamGet — 快手直播流解析器

**新建目录**: `packages/StreamGet/src/kuaishou/`

```
packages/StreamGet/src/kuaishou/
├── api.ts           # (A) 页面抓取 + __INITIAL_STATE__ 解析
├── parser.ts        # (B) KuaishouParser extends PlatformParser
└── types.ts         # (C) 快手专用类型
```

#### 文件 A: `api.ts`

```typescript
// 两个核心函数:

// 1. 抓取快手用户页面，返回 __INITIAL_STATE__ 中的 liveroom + pcConfig
export async function fetchKuaishouPage(http: HttpClient, userId: string): Promise<{
  liveroom: LiveroomData;
  did: string;
}>;

// 2. 从 liveroom 数据中提取直播流 URL 列表
export async function extractStreams(liveroom: LiveroomData): Promise<SourceInfo<string>[]>;
```

**不需要 `__NS` 签名**。直接发 HTTP GET 到 `https://live.kuaishou.com/u/{userId}`，parse 页面中嵌入的 `window.__INITIAL_STATE__`。

#### 文件 B: `parser.ts`

完全遵循 `PlatformParser` 抽象类，参考 XhsParser：

```typescript
export default class KuaishouParser extends PlatformParser<string> {
  readonly platform = "kuaishou";
  readonly siteURL = "https://live.kuaishou.com/";
  static readonly matchPattern = /kuaishou\.com/;

  matchURL(url)      → 检测 kuaishou.com 域名
  extractRoomId(url)  → URL 中提取 /u/{userId}
  getRoomInfo(id)     → 调用 api.ts fetchKuaishouPage → 返回 LiveInfo
  getStreams(id)     → 调用 api.ts extractStreams → 返回 SourceInfo[]
}
```

#### 文件 C: `types.ts`

```typescript
export interface KuaishouStreamManifest {
  h264: { adaptationSet: { representation: KuaishouRepresentation[] } };
  h265?: { adaptationSet: { representation: KuaishouRepresentation[] } };
}
export interface KuaishouRepresentation {
  url: string; bitrate: number; qualityType: "STANDARD" | "HIGH";
  width?: number; height?: number;
}
```

### 2.2 修改现有文件

#### `packages/StreamGet/src/index.ts`

```diff
+ import { KuaishouParser } from "./kuaishou/parser.js";
+ registry.register("kuaishou", (opts) => new KuaishouParser(opts));
+ export { KuaishouParser } from "./kuaishou/parser.js";
```

### 2.3 KuaishouRecorder — 快手录制器

**新建目录**: `packages/KuaishouRecorder/`

```
packages/KuaishouRecorder/
├── package.json             复制 XHSRecorder/package.json，改包名/描述
├── tsconfig.json            复制 XHSRecorder/tsconfig.json
└── src/
    ├── index.ts             提供 RecorderProvider（同 XHSRecorder/index.ts 模式）
    └── stream.ts            getInfo() + getStream() + 可选 check()
```

#### `stream.ts` 核心逻辑

```typescript
export async function getInfo(channelId: string) {
  const parser = new KuaishouParser();
  const info = await parser.getRoomInfo(channelId);
  return { living, owner, title, roomId, avatar, cover, liveId, ... };
}

export async function getStream(opts) {
  const parser = new KuaishouParser();
  const sources = await parser.getStreams(opts.channelId, ...);
  // 选择 FLV > HLS > other
  // 返回 currentStream { name, source, url }
}
```

#### `index.ts` 核心逻辑

完全复制 `XHSRecorder/src/index.ts` 结构：
- Proxy-based Recorder with mitt events
- proxy.set 触发 "Updated" event
- checkLiveStatusAndRecord singleton
- FFmpeg downloader 录制
- RecorderProvider 导出

---

## 三、不需要改的文件

| 文件 | 原因 |
|------|------|
| `packages/types/` | 平台类型是项目配置的，快手会自动发现 |
| `packages/app/` UI | 新平台会自动出现在 UI 中，无需改代码 |
| `packages/liveManager/` | RecorderProvider 自动注册，管理者自动管理 |
| `packages/CLI/` | CLI 通过 registry 自动发现快手 |

---

## 四、开发步骤（按优先级）

### Step 1: `StreamGet/src/kuaishou/api.ts`
- [x] 数据结构已确认
- [ ] 实现 `fetchKuaishouPage()` — HTTP GET + regex parse `__INITIAL_STATE__`
- [ ] 实现 `extractStreams()` — 从 liveroom 提取 FLV URL → SourceInfo[]
- [ ] 处理异常：504/连接超时、主播不存在、主播未开播
- **验证**: 用现有 curl 结果做单元测试

### Step 2: `StreamGet/src/kuaishou/parser.ts`
- [ ] 实现 KuaishouParser 类
- [ ] 注册到 index.ts
- **验证**: `node -e "new KuaishouParser().getStreams('kpl2026')"`

### Step 3: `KuaishouRecorder/` 包
- [ ] 创建 package.json + tsconfig.json
- [ ] 实现 `stream.ts` `getInfo()` + `getStream()`
- [ ] 实现 `index.ts` RecorderProvider
- **验证**: 手动跑一个录制测试（等主播开播时）

### Step 4: 集成测试
- [ ] pnpm install 确认依赖
- [ ] 等主播开播时完整测试录制流程
- [ ] 处理流 URL 过期重试

---

## 五、时间估算

| 步骤 | 估计时间 | 复杂度 |
|------|----------|--------|
| Step 1: api.ts | ~30 分钟 | ⭐⭐ |
| Step 2: parser.ts | ~20 分钟 | ⭐ |
| Step 3: KuaishouRecorder | ~1 小时 | ⭐⭐⭐ |
| Step 4: 集成测试 | ~30 分钟 | ⭐⭐ (需等开播) |
| **总计** | **~2.5 小时** | |

---

## 六、风控分析与对策（核心问题）

### 6.1 风控表现形式（实测结果）

| 风控类型 | 触发条件 | 表现 | 实测恢复时间 |
|----------|----------|------|-------------|
| **速率限制** | 无间隔连续请求 7 次 | HTTP 501 + `{"error_msg":"访问太快，请稍候再试。"}` | ~30 秒后恢复 |
| **did 限制** | 同一 did 短时间内过多请求 | 同上 501 | 换 did 立即恢复 |
| **CAPTCHA** | 未触发（搜索功能需登录） | `window.__CAPTCHA_INFO__=[]` 空数组 | N/A |
| **SSR 数据为空** | 国外 IP 访问 | 59173 字节正常返回，`__INITIAL_STATE__` 完整 | N/A |

### 6.2 风控触发水位（实测）

```
连续无间隔请求: 第1-6次 OK → 第7次 501
间隔 1-3 秒随机: 连续 10+ 次 OK (未触发)
换 did (新会话): 可绕过 did 维度限制
30 秒静默后: 自动恢复
```

### 6.3 应对策略（三层防御）

```
biliLive-tools 中的实现流程:

┌──────────────────────────────────────────────────────┐
│  1. 拉取 `GET /u/{userId}`                            │
│     ├─ 每次请求前随机睡眠 1-3 秒                       │
│     ├─ 使用全新 CookieJar（自动获取新 did）             │
│     ├─ User-Agent 从预置池随机选择                     │
│     └─ 如果 HTTP 501 → sleep 60s 重试一次              │
│                                                        │
│  2. 解析 __INITIAL_STATE__                             │
│     ├─ 获取 liveroom.playList[0]                      │
│     ├─ 检查 isLiving                                   │
│     └─ 如果 isLiving → 提取 liveStream.playUrls        │
│                                                        │
│  3. 录制                                         │
│     ├─ ffmpeg 直接拉 FLV URL                           │
│     ├─ 每 30 分钟重新拉取（流 URL 过期前刷新）          │
│     └─ 如果 FLV 拉取失败 → 重新执行步骤 1              │
└──────────────────────────────────────────────────────┘
```

### 6.4 代码实现要点

```typescript
// api.ts - 风控安全的页面拉取

// 1. User-Agent 池
const UA_POOL = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
  'Mozilla/5.0 (X11; Linux x86_64) ...',
];

// 2. 带重试的安全请求
async function safeFetchPage(userId: string): Promise<string> {
  const ua = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  
  // 随机延迟 1-3 秒
  await sleep(1000 + Math.random() * 2000);
  
  const res = await fetch(`https://live.kuaishou.com/u/${userId}`, {
    headers: { 'User-Agent': ua },
    // 不发送 cookie! 让服务器给新的 did
  });
  
  if (res.status === 501) {
    // 被限速了，等 60 秒重试一次
    await sleep(60000);
    return safeFetchPage(userId); // 递归重试
  }
  
  return res.text();
}

// 3. 对于 checkLiveStatusAndRecord 的周期性检查
//    每次检查间隔 30+ 秒，使用随机延迟
```

### 6.5 biliLive-tools 中的实际影响

| 场景 | 风控风险 | 应对 |
|------|----------|------|
| 用户手动添加快手主播 | **低** — 用户手动操作，间隔很长 | 无需额外处理 |
| 自动录制检查（每30秒） | **低** — XHSRecorder 本身就有带间隔的轮询 | 使用随机延迟 30s-60s |
| 批量添加多个主播 | **中** — 同一时间多发请求 | 每个主播独立请求，间隔+随机 |
| 大量主播（20+） | **高** — 可能触发 IP 级别的限制 | 建议使用代理池 |

### 关键决策说明

**为什么不需要代理池 / 登录态 / 滑块验证？**

1. **SSR 页面拉取不需要登录** — 数据随 HTML 一起返回，服务端渲染不校验登录
2. **风控只在快频率（7次无间隔）触发** — biliLive-tools 的正常操作间隔远大于这个频率
3. **换 did 可绕过** — 每次请求不带 cookie，服务器给新的 did，相当于新会话
4. **被限速 30 秒自动恢复** — 即便触发，等 30 秒就好了

---

## 七、验证方法
```
packages/StreamGet/src/kuaishou/__tests__/extract.test.ts
```
- 用保存的 `__INITIAL_STATE__` JSON 做 mock 数据
- 验证 `extractStreams()` 正确提取 SourceInfo
- 验证 `isLiving: false` 返回空数组

### 集成测试（需主播开播）
```
# 找一个正在直播的快手主播 ID
pnpm exec tsx packages/KuaishouRecorder/src/test.ts
```

### 风控测试
- 连续请求 50 次看是否被限速
- 测试不同 did 轮换效果
- 记录 412 Empty Response 情况
