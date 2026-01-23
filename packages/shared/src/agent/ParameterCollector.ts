import type { ConversationSession, SkillSchema, ParameterExtractionResult } from "./types.js";
import type { NLU } from "./nlu/index.js";

/**
 * 参数补全器 - 处理参数缺失的情况
 */
export class ParameterCollector {
  constructor(
    private nlu: NLU,
    private maxRetries: number = 3,
  ) {}

  /**
   * 检查参数是否完整
   * @param session 会话
   * @param skill 技能定义
   * @returns 参数完整性检查结果
   */
  checkParameters(
    session: ConversationSession,
    skill: SkillSchema,
  ): {
    isComplete: boolean;
    missingRequired: string[];
    missingOptional: string[];
  } {
    const { required } = skill.parameters;
    const collected = session.collectedParams;

    const missingRequired = required.filter(
      (param) => collected[param] === null || collected[param] === undefined,
    );

    const allParams = Object.keys(skill.parameters.properties);
    const missingOptional = allParams.filter(
      (param) =>
        !required.includes(param) && (collected[param] === null || collected[param] === undefined),
    );

    return {
      isComplete: missingRequired.length === 0,
      missingRequired,
      missingOptional,
    };
  }

  /**
   * 获取下一个需要收集的参数
   * @param session 会话
   * @param skill 技能定义
   * @returns 下一个参数名称，如果全部收集完成则返回 null
   */
  getNextParameter(session: ConversationSession, skill: SkillSchema): string | null {
    const { missingRequired } = this.checkParameters(session, skill);

    if (missingRequired.length === 0) {
      return null;
    }

    // 如果定义了参数顺序，按顺序返回
    if (skill.paramOrder) {
      for (const param of skill.paramOrder) {
        if (missingRequired.includes(param)) {
          return param;
        }
      }
    }

    // 否则返回第一个缺失的必需参数
    return missingRequired[0];
  }

  /**
   * 生成参数收集提示
   * @param paramName 参数名
   * @param skill 技能定义
   * @param retryCount 重试次数
   * @returns 提示文本
   */
  generatePrompt(paramName: string, skill: SkillSchema, retryCount: number = 0): string {
    const paramSchema = skill.parameters.properties[paramName];
    if (!paramSchema) {
      return `请提供 ${paramName}`;
    }

    return this.nlu.generateParameterPrompt(paramName, paramSchema, retryCount);
  }

  /**
   * 处理用户对参数的回复
   * @param userInput 用户输入
   * @param paramName 当前要收集的参数名
   * @param skill 技能定义
   * @returns 提取的参数值
   */
  async collectParameter(userInput: string, paramName: string, skill: SkillSchema): Promise<any> {
    const paramSchema = skill.parameters.properties[paramName];
    if (!paramSchema) {
      throw new Error(`Unknown parameter: ${paramName}`);
    }

    // 使用 NLU 提取单个参数
    const value = await this.nlu.extractSingleParameter(userInput, paramName, paramSchema);

    return value;
  }

  /**
   * 批量提取参数（从一次输入中尽可能多地提取）
   * @param userInput 用户输入
   * @param skill 技能定义
   * @returns 参数提取结果
   */
  async extractBatch(userInput: string, skill: SkillSchema): Promise<ParameterExtractionResult> {
    return await this.nlu.extractParameters(userInput, skill);
  }

  /**
   * 验证参数值
   * @param paramName 参数名
   * @param value 参数值
   * @param skill 技能定义
   * @returns 验证结果 { valid: boolean, error?: string }
   */
  validateParameter(
    paramName: string,
    value: any,
    skill: SkillSchema,
  ): { valid: boolean; error?: string } {
    const paramSchema = skill.parameters.properties[paramName];
    if (!paramSchema) {
      return { valid: false, error: "未知参数" };
    }

    // 必需参数检查
    if (skill.parameters.required.includes(paramName) && (value === null || value === undefined)) {
      return { valid: false, error: "该参数为必需参数" };
    }

    // 类型检查
    if (value !== null && value !== undefined) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (paramSchema.type === "number" && actualType !== "number") {
        return { valid: false, error: "参数类型必须是数字" };
      }
      if (paramSchema.type === "string" && actualType !== "string") {
        return { valid: false, error: "参数类型必须是字符串" };
      }
      if (paramSchema.type === "boolean" && actualType !== "boolean") {
        return { valid: false, error: "参数类型必须是布尔值" };
      }
      if (paramSchema.type === "array" && actualType !== "array") {
        return { valid: false, error: "参数类型必须是数组" };
      }

      // 枚举检查
      if (paramSchema.enum && !paramSchema.enum.includes(value)) {
        return {
          valid: false,
          error: `参数值必须是以下之一: ${paramSchema.enum.join(", ")}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * 判断是否应该重试
   * @param retryCount 当前重试次数
   * @returns 是否应该继续重试
   */
  shouldRetry(retryCount: number): boolean {
    return retryCount < this.maxRetries;
  }

  /**
   * 生成参数摘要（用于确认）
   * @param params 参数对象
   * @param skill 技能定义
   * @returns 参数摘要文本
   */
  generateParamsSummary(params: Record<string, any>, skill: SkillSchema): string {
    const lines: string[] = [];

    for (const [name, value] of Object.entries(params)) {
      if (value === null || value === undefined) continue;

      const paramSchema = skill.parameters.properties[name];
      const description = paramSchema?.description || name;

      lines.push(`- ${description}: ${value}`);
    }

    return lines.join("\n");
  }
}
