import type {
  AgentConfig,
  AgentResponse,
  ConversationState,
  ConversationSession,
} from "./types.js";
import { ConversationManager } from "./ConversationManager.js";
import { SkillLoader } from "./SkillLoader.js";
import { NLU } from "./nlu/index.js";
import { ParameterCollector } from "./ParameterCollector.js";
import { SkillExecutor } from "./SkillExecutor.js";
import type { Skill } from "./skills/base.js";

/**
 * AI Agent 控制器 - 协调整个对话流程
 */
export class AgentController {
  private conversationManager: ConversationManager;
  private skillLoader: SkillLoader;
  private nlu: NLU;
  private parameterCollector: ParameterCollector;
  private skillExecutor: SkillExecutor;
  private config: AgentConfig;

  constructor(llmProvider: any, skillExecutor: SkillExecutor, config?: Partial<AgentConfig>) {
    // 默认配置
    this.config = {
      sessionTimeout: 30 * 60 * 1000, // 30 分钟
      maxRetries: 3,
      enablePersistence: false,
      llmTemperature: 0.3,
      debug: false,
      ...config,
    };

    // 初始化组件
    this.conversationManager = new ConversationManager(this.config.sessionTimeout);
    this.skillLoader = new SkillLoader();
    this.nlu = new NLU(llmProvider);
    this.parameterCollector = new ParameterCollector(this.nlu, this.config.maxRetries);
    this.skillExecutor = skillExecutor;

    if (this.config.debug) {
      console.log("Agent initialized, waiting for skill registration");
    }
  }

  /**
   * 注册技能
   */
  registerSkills(skills: Skill[]): void {
    this.skillLoader.registerSkills(skills);
    if (this.config.debug) {
      console.log(`Agent registered ${this.skillLoader.getSkillNames().length} skills`);
    }
  }

  /**
   * 创建新会话
   * @param userId 用户 ID
   * @returns 会话 ID
   */
  createSession(userId?: string): string {
    const session = this.conversationManager.createSession(userId);
    return session.id;
  }

  /**
   * 处理用户消息
   * @param sessionId 会话 ID
   * @param userMessage 用户消息
   * @returns Agent 响应
   */
  async handleMessage(sessionId: string, userMessage: string): Promise<AgentResponse> {
    // 获取会话
    let session = this.conversationManager.getSession(sessionId);
    if (!session) {
      // 会话不存在，创建新会话
      session = this.conversationManager.createSession();
      sessionId = session.id;
    }

    // 添加用户消息到上下文
    this.conversationManager.addMessage(sessionId, "user", userMessage);

    try {
      // 根据当前状态处理消息
      let response: AgentResponse;

      switch (session.state) {
        case "idle":
          // 识别意图
          response = await this.handleIntentIdentification(session, userMessage);
          break;

        case "collecting_params":
          // 收集参数
          response = await this.handleParameterCollection(session, userMessage);
          break;

        case "confirming":
          // 处理确认
          response = await this.handleConfirmation(session, userMessage);
          break;

        default:
          // 重置会话并重新识别意图
          this.conversationManager.resetSession(sessionId);
          response = await this.handleIntentIdentification(session, userMessage);
      }

      // 添加助手回复到上下文
      this.conversationManager.addMessage(sessionId, "assistant", response.message);

      return response;
    } catch (error: any) {
      this.log("Error handling message:", error);

      // 更新状态为错误
      this.conversationManager.updateState(sessionId, "error" as ConversationState);

      return {
        sessionId,
        message: `抱歉，处理您的请求时出现错误：${error.message || "未知错误"}`,
        state: "error" as ConversationState,
        action: "error",
      };
    }
  }

