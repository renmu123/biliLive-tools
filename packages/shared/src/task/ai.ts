import fs from "fs-extra";
import { AliyunASR, TranscriptionDetail, QwenLLM } from "../ai/index.js";

import { appConfig } from "../config.js";
import logger from "../utils/log.js";

/**
 * 音乐字幕优化
 */
function optimizeMusicSubtitles(results: TranscriptionDetail): TranscriptionDetail {
  // 去除"，"、“。”等标点符号
  const transcripts = results.transcripts?.map((transcript) => {
    const optimizedSentences = transcript.sentences?.map((sentence) => {
      let optimizedText = sentence.text.replace(/[，。、“”‘’！？]/g, " ");
      return {
        ...sentence,
        text: optimizedText,
      };
    });

    return {
      ...transcript,
      sentences: optimizedSentences,
    };
  });
  return {
    ...results,
    transcripts: transcripts,
  };
}

/**
 * 获取 AI 服务商的 API Key，现在是随便写，只支持阿里
 * @returns
 */
function getApiKey(): string {
  const data = appConfig.get("ai") || {};
  if (data?.vendors.length === 0) {
    throw new Error("请先在配置中设置 AI 服务商的 API Key");
  }
  return data.vendors[0].apiKey || "";
}

/**
 * 音频识别
 * @param file
 * @param key
 * @returns
 */
export async function asrRecognize(file: string, vendorId: string) {
  const { apiKey } = await getVendor(vendorId);

  const asr = new AliyunASR({
    apiKey: apiKey,
  });

  try {
    const results = await asr.recognizeLocalFile(file);

    // console.log("识别结果:", results.transcripts?.[0]);

    // console.log("已将字幕保存到 output.srt 文件");
    return results;
  } catch (error) {
    logger.error("ASR 识别失败:", error);
    throw error;
  }
}

/**
 * 使用通义千问 LLM 示例
 */
export async function llm(message: string, systemPrompt?: string, key?: string) {
  console.log("=== 示例: 使用通义千问 LLM ===");
  const apiKey = key ?? getApiKey();

  const llm = new QwenLLM({
    apiKey: apiKey,
    model: "qwen-plus",
  });

  try {
    const response = await llm.sendMessage(message, systemPrompt, {
      // responseFormat: zodResponseFormat(Song, "song"),
    });

    if ("content" in response) {
      console.log("提问:", response);
      console.log("回复:", response.content);
      console.log("Token 使用:", response.usage);
      return response;
    }
  } catch (error) {
    console.error("LLM 请求失败:", error);
  }
}

async function getSongRecognizeConfig() {
  const data = appConfig.get("ai") || {};
  if (data?.vendors.length === 0) {
    throw new Error("请先在配置中设置 AI 服务商的 API Key");
  }

  const asrVendorId = data.vendors.find((v) => v.provider === "aliyun")?.id;
  if (!asrVendorId) {
    throw new Error("请先在配置中设置 阿里云 ASR 服务商的 API Key");
  }

  let llmVendorId = asrVendorId;
  if (data?.songRecognizeLlm?.vendorId) {
    llmVendorId = data.songRecognizeLlm.vendorId;
  }

  return {
    asrVendorId,
    llmVendorId,
    llmPrompt:
      data?.songRecognizeLlm?.prompt ||
      "你是一个歌词分析助手，只根据歌词推断歌曲名称，不要输出多余内容，不要包含符号。",
    llmModel: data?.songRecognizeLlm?.model || "qwen-plus",
    enableSearch: data?.songRecognizeLlm?.enableSearch ?? false,
    maxInputLength: data?.songRecognizeLlm?.maxInputLength || 300,
  };
}

async function getVendor(vendorId: string) {
  const data = appConfig.get("ai") || {};
  const vendor = data.vendors.find((v: any) => v.id === vendorId);
  if (!vendor) {
    throw new Error(`未找到 ID 为 ${vendorId} 的供应商配置`);
  }
  return vendor;
}

/**
 * 输入音频，识别歌曲名称，输出歌词以及歌曲名称
 * @param file - 音频文件路径
 */
export async function songRecognize(file: string) {
  const { asrVendorId, llmVendorId, llmPrompt, llmModel, enableSearch, maxInputLength } =
    await getSongRecognizeConfig();

  const data = await asrRecognize(file, asrVendorId);
  const messages = data.transcripts?.[0]?.text || "";
  if (!messages) {
    logger.warn("没有识别到任何文本内容，无法进行歌曲识别");
    return;
  }

  const { apiKey } = await getVendor(llmVendorId);
  const llm = new QwenLLM({
    apiKey: apiKey,
    model: llmModel,
  });
  logger.info("使用 LLM 进行歌曲名称识别...", {
    prompt: llmPrompt,
    messages: messages.slice(0, maxInputLength),
    llmModel,
  });
  const response = await llm.sendMessage(messages.slice(0, maxInputLength), llmPrompt, {
    enableSearch: enableSearch,
    forcedSearch: enableSearch,
  });
  logger.info("识别结果:", response);
  // const srtData = asr.convert2Srt(optimizeMusicSubtitles(results));
  // await fs.writeFile("./output.srt", srtData, "utf-8");
  return {
    name: response.content,
    lyrics: messages,
  };
}
