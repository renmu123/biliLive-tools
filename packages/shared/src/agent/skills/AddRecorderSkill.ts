import { Skill } from "./base.js";
import type { SkillSchema, SkillExecutionResult } from "../types.js";

/**
 * 添加录制器技能
 */
export default class AddRecorderSkill extends Skill {
  readonly schema: SkillSchema = {
    name: "addRecorder",
    showName: "添加直播间",
    description: "添加直播间录制器",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "直播间链接",
        },
      },
      required: ["url"],
    },
  };

  // 依赖注入：录制器服务
  private recorderService?: any;

  constructor(recorderService?: any) {
    super();
    this.recorderService = recorderService;
  }

  async execute(params: Record<string, any>): Promise<SkillExecutionResult> {
    const { url } = params;

    try {
      console.log(`[AddRecorderSkill] Adding recorder for URL: ${url}`);

      if (!this.recorderService) {
        throw new Error("RecorderService not available");
      }

      // 解析直播间地址
      const data = await this.recorderService.resolve(url);
      if (!data) {
        throw new Error("无法解析直播间地址");
      }

      // 添加录制器
      const result = await this.recorderService.addRecorder(data);

      return {
        success: true,
        data: result,
        message: `成功添加直播间录制器：${url}`,
      };
    } catch (error: any) {
      console.error(`[AddRecorderSkill] Failed to add recorder:`, error);
      return {
        success: false,
        error: error.message,
        message: `添加录制器失败：${error.message}`,
      };
    }
  }
}
