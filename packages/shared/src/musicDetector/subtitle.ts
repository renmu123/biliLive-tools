import path from "node:path";
import fs from "fs-extra";
import { stringifySync } from "subtitle";
import { asrRecognize } from "./index.js";
import { appConfig } from "../config.js";
import logger from "../utils/log.js";
import { getTempPath, calculateFileQuickHash } from "../utils/index.js";

import type { TranscriptionDetail } from "../ai/index.js";

/**
 * 根据 word 级别的标点符号生成优化的 SRT 字幕
 * TODO: 中文数字转阿拉伯数字，由于fun-asr会默认都识别为中文数字
 * @param detail - ASR 识别结果详情
 * @param options - 配置选项
 * @returns SRT 格式的字幕字符串
 */
export function convertToSrtByWords(
  detail: TranscriptionDetail,
  options?: {
    offset?: number; // 时间偏移量（毫秒），默认 0
    maxLength?: number; // 单条字幕最大长度（字符数），默认 20
    fillGap?: number; // 补齐字幕间隔的最大阈值（毫秒），默认 500ms，设为 0 则不补齐
  },
): string {
  const offset = options?.offset ?? 0;
  const maxLength = options?.maxLength ?? 20;
  const fillGap = options?.fillGap ?? 500;

  // 收集所有字幕数据
  const subtitles: Array<{ start: number; end: number; text: string }> = [];

  for (const transcript of detail.transcripts || []) {
    for (const sentence of transcript.sentences || []) {
      if (!sentence.words || sentence.words.length === 0) {
        continue;
      }

      let accumulatedText = "";
      let startTime = 0;
      let endTime = 0;

      for (let i = 0; i < sentence.words.length; i++) {
        const word = sentence.words[i];
        // const nextWord = sentence.words[i + 1];

        // 初始化起始时间
        if (accumulatedText === "") {
          startTime = word.begin_time;
        }

        // 累积文本和结束时间
        accumulatedText += word.text;
        endTime = word.end_time;

        // 检查是否需要断句
        let shouldBreak = false;

        // 1. 遇到标点符号且字符数大于4，断句
        if (word.punctuation && accumulatedText.length > 4) {
          accumulatedText += word.punctuation;
          shouldBreak = true;
        }
        // 如果有标点但字符数不够，只添加标点继续累积
        else if (word.punctuation) {
          accumulatedText += word.punctuation;
        }
        // 2. 长度超过最大限制，强制断句
        else if (accumulatedText.length >= maxLength) {
          shouldBreak = true;
        }
        // // 3. 长度超过 smartLength 且时间间隔较大，智能断句
        // else if (
        //   accumulatedText.length >= smartLength &&
        //   nextWord &&
        //   nextWord.begin_time - endTime > timeGapThreshold
        // ) {
        //   shouldBreak = true;
        // }

        if (shouldBreak) {
          // 收集字幕数据
          const cleanedText = accumulatedText.replace(/[\p{P}\p{S}]+$/u, "");
          if (cleanedText.trim()) {
            subtitles.push({
              start: startTime + offset,
              end: endTime + offset,
              text: cleanedText,
            });
          }

          accumulatedText = "";
          startTime = 0;
          endTime = 0;
        }
      }

      // 处理剩余的未输出文本（强制输出，确保无遗漏）
      if (accumulatedText.trim()) {
        const cleanedText = accumulatedText.replace(/[\p{P}\p{S}]+$/u, "");
        if (cleanedText.trim()) {
          subtitles.push({
            start: startTime + offset,
            end: endTime + offset,
            text: cleanedText,
          });
        }
      }
    }
  }

  // 第二次遍历：补齐字幕间隔
  if (fillGap > 0) {
    for (let i = 0; i < subtitles.length - 1; i++) {
      const current = subtitles[i];
      const next = subtitles[i + 1];

      const gap = next.start - current.end;

      // 如果间隔在补齐阈值内，则进行补齐
      if (gap > 0 && gap <= fillGap) {
        // 前一个字幕分配 60% 的间隔时间
        current.end += gap * 0.6;
        // 后一个字幕分配 40% 的间隔时间
        next.start -= gap * 0.4;
      }
    }
  }

  // 使用 subtitle 库生成 SRT 字符串
  const srtNodes = subtitles.map((sub) => ({
    type: "cue" as const,
    data: {
      start: sub.start,
      end: sub.end,
      text: sub.text,
    },
  }));

  return stringifySync(srtNodes, { format: "SRT" });
}

