# 通义千问 LLM 集成

已成功集成阿里云通义千问 API，使用 OpenAI 兼容的 SDK。

## 已完成的工作

1. ✅ 创建了 `QwenLLM` 类 (`packages/shared/src/ai/llm/qwen.ts`)
   - 支持基本对话
   - 支持多轮对话
   - 支持流式输出
   - 支持联网搜索
   - 完整的 TypeScript 类型支持

2. ✅ 添加了 OpenAI SDK 依赖 (`openai@^4.73.0`)

3. ✅ 创建了使用示例 (`packages/shared/src/task/llm-example.ts`)

4. ✅ 更新了导出 (`packages/shared/src/ai/index.ts`)

5. ✅ 创建了详细的使用文档 (`packages/shared/src/ai/llm/README.md`)

6. ✅ 更新了 `ai.ts` 移除了硬编码的 API Key

## 使用方法

### 基本使用

```typescript
import { QwenLLM } from "@biliLive-tools/shared";

const llm = new QwenLLM({
  apiKey: "sk-your-api-key-here",
  model: "qwen-plus",
});

const response = await llm.sendMessage("你好");
console.log(response.content);
```

### 流式输出

```typescript
const stream = await llm.chat([{ role: "user", content: "写一首诗" }], { stream: true });

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || "";
  process.stdout.write(content);
}
```

## 配置说明

- **apiKey**: 必填，阿里云 API Key
- **model**: 可选，默认 `qwen-plus`
  - `qwen-turbo` - 快速模型
  - `qwen-plus` - 平衡模型
  - `qwen-max` - 最强模型
- **baseURL**: 可选，默认 `https://dashscope.aliyuncs.com/compatible-mode/v1`

## 下一步

1. 在 `.env` 文件中配置 API Key
2. 运行示例代码进行测试
3. 根据实际需求调整参数

## 参考文档

- [阿里云通义千问 API 文档](https://help.aliyun.com/zh/model-studio/qwen-api-reference)
- 本地文档: `packages/shared/src/ai/llm/README.md`
