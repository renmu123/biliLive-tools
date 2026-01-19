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
 * 音频识别
 * @param file
 * @param key
 * @returns
 */
export async function asrRecognize(file: string, vendorId: string) {
  const { apiKey } = getVendor(vendorId);

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
      console.log("提问:", response);
      console.log("回复:", response.content);
      console.log("Token 使用:", response.usage);
      return response;
    }
  } catch (error) {
    console.error("LLM 请求失败:", error);
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
 * 获取歌词优化配置
 */
function getLyricOptimizeConfig() {
  const { data, llmVendorId, llmModel } = getSongRecognizeConfig();
  return {
    vendorId: data?.songLyricOptimize?.vendorId || llmVendorId,
    prompt: data?.songLyricOptimize?.prompt,
    model: data?.songLyricOptimize?.model || llmModel,
    enableStructuredOutput: data?.songLyricOptimize?.enableStructuredOutput ?? true,
  };
}

/**
 * 歌词优化
 * @param lyrics - 原始歌词文本
 * @param offset - 偏移时间，单位毫秒
 */
export async function optimizeLyrics(asrData: TranscriptionDetail, lyrics: string, offset: number) {
  const { vendorId, prompt, model, enableStructuredOutput } = getLyricOptimizeConfig();
  const { apiKey } = getVendor(vendorId);
  const llm = new QwenLLM({
    apiKey: apiKey,
    model: model,
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
    message: `原歌词：${lyrics}\nASR转录数据：${JSON.stringify(asrCleanedSentences)}`,
    systemPrompt: prompt,
    llmModel: model,
  });
  const response = await llm.sendMessage(
    `原歌词：${lyrics}\nASR转录数据：${JSON.stringify(asrCleanedSentences)}`,
    prompt,
    {
      enableSearch: false,
      responseFormat: enableStructuredOutput ? { type: "json_object" } : undefined,
    },
  );
  logger.info("优化结果:", response);
  if (!response.content) {
    throw new Error("LLM 未返回任何内容");
  }
  try {
    const json = JSON.parse(response.content) as ASRWord[];
    const srtData = convert2Srt2(json, offset);
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
    data,
    asrVendorId,
    llmVendorId,
    llmPrompt: data?.songRecognizeLlm?.prompt,
    llmModel: data?.songRecognizeLlm?.model || "qwen-plus",
    enableSearch: data?.songRecognizeLlm?.enableSearch ?? false,
    maxInputLength: data?.songRecognizeLlm?.maxInputLength || 300,
    enableStructuredOutput: data?.songRecognizeLlm?.enableStructuredOutput ?? true,
    lyricOptimize: data?.songRecognizeLlm?.lyricOptimize ?? true,
  };
}

/**
 * 输入音频，识别歌曲名称，输出歌词以及歌曲名称
 * @param file - 音频文件路径
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
  } = await getSongRecognizeConfig();

  const data = await asrRecognize(file, asrVendorId);
  const messages = data.transcripts?.[0]?.text || "";
  if (!messages) {
    logger.warn("没有识别到任何文本内容，无法进行歌曲识别");
    return;
  }

  const { apiKey } = getVendor(llmVendorId);
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
    responseFormat: enableStructuredOutput ? { type: "json_object" } : undefined,
    searchOptions: {
      forcedSearch: enableSearch,
      search_strategy: "max",
      intention_options: {
        prompt_intervene: "仅检索MUSIC相关内容",
      },
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
    let srtData = "";
    if (json.lyrics) {
      if (lyricOptimize) {
        srtData = await optimizeLyrics(data, json.lyrics, audioStartTime * 1000);
      } else {
        srtData = convert2Srt(optimizeMusicSubtitles(data), audioStartTime * 1000);
        // fs.writeJSONSync("./last_song_recognize_asr_result.json", data, { spaces: 2 });
        // await fs.writeFile("./output.srt", srtData, "utf-8");
      }
    }

    return {
      name: json.name,
      lyrics: srtData,
    };
  } catch (e) {
    logger.error("LLM 返回内容非 JSON 格式，尝试按纯文本处理", e);
    throw new Error("LLM 返回内容非 JSON 格式，无法解析歌曲名称和歌词");
  }
}
