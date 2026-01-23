import fs from "fs-extra";
import path from "node:path";

import { spawn } from "node:child_process";
import logger from "../utils/log.js";
import { calculateFileQuickHash, getTempPath } from "../utils/index.js";
import { addExtractAudioTask } from "./video.js";

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
