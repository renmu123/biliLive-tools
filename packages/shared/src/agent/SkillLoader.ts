import type { SkillSchema } from "./types.js";
import type { Skill } from "./skills/base.js";

/**
 * 技能加载器 - 手动注册技能
 */
export class SkillLoader {
  private skills: Map<string, { schema: SkillSchema; skill: Skill }> = new Map();

  /**
   * 注册技能
   */
  registerSkill(skill: Skill): void {
    // 验证技能定义
    this.validateSkill(skill.schema);

    this.skills.set(skill.schema.name, {
      schema: skill.schema,
      skill: skill,
    });

    console.log(`Registered skill: ${skill.schema.name}`);
  }

  /**
   * 批量注册技能
   */
  registerSkills(skills: Skill[]): void {
    for (const skill of skills) {
      this.registerSkill(skill);
    }
    console.log(`Total registered skills: ${this.skills.size}`);
  }

  /**
   * 获取技能定义
   */
  getSkill(name: string): SkillSchema | undefined {
    return this.skills.get(name)?.schema;
  }

  /**
   * 获取技能实例
   */
  getSkillInstance(name: string): Skill | undefined {
    return this.skills.get(name)?.skill;
  }

  /**
   * 获取所有技能
   */
  getAllSkills(): SkillSchema[] {
    return Array.from(this.skills.values()).map((item) => item.schema);
  }

  /**
   * 获取技能名称列表
   */
  getSkillNames(): string[] {
    return Array.from(this.skills.keys());
  }

  /**
   * 为技能设置依赖
   */
  setSkillDependencies(skillName: string, dependencies: any): void {
    const skillData = this.skills.get(skillName);
    if (skillData) {
      // 将依赖注入到技能实例
      Object.assign(skillData.skill, dependencies);
    }
  }

  /**
   * 清除所有技能
   */
  clear(): void {
    this.skills.clear();
  }

  /**
   * 验证技能定义
   */
  private validateSkill(skill: any): void {
    if (!skill.name || typeof skill.name !== "string") {
      throw new Error("Skill must have a valid name");
    }

    if (!skill.description || typeof skill.description !== "string") {
      throw new Error(`Skill ${skill.name} must have a description`);
    }

    if (!skill.parameters || typeof skill.parameters !== "object") {
      throw new Error(`Skill ${skill.name} must have parameters definition`);
    }

    if (skill.parameters.type !== "object") {
      throw new Error(`Skill ${skill.name} parameters type must be "object"`);
    }

    if (!skill.parameters.properties || typeof skill.parameters.properties !== "object") {
      throw new Error(`Skill ${skill.name} must have parameters.properties`);
    }

    if (!Array.isArray(skill.parameters.required)) {
      throw new Error(`Skill ${skill.name} must have parameters.required array`);
    }
  }

  /**
   * 重新加载技能
   */
  reload(): void {
    this.skills.clear();
    // this.loadAll();
  }
}