/**
 * 获取歌曲识别配置
 */
function getSubtitleRecognizeConfig() {
  const data = appConfig.get("ai") || {};
  if (data?.vendors.length === 0) {
    throw new Error("请先在配置中设置 AI 服务商的 API Key");
  }

  let asrVendorId = data.subtitleRecognize.vendorId;
  if (!asrVendorId) {
    asrVendorId = data.vendors.find((v: any) => v.provider === "aliyun")?.id;
  }

  if (!asrVendorId) {
    throw new Error("请先在配置中设置 阿里云 ASR 服务商的 API Key");
  }

  return {
    data,
    asrVendorId,
  };
}

/**
 * 字幕识别 - 将音频/视频文件转换为 SRT 字幕
 * @param file - 音频或视频文件路径
 * @param vendorId - AI 服务商 ID
 * @param options - 配置选项
 * @returns SRT 格式的字幕字符串
 */
export async function subtitleRecognize(
  file: string,
  options?: {
    offset?: number; // 时间偏移量（秒）
    maxLength?: number; // 单条字幕最大长度
    timeGapThreshold?: number; // 时间间隔阈值（毫秒）
    fillGap?: number; // 补齐字幕间隔的最大阈值（毫秒）
    disableCache?: boolean; // 禁用缓存
  },
): Promise<string> {
  const offset = (options?.offset ?? 0) * 1000; // 转换为毫秒
  const maxLength = options?.maxLength ?? 20;
  const timeGapThreshold = options?.timeGapThreshold ?? 300;
  const fillGap = options?.fillGap ?? 1000;
  const disableCache = options?.disableCache ?? false;

  logger.info("开始字幕识别", {
    file,
    offset,
    maxLength,
    timeGapThreshold,
    fillGap,
    disableCache,
  });

  try {
    const { asrVendorId } = getSubtitleRecognizeConfig();

    // 生成缓存路径
    const cachePath = getTempPath();
    const fileHash = await calculateFileQuickHash(file);
    const cacheFileName = `asr_subtitle_cache_${fileHash}.json`;
    const cacheFilePath = path.join(cachePath, cacheFileName);

    let asrResult: TranscriptionDetail | null = null;

    // 尝试从缓存读取
    if (!disableCache && (await fs.pathExists(cacheFilePath))) {
      logger.info("检测到 ASR 缓存，直接读取:", cacheFilePath);
      try {
        asrResult = await fs.readJSON(cacheFilePath);
      } catch (error) {
        logger.warn("缓存文件读取失败，将重新识别", error);
      }
    }
    if (!asrResult) {
      // 调用 ASR 识别
      asrResult = await asrRecognize(file, asrVendorId);

      // 保存到缓存（如果未禁用缓存）
      if (!disableCache) {
        await fs.writeJSON(cacheFilePath, asrResult, { spaces: 2 });
        logger.info("ASR 结果已缓存到:", cacheFilePath);
      }
    }

    if (!asrResult.transcripts || asrResult.transcripts.length === 0) {
      logger.warn("ASR 未识别到任何内容");
      return "";
    }

    // 使用优化的 SRT 转换函数
    const srt = convertToSrtByWords(asrResult, {
      offset,
      maxLength,
      fillGap,
    });

    logger.info("字幕识别完成", { subtitleCount: srt.split("\n\n").length - 1 });

    return srt;
  } catch (error) {
    logger.error("字幕识别失败:", error);
    throw error;
  }
}
