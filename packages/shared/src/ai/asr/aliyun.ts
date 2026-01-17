import axios, { AxiosInstance } from "axios";
import fs from "fs-extra";
import FormData from "form-data";
import logger from "../../utils/log.js";

/**
 * 阿里云ASR配置接口
 */
export interface AliyunASROptions {
  /**
   * API Key，用于鉴权
   */
  apiKey: string;

  /**
   * 自定义API地址（可选）
   * @default 'https://dashscope.aliyuncs.com'
   */
  baseURL?: string;

  /**
   * 模型名称
   * @default 'fun-asr'
   */
  model?:
    | "fun-asr"
    | "fun-asr-2025-11-07"
    | "fun-asr-2025-08-25"
    | "fun-asr-mtl"
    | "fun-asr-mtl-2025-08-25";

  /**
   * 日志记录器
   */
  logger?: typeof logger;
}

/**
 * 提交任务参数
 */
export interface SubmitTaskParams {
  /**
   * 音视频文件URL，支持 HTTP/HTTPS 协议
   */
  fileUrl: string;

  /**
   * 热词ID（可选）
   */
  vocabularyId?: string;

  /**
   * 音轨索引，默认 [0]
   */
  channelId?: number[];

  /**
   * 敏感词过滤设置
   */
  specialWordFilter?: string;

  /**
   * 自动说话人分离，默认 false
   */
  diarizationEnabled?: boolean;

  /**
   * 说话人数量参考值（2-100）
   */
  speakerCount?: number;

  /**
   * 待识别语言代码，如 ["zh", "en"]
   */
  languageHints?: string[];
}

/**
 * 任务状态
 */
export type TaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

/**
 * 识别结果
 */
export interface TranscriptionResult {
  /**
   * 文件URL
   */
  fileUrl: string;

  /**
   * 识别结果URL（有效期24小时）
   */
  transcription_url?: string;

  /**
   * 子任务状态
   */
  subtask_status: TaskStatus;

  /**
   * 错误码（失败时）
   */
  code?: string;

  /**
   * 错误信息（失败时）
   */
  message?: string;
}

/**
 * 任务查询结果
 */
export interface TaskQueryResult {
  /**
   * 任务ID
   */
  taskId: string;

  /**
   * 任务状态
   */
  taskStatus: TaskStatus;

  /**
   * 提交时间
   */
  submitTime?: string;

  /**
   * 开始时间
   */
  scheduledTime?: string;

  /**
   * 结束时间
   */
  endTime?: string;

  /**
   * 识别结果列表
   */
  results?: TranscriptionResult[];
}

/**
 * 识别结果详情
 */
export interface TranscriptionDetail {
  file_url: string;
  properties: {
    /**
     * 音频格式
     */
    audio_format?: string;

    /**
     * 音轨信息
     */
    channels?: number[];

    /**
     * 原始采样率（Hz）
     */
    original_sampling_rate?: number;

    /**
     * 原始时长（ms）
     */
    original_duration_in_milliseconds?: number;
  };

  /**
   * 转写结果
   */
  transcripts?: Array<{
    /**
     * 音轨索引
     */
    channel_id: number;

    /**
     * 语音内容时长（ms）
     */
    content_duration_in_milliseconds: number;

    /**
     * 段落级别转写结果
     */
    text: string;

    /**
     * 句子级别转写结果
     */
    sentences?: Array<{
      /**
       * 开始时间戳（ms）
       */
      begin_time: number;

      /**
       * 结束时间戳（ms）
       */
      end_time: number;

      /**
       * 转写文本
       */
      text: string;

      /**
       * 说话人索引（启用说话人分离时）
       */
      speakerId?: number;
      sentence_id: number;
    }>;

    /**
     * 词级别转写结果
     */
    words?: Array<{
      /**
       * 开始时间戳（ms）
       */
      begin_time: number;

      /**
       * 结束时间戳（ms）
       */
      end_time: number;

      /**
       * 词文本
       */
      text: string;

      /**
       * 标点符号
       */
      punctuation?: string;

      /**
       * 说话人索引（启用说话人分离时）
       */
      speakerId?: number;
    }>;
  }>;
}

/**
 * 阿里云ASR语音识别类
 * 使用阿里云百炼 Fun-ASR 模型进行录音文件识别
 */
export class AliyunASR {
  private apiKey: string;
  private baseURL: string;
  private model: string;
  private logger: typeof logger | Console;
  private client: AxiosInstance;

  constructor(options: AliyunASROptions) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || "https://dashscope.aliyuncs.com";
    this.model = options.model || "fun-asr";
    this.logger = options.logger || console;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * 提交语音识别任务
   * @param params 任务参数
   * @returns 任务ID
   */
  async submitTask(params: SubmitTaskParams): Promise<string> {
    try {
      const requestData = {
        model: this.model,
        input: {
          file_urls: [params.fileUrl],
        },
        parameters: {
          ...(params.vocabularyId && { vocabulary_id: params.vocabularyId }),
          ...(params.channelId && { channel_id: params.channelId }),
          ...(params.specialWordFilter && { special_word_filter: params.specialWordFilter }),
          ...(params.diarizationEnabled !== undefined && {
            diarization_enabled: params.diarizationEnabled,
          }),
          ...(params.speakerCount && { speaker_count: params.speakerCount }),
          ...(params.languageHints && { language_hints: params.languageHints }),
        },
      };

      this.logger.info("提交ASR任务", { fileUrl: params.fileUrl });

      const response = await this.client.post(
        "/api/v1/services/audio/asr/transcription",
        requestData,
        {
          headers: {
            "X-DashScope-Async": "enable",
          },
        },
      );

      const taskId = response.data.output.task_id;
      this.logger.info(`ASR任务已提交，任务ID: ${taskId}`);

      return taskId;
    } catch (error) {
      this.logger.error("提交ASR任务失败", error);
      throw error;
    }
  }

