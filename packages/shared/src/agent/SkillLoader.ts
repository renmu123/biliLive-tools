import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync } from "node:fs";
import path, { join } from "node:path";

import type { SkillSchema } from "./types.js";

/**
 * 技能加载器 - 从 JSON 文件加载技能定义
 */
export class SkillLoader {
  private skills: Map<string, SkillSchema> = new Map();
  private skillsDir: string;

  constructor(skillsDir?: string) {
    // 默认使用相对于当前文件的 skills 目录
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    this.skillsDir = skillsDir || join(__dirname, "skills");
  }

  /**
   * 加载所有技能定义
   */
  loadAll(): void {
    try {
      const files = readdirSync(this.skillsDir);

      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        const filePath = join(this.skillsDir, file);
        try {
          const content = readFileSync(filePath, "utf-8");
          const skill = JSON.parse(content) as SkillSchema;

          // 验证技能定义
          this.validateSkill(skill);

          this.skills.set(skill.name, skill);
        } catch (error) {
          console.error(`Failed to load skill from ${file}:`, error);
        }
      }

      console.log(`Loaded ${this.skills.size} skills`);
    } catch (error) {
      console.error("Failed to load skills directory:", error);
    }
  }

  /**
   * 获取技能定义
   */
  getSkill(name: string): SkillSchema | undefined {
    return this.skills.get(name);
  }

  /**
   * 获取所有技能
   */
  getAllSkills(): SkillSchema[] {
    return Array.from(this.skills.values());
  }

  /**
   * 获取技能名称列表
   */
  getSkillNames(): string[] {
    return Array.from(this.skills.keys());
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
    this.loadAll();
  }
}
