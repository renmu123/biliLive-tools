# 通义千问 LLM 使用文档

## 概述

本模块提供了基于 OpenAI 兼容 SDK 调用阿里云通义千问 API 的封装。

## 安装依赖

```bash
pnpm install openai
```

## 快速开始

### 1. 基本使用

```typescript
import { QwenLLM } from "@biliLive-tools/shared";

const llm = new QwenLLM({
  apiKey: "sk-your-api-key-here", // 你的阿里云 API Key
  model: "qwen-plus", // 可选，默认 qwen-plus
});

// 发送单条消息
const response = await llm.sendMessage(
  "你好，请介绍一下自己",
  "你是一个有帮助的助手", // 可选的系统提示
);

console.log(response.content);
```

### 2. 多轮对话

```typescript
const response = await llm.chat([
  { role: "system", content: "你是一个专业的编程助手" },
  { role: "user", content: "什么是 TypeScript？" },
  { role: "assistant", content: "TypeScript 是 JavaScript 的超集..." },
  { role: "user", content: "它有什么优点？" },
]);
```

### 3. 流式输出

```typescript
const stream = await llm.chat([{ role: "user", content: "写一首诗" }], {
  stream: true,
  temperature: 0.8,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || "";
  process.stdout.write(content);
}
```

## 配置选项

### QwenConfig

| 参数    | 类型   | 必填 | 默认值                                            | 说明                  |
| ------- | ------ | ---- | ------------------------------------------------- | --------------------- |
| apiKey  | string | 是   | -                                                 | API Key，格式：sk-xxx |
| model   | string | 否   | qwen-plus                                         | 模型名称              |
| baseURL | string | 否   | https://dashscope.aliyuncs.com/compatible-mode/v1 | API 端点              |
| timeout | number | 否   | 60000                                             | 超时时间（毫秒）      |

### 可用模型

- `qwen-turbo` - 快速模型，适合日常对话
- `qwen-plus` - 平衡性能和成本
- `qwen-max` - 最强大的模型
- `qwen-max-longcontext` - 支持长上下文
- `qwen-vl` - 多模态模型（支持图像）
- 更多模型请参考：https://help.aliyun.com/zh/model-studio/getting-started/models

### ChatOptions

| 参数            | 类型               | 默认值 | 说明                        |
| --------------- | ------------------ | ------ | --------------------------- |
| temperature     | number             | 0.7    | 采样温度，控制随机性 [0, 2) |
| topP            | number             | -      | 核采样概率阈值 (0, 1.0]     |
| maxTokens       | number             | -      | 最大输出 token 数           |
| stream          | boolean            | false  | 是否流式输出                |
| stop            | string \| string[] | -      | 停止词                      |
| presencePenalty | number             | -      | 内容重复度 [-2.0, 2.0]      |
| enableSearch    | boolean            | false  | 是否开启联网搜索            |

## 高级功能

### 控制输出长度

```typescript
const response = await llm.sendMessage("介绍一下北京", undefined, {
  maxTokens: 100, // 限制在 100 个 token 以内
});
```

### 调整创造性

```typescript
// 创意写作 - 高温度
const creative = await llm.sendMessage("写一个故事", undefined, {
  temperature: 0.9,
});

// 事实性回答 - 低温度
const factual = await llm.sendMessage("什么是 DNA？", undefined, {
  temperature: 0.1,
});
```

### 降低重复度

```typescript
const response = await llm.sendMessage("写一段产品介绍", undefined, {
  presencePenalty: 1.0, // 降低重复
});
```

### 联网搜索

```typescript
const response = await llm.sendMessage("2024年最新的 AI 技术发展如何？", undefined, {
  enableSearch: true, // 启用联网搜索获取最新信息
});
```

### 停止词

```typescript
const response = await llm.sendMessage("列举编程语言", undefined, {
  stop: ["\n\n", "###"], // 遇到这些词就停止生成
});
```

## 完整示例

查看 `task/llm-example.ts` 获取更多完整示例：

```bash
tsx packages/shared/src/task/llm-example.ts
```

## API Key 获取

1. 访问阿里云百炼平台：https://www.aliyun.com/product/bailian
2. 登录后进入控制台
3. 创建 API Key
4. 配置环境变量或直接传入代码

## 参考文档

- [阿里云通义千问 API 参考](https://help.aliyun.com/zh/model-studio/qwen-api-reference)
- [OpenAI SDK 文档](https://platform.openai.com/docs/api-reference)

## 注意事项

1. API Key 安全：不要将 API Key 提交到代码仓库
2. 费用控制：注意使用量，避免超出预算
3. 速率限制：注意 API 的调用频率限制
4. 错误处理：生产环境中请添加适当的错误处理和重试逻辑
