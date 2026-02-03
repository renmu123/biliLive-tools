import path from "node:path";
import fs from "fs-extra";
import { analyzeAudio, detectMusicSegments, DetectionConfig } from "music-segment-detector";

import { addExtractAudioTask } from "../task/video.js";
import { AliyunASR, TranscriptionDetail, QwenLLM, recognize } from "../ai/index.js";
import { recognize as shazamRecognize } from "./shazam.js";
import { appConfig } from "../config.js";
import logger from "../utils/log.js";
import { getModel } from "./utils.js";
import { getTempPath, uuid, calculateFileQuickHash } from "../utils/index.js";

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

function convert2Srt(detail: TranscriptionDetail, offset: number): string {
  let srt = "";
  let index = 1;
  for (const transcript of detail.transcripts || []) {
    for (const sentence of transcript.sentences || []) {
      const start = new Date(sentence.begin_time + offset)
        .toISOString()
        .substr(11, 12)
        .replace(".", ",");
      const end = new Date(sentence.end_time + offset)
        .toISOString()
        .substr(11, 12)
        .replace(".", ",");
      srt += `${index}\n${start} --> ${end}\n${sentence.text}\n\n`;
      index++;
    }
  }
  return srt;
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
 * 音频识别（返回原生格式，向后兼容）
 * @deprecated 建议使用 createASRProvider(modelId) 以支持多种 ASR 提供商
 * @param file
 * @param opts
 * @returns
 */
export async function asrRecognize(file: string, opts: { vendorId: string; model: string }) {
  const { apiKey } = getVendor(opts.vendorId);

  const asr = new AliyunASR({
    apiKey: apiKey,
    model: opts.model,
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
export async function llm(
  message: string,
  systemPrompt?: string,
  opts: {
    key?: string;
    enableSearch?: boolean;
    jsonResponse?: boolean;
    stream?: boolean;
  } = {},
) {
  console.log("=== 示例: 使用通义千问 LLM ===");
  const apiKey = opts.key ?? getApiKey();

  const llm = new QwenLLM({
    apiKey: apiKey,
    model: "qwen-plus",
  });

  try {
    // const testData = fs.readFileSync(
    //   "C:\\Users\\renmu\\Downloads\\新建文件夹 (2)\\cleaned_data.json",
    // );
    // console.log("读取测试数据，长度:", message + testData, testData.length);
    const response = await llm.sendMessage(message, systemPrompt, {
      // responseFormat: zodResponseFormat(Song, "song"),
      enableSearch: opts.enableSearch ?? false,
      responseFormat: opts.jsonResponse ? { type: "json_object" } : undefined,
      // @ts-ignore
      stream: opts.stream ?? undefined,
      searchOptions: {
        forcedSearch: opts.enableSearch ?? false,
      },
    });

    if ("content" in response) {
      logger.info("LLM 请求成功", JSON.stringify(response));
      // console.log("提问:", response);
      // console.log("回复:", response.content);
      // console.log("Token 使用:", response.usage);
      return response;
    }
    throw new Error("LLM 未返回预期的响应内容");
  } catch (error) {
    console.error("LLM 请求失败:", error);
    throw error;
  }
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
export async function optimizeLyrics(asrData: TranscriptionDetail, lyrics: string, offset: number) {
  const { vendorId, prompt, model, enableStructuredOutput } = getLyricOptimizeConfig();
  const { apiKey, baseURL } = getVendor(vendorId);
  const llm = new QwenLLM({
    apiKey: apiKey,
    model: model,
    baseURL: baseURL,
  });

  const asrCleanedSentences: ASRWord[] = [];
  for (const transcript of asrData.transcripts || []) {
    for (const sentence of transcript.sentences || []) {
      for (const word of sentence.words || []) {
        asrCleanedSentences.push({
          st: word.begin_time,
          et: word.end_time,
          t: word.text,
        });
      }
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

  const asrModel = getModel(data.songRecognizeAsr?.modelId, config);

  const asrVendor = data.vendors.find((v: any) => v.id === asrModel.vendorId);
  if (!asrVendor) {
    throw new Error("找不到ASR模型关联的供应商");
  }

  const llmModel = getModel(data?.songRecognizeLlm?.modelId, config);
  const llmVendor = data.vendors.find((v: any) => v.id === llmModel.vendorId);
  if (!llmVendor) {
    throw new Error("找不到LLM模型关联的供应商");
  }

  return {
    data,
    asrVendorId: asrVendor.id,
    asrModel: asrModel.modelName,
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
    asrVendorId,
    llmVendorId,
    llmPrompt,
    llmModel,
    enableSearch,
    maxInputLength,
    enableStructuredOutput,
    lyricOptimize,
    asrModel,
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
  const data = await asrRecognize(file, { vendorId: asrVendorId, model: asrModel });
  const messages = data.transcripts?.[0]?.text || "";
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
    srtData = await optimizeLyrics(data, rawLyrics, audioStartTime * 1000);
  }
  if (!srtData) {
    srtData = convert2Srt(optimizeMusicSubtitles(data), audioStartTime * 1000);
  }

  const name = info?.name;
  return {
    name: name,
    lyrics: srtData,
  };
}
