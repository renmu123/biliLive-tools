import { QwenLLM } from "../index.js";

/**
 * 基本使用示例
 */
export async function basicExample() {
  console.log("=== 示例 1: 基本对话 ===");

  const llm = new QwenLLM({
    apiKey: "sk-your-api-key-here", // 请替换为你的 API Key
    model: "qwen-plus", // 可选：qwen-turbo, qwen-plus, qwen-max 等
  });

  try {
    // 发送单条消息
    const response = await llm.sendMessage(
      "请用一句话介绍一下北京",
      "你是一个有帮助的助手", // 可选的系统提示
    );

    console.log("回复:", response.content);
    console.log("Token 使用:", response.usage);
  } catch (error) {
    console.error("请求失败:", error);
  }
}

/**
 * 多轮对话示例
 */
export async function multiTurnExample() {
  console.log("\n=== 示例 2: 多轮对话 ===");

  const llm = new QwenLLM({
    apiKey: "sk-your-api-key-here",
  });

  try {
    const response = await llm.chat([
      { role: "system", content: "你是一个专业的旅游顾问" },
      { role: "user", content: "我想去北京旅游，有什么推荐的景点吗？" },
      { role: "assistant", content: "北京有很多著名景点，比如故宫、长城、天坛等..." },
      { role: "user", content: "长城需要玩多久？" },
    ]);

    console.log("回复:", response.content);
  } catch (error) {
    console.error("请求失败:", error);
  }
}

/**
 * 流式输出示例
 */
export async function streamExample() {
  console.log("\n=== 示例 3: 流式输出 ===");

  const llm = new QwenLLM({
    apiKey: "sk-your-api-key-here",
  });

  try {
    const stream = await llm.chat(
      [
        { role: "system", content: "你是一个创意写作助手" },
        { role: "user", content: "写一首关于春天的短诗" },
      ],
      {
        stream: true,
        temperature: 0.8, // 提高创造性
      },
    );

    console.log("流式回复:");
    // @ts-ignore
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      process.stdout.write(content);
    }
    console.log("\n");
  } catch (error) {
    console.error("请求失败:", error);
  }
}

/**
 * 高级参数示例
 */
export async function advancedExample() {
  console.log("\n=== 示例 4: 高级参数配置 ===");

  const llm = new QwenLLM({
    apiKey: "sk-your-api-key-here",
    model: "qwen-plus",
  });

  try {
    const response = await llm.chat(
      [
        { role: "system", content: "你是一个技术博客作者" },
        { role: "user", content: "用 100 字以内介绍一下什么是 RESTful API" },
      ],
      {
        temperature: 0.3, // 降低随机性，让回答更加确定
        maxTokens: 200, // 限制输出长度
        topP: 0.8,
        presencePenalty: 0.5, // 降低重复度
        stop: ["\n\n"], // 遇到两个换行符就停止
      },
    );

    console.log("回复:", response.content);
    console.log("停止原因:", response.finishReason);
  } catch (error) {
    console.error("请求失败:", error);
  }
}

/**
 * 联网搜索示例
 */
export async function searchExample() {
  console.log("\n=== 示例 5: 联网搜索 ===");

  const llm = new QwenLLM({
    apiKey: "sk-your-api-key-here",
    model: "qwen-plus",
  });

  try {
    const response = await llm.sendMessage(
      "2024年巴黎奥运会中国获得了多少枚金牌？",
      "你是一个知识渊博的助手",
      {
        enableSearch: true, // 启用联网搜索
      },
    );

    console.log("回复:", response.content);
  } catch (error) {
    console.error("请求失败:", error);
  }
}

/**
 * 文本续写示例
 */
export async function completeExample() {
  console.log("\n=== 示例 6: 文本续写 ===");

  const llm = new QwenLLM({
    apiKey: "sk-your-api-key-here",
  });

  try {
    const response = await llm.complete("从前有座山，山里有座庙，", {
      temperature: 0.9,
      maxTokens: 100,
    });

    console.log("续写结果:", response.content);
  } catch (error) {
    console.error("请求失败:", error);
  }
}

// 运行示例
if (require.main === module) {
  (async () => {
    await basicExample();
    await multiTurnExample();
    await streamExample();
    await advancedExample();
    await searchExample();
    await completeExample();
  })();
}