  /**
   * 处理意图识别阶段
   */
  private async handleIntentIdentification(
    session: ConversationSession,
    userMessage: string,
  ): Promise<AgentResponse> {
    this.conversationManager.updateState(session.id, "identifying_intent" as ConversationState);

    const availableSkills = this.skillLoader.getAllSkills();

    // 识别意图
    const intent = await this.nlu.identifyIntent(userMessage, availableSkills);
    const skill = this.skillLoader.getSkill(intent.skillName);

    if (!skill) {
      throw new Error(`技能 ${intent.skillName} 不存在`);
    }

    this.log(`Intent identified: ${intent.skillName}, confidence: ${intent.confidence}`);

    // 设置当前技能
    this.conversationManager.setCurrentSkill(session.id, intent.skillName);

    // 提取参数
    const extraction = await this.parameterCollector.extractBatch(userMessage, skill);

    // 更新已收集的参数
    this.conversationManager.updateParams(session.id, extraction.params);

    // 检查参数完整性
    const paramCheck = this.parameterCollector.checkParameters(session, skill);

    if (paramCheck.isComplete) {
      // 参数已完整，进入确认阶段
      return await this.prepareConfirmation(session, skill);
    } else {
      // 参数不完整，进入收集阶段
      this.conversationManager.setMissingParams(session.id, paramCheck.missingRequired);
      this.conversationManager.updateState(session.id, "collecting_params" as ConversationState);

      const nextParam = this.parameterCollector.getNextParameter(session, skill);
      if (!nextParam) {
        throw new Error("No next parameter found");
      }

      const prompt = this.parameterCollector.generatePrompt(nextParam, skill, 0);

      return {
        sessionId: session.id,
        message: `好的，我将帮您${skill.description}。\n\n${prompt}`,
        state: "collecting_params" as ConversationState,
        action: "input_required",
      };
    }
  }

  /**
   * 处理参数收集阶段
   */
  private async handleParameterCollection(
    session: ConversationSession,
    userMessage: string,
  ): Promise<AgentResponse> {
    const skill = this.skillLoader.getSkill(session.currentSkill!);
    if (!skill) {
      throw new Error("Skill not found");
    }

    // 获取当前要收集的参数
    const currentParam = this.parameterCollector.getNextParameter(session, skill);
    if (!currentParam) {
      // 所有参数已收集完成
      return await this.prepareConfirmation(session, skill);
    }

    // 提取参数值
    const value = await this.parameterCollector.collectParameter(userMessage, currentParam, skill);

    if (value === null || value === undefined) {
      // 提取失败，增加重试计数
      const retryCount = this.conversationManager.incrementRetry(session.id, currentParam);

      if (!this.parameterCollector.shouldRetry(retryCount)) {
        // 超过最大重试次数
        this.conversationManager.resetSession(session.id);
        return {
          sessionId: session.id,
          message: `抱歉，我无法理解您提供的${currentParam}信息。操作已取消，请重新开始。`,
          state: "idle" as ConversationState,
          action: "error",
        };
      }

      // 重新询问
      const prompt = this.parameterCollector.generatePrompt(currentParam, skill, retryCount);
      return {
        sessionId: session.id,
        message: prompt,
        state: "collecting_params" as ConversationState,
        action: "input_required",
      };
    }

    // 验证参数
    const validation = this.parameterCollector.validateParameter(currentParam, value, skill);
    if (!validation.valid) {
      const retryCount = this.conversationManager.incrementRetry(session.id, currentParam);

      if (!this.parameterCollector.shouldRetry(retryCount)) {
        this.conversationManager.resetSession(session.id);
        return {
          sessionId: session.id,
          message: `参数验证失败：${validation.error}。操作已取消，请重新开始。`,
          state: "idle" as ConversationState,
          action: "error",
        };
      }

      return {
        sessionId: session.id,
        message: `${validation.error}\n\n${this.parameterCollector.generatePrompt(currentParam, skill, retryCount)}`,
        state: "collecting_params" as ConversationState,
        action: "input_required",
      };
    }

    // 参数有效，保存
    this.conversationManager.updateParams(session.id, { [currentParam]: value });

    // 检查是否还有缺失的参数
    const paramCheck = this.parameterCollector.checkParameters(session, skill);

    if (paramCheck.isComplete) {
      // 所有参数已收集完成
      return await this.prepareConfirmation(session, skill);
    } else {
      // 继续收集下一个参数
      const nextParam = this.parameterCollector.getNextParameter(session, skill);
      if (!nextParam) {
        return await this.prepareConfirmation(session, skill);
      }

      const prompt = this.parameterCollector.generatePrompt(nextParam, skill, 0);
      return {
        sessionId: session.id,
        message: prompt,
        state: "collecting_params" as ConversationState,
        action: "input_required",
      };
    }
  }

