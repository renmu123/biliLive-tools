import type { SkillSchema, SkillExecutionResult, SkillHandler } from "./types.js";

/**
 * 技能执行引擎 - 将技能映射到实际的执行函数
 */
export class SkillExecutor {
  private handlers: Map<string, SkillHandler> = new Map();

  /**
   * 注册技能处理器
   * @param skillName 技能名称
   * @param handler 处理器
   */
  registerHandler(skillName: string, handler: SkillHandler): void {
    this.handlers.set(skillName, handler);
  }

  /**
   * 批量注册处理器
   * @param handlers 处理器映射
   */
  registerHandlers(handlers: Record<string, SkillHandler>): void {
    for (const [skillName, handler] of Object.entries(handlers)) {
      this.registerHandler(skillName, handler);
    }
  }

  /**
   * 执行技能
   * @param skillName 技能名称
   * @param params 参数
   * @param skill 技能定义（用于验证）
   * @returns 执行结果
   */
  async execute(
    skillName: string,
    params: Record<string, any>,
    skill: SkillSchema,
  ): Promise<SkillExecutionResult> {
    // 检查处理器是否存在
    const handler = this.handlers.get(skillName);
    if (!handler) {
      return {
        success: false,
        error: `技能 ${skillName} 未实现`,
        message: `抱歉，暂不支持 ${skill.description} 功能`,
      };
    }

    // 最终参数验证
    const validationResult = this.validateParams(params, skill);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.errors.join("; "),
        message: `参数验证失败：${validationResult.errors.join("，")}`,
      };
    }

    try {
      // 执行技能
      const result = await handler.execute(params);
      return result;
    } catch (error: any) {
      console.error(`Skill execution failed for ${skillName}:`, error);
      return {
        success: false,
        error: error.message || String(error),
        message: `执行失败：${error.message || "未知错误"}`,
      };
    }
  }

  /**
   * 验证参数
   * @param params 参数对象
   * @param skill 技能定义
   * @returns 验证结果
   */
  private validateParams(
    params: Record<string, any>,
    skill: SkillSchema,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查必需参数
    for (const required of skill.parameters.required) {
      if (params[required] === null || params[required] === undefined) {
        errors.push(`缺少必需参数: ${required}`);
      }
    }

    // 检查参数类型
    for (const [name, value] of Object.entries(params)) {
      if (value === null || value === undefined) continue;

      const paramSchema = skill.parameters.properties[name];
      if (!paramSchema) {
        errors.push(`未知参数: ${name}`);
        continue;
      }

      // 类型检查
      const actualType = Array.isArray(value) ? "array" : typeof value;
      const expectedType = paramSchema.type;

      if (expectedType === "number" && actualType !== "number") {
        errors.push(`参数 ${name} 类型错误，期望 number，实际 ${actualType}`);
      } else if (expectedType === "string" && actualType !== "string") {
        errors.push(`参数 ${name} 类型错误，期望 string，实际 ${actualType}`);
      } else if (expectedType === "boolean" && actualType !== "boolean") {
        errors.push(`参数 ${name} 类型错误，期望 boolean，实际 ${actualType}`);
      } else if (expectedType === "array" && actualType !== "array") {
        errors.push(`参数 ${name} 类型错误，期望 array，实际 ${actualType}`);
      }

      // 枚举检查
      if (paramSchema.enum && !paramSchema.enum.includes(value)) {
        errors.push(`参数 ${name} 值必须是以下之一: ${paramSchema.enum.join(", ")}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查技能是否已注册
   * @param skillName 技能名称
   * @returns 是否已注册
   */
  isRegistered(skillName: string): boolean {
    return this.handlers.has(skillName);
  }

  /**
   * 获取已注册的技能列表
   * @returns 技能名称数组
   */
  getRegisteredSkills(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 注销技能处理器
   * @param skillName 技能名称
   */
  unregisterHandler(skillName: string): boolean {
    return this.handlers.delete(skillName);
  }

  /**
   * 清空所有处理器
   */
  clearHandlers(): void {
    this.handlers.clear();
  }
}
