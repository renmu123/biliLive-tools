import path from "node:path";
import fs from "fs-extra";
import { analyzeAudio, detectMusicSegments, DetectionConfig } from "music-segment-detector";

import { addExtractAudioTask } from "../task/video.js";
import { QwenLLM, recognize } from "../ai/index.js";
import { recognize as shazamRecognize } from "./shazam.js";
import { appConfig } from "../config.js";
import logger from "../utils/log.js";
import { getModel } from "./utils.js";
import { getTempPath, uuid, calculateFileQuickHash } from "../utils/index.js";

import type { StandardASRResult } from "../ai/index.js";

/**
 * 检测唱歌边界点
 * @param videoPath 输入视频文件路径,wav
 */
export async function musicDetect(
  videoPath: string,
  iConfig?: Partial<DetectionConfig & { disableCache: boolean }>,
) {
  const cachePath = getTempPath();
  const outputVideoName = `${uuid()}.wav`;
  const fileHash = await calculateFileQuickHash(videoPath);
  const featuresJsonPath = path.join(cachePath, `features_${fileHash}.json`);

  let features: Awaited<ReturnType<typeof analyzeAudio>> = [];
  if (await fs.pathExists(featuresJsonPath)) {
    logger.info("检测到已有音频特征缓存，直接读取:", featuresJsonPath);
    features = await fs.readJSON(featuresJsonPath);
  } else {
    const task = await addExtractAudioTask(videoPath, outputVideoName, {
      saveType: 2,
      savePath: cachePath,
      autoRun: true,
      addQueue: false,
      sampleRate: 16000,
    });
    const outputFile: string = await new Promise((resolve, reject) => {
      task.on("task-end", () => {
        resolve(task.output as string);
      });
      task.on("task-error", (err) => {
        reject(err);
      });
    });

    // 1. 分析 WAV 音频文件（带进度回调）
    features = await analyzeAudio(outputFile, 2048, 512, () => {
      // console.log(`分析进度: ${(progress * 100).toFixed(1)}%`);
    });
    fs.remove(outputFile);

    if (!iConfig?.disableCache) {
      await fs.writeJSON(featuresJsonPath, features, { spaces: 2 });
    }
  }

  const config: DetectionConfig = {
    energyPercentile: 50, // 能量百分位阈值 (0-100)
    minSegmentDuration: 20, // 最小片段时长（秒）
    maxGapDuration: 20, // 最大间隔时长（秒）
    smoothWindowSize: 4, // 平滑窗口大小（秒）
    ...iConfig,
  };

  // 2. 检测音乐片段
  const segments = detectMusicSegments(features, config);

  // 3. 如果配置了不保留缓存，删除缓存文件
  // @ts-ignore
  if (iConfig?.disableCache && (await fs.pathExists(featuresJsonPath))) {
    logger.info("删除音频特征缓存文件:", featuresJsonPath);
    await fs.remove(featuresJsonPath);
  }

  // 4. 使用检测到 的片段
  segments.forEach((segment) => {
    logger.info("检测到音乐片段:", segment);
  });
  return segments;
}

interface ASRWord {
  st: number;
  et: number;
  t: string;
}

function convert2Srt2(detail: ASRWord[], offset: number): string {
  let srt = "";
  let index = 1;
  for (const sentence of detail || []) {
    const start = new Date(sentence.st + offset).toISOString().substr(11, 12).replace(".", ",");
    const end = new Date(sentence.et + offset).toISOString().substr(11, 12).replace(".", ",");
    srt += `${index}\n${start} --> ${end}\n${sentence.t}\n\n`;
    index++;
  }
  return srt;
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
 */
export async function optimizeLyrics(asrData: StandardASRResult, lyrics: string, offset: number) {
  // 检查是否有词级时间戳
  if (!asrData.words || asrData.words.length === 0) {
    throw new Error(
      "当前选择的 ASR 模型不支持词级时间戳，无法进行歌词优化。请使用支持词级时间戳的模型（如阿里云 fun-asr）。",
    );
  }

  const { vendorId, prompt, model, enableStructuredOutput } = getLyricOptimizeConfig();
  const { apiKey, baseURL } = getVendor(vendorId);
  const llm = new QwenLLM({
    apiKey: apiKey,
    model: model,
    baseURL: baseURL,
  });

  const asrCleanedSentences: ASRWord[] = [];
  for (const word of asrData.words) {
    asrCleanedSentences.push({
      st: word.start * 1000, // 秒转毫秒
      et: word.end * 1000,
      t: word.word,
    });
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
    },
  );
  logger.info("优化结果:", response);
  if (!response.content) {
    throw new Error("LLM 未返回任何内容");
  }
  try {
    const json = JSON.parse(response.content) as ASRWord[] | { data: ASRWord[] };
    const aSRWords = Array.isArray(json) ? json : json.data;
    const srtData = convert2Srt2(aSRWords, offset);
    return srtData;
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
    lyricOptimize: data?.songRecognizeLlm?.lyricOptimize ?? true,
  };
}

