import path from "node:path";
import { randomUUID } from "node:crypto";
import fs from "fs-extra";
import pLimit from "p-limit";
import { container } from "../../index.js";
import { getTempPath, calculateFileQuickHash } from "../../utils/index.js";
import { getBinPath } from "../../task/video.js";
import logger from "../../utils/log.js";
import { analyzeAudio } from "./analyze.js";
import { ensureModel, MODEL_SHA256 } from "./model.js";
import { normalizeConfig, detectSingingSegments, isAudioAnalysis } from "./detect.js";
import type { MusicDetectionConfig } from "@biliLive-tools/types/musicDetection.js";
import type { AudioAnalysis, ProgressCallback } from "./types.js";

const limit = pLimit(1);
const CACHE_VERSION = 1;

export async function musicDetect(
  input: string,
  options?: Partial<MusicDetectionConfig>,
  onProgress?: ProgressCallback,
) {
  const config = normalizeConfig(options);
  onProgress?.({ stage: "queue", percentage: 0, message: "等待演唱检测" });
  return limit(async () => {
    const cacheDirectory = getTempPath();
    const hash = await calculateFileQuickHash(input);
    const cacheFile = path.join(cacheDirectory, `yamnet_v${CACHE_VERSION}_${hash}.json`);
    let analysis: AudioAnalysis | undefined;
    try {
      if (!config.disableCache && (await fs.pathExists(cacheFile))) {
        try {
          const cache = await fs.readJSON(cacheFile);
          if (
            cache.version === CACHE_VERSION &&
            cache.model === MODEL_SHA256 &&
            isAudioAnalysis(cache.analysis)
          ) {
            analysis = cache.analysis;
            onProgress?.({ stage: "cache", percentage: 90, message: "读取 YAMNet 分数缓存" });
          }
        } catch (error) {
          logger.warn("YAMNet 缓存无效，重新分析", error);
        }
      }
      if (!analysis) {
        const { ffmpegPath } = getBinPath();
        const yamnetModelPath =
          container.resolve("globalConfig").defaultYamnetModelPath ||
          path.resolve("models/yamnet.onnx");
        const modelPath = await ensureModel(yamnetModelPath);
        analysis = await analyzeAudio(input, modelPath, cacheDirectory, ffmpegPath, onProgress);
        if (!config.disableCache) {
          const partial = `${cacheFile}.${randomUUID()}.part`;
          try {
            await fs.writeJSON(partial, { version: CACHE_VERSION, model: MODEL_SHA256, analysis });
            await fs.move(partial, cacheFile, { overwrite: true });
          } finally {
            await fs.remove(partial);
          }
        }
      }
      onProgress?.({ stage: "detect", percentage: 95, message: "检测演唱、合并间奏并补齐前后奏" });
      const segments = detectSingingSegments(analysis, config);
      logger.info(`YAMNet 检测到 ${segments.length} 个演唱片段`);
      onProgress?.({
        stage: "complete",
        percentage: 100,
        message: `分析完成，检测到 ${segments.length} 个演唱片段`,
      });
      return segments;
    } finally {
      if (config.disableCache) await fs.remove(cacheFile);
    }
  });
}
