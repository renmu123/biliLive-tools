# ASR 语音识别使用说明

## 功能概述

实现了多个 ASR 服务提供商的统一接口，支持：

- ✅ **阿里云 Fun-ASR**: 中文、英文、日语、韩语等多语言识别，支持说话人分离
- ✅ **OpenAI Whisper**: 多语言识别，支持多种音频格式
- ✅ **统一适配器**: 通过 `createASRProvider(modelId)` 自动选择提供商
- ✅ 本地文件自动上传
- ✅ 完整的识别结果（段落、句子、词级别）

## 快速开始

### 推荐方式：使用适配器（自动选择提供商）

```typescript
import { createASRProvider } from "@biliLive-tools/shared/ai";

// 根据配置中的 modelId 自动选择提供商（阿里云/OpenAI）
const asr = createASRProvider("your-model-id");

// 识别本地文件，返回标准格式
const result = await asr.recognizeLocalFile("./audio.mp3");

console.log("完整文本:", result.text);
console.log("语言:", result.language);
console.log("时长:", result.duration, "秒");

// 遍历分段
result.segments.forEach((seg) => {
  console.log(`[${seg.start}s - ${seg.end}s] ${seg.text}`);
});
```

### 标准格式说明

适配器返回的 `StandardASRResult` 格式：

```typescript
interface StandardASRResult {
  text: string; // 完整转写文本
  duration?: number; // 音频时长（秒）
  language?: string; // 识别的语言代码
  segments: StandardASRSegment[]; // 句子级别分段
  words?: StandardASRWord[]; // 词级别时间戳（可选）
}
```

## 使用示例

### 1. OpenAI Whisper 识别

```typescript
import { OpenAIWhisperASR } from "@biliLive-tools/shared/ai";

const asr = new OpenAIWhisperASR({
  apiKey: "your-openai-api-key",
  baseURL: "https://api.openai.com/v1", // 可选，支持 Azure OpenAI
  model: "whisper-1",
});

// 识别本地文件
const result = await asr.recognizeLocalFile("./audio.mp3", {
  language: "zh", // 可选：指定语言提高准确度
  prompt: "这是一段关于技术的讨论", // 可选：提示文本
});

console.log("识别结果:", result.text);
console.log("语言:", result.language);
console.log("时长:", result.duration, "秒");
```

### 2. 阿里云 Fun-ASR 识别

```typescript
import { AliyunASR } from "@biliLive-tools/shared/ai";

// 创建实例
const asr = new AliyunASR({
  apiKey: "your-api-key",
  model: "fun-asr", // 可选: fun-asr, fun-asr-mtl 等
});

// 识别在线文件
const result = await asr.recognize("https://example.com/audio.mp3");

// 获取识别文本
const text = result.transcripts?.[0]?.text;
console.log("识别结果:", text);
```

### 3. 识别本地文件（阿里云自动上传）

```typescript
// 自动上传本地文件到临时服务并识别
const result = await asr.recognizeLocalFile("./audio.mp3");

// 获取识别文本
const text = result.transcripts?.[0]?.text;
console.log("识别结果:", text);
```

### 4. 高级用法 - 说话人分离（阿里云）

```typescript
const result = await asr.recognize("https://example.com/meeting.mp3", {
  diarizationEnabled: true, // 启用说话人分离
  speakerCount: 3, // 预期说话人数量
  languageHints: ["zh", "en"], // 语言提示
});

// 获取带说话人信息的句子
const sentences = result.transcripts?.[0]?.sentences || [];
sentences.forEach((sentence) => {
  console.log(`说话人${sentence.speakerId}: ${sentence.text}`);
});
```

### 5. 使用适配器 - 统一标准格式

