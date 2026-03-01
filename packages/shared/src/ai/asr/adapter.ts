import { AliyunASR, type TranscriptionDetail } from "./aliyun.js";
import { OpenAIWhisperASR, type OpenAITranscriptionResponse } from "./openai.js";
import { FFmpegWhisperASR, type WhisperTranscriptionResult } from "./ffmpeg.js";
import type { StandardASRResult, StandardASRSegment, StandardASRWord } from "./types.js";
import { appConfig } from "../../config.js";
import { getModel } from "../../musicDetector/utils.js";
import logger from "../../utils/log.js";

/**
 * ASR 提供商统一接口
 */
export interface ASRProvider {
  /**
   * 识别音频文件（通过 URL）
   * @param fileUrl 音频文件 URL
   * @returns 标准格式的识别结果
   */
  recognize(fileUrl: string): Promise<StandardASRResult>;

  /**
   * 识别本地音频文件
   * @param filePath 本地文件路径
   * @returns 标准格式的识别结果
   */
  recognizeLocalFile(filePath: string): Promise<StandardASRResult>;
}

/**
 * 阿里云 ASR 适配器
 */
export class AliyunASRAdapter implements ASRProvider {
  private client: AliyunASR;

  constructor(config: { apiKey: string; baseURL?: string; model: string }) {
    this.client = new AliyunASR({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      model: config.model,
      logger,
    });
  }

  async recognize(fileUrl: string): Promise<StandardASRResult> {
    const result = await this.client.recognize(fileUrl);
    return this.transformAliyunResult(result);
  }

  async recognizeLocalFile(filePath: string): Promise<StandardASRResult> {
    const result = await this.client.recognizeLocalFile(filePath);
    return this.transformAliyunResult(result);
  }

  /**
   * 转换阿里云格式为标准格式
   */
  private transformAliyunResult(result: TranscriptionDetail): StandardASRResult {
    const transcript = result.transcripts?.[0];
    if (!transcript) {
      throw new Error("阿里云 ASR 返回结果为空");
    }

    const segments: StandardASRSegment[] = [];
    const words: StandardASRWord[] = [];

    // 转换句子级别数据
    transcript.sentences?.forEach((sentence, index) => {
      segments.push({
        id: index,
        start: sentence.begin_time / 1000, // 毫秒转秒
        end: sentence.end_time / 1000,
        text: sentence.text,
        speaker: sentence.speakerId?.toString(),
      });

      // 转换词级别数据
      sentence.words?.forEach((word) => {
        words.push({
          start: word.begin_time / 1000,
          end: word.end_time / 1000,
          word: word.text,
          punctuation: word.punctuation,
          speaker: word.speakerId?.toString(),
        });
      });
    });

    return {
      text: transcript.text,
      duration: result.properties.original_duration_in_milliseconds
        ? result.properties.original_duration_in_milliseconds / 1000
        : undefined,
      language: undefined, // 阿里云不返回语言信息
      segments,
      words: words.length > 0 ? words : undefined,
    };
  }
}

/**
 * OpenAI Whisper ASR 适配器
 */
export class OpenAIASRAdapter implements ASRProvider {
  private client: OpenAIWhisperASR;

  constructor(config: { apiKey: string; baseURL?: string; model: string }) {
    this.client = new OpenAIWhisperASR({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      model: config.model,
      logger,
    });
  }

  async recognize(fileUrl: string): Promise<StandardASRResult> {
    const result = await this.client.recognize(fileUrl);
    return this.transformOpenAIResult(result);
  }

  async recognizeLocalFile(filePath: string): Promise<StandardASRResult> {
    const result = await this.client.recognizeLocalFile(filePath);
    return this.transformOpenAIResult(result);
  }

