import {
  AgentController,
  SkillExecutor,
  type SkillExecutionResult,
  type AgentResponse,
} from "@bililive-tools/shared/agent/index.js";
import { createSkills } from "@bililive-tools/shared/agent/skillRegistry.js";
import { QwenLLM } from "@biliLive-tools/shared/ai/index.js";
import { container, appConfig } from "../index.js";
import recorderService from "./recorder.js";
import logger from "@bililive-tools/shared/utils/log.js";

function getVendor(vendorId: string) {
  const data = appConfig.get("ai") || {};
  const vendor = data.vendors.find((v: any) => v.id === vendorId);
  if (!vendor) {
    return null;
  }
  return vendor;
}

/**
 * 获取配置
 */
function getAgentConfig() {
  const data = appConfig.get("ai") || {};
  if (data?.vendors.length === 0) {
    throw new Error("请先在配置中设置 AI 服务商的 API Key");
  }

  const vendorId = data.vendors.find((v) => v.provider === "aliyun")?.id;
  if (!vendorId) {
    throw new Error("请先在配置中设置 阿里云 ASR 服务商的 API Key");
  }
  const vendor = getVendor(vendorId);

  return {
    data,
    vendorId,
    model: data?.agent?.model || "qwen-plus",
    apiKey: vendor?.apiKey,
    baseUrl: vendor?.baseURL,
  };
}

/**
 * Agent 服务类
 */
export class AgentService {
  private agent: AgentController;
  private skillExecutor: SkillExecutor;

  constructor() {
    // 初始化技能执行器
    this.skillExecutor = new SkillExecutor();

    // 初始化 LLM
    const llmConfig = getAgentConfig();
    if (!llmConfig?.apiKey) {
      logger.warn("[Agent] QwenLLM API key not configured, Agent may not work properly");
    }
    console.log({
      apiKey: llmConfig?.apiKey,
      baseURL: llmConfig?.baseUrl,
      model: llmConfig?.model,
    });

    const llm = new QwenLLM({
      apiKey: llmConfig?.apiKey || "",
      baseURL: llmConfig?.baseUrl,
      model: llmConfig?.model || "qwen-plus",
    });

    // 初始化 Agent 控制器
    this.agent = new AgentController(llm, this.skillExecutor, {
      sessionTimeout: 30 * 60 * 1000, // 30 分钟
      maxRetries: 3,
      llmTemperature: 0.3,
      debug: true,
    });

    // 从 shared 统一注册技能
    this.registerSkills();

    logger.info(`[Agent] Initialized with skills: ${this.agent.getAvailableSkills().join(", ")}`);
  }

  /**
   * 注册所有技能
   */
  private registerSkills(): void {
    // 使用 shared 中的统一技能注册
    const skills = createSkills({
      recorderService: recorderService,
    });

    // 注册到 Agent Controller (用于 schema 管理)
    this.agent.registerSkills(skills);

    // 注册到 Skill Executor (用于执行)
    for (const skill of skills) {
      this.skillExecutor.registerHandler(skill.schema.name, skill);
    }

    logger.info(`[Agent] Registered ${skills.length} skills`);
  }

  /**
   * 创建新会话
   */
  createSession(userId?: string): string {
    const sessionId = this.agent.createSession(userId);
    logger.info(`[Agent] Created new session: ${sessionId} for user: ${userId || "anonymous"}`);
    return sessionId;
  }

  /**
   * 处理用户消息
   */
  async chat(sessionId: string, message: string): Promise<AgentResponse> {
    logger.info(`[Agent] Processing message in session ${sessionId}: ${message}`);

    try {
      const response = await this.agent.handleMessage(sessionId, message);
      logger.info(
        `[Agent] Response for session ${sessionId}, state: ${response.state}, action: ${response.action}`,
      );
      return response;
    } catch (error: any) {
      logger.error(`[Agent] Error processing message:`, error);
      throw error;
    }
  }

  /**
   * 获取会话信息
   */
  getSession(sessionId: string) {
    return this.agent.getSession(sessionId);
  }

  /**
   * 重置会话
   */
  resetSession(sessionId: string): boolean {
    logger.info(`[Agent] Resetting session: ${sessionId}`);
    return this.agent.resetSession(sessionId);
  }

  /**
   * 获取可用技能列表
   */
  getAvailableSkills(): string[] {
    return this.agent.getAvailableSkills();
  }

  /**
   * 重新加载技能
   */
  reloadSkills(): void {
    logger.info("[Agent] Reloading skills");

    // 重新创建技能实例
    const skills = createSkills({
      recorderService: recorderService,
    });

    // 重新注册到 Agent Controller
    this.agent.reregisterSkills(skills);

    // 重新注册到 Skill Executor
    for (const skill of skills) {
      this.skillExecutor.registerHandler(skill.schema.name, skill);
    }

    logger.info(`[Agent] Reloaded ${skills.length} skills`);
  }
}

// 导出单例实例
let agentServiceInstance: AgentService | null = null;

export function getAgentService(): AgentService {
  if (!agentServiceInstance) {
    agentServiceInstance = new AgentService();
  }
  return agentServiceInstance;
}

export default {
  getAgentService,
};
