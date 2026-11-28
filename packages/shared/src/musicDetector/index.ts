import { stringifySync } from "subtitle";

import { QwenLLM, recognize } from "../ai/index.js";
import { recognize as shazamRecognize } from "./shazam.js";
import { appConfig } from "../config.js";
import logger from "../utils/log.js";
import { getModel } from "./utils.js";

import type { StandardASRResult } from "../ai/index.js";
import type { SongRecognizeMode } from "@biliLive-tools/types";
export { musicDetect } from "./yamnet/index.js";
export type { ProgressCallback } from "./yamnet/types.js";

interface ASRWord {
  st: number;
  et: number;
  t: string;
}

function convert2Srt(detail: ASRWord[], offset: number): string {
  const srtNodes = detail
    .filter((word) => word.t.trim() !== "")
    .map((word) => ({
      type: "cue" as const,
      data: {
        start: word.st + offset,
        end: word.et + offset,
        text: word.t,
      },
    }));

  return stringifySync(srtNodes, { format: "SRT" });
}

function getVendor(vendorId: string) {
  const data = appConfig.get("ai") || {};
  const vendor = data.vendors.find((v: any) => v.id === vendorId);
  if (!vendor) {
    throw new Error(`未找到 ID 为 ${vendorId} 的供应商配置`);
  }
  return vendor;
}

/**
 * 歌词优化
 * @param lyrics - 原始歌词文本
 * @param offset - 偏移时间，单位毫秒
 * @returns 优化后的 ASRWord 数组
 */
export async function optimizeLyrics(
  asrData: StandardASRResult,
  lyrics: string,
  offset: number,
): Promise<ASRWord[]> {
  const { vendorId, prompt, model, enableStructuredOutput } = getLyricOptimizeConfig();
  const { apiKey, baseURL } = getVendor(vendorId);
  const llm = new QwenLLM({
    apiKey: apiKey,
    model: model,
    baseURL: baseURL,
  });

  const asrCleanedSentences: ASRWord[] = [];
  if (asrData.words && asrData.words.length !== 0) {
    // 优先使用词级时间戳
    for (const word of asrData.words) {
      asrCleanedSentences.push({
        st: word.start * 1000, // 秒转毫秒
        et: word.end * 1000,
        t: word.word,
      });
    }
  }
  if (asrCleanedSentences.length === 0) {
    // 回退到分段级时间戳
    for (const segment of asrData.segments) {
      asrCleanedSentences.push({
        st: segment.start * 1000, // 秒转毫秒
        et: segment.end * 1000,
        t: segment.text,
      });
    }
  }

  logger.info("使用 LLM 进行歌词优化...", {
    message: `Standard_Lyrics：${lyrics}\nASR转录数据：${JSON.stringify(asrCleanedSentences)}`,
    systemPrompt: prompt,
    llmModel: model,
  });
  const response = await llm.sendMessage(
    `Standard_Lyrics：${lyrics}\nASR转录数据：${JSON.stringify(asrCleanedSentences)}`,
    prompt,
    {
      temperature: 0.5,
      enableSearch: false,
      responseFormat: enableStructuredOutput ? { type: "json_object" } : undefined,
      enableThinking: model.toLowerCase().includes("deepseek"),
    },
  );
  logger.info("优化结果:", response);
  if (!response.content) {
    throw new Error("LLM 未返回任何内容");
  }
  try {
    const json = JSON.parse(response.content) as ASRWord[] | { data: ASRWord[] };
    const aSRWords = Array.isArray(json) ? json : json.data;
    // 应用偏移时间
    const wordsWithOffset = aSRWords.map((word) => ({
      st: word.st + offset,
      et: word.et + offset,
      t: word.t,
    }));
    return wordsWithOffset;
  } catch (e) {
    logger.error("LLM 返回内容非 JSON 格式，尝试按纯文本处理", e);
    throw new Error("LLM 返回内容非 JSON 格式，无法解析优化后的歌词");
  }
}

/**
 * 获取歌曲识别配置
 */
function getSongRecognizeConfig() {
  const config = appConfig.getAll();
  const data = config.ai;

  const asrModelId = data.songRecognizeAsr?.modelId;
  if (!asrModelId) {
    throw new Error("请先在配置中设置歌曲识别 ASR 模型");
  }

  const llmModel = getModel(data?.songRecognizeLlm?.modelId, config);
  const llmVendor = data.vendors.find((v: any) => v.id === llmModel.vendorId);
  if (!llmVendor) {
    throw new Error("找不到LLM模型关联的供应商");
  }

  return {
    data,
    asrModelId,
    llmVendorId: llmVendor.id,
    llmModel: llmModel.modelName,
    llmPrompt: data?.songRecognizeLlm?.prompt,
    enableSearch: data?.songRecognizeLlm?.enableSearch ?? false,
    maxInputLength: data?.songRecognizeLlm?.maxInputLength || 300,
    enableStructuredOutput: data?.songRecognizeLlm?.enableStructuredOutput ?? true,
  };
}

/**
 * 获取歌词优化配置
 */
function getLyricOptimizeConfig() {
  const config = appConfig.getAll();
  const data = config.ai;
  const modelId = data?.songLyricOptimize?.modelId || data?.songRecognizeLlm?.modelId;

  const model = getModel(modelId, config);
  const vendor = data.vendors.find((v: any) => v.id === model.vendorId);
  if (!vendor) {
    throw new Error("找不到LLM模型关联的供应商");
  }

  return {
    vendorId: vendor.id,
    prompt: data?.songLyricOptimize?.prompt,
    model: model.modelName,
    enableStructuredOutput: data?.songLyricOptimize?.enableStructuredOutput ?? true,
  };
}

