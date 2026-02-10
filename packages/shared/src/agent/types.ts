/**
 * AI Agent 核心类型定义
 */

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: number;
}

/**
 * 技能定义（基于 JSON Schema）
 */
export interface SkillSchema {
  /** 技能名称（唯一标识） */
  name: string;
  /** 技能显示名称 */
  showName: string;
  /** 技能描述 */
  description: string;
  /** 参数定义 */
  parameters: {
    type: "object";
    properties: Record<string, ParameterSchema>;
    required: string[];
  };
  /** 参数收集顺序（可选，用于依赖关系） */
  paramOrder?: string[];
}

/**
 * 参数 Schema
 */
export interface ParameterSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: any[];
  default?: any;
  /** 参数格式，如 "file-path" 表示文件路径 */
  format?: string;
  items?: ParameterSchema;
  properties?: Record<string, ParameterSchema>;
  /** 文件选择相关配置（当 format 为 "file-path" 时使用） */
  fileOptions?: {
    /** 允许的文件扩展名，如 ["mp4", "flv"] */
    extensions?: string[];
    /** 是否支持多选 */
    multi?: boolean;
  };
}

/**
 * 会话状态
 */
export enum ConversationState {
  /** 等待用户输入 */
  IDLE = "idle",
  /** 识别意图中 */
  IDENTIFYING_INTENT = "identifying_intent",
  /** 收集参数中 */
  COLLECTING_PARAMS = "collecting_params",
  /** 等待用户确认 */
  CONFIRMING = "confirming",
  /** 执行中 */
  EXECUTING = "executing",
  /** 已完成 */
  COMPLETED = "completed",
  /** 错误 */
  ERROR = "error",
}

/**
 * 对话会话
 */
export interface ConversationSession {
  /** 会话 ID */
  id: string;
  /** 用户 ID */
  userId?: string;
  /** 会话状态 */
  state: ConversationState;
  /** 对话历史 */
  context: ChatMessage[];
  /** 当前识别的技能 */
  currentSkill: string | null;
  /** 已收集的参数 */
  collectedParams: Record<string, any>;
  /** 缺失的参数列表 */
  missingParams: string[];
  /** 创建时间 */
  startTime: number;
  /** 最后活跃时间 */
  lastActiveTime: number;
  /** 重试次数（用于参数收集） */
  retryCount: Record<string, number>;
}

/**
 * 意图识别结果
 */
export interface IntentResult {
  /** 技能名称 */
  skillName: string;
  /** 置信度 (0-1) */
  confidence: number;
  /** 初步提取的参数 */
  extractedParams: Record<string, any>;
}

/**
 * 参数提取结果
 */
export interface ParameterExtractionResult {
  /** 成功提取的参数 */
  params: Record<string, any>;
  /** 缺失的必需参数 */
  missingRequired: string[];
  /** 验证错误 */
  validationErrors: Record<string, string>;
}

/**
 * 技能执行结果
 */
export interface SkillExecutionResult {
  /** 是否成功 */
  success: boolean;
  /** 返回数据 */
  data?: any;
  /** 错误信息 */
  error?: string;
  /** 用户友好的回复文本 */
  message: string;
}

/**
 * Agent 响应
 */
export interface AgentResponse {
  /** 会话 ID */
  sessionId: string;
  /** 回复文本 */
  message: string;
  /** 当前会话状态 */
  state: ConversationState;
  /** 需要的操作（如需要用户提供参数） */
  action?: "input_required" | "confirm_required" | "completed" | "error";
  /** 额外数据 */
  data?: any;
}

/**
 * Agent 配置
 */
export interface AgentConfig {
  /** 会话超时时间（毫秒） */
  sessionTimeout: number;
  /** 参数收集最大重试次数 */
  maxRetries: number;
  /** 是否启用会话持久化 */
  enablePersistence: boolean;
  /** LLM 温度参数 */
  llmTemperature: number;
  /** 是否启用调试日志 */
  debug: boolean;
}

/**
 * 技能处理器接口
 */
export interface SkillHandler {
  execute(params: Record<string, any>): Promise<SkillExecutionResult>;
}
