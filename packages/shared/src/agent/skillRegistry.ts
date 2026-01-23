import { AddRecorderSkill, UploadVideoToBilibliSkill } from "./skills/index.js";

import type { Skill } from "./skills/base.js";

/**
 * 技能注册表 - 统一管理所有可用技能
 */

/**
 * 创建所有技能实例
 * @param dependencies 依赖注入对象，包含各种服务
 * @returns 技能实例数组
 */
export function createSkills(dependencies?: {
  recorderService?: any;
  videoService?: any;
}): Skill[] {
  const skills: Skill[] = [];

  // 注册添加录播器技能
  skills.push(new AddRecorderSkill(dependencies?.recorderService));

  // 注册上传视频到B站技能
  skills.push(new UploadVideoToBilibliSkill(dependencies?.videoService));

  return skills;
}
