import path from "node:path";
import fs from "fs-extra";
import { replaceExtName } from "@biliLive-tools/shared/utils/index.js";

/**
 * 路径解析器 - 处理各种文件路径相关的逻辑
 */
export class PathResolver {
  /**
   * 获取弹幕文件路径
   * @param videoPath 视频文件路径
   * @param danmuPath 指定的弹幕文件路径（可选）
   * @returns 弹幕文件路径
   */
  static getDanmuPath(videoPath: string, danmuPath?: string): string {
    if (danmuPath) return danmuPath;
    return replaceExtName(videoPath, ".xml");
  }

  /**
   * 获取封面文件路径
   * @param videoPath 视频文件路径
   * @param coverPath 指定的封面路径（可选）
   * @returns 封面路径，如果不存在则返回 ""
   */
  static getCoverPath(videoPath: string, coverPath?: string): string {
    if (coverPath && fs.pathExistsSync(coverPath)) {
      return coverPath;
    }

    const { name, dir } = path.parse(videoPath);
    const coverWithSuffix = path.join(dir, `${name}.cover.jpg`);
    const coverJpg = path.join(dir, `${name}.jpg`);
    const coverPng = path.join(dir, `${name}.png`);

    // 优先检查 .cover.jpg
    if (fs.pathExistsSync(coverWithSuffix)) {
      return coverWithSuffix;
    }

    // 其次检查 .jpg
    if (fs.pathExistsSync(coverJpg)) {
      return coverJpg;
    }

    // 最后检查 .png
    if (fs.pathExistsSync(coverPng)) {
      return coverPng;
    }

    return "";
  }

  /**
   * 生成输出文件路径
   * @param inputPath 输入文件路径
   * @param suffix 文件后缀（不包含扩展名）
   * @param ext 扩展名（包含点号，如 '.mp4'）
   * @returns 输出文件路径
   */
  static getOutputPath(inputPath: string, suffix: string, ext: string): string {
    const { dir, name } = path.parse(inputPath);
    const outputName = `${name}-${suffix}${ext}`;
    return path.join(dir, outputName);
  }

  /**
   * 尝试将文件路径替换为 mp4 格式
   * 如果原始文件存在则返回原始路径，否则尝试 mp4 路径
   * @param originalPath 原始文件路径
   * @returns 实际存在的文件路径
   */
  static tryMp4Fallback(originalPath: string): string {
    if (fs.pathExistsSync(originalPath)) {
      return originalPath;
    }

    const mp4Path = replaceExtName(originalPath, ".mp4");
    if (fs.pathExistsSync(mp4Path)) {
      return mp4Path;
    }

    return originalPath;
  }

  /**
   * 判断文件是否为处理后的文件（弹幕版或后处理版本）
   * @param filePath 文件路径
   * @returns 如果是处理后的文件返回 'danmaku'，否则返回 'source'
   */
  static getFileType(filePath: string): "source" | "danmaku" {
    if (filePath.includes("-弹幕版") || filePath.includes("-后处理")) {
      return "danmaku";
    }
    return "source";
  }

  /**
   * 生成格式化的文件夹结构
   * @param template 模板字符串，支持的占位符：
   *   - {{platform}} - 平台名称
   *   - {{user}} - 用户名
   *   - {{software}} - 软件平台
   *   - {{year}} - 年份（4位）
   *   - {{month}} - 月份（2位，补零）
   *   - {{date}} - 日期（2位，补零）
   *   - {{yyyy}} - 年份（4位）
   *   - {{MM}} - 月份（2位，补零）
   *   - {{dd}} - 日期（2位，补零）
   *   - {{now}} - 格式化日期（yyyy.MM.dd）
   * @param params 格式化参数
   * @returns 格式化后的文件夹路径
   */
  static formatFolderStructure(
    template: string,
    params: {
      platform: string;
      user: string;
      software?: string;
      liveStartTime: Date;
    },
  ): string {
    const { platform, user, software = "custom", liveStartTime } = params;

    const formatParams = {
      platform,
      user,
      software,
      year: liveStartTime.getFullYear(),
      month: (liveStartTime.getMonth() + 1).toString().padStart(2, "0"),
      date: liveStartTime.getDate().toString().padStart(2, "0"),
      yyyy: liveStartTime.getFullYear(),
      MM: (liveStartTime.getMonth() + 1).toString().padStart(2, "0"),
      dd: liveStartTime.getDate().toString().padStart(2, "0"),
      now: `${liveStartTime.getFullYear()}.${(liveStartTime.getMonth() + 1).toString().padStart(2, "0")}.${liveStartTime.getDate().toString().padStart(2, "0")}`,
    };

    let result = template;
    for (const [key, value] of Object.entries(formatParams)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }

    return result;
  }
}
