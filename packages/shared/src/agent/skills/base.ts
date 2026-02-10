import type { SkillSchema, SkillHandler, SkillExecutionResult } from "../types.js";

/**
 * 技能定义基类
 */
export abstract class Skill implements SkillHandler {
  abstract readonly schema: SkillSchema;
  abstract execute(params: Record<string, any>): Promise<SkillExecutionResult>;
}
