import fs from "fs-extra";
import path from "node:path";

import { spawn } from "node:child_process";
import logger from "../utils/log.js";
import { calculateFileQuickHash, getTempPath } from "../utils/index.js";
import { addExtractAudioTask } from "./video.js";
import { AudiowaveformData, AnalyzerConfig, BoundaryDetector } from "../WaveformAnalyzer/index.js";

import { getBinPath } from "./video.js";

export function generateAudioWaveform(
  audioFilePath: string,
  outputJsonPath: string,
): Promise<void> {
  const { audiowaveformPath } = getBinPath();
  return new Promise((resolve, reject) => {
    const args = ["-i", audioFilePath, "-o", outputJsonPath];
    const process = spawn(audiowaveformPath, args, { windowsHide: true });
    logger.info(`audiowaveform process started: ${audiowaveformPath} ${args.join(" ")}`);
    process.on("error", (err) => {
      logger.error("audiowaveform process error:", err);
      reject(err);
    });
    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

/**
 * 生成waveform数据
 * @param {string} videoFilePath 视频文件路径
 * @return {Promise<string>} waveform数据路径
 */
export const generateWaveformData = async (videoFilePath: string) => {
  const fileHash = await calculateFileQuickHash(videoFilePath);
  const cachePath = getTempPath();
  const outputVideoName = `cut_${fileHash}.wav`;
  const outputPeakName = `peaks_${fileHash}.json`;
  const outputPeakPath = path.join(cachePath, outputPeakName);

  if (await fs.pathExists(outputPeakPath)) {
    return outputPeakPath;
  }

  const task = await addExtractAudioTask(videoFilePath, outputVideoName, {
    saveType: 2,
    savePath: cachePath,
    autoRun: true,
    addQueue: false,
  });
  const outputFile: string = await new Promise((resolve, reject) => {
    task.on("task-end", () => {
      resolve(task.output as string);
    });
    task.on("task-error", (err) => {
      reject(err);
    });
  });

  try {
    await generateAudioWaveform(outputFile, outputPeakPath);
    fs.remove(outputFile);
    return outputPeakPath;
  } catch (error) {
    logger.error("生成waveform数据失败:", error);
    throw error;
  }
};

/**
 * 分析波形数据，主要用于检测唱歌边界点
 * @param videoPath 输入视频文件路径
 */
export async function analyzerWaveform(videoPath: string, iConfig?: Partial<AnalyzerConfig>) {
  const dataPath = await generateWaveformData(videoPath);
  const fileContent = await fs.readFile(dataPath, "utf-8");
  const data: AudiowaveformData = JSON.parse(fileContent);
  const config: AnalyzerConfig = {
    windowSize: 3.0, // 窗口大小（秒）- 增大让分析更平滑
    windowOverlap: 0.5, // 50%重叠
    singingEnergyThreshold: 1.1, // 唱歌能量阈值倍数 - 降低以减少漏检
    talkingEnergyThreshold: 0.7, // 说话能量阈值倍数
    minSegmentDuration: 15.0, // 最小片段时长（秒）- 增大过滤短片段
    mergeGap: 20.0, // 合并间隔（秒）- 增大合并相邻片段
    silenceThreshold: 30, // 静音阈值
    ...iConfig,
  };
  const detector = new BoundaryDetector(data, config);
  const segments = detector.detectSegments();
  return segments.filter((seg) => seg.type === "singing");
}