  /**
   * 准备确认阶段
   */
  private async prepareConfirmation(
    session: ConversationSession,
    skill: any,
  ): Promise<AgentResponse> {
    this.conversationManager.updateState(session.id, "confirming" as ConversationState);

    const summary = this.parameterCollector.generateParamsSummary(session.collectedParams, skill);

    return {
      sessionId: session.id,
      message: `请确认以下信息：\n\n${summary}\n\n是否确认执行？（回复"是"或"否"）`,
      state: "confirming" as ConversationState,
      action: "confirm_required",
      data: { params: session.collectedParams },
    };
  }

  /**
   * 处理确认阶段
   */
  private async handleConfirmation(
    session: ConversationSession,
    userMessage: string,
  ): Promise<AgentResponse> {
    const confirmed = this.isConfirmation(userMessage);

    if (!confirmed) {
      // 用户拒绝，重置会话
      this.conversationManager.resetSession(session.id);
      return {
        sessionId: session.id,
        message: "操作已取消。如需帮助，请告诉我您想做什么。",
        state: "idle" as ConversationState,
        action: "completed",
      };
    }

    // 用户确认，执行技能
    const skill = this.skillLoader.getSkill(session.currentSkill!);
    if (!skill) {
      throw new Error("Skill not found");
    }

    this.conversationManager.updateState(session.id, "executing" as ConversationState);

    try {
      // 执行技能
      const result = await this.skillExecutor.execute(
        session.currentSkill!,
        session.collectedParams,
        skill,
      );

      // 重置会话状态
      this.conversationManager.updateState(session.id, "completed" as ConversationState);
      this.conversationManager.resetSession(session.id);

      return {
        sessionId: session.id,
        message: result.message,
        state: "completed" as ConversationState,
        action: "completed",
        data: result.data,
      };
    } catch (error: any) {
      this.conversationManager.updateState(session.id, "error" as ConversationState);
      this.conversationManager.resetSession(session.id);

      return {
        sessionId: session.id,
        message: `执行失败：${error.message || "未知错误"}`,
        state: "error" as ConversationState,
        action: "error",
      };
    }
  }

  /**
   * 判断用户是否确认
   */
  private isConfirmation(message: string): boolean {
    const lowerMsg = message.toLowerCase().trim();
    const positiveWords = [
      "是",
      "确认",
      "确定",
      "好的",
      "可以",
      "yes",
      "y",
      "ok",
      "sure",
      "confirm",
    ];
    const negativeWords = ["否", "不", "取消", "no", "n", "cancel"];

    for (const word of positiveWords) {
      if (lowerMsg.includes(word)) return true;
    }

    for (const word of negativeWords) {
      if (lowerMsg.includes(word)) return false;
    }

    // 默认视为确认
    return true;
  }

  /**
   * 获取会话信息
   */
  getSession(sessionId: string): ConversationSession | undefined {
    return this.conversationManager.getSession(sessionId);
  }

  /**
   * 重置会话
   */
  resetSession(sessionId: string): boolean {
    return this.conversationManager.resetSession(sessionId);
  }

  /**
   * 重新注册技能
   */
  reregisterSkills(skills: Skill[]): void {
    this.skillLoader.clear();
    this.registerSkills(skills);
    this.log(`Reregistered skills: ${this.skillLoader.getSkillNames().join(", ")}`);
  }

  /**
   * 获取可用技能列表
   */
  getAvailableSkills(): string[] {
    return this.skillLoader.getSkillNames();
  }

  /**
   * 日志输出
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log("[Agent]", ...args);
    }
  }
}
