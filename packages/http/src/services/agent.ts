import {
  AgentController,
  SkillExecutor,
  type SkillHandler,
  type SkillExecutionResult,
  type AgentResponse,
} from "@bililive-tools/shared/agent/index.js";
import { QwenLLM } from "@biliLive-tools/shared/ai/index.js";
import { container, appConfig } from "../index.js";
import recorderService from "./recorder.js";
import logger from "@bililive-tools/shared/utils/log.js";

/**
 * 添加录制器技能处理器
 */
class AddRecorderHandler implements SkillHandler {
  async execute(params: Record<string, any>): Promise<SkillExecutionResult> {
    const { url } = params;

    try {
      logger.info(`[Agent] Adding recorder for URL: ${url}`);

      const data = await recorderService.resolve(url);
      if (!data) {
        throw new Error("无法解析直播间地址");
      }
      // 调用实际的 RecorderService
      const result = await recorderService.addRecorder(data);

      return {
        success: true,
        data: result,
        message: `成功添加直播间录制器：${url}`,
      };
    } catch (error: any) {
      logger.error(`[Agent] Failed to add recorder:`, error);
      return {
        success: false,
        error: error.message,
        message: `添加录制器失败：${error.message}`,
      };
    }
  }
}

/**
 * 上传视频到 B 站技能处理器
 */
class UploadVideoHandler implements SkillHandler {
  async execute(params: Record<string, any>): Promise<SkillExecutionResult> {
    const { filePath } = params;

    try {
      logger.info(`[Agent] Uploading video: ${filePath}`);

      // TODO: 调用实际的上传服务
      // const videoService = container.resolve("videoService");
      // const result = await videoService.uploadToBilibili(filePath);

      // 暂时返回模拟结果
      return {
        success: true,
        data: { filePath },
        message: `视频上传功能正在开发中，文件路径：${filePath}`,
      };
    } catch (error: any) {
      logger.error(`[Agent] Failed to upload video:`, error);
      return {
        success: false,
        error: error.message,
        message: `上传视频失败：${error.message}`,
      };
    }
  }
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

    // 注册技能处理器
    this.registerSkills();

    // 初始化 LLM
    const llmConfig = appConfig.data.ai.songLyricOptimize;
    llmConfig.apiKey = "sk-";
    if (!llmConfig?.apiKey) {
      logger.warn("[Agent] QwenLLM API key not configured, Agent may not work properly");
    }

    const llm = new QwenLLM({
      apiKey: llmConfig?.apiKey || "",
      baseURL: llmConfig?.baseUrl,
      model: llmConfig?.model || "qwen-turbo",
    });

    // 初始化 Agent 控制器
    this.agent = new AgentController(llm, this.skillExecutor, {
      sessionTimeout: 30 * 60 * 1000, // 30 分钟
      maxRetries: 3,
      llmTemperature: 0.3,
      debug: true,
    });

    logger.info(`[Agent] Initialized with skills: ${this.agent.getAvailableSkills().join(", ")}`);
  }

  /**
   * 注册所有技能
   */
  private registerSkills(): void {
    // 注册添加录制器技能
    this.skillExecutor.registerHandler("addRecorder", new AddRecorderHandler());

    // 注册上传视频技能
    this.skillExecutor.registerHandler("uploadVideoToBilibli", new UploadVideoHandler());

    logger.info(
      `[Agent] Registered ${this.skillExecutor.getRegisteredSkills().length} skill handlers`,
    );
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
    this.agent.reloadSkills();
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