/**
 * 使用 LLM 识别歌曲名称
 * @param asrText - ASR 识别的文本内容
 * @param vendorId - LLM 供应商 ID
 * @param options - 配置选项
 * @returns 歌曲名称和歌词
 */
async function recognizeSongNameWithLLM(
  asrText: string,
  vendorId: string,
  options: {
    prompt?: string;
    model: string;
    enableSearch: boolean;
    maxInputLength: number;
    enableStructuredOutput: boolean;
    mode: SongRecognizeMode;
  },
) {
  try {
    const { apiKey, baseURL } = getVendor(vendorId);
    const llm = new QwenLLM({
      apiKey: apiKey,
      model: options.model,
      baseURL: baseURL,
    });

    const truncatedText = asrText.slice(0, options.maxInputLength);
    const prompt =
      options.mode === "name"
        ? `${options.prompt || ""}\n本次任务仅识别歌曲名称，只返回 JSON 对象 {"name":"歌曲名称"}，不要返回歌词。`
        : options.prompt;
    logger.info("使用 LLM 进行歌曲名称识别...", {
      prompt,
      messages: truncatedText,
      llmModel: options.model,
    });

    const isQwenModel = options.model.toLowerCase().includes("qwen");
    const response = await llm.sendMessage(truncatedText, prompt, {
      enableSearch: options.enableSearch,
      responseFormat: options.enableStructuredOutput
        ? isQwenModel
          ? {
              type: "json_schema",
              json_schema: {
                name: "song_recognition",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    ...(options.mode === "lyrics" && { lyrics: { type: "string" } }),
                  },
                  required: options.mode === "lyrics" ? ["name", "lyrics"] : ["name"],
                  additionalProperties: false,
                },
              },
            }
          : { type: "json_object" }
        : undefined,
      temperature: 0.6,
      enableThinking: false,
      searchOptions: {
        forcedSearch: options.enableSearch,
        search_strategy: "max",
      },
    });

    logger.info("识别结果:", response);
    if (!response.content) {
      throw new Error("LLM 未返回任何内容");
    }

    try {
      // DeepSeek 联网搜索不支持 JSON 模式，兼容按提示词返回的 JSON 代码块。
      const content = response.content.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, "$1");
      const json = JSON.parse(content) as {
        name: string;
        lyrics?: string;
      };
      if (!json || typeof json.name !== "string" || !json.name.trim()) {
        throw new Error("LLM 未返回有效的歌曲名称");
      }
      return json;
    } catch (e) {
      throw new Error("LLM 返回内容非 JSON 格式，无法解析歌曲名称和歌词");
    }
  } catch (error) {
    logger.error("LLM 识别歌曲名称失败:", error);
    return null;
  }
}

/**
 * 输入音频，识别歌曲名称，输出歌词以及歌曲名称
 * @param file - 音频文件路径
 * @param audioStartTime - 音频开始时间（秒）
 * @param mode - name 仅识别歌名，lyrics 识别歌名并优化歌词
 */
export async function songRecognize(
  file: string,
  audioStartTime: number = 0,
  mode: SongRecognizeMode = "name",
) {
  if (mode === "name") {
    try {
      const info = await shazamRecognize(file, false);
      logger.info("Shazam 识别结果:", info);
      if (info?.name) {
        return { name: info.name };
      }
      logger.warn("Shazam 未识别到歌曲名称，尝试使用 ASR 和 LLM");
    } catch (error) {
      logger.warn("Shazam 识别失败，尝试使用 ASR 和 LLM:", error);
    }
  }

  const {
    asrModelId,
    llmVendorId,
    llmPrompt,
    llmModel,
    enableSearch,
    maxInputLength,
    enableStructuredOutput,
  } = getSongRecognizeConfig();

  const data = await recognize(file, asrModelId);
  const messages = data.text || "";
  if (!messages) {
    logger.warn("没有识别到任何文本内容，无法进行歌曲识别");
    return;
  }

  const info = await recognizeSongNameWithLLM(messages, llmVendorId, {
    prompt: llmPrompt,
    model: llmModel,
    enableSearch,
    maxInputLength,
    enableStructuredOutput,
    mode,
  });
  if (!info) {
    logger.warn("未识别到任何歌曲信息");
    return;
  }
  if (mode === "name") {
    return { name: info.name };
  }

  const rawLyrics = info?.lyrics;
  let words: ASRWord[] = [];

  if (rawLyrics) {
    try {
      words = await optimizeLyrics(data, rawLyrics, audioStartTime * 1000);
    } catch (error: any) {
      logger.error("歌词优化失败:", error);
    }
  }

  if (words.length === 0) {
    // 如果没有歌词优化结果，使用原始 ASR 结果
    const segments = data.segments || [];

    // 使用词级时间戳生成 ASRWord 数组
    words = segments.map((sentence) => {
      let text = sentence.text.replace(/[，。、“”‘’！？]/g, " ");

      return {
        st: sentence.start * 1000 + audioStartTime * 1000,
        et: sentence.end * 1000 + audioStartTime * 1000,
        t: text,
      };
    });
  }

  // 统一生成 SRT
  const srtData = convert2Srt(words, 0);

  const name = info?.name;
  return {
    name: name,
    lyrics: srtData,
  };
}
