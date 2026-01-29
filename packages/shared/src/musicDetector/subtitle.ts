import { asrRecognize } from "./index.js";
import { appConfig } from "../config.js";
import logger from "../utils/log.js";

import type { TranscriptionDetail } from "../ai/index.js";

/**
 * 根据 word 级别的标点符号生成优化的 SRT 字幕
 * @param detail - ASR 识别结果详情
 * @param offset - 时间偏移量（毫秒）
 * @returns SRT 格式的字幕字符串
 */
export function convertToSrtByWords(detail: TranscriptionDetail, offset: number = 0): string {
  let srt = "";
  let index = 1;

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

        // 初始化起始时间
        if (accumulatedText === "") {
          startTime = word.begin_time;
        }

        // 累积文本和结束时间
        accumulatedText += word.text;
        endTime = word.end_time;

        // 检查是否有标点符号，有标点就断句
        if (word.punctuation) {
          // 添加标点到累积文本
          accumulatedText += word.punctuation;

          // 生成字幕条目（去除尾部标点）
          const cleanedText = accumulatedText.replace(/[\p{P}\p{S}]+$/u, "");

          if (cleanedText.trim()) {
            const start = new Date(startTime + offset)
              .toISOString()
              .substr(11, 12)
              .replace(".", ",");
            const end = new Date(endTime + offset).toISOString().substr(11, 12).replace(".", ",");
            srt += `${index}\n${start} --> ${end}\n${cleanedText}\n\n`;
            index++;
          }

          // 重置累积变量
          accumulatedText = "";
          startTime = 0;
          endTime = 0;
        }
      }

      // 处理剩余的未输出文本（强制输出，确保无遗漏）
      if (accumulatedText.trim()) {
        const cleanedText = accumulatedText.replace(/[\p{P}\p{S}]+$/u, "");

        if (cleanedText.trim()) {
          const start = new Date(startTime + offset).toISOString().substr(11, 12).replace(".", ",");
          const end = new Date(endTime + offset).toISOString().substr(11, 12).replace(".", ",");
          srt += `${index}\n${start} --> ${end}\n${cleanedText}\n\n`;
          index++;
        }
      }
    }
  }

  return srt;
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
  },
): Promise<string> {
  const offset = (options?.offset ?? 0) * 1000; // 转换为毫秒

  logger.info("开始字幕识别", { file, offset });

  try {
    const { asrVendorId } = getSubtitleRecognizeConfig();
    // 调用 ASR 识别
    const asrResult = await asrRecognize(file, asrVendorId);

    if (!asrResult.transcripts || asrResult.transcripts.length === 0) {
      logger.warn("ASR 未识别到任何内容");
      return "";
    }

    // 使用优化的 SRT 转换函数
    const srt = convertToSrtByWords(asrResult, offset);
    console.log(asrResult);

    logger.info("字幕识别完成", { subtitleCount: srt.split("\n\n").length - 1 });

    return srt;
  } catch (error) {
    logger.error("字幕识别失败:", error);
    throw error;
  }
}
