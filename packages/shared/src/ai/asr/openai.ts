import axios, { AxiosInstance } from "axios";
import fs from "fs-extra";
import FormData from "form-data";
import logger from "../../utils/log.js";

/**
 * OpenAI Whisper ASR 配置接口
 */
export interface OpenAIWhisperASROptions {
  /**
   * API Key，用于鉴权
   */
  apiKey: string;

  /**
   * 自定义API地址（可选）
   * @default 'https://api.openai.com/v1'
   */
  baseURL?: string;

  /**
   * 模型名称
   * @default 'whisper-1'
   */
  model?: string;

  /**
   * 日志记录器
   */
  logger?: typeof logger;
}

/**
 * OpenAI Whisper API 响应格式（verbose_json）
 */
export interface OpenAITranscriptionResponse {
  /**
   * 任务类型
   */
  task: "transcribe";

  /**
   * 识别的语言代码
   */
  language: string;

  /**
   * 音频时长（秒）
   */
  duration: number;

  /**
   * 完整转写文本
   */
  text: string;

  /**
   * 分段转写结果
   */
  segments: OpenAISegment[];
}

/**
 * OpenAI 分段结果
 */
export interface OpenAISegment {
  /**
   * 片段索引
   */
  id: number;

  /**
   * 开始时间（秒）
   */
  start: number;

  /**
   * 结束时间（秒）
   */
  end: number;

  /**
   * 转写文本
   */
  text: string;

  /**
   * 词级别时间戳（tokens）
   */
  tokens?: number[];

  /**
   * 温度参数
   */
  temperature?: number;

  /**
   * 平均对数概率
   */
  avg_logprob?: number;

  /**
   * 压缩率
   */
  compression_ratio?: number;

  /**
   * 无语音概率
   */
  no_speech_prob?: number;
}

/**
 * OpenAI Whisper ASR 语音识别类
 * 使用 OpenAI Whisper API 进行录音文件识别
 */
export class OpenAIWhisperASR {
  private client: AxiosInstance;
  private model: string;
  private logger: typeof logger;

  /**
   * 创建 OpenAI Whisper ASR 实例
   */
  constructor(options: OpenAIWhisperASROptions) {
    const { apiKey, baseURL = "https://api.openai.com/v1", model = "whisper-1" } = options;

    this.model = model;
    this.logger = options.logger || logger;

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 300000, // 5分钟超时
    });
  }

  /**
   * 识别音频文件（通过文件URL）
   * 注意：OpenAI Whisper API 不支持直接传URL，需要先下载文件
   *
   * @param fileUrl 音频文件URL
   * @returns 转写结果
   */
  async recognize(fileUrl: string): Promise<OpenAITranscriptionResponse> {
    this.logger.info(`开始下载文件: ${fileUrl}`);

    // 下载文件到临时位置
    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    const tempFilePath = `/tmp/whisper-temp-${Date.now()}.audio`;
    await fs.writeFile(tempFilePath, response.data);

    try {
      const result = await this.recognizeLocalFile(tempFilePath);
      return result;
    } finally {
      // 清理临时文件
      await fs.remove(tempFilePath).catch((err) => {
        this.logger.warn(`清理临时文件失败: ${err.message}`);
      });
    }
  }

  /**
   * 识别本地音频文件
   *
   * @param filePath 本地音频文件路径
   * @param options 可选参数
   * @returns 转写结果
   */
  async recognizeLocalFile(
    filePath: string,
    options?: {
      /**
       * 提示文本，用于提高识别准确度
       */
      prompt?: string;

      /**
       * 指定语言（ISO-639-1 代码）
       */
      language?: string;

      /**
       * 采样温度 (0-1)
       */
      temperature?: number;
    },
  ): Promise<OpenAITranscriptionResponse> {
    this.logger.info(`开始识别本地文件: ${filePath}`);

    // 检查文件是否存在
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 创建 FormData
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("model", this.model);
    formData.append("response_format", "verbose_json"); // 使用 verbose_json 获取时间戳

    if (options?.prompt) {
      formData.append("prompt", options.prompt);
    }

    if (options?.language) {
      formData.append("language", options.language);
    }

    if (options?.temperature !== undefined) {
      formData.append("temperature", options.temperature.toString());
    }

    try {
      const response = await this.client.post<OpenAITranscriptionResponse>(
        "/audio/transcriptions",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      this.logger.info(`识别完成，文本长度: ${response.data.text.length}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || "未知错误";
      this.logger.error(`OpenAI Whisper 识别失败: ${errorMessage}`);
      throw new Error(`OpenAI Whisper 识别失败: ${errorMessage}`);
    }
  }
}
