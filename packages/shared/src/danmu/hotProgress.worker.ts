import fs from "fs-extra";
import { Resvg } from "@resvg/resvg-js";

export interface WorkerTask {
  svg: string;
  outputPath: string;
  width: number;
  height: number;
}

export interface WorkerResult {
  outputPath: string;
  width: number;
  height: number;
  success: boolean;
}

/**
 * Worker 函数：将 SVG 转换为 PNG 并保存到指定路径
 */
export default async function svgToPng(task: WorkerTask): Promise<WorkerResult> {
  try {
    const { svg, outputPath, width, height } = task;

    // 配置 Resvg 选项
    const opts = {
      background: "rgba(0, 0, 0, 0)", // 透明背景
      font: {
        loadSystemFonts: false, // 不加载系统字体以提高性能
      },
      logLevel: "error" as const, // 减少日志输出
      fitTo: {
        mode: "width" as const,
        value: width,
      },
    };

    // 渲染 SVG
    const resvg = new Resvg(svg, opts);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // 写入文件
    await fs.writeFile(outputPath, pngBuffer);

    return {
      outputPath,
      width: pngData.width,
      height: pngData.height,
      success: true,
    };
  } catch (error) {
    console.error(`Worker error processing ${task.outputPath}:`, error);
    return {
      outputPath: task.outputPath,
      width: task.width,
      height: task.height,
      success: false,
    };
  }
}