/**
 * 获取歌词优化配置
 */
function getLyricOptimizeConfig() {
  const config = appConfig.getAll();
  const data = config.ai;
  let modelId = data?.songLyricOptimize?.modelId;

  const model = getModel(modelId);
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
    logger.info("使用 LLM 进行歌曲名称识别...", {
      prompt: options.prompt,
      messages: truncatedText,
      llmModel: options.model,
    });

    const response = await llm.sendMessage(truncatedText, options.prompt, {
      enableSearch: options.enableSearch,
      responseFormat: options.enableStructuredOutput ? { type: "json_object" } : undefined,
      temperature: 0.6,
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
      const json = JSON.parse(response.content) as {
        name: string;
        lyrics: string;
      };
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
 */
export async function songRecognize(file: string, audioStartTime: number = 0) {
  const {
    asrModelId,
    llmVendorId,
    llmPrompt,
    llmModel,
    enableSearch,
    maxInputLength,
    enableStructuredOutput,
    lyricOptimize,
  } = getSongRecognizeConfig();

  let info: {
    name: string;
    lyrics: string | null;
  } | null = await shazamRecognize(file, lyricOptimize);
  if (!info) {
    logger.warn("Shazam 未识别到任何歌曲信息");
  }
  logger.info("Shazam 识别结果:", info);

  // 如果不需要进行歌词优化，且已经有歌曲名称，直接返回
  if (!lyricOptimize && info?.name) {
    logger.info("不需要进行歌词优化，直接返回 Shazam 歌曲名称");
    return {
      name: info.name,
    };
  }

  // 如果开启了歌词优化，首先要asr识别
  const data = await recognize(file, asrModelId);
  const messages = data.text || "";
  if (!messages) {
    logger.warn("没有识别到任何文本内容，无法进行歌曲识别");
    return;
  }

  // 如果 Shazam 未识别到歌曲名称或歌词，则使用 LLM 再识别一次
  if (!info?.lyrics || !info?.name) {
    info = await recognizeSongNameWithLLM(messages, llmVendorId, {
      prompt: llmPrompt,
      model: llmModel,
      enableSearch: enableSearch,
      maxInputLength: maxInputLength,
      enableStructuredOutput: enableStructuredOutput,
    });
  }
  if (!info) {
    logger.warn("未识别到任何歌曲信息");
    return;
  }

  const rawLyrics = info?.lyrics;
  let srtData = "";
  if (rawLyrics && lyricOptimize) {
    try {
      srtData = await optimizeLyrics(data, rawLyrics, audioStartTime * 1000);
    } catch (error: any) {
      logger.error("歌词优化失败:", error);
    }
  }
  if (!srtData) {
    // 如果没有歌词优化结果，使用原始 ASR 结果生成 SRT
    // 这里也需要词级时间戳
    if (!data.words || data.words.length === 0) {
      throw new Error(
        "当前选择的 ASR 模型不支持词级时间戳，无法生成歌曲字幕。请使用支持词级时间戳的模型（如阿里云 fun-asr）。",
      );
    }

    // 生成简单的 SRT（使用词级时间戳）
    const words: ASRWord[] = data.words.map((word) => ({
      st: word.start * 1000 + audioStartTime * 1000,
      et: word.end * 1000 + audioStartTime * 1000,
      t: word.word,
    }));
    srtData = convert2Srt2(words, 0);
  }

  const name = info?.name;
  return {
    name: name,
    lyrics: srtData,
  };
}