  /**
   * 查询任务状态和结果
   * @param taskId 任务ID
   * @returns 任务查询结果
   */
  async queryTask(taskId: string): Promise<TaskQueryResult> {
    try {
      const response = await this.client.post(`/api/v1/tasks/${taskId}`, null, {
        headers: {
          "X-DashScope-Async": "enable",
        },
      });

      console.log("查询ASR任务状态", response, {
        taskId,
        status: response.data.output.task_status,
      });

      return {
        taskId: response.data.output.task_id,
        taskStatus: response.data.output.task_status,
        submitTime: response.data.output.submit_time,
        scheduledTime: response.data.output.scheduled_time,
        endTime: response.data.output.end_time,
        results: response.data.output.results,
      };
    } catch (error) {
      this.logger.error("查询ASR任务失败", error);
      throw error;
    }
  }

  /**
   * 等待任务完成（轮询）
   * @param taskId 任务ID
   * @param options 轮询配置
   * @returns 任务结果
   */
  async waitForCompletion(
    taskId: string,
    options: {
      /** 轮询间隔（毫秒），默认 2000ms */
      interval?: number;
      /** 最大等待时间（毫秒），默认 30 分钟 */
      maxWaitTime?: number;
    } = {},
  ): Promise<TaskQueryResult> {
    const { interval = 2000, maxWaitTime = 30 * 60 * 1000 } = options;
    const startTime = Date.now();

    while (true) {
      const result = await this.queryTask(taskId);

      if (result.taskStatus === "SUCCEEDED" || result.taskStatus === "FAILED") {
        return result;
      }

      if (Date.now() - startTime > maxWaitTime) {
        throw new Error(`任务超时，任务ID: ${taskId}`);
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  /**
   * 下载识别结果详情
   * @param transcriptionUrl 识别结果URL
   * @returns 识别结果详情
   */
  async downloadTranscription(transcriptionUrl: string): Promise<TranscriptionDetail> {
    try {
      const response = await axios.get(transcriptionUrl);
      return response.data;
    } catch (error) {
      this.logger.error("下载识别结果失败", error);
      throw error;
    }
  }

  /**
   * 一站式识别：提交任务 -> 等待完成 -> 获取结果
   * @param fileUrl 音频文件URL
   * @param params 其他参数
   * @returns 识别结果详情
   */
  async recognize(
    fileUrl: string,
    params?: Omit<SubmitTaskParams, "fileUrl">,
  ): Promise<TranscriptionDetail> {
    // 提交任务
    const taskId = await this.submitTask({
      fileUrl,
      ...params,
    });

    // 等待完成
    const result = await this.waitForCompletion(taskId);

    // 获取识别结果
    if (result.results && result.results.length > 0) {
      const item = result.results[0];
      if (item.subtask_status === "SUCCEEDED" && item.transcription_url) {
        const detail = await this.downloadTranscription(item.transcription_url);
        return detail;
      } else if (item.subtask_status === "FAILED") {
        this.logger.error(`文件识别失败: ${item.fileUrl}`, {
          code: item.code,
          message: item.message,
        });
        throw new Error(`识别失败: ${item.message || item.code}`);
      }
    }

    throw new Error("识别失败，未获取到结果");
  }

  /**
   * 上传本地文件到 tmpfiles.org 并返回公网URL
   * @param filePath 本地文件路径
   * @returns 文件的公网访问URL
   */
  async uploadToTmpfiles(filePath: string): Promise<string> {
    try {
      this.logger.info(`开始上传文件到 tmpfiles.org: ${filePath}`);

      const fileStream = fs.createReadStream(filePath);
      const formData = new FormData();
      formData.append("file", fileStream);

      const response = await axios.post("https://tmpfiles.org/api/v1/upload", formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      if (response.data.status === "success" && response.data.data?.url) {
        // tmpfiles.org 返回的URL格式是 https://tmpfiles.org/xxxxx
        // 需要转换为直接下载链接 https://tmpfiles.org/dl/xxxxx
        const originalUrl = response.data.data.url;
        const downloadUrl = originalUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/");

        this.logger.info(`文件上传成功: ${downloadUrl}`);
        return downloadUrl;
      } else {
        throw new Error(`上传失败: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      this.logger.error("上传文件到 tmpfiles.org 失败", error);
      throw error;
    }
  }

  /**
   * 识别本地文件（自动上传到临时服务）
   * @param filePath 本地文件路径
   * @param params 识别参数
   * @returns 识别结果详情
   */
  async recognizeLocalFile(
    filePath: string,
    params?: Omit<SubmitTaskParams, "fileUrl">,
  ): Promise<TranscriptionDetail> {
    // 检查文件是否存在
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 上传到临时文件服务
    const fileUrl = await this.uploadToTmpfiles(filePath);

    // 识别
    return await this.recognize(fileUrl, params);
  }

  convert2Srt(detail: TranscriptionDetail): string {
    let srt = "";
    let index = 1;
    for (const transcript of detail.transcripts || []) {
      for (const sentence of transcript.sentences || []) {
        const start = new Date(sentence.begin_time).toISOString().substr(11, 12).replace(".", ",");
        const end = new Date(sentence.end_time).toISOString().substr(11, 12).replace(".", ",");
        srt += `${index}\n${start} --> ${end}\n${sentence.text}\n\n`;
        index++;
      }
    }
    return srt;
  }
}

export default AliyunASR;
