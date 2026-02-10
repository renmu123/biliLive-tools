import { Skill } from "./base.js";
import type { SkillSchema, SkillExecutionResult } from "../types.js";

/**
 * 上传视频到 B 站技能
 */
class UploadVideoToBilibliSkill extends Skill {
  readonly schema: SkillSchema = {
    name: "uploadVideoToBilibli",
    showName: "上传视频到B站",
    description: "将本地视频文件上传至Bilibili",
    parameters: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "要上传的视频本地文件路径",
          format: "file-path",
          fileOptions: {
            extensions: ["mp4", "flv", "mkv", "m4s", "ts"],
            multi: false,
          },
        },
      },
      required: ["filePath"],
    },
  };

  // 依赖注入：视频服务
  private videoService?: any;

  constructor(videoService?: any) {
    super();
    this.videoService = videoService;
  }

  async execute(params: Record<string, any>): Promise<SkillExecutionResult> {
    const { filePath } = params;

    try {
      console.log(`[UploadVideoToBilibliSkill] Uploading video: ${filePath}`);

      if (!this.videoService) {
        // 暂时返回模拟结果
        return {
          success: true,
          data: { filePath },
          message: `视频上传功能正在开发中，文件路径：${filePath}`,
        };
      }

      // 调用实际的上传服务
      const result = await this.videoService.uploadToBilibili(filePath);

      return {
        success: true,
        data: result,
        message: `成功上传视频到 B 站：${filePath}`,
      };
    } catch (error: any) {
      console.error(`[UploadVideoToBilibliSkill] Failed to upload video:`, error);
      return {
        success: false,
        error: error.message,
        message: `上传视频失败：${error.message}`,
      };
    }
  }
}

export default UploadVideoToBilibliSkill;
