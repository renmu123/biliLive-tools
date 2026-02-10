/**
 * AI Agent 使用示例
 */

import { AgentController, SkillExecutor } from "./index.js";
import { AddRecorderHandler, UploadVideoHandler } from "./handlers.js";

/**
 * 初始化 Agent 示例
 */
export function createAgent(llmProvider: any) {
  // 1. 创建技能执行器
  const skillExecutor = new SkillExecutor();

  // 2. 注册技能处理器
  skillExecutor.registerHandler("addRecorder", new AddRecorderHandler());
  skillExecutor.registerHandler("uploadVideoToBilibli", new UploadVideoHandler());

  // 3. 创建 Agent 控制器
  const agent = new AgentController(llmProvider, skillExecutor, {
    sessionTimeout: 30 * 60 * 1000, // 30 分钟
    maxRetries: 3,
    llmTemperature: 0.3,
    debug: true,
  });

  return agent;
}

/**
 * 使用示例 1：完整对话流程
 */
export async function example1(agent: AgentController) {
  // 创建会话
  const sessionId = agent.createSession("user-123");

  // 用户输入：包含完整参数
  const response1 = await agent.handleMessage(
    sessionId,
    "帮我添加一个录制器，直播间地址是 https://live.bilibili.com/123456",
  );
  console.log("Agent:", response1.message);
  // 期望：识别意图 -> 提取参数 -> 请求确认

  // 用户确认
  const response2 = await agent.handleMessage(sessionId, "是的，确认");
  console.log("Agent:", response2.message);
  // 期望：执行技能 -> 返回结果
}

/**
 * 使用示例 2：参数缺失，多轮对话
 */
export async function example2(agent: AgentController) {
  const sessionId = agent.createSession();

  // 用户输入：缺少参数
  const response1 = await agent.handleMessage(sessionId, "我想添加一个录制器");
  console.log("Agent:", response1.message);
  // 期望：识别意图 -> 发现缺少参数 -> 询问 URL

  // 用户提供参数
  const response2 = await agent.handleMessage(sessionId, "https://live.bilibili.com/123456");
  console.log("Agent:", response2.message);
  // 期望：收集参数 -> 请求确认

  // 用户确认
  const response3 = await agent.handleMessage(sessionId, "确认");
  console.log("Agent:", response3.message);
  // 期望：执行技能 -> 返回结果
}

/**
 * 使用示例 3：用户取消操作
 */
export async function example3(agent: AgentController) {
  const sessionId = agent.createSession();

  const response1 = await agent.handleMessage(
    sessionId,
    "添加录制器 https://live.bilibili.com/123456",
  );
  console.log("Agent:", response1.message);

  // 用户取消
  const response2 = await agent.handleMessage(sessionId, "不，取消");
  console.log("Agent:", response2.message);
  // 期望：取消操作 -> 重置会话
}

/**
 * 使用示例 4：多个会话并行
 */
export async function example4(agent: AgentController) {
  // 会话 1
  const session1 = agent.createSession("user-1");
  await agent.handleMessage(session1, "添加录制器");

  // 会话 2
  const session2 = agent.createSession("user-2");
  await agent.handleMessage(session2, "上传视频");

  // 两个会话独立运行，互不干扰
}

/**
 * 使用示例 5：重试机制
 */
export async function example5(agent: AgentController) {
  const sessionId = agent.createSession();

  const response1 = await agent.handleMessage(sessionId, "添加录制器");
  console.log("Agent:", response1.message);
  // 期望：询问 URL

  // 用户提供无效输入
  const response2 = await agent.handleMessage(sessionId, "不知道");
  console.log("Agent:", response2.message);
  // 期望：重新询问 URL（第 1 次重试）

  const response3 = await agent.handleMessage(sessionId, "随便");
  console.log("Agent:", response3.message);
  // 期望：重新询问 URL（第 2 次重试）

  const response4 = await agent.handleMessage(sessionId, "算了");
  console.log("Agent:", response4.message);
  // 期望：超过最大重试次数 -> 取消操作
}
