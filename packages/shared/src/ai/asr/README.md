# 阿里云 ASR 语音识别使用说明

## 功能概述

实现了阿里云百炼 Fun-ASR 模型的录音文件识别功能，支持：

- ✅ 中文、英文、日语、韩语等多语言识别
- ✅ 自动说话人分离
- ✅ 本地文件自动上传到临时服务
- ✅ 异步任务轮询等待
- ✅ 完整的识别结果（段落、句子、词级别）

## 使用示例

### 1. 基础用法 - 识别在线文件

```typescript
import { AliyunASR } from "@biliLive-tools/shared/ai";

// 创建实例
const asr = new AliyunASR({
  apiKey: "your-api-key",
  model: "fun-asr", // 可选: fun-asr, fun-asr-mtl 等
});

// 识别在线文件
const results = await asr.recognize(["https://example.com/audio.mp3"]);

// 获取识别文本
const text = results[0].transcripts?.[0]?.transcript;
console.log("识别结果:", text);
```

### 2. 识别本地文件（自动上传）

```typescript
// 自动上传本地文件到 tmpfiles.org 并识别
const result = await asr.recognizeLocalFile("./audio.mp3");

// 获取识别文本
const text = result.transcripts?.[0]?.transcript;
console.log("识别结果:", text);
```

### 3. 高级用法 - 说话人分离

```typescript
const results = await asr.recognize(["https://example.com/meeting.mp3"], {
  diarizationEnabled: true, // 启用说话人分离
  speakerCount: 3, // 预期说话人数量
  languageHints: ["zh", "en"], // 语言提示
});

// 获取带说话人信息的句子
const sentences = results[0].transcripts?.[0]?.sentences || [];
sentences.forEach((sentence) => {
  console.log(`说话人${sentence.speakerId}: ${sentence.text}`);
});
```

### 4. 手动控制流程

```typescript
// 1. 上传本地文件
const fileUrl = await asr.uploadToTmpfiles("./audio.mp3");

// 2. 提交识别任务
const taskId = await asr.submitTask({
  fileUrls: [fileUrl],
  channelId: [0],
});

// 3. 轮询等待任务完成
const result = await asr.waitForCompletion(taskId, {
  interval: 1000, // 轮询间隔 1 秒
  maxWaitTime: 10 * 60 * 1000, // 最长等待 10 分钟
});

// 4. 下载识别结果
if (result.results?.[0]?.transcriptionUrl) {
  const detail = await asr.downloadTranscription(result.results[0].transcriptionUrl);
  console.log(detail);
}
```

## API 文档

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