  /**
   * 转换 OpenAI Whisper 格式为标准格式
   */
  private transformOpenAIResult(result: OpenAITranscriptionResponse): StandardASRResult {
    const segments: StandardASRSegment[] = result.segments.map((segment) => ({
      id: segment.id,
      start: segment.start,
      end: segment.end,
      text: segment.text.trim(),
      speaker: undefined, // Whisper 不支持说话人分离
    }));

    return {
      text: result.text,
      duration: result.duration,
      language: result.language,
      segments,
      words: undefined, // Whisper API 不返回词级别时间戳
    };
  }
}

/**
 * FFmpeg Whisper ASR 适配器
 */
export class FFmpegWhisperASRAdapter implements ASRProvider {
  private client: FFmpegWhisperASR;

  constructor(config: { ffmpegPath: string; model: string; language?: string; queue?: number }) {
    this.client = new FFmpegWhisperASR({
      ffmpegPath: config.ffmpegPath,
      model: config.model,
      language: config.language || "zh",
      queue: config.queue || 20,
      logger,
    });
  }

  async recognize(): Promise<StandardASRResult> {
    throw new Error("FFmpeg Whisper 不支持直接识别 URL，请使用 recognizeLocalFile");
  }

  async recognizeLocalFile(filePath: string): Promise<StandardASRResult> {
    const result = await this.client.recognizeLocalFile(filePath);
    return this.transformWhisperResult(result);
  }

  /**
   * 转换 FFmpeg Whisper 格式为标准格式
   */
  private transformWhisperResult(result: WhisperTranscriptionResult): StandardASRResult {
    if (!result.segments || result.segments.length === 0) {
      throw new Error("Whisper 返回结果为空");
    }

    // 转换段落格式（毫秒转秒）
    const segments: StandardASRSegment[] = result.segments.map((segment, index) => ({
      id: index,
      start: segment.start / 1000, // 毫秒转秒
      end: segment.end / 1000, // 毫秒转秒
      text: segment.text,
    }));

    // 构建完整文本
    const text = segments.map((s) => s.text).join("");

    // 计算总时长
    const duration = segments.length > 0 ? segments[segments.length - 1].end : 0;

    return {
      text,
      duration,
      language: undefined, // Whisper 在 JSONL 输出中不包含语言信息
      segments,
      words: undefined, // JSONL 格式不提供词级别时间戳
    };
  }
}

/**
 * 获取供应商配置
 */
function getVendor(vendorId: string) {
  const data = appConfig.get("ai") || {};
  const vendor = data.vendors.find((v: any) => v.id === vendorId);
  if (!vendor) {
    throw new Error(`未找到 ID 为 ${vendorId} 的供应商配置`);
  }
  return vendor;
}

/**
 * 创建 ASR 提供商实例
 * @param modelId 模型 ID
 * @returns ASR 提供商实例
 */
export function createASRProvider(modelId: string): ASRProvider {
  // 获取模型配置
  const model = getModel(modelId);

  // 获取供应商配置
  const vendor = getVendor(model.vendorId);

  // 根据 provider 类型创建对应的适配器
  const config = {
    apiKey: vendor.apiKey,
    baseURL: vendor.baseURL,
    model: model.modelName,
  };

  switch (vendor.provider) {
    case "aliyun":
      return new AliyunASRAdapter(config);
    case "openai":
      return new OpenAIASRAdapter(config);
    case "ffmpeg":
      if (!vendor.baseURL) {
        throw new Error("FFmpeg provider 需要配置 baseURL（ffmpeg 执行文件路径）");
      }
      return new FFmpegWhisperASRAdapter({
        ffmpegPath: vendor.baseURL, // baseURL 存储 ffmpeg 路径
        model: model.modelName, // modelName 存储模型文件路径
      });
    default:
      throw new Error(`不支持的 ASR 提供商: ${vendor.provider}`);
  }
}

/**
 * 识别音频文件（返回标准格式）
 * @param file 音频文件
 * @param modelId 模型id
 * @returns
 */
export function recognize(file: string, modelId: string): Promise<StandardASRResult> {
  const asrProvider = createASRProvider(modelId);
  return asrProvider.recognizeLocalFile(file);
}