```typescript
import { createASRProvider, AliyunASRAdapter, OpenAIASRAdapter } from "@biliLive-tools/shared/ai";

// 方式 1: 通过 modelId 自动创建（推荐）
const asr = createASRProvider("your-model-id-from-config");

// 方式 2: 手动创建阿里云适配器
const aliyunAdapter = new AliyunASRAdapter({
  apiKey: "your-aliyun-key",
  model: "fun-asr",
});

// 方式 3: 手动创建 OpenAI 适配器
const openaiAdapter = new OpenAIASRAdapter({
  apiKey: "your-openai-key",
  model: "whisper-1",
  baseURL: "https://api.openai.com/v1",
});

// 所有适配器返回统一的标准格式
const result = await asr.recognizeLocalFile("./audio.mp3");

console.log("完整文本:", result.text);
result.segments.forEach((seg) => {
  console.log(`[${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s] ${seg.text}`);
  if (seg.speaker) console.log(`  说话人: ${seg.speaker}`);
});

// 词级别时间戳（如果提供商支持）
if (result.words) {
  console.log("词级别时间戳:", result.words.length, "个词");
}
```

### 6. 手动控制流程（阿里云）

```typescript
// 1. 上传本地文件
const fileUrl = await asr.uploadToTmpfiles("./audio.mp3");

// 2. 提交识别任务
const taskId = await asr.submitTask({
  fileUrl: fileUrl,
  channelId: [0],
});

// 3. 轮询等待任务完成
const result = await asr.waitForCompletion(taskId, {
  interval: 1000, // 轮询间隔 1 秒
  maxWaitTime: 10 * 60 * 1000, // 最长等待 10 分钟
});

// 4. 下载识别结果
if (result.results?.[0]?.transcription_url) {
  const detail = await asr.downloadTranscription(result.results[0].transcription_url);
  console.log(detail);
}
```

## API 文档

### createASRProvider (推荐)

根据 modelId 自动创建 ASR 提供商实例。

```typescript
function createASRProvider(modelId: string): ASRProvider;
```

**返回:** 统一的 `ASRProvider` 接口，支持：

- `recognize(fileUrl: string): Promise<StandardASRResult>`
- `recognizeLocalFile(filePath: string): Promise<StandardASRResult>`

### AliyunASR 构造函数

```typescript
new AliyunASR(options: AliyunASROptions)
```

**参数:**

- `apiKey` (必填): 阿里云 API Key
- `baseURL` (可选): 自定义 API 地址，默认 `https://dashscope.aliyuncs.com`
- `model` (可选): 模型名称，默认 `fun-asr`
  - `fun-asr`: 稳定版，支持中英日
  - `fun-asr-mtl`: 多语言版，支持 30+ 语言

### OpenAIWhisperASR 构造函数

```typescript
new OpenAIWhisperASR(options: OpenAIWhisperASROptions)
```

**参数:**

- `apiKey` (必填): OpenAI API Key
- `baseURL` (可选): 自定义 API 地址，默认 `https://api.openai.com/v1`
  - 支持 Azure OpenAI: `https://your-resource.openai.azure.com/openai/deployments/your-deployment`
  - 支持本地 Whisper 服务或其他兼容端点
- `model` (可选): 模型名称，默认 `whisper-1`
  - `fun-asr-2025-11-07`: 快照版
  - `fun-asr-2025-08-25`: 快照版（中英）
  - `fun-asr-mtl-2025-08-25`: 多语言快照版

### 主要方法

#### recognize()

一站式识别：提交任务 -> 等待完成 -> 获取结果

```typescript
recognize(
  fileUrls: string[],
  params?: {
    vocabularyId?: string;        // 热词 ID
    channelId?: number[];         // 音轨索引，默认 [0]
    diarizationEnabled?: boolean; // 说话人分离
    speakerCount?: number;        // 说话人数量 (2-100)
    languageHints?: string[];     // 语言代码，如 ["zh", "en"]
  }
): Promise<TranscriptionDetail[]>
```

#### recognizeLocalFile()

识别本地文件（自动上传）

```typescript
recognizeLocalFile(
  filePath: string,
  params?: Omit<SubmitTaskParams, "fileUrls">
): Promise<TranscriptionDetail>
```

#### uploadToTmpfiles()

上传本地文件到 tmpfiles.org

```typescript
uploadToTmpfiles(filePath: string): Promise<string>
```

**返回:** 文件的公网访问 URL（有效期 24 小时）

## 支持的音频格式

`aac`, `amr`, `avi`, `flac`, `flv`, `m4a`, `mkv`, `mov`, `mp3`, `mp4`, `mpeg`, `ogg`, `opus`, `wav`, `webm`, `wma`, `wmv`

## 约束条件

- 音频文件不超过 2GB
- 时长在 12 小时以内
- 单次请求最多支持 100 个文件 URL
- 识别结果 URL 有效期 24 小时
- tmpfiles.org 上传的文件有效期 24 小时

## 错误处理

```typescript
try {
  const result = await asr.recognizeLocalFile("./audio.mp3");
  console.log(result);
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error("API 错误:", error.response?.data);
  } else {
    console.error("其他错误:", error);
  }
}
```

## 在应用中集成

在 `packages/app/src/renderer/src/pages/setting/AISetting.vue` 中配置 API Key 后，可以在其他模块中这样使用：

```typescript
import { appConfig } from "@biliLive-tools/shared";
import { AliyunASR } from "@biliLive-tools/shared/ai";

// 获取配置的 API Key
const config = appConfig.getAll();
const vendor = config.ai.vendors.find((v) => v.provider === "aliyun");

if (!vendor) {
  throw new Error("请先在设置中配置阿里云 API Key");
}

// 创建 ASR 实例
const asr = new AliyunASR({
  apiKey: vendor.apiKey,
  baseURL: vendor.baseURL,
});

// 使用
const result = await asr.recognizeLocalFile("./audio.mp3");
```

## 参考资料

- [阿里云 Fun-ASR 官方文档](https://help.aliyun.com/zh/model-studio/fun-asr-recorded-speech-recognition-restful-api)
- [tmpfiles.org API 文档](https://tmpfiles.org/api)
