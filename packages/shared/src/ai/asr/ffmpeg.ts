import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import logger from "../../utils/log.js";
import { escaped } from "../../utils/index.js";

/**
 * FFmpeg Whisper 配置接口
 */
export interface FFmpegWhisperOptions {
  /**
   * ffmpeg 可执行文件路径
   */
  ffmpegPath: string;

  /**
   * whisper 模型文件路径
   */
  model: string;

  /**
   * 日志记录器
   */
  logger?: typeof logger;

  /**
   * 识别语言（如 "zh", "en"）
   * @default "zh"
   */
  language?: string;

  /**
   * 队列大小
   * @default 20
   */
  queue?: number;
}

/**
 * FFmpeg Whisper JSONL 输出格式（每行一个对象）
 */
export interface WhisperSegment {
  /**
   * 开始时间（毫秒）
   */
  start: number;

  /**
   * 结束时间（毫秒）
   */
  end: number;

  /**
   * 文本内容
   */
  text: string;
}

/**
 * FFmpeg Whisper 转写结果
 */
export interface WhisperTranscriptionResult {
  /**
   * 段落级别结果数组
   */
  segments: WhisperSegment[];
}

/**
 * FFmpeg Whisper ASR 实现
 * 使用 spawn 直接调用 ffmpeg 的 whisper 滤镜
 */
export class FFmpegWhisperASR {
  private options: Required<FFmpegWhisperOptions>;

  constructor(options: FFmpegWhisperOptions) {
    this.options = {
      logger: logger,
      language: "zh",
      queue: 20,
      ...options,
    };

    // 验证 ffmpeg 路径
    if (!fs.existsSync(this.options.ffmpegPath)) {
      throw new Error(`FFmpeg 路径不存在: ${this.options.ffmpegPath}`);
    }

    // 验证模型文件路径
    if (!fs.existsSync(this.options.model)) {
      throw new Error(`Whisper 模型文件不存在: ${this.options.model}`);
    }
  }

  /**
   * 识别本地音频文件
   * @param filePath 本地文件路径
   * @returns Whisper 转写结果
   */
  async recognizeLocalFile(filePath: string): Promise<WhisperTranscriptionResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`音频文件不存在: ${filePath}`);
    }

    // 创建临时目录存放结果
    const tempDir = path.join(os.tmpdir(), "whisper-asr");
    await fs.ensureDir(tempDir);

    // 生成唯一的输出文件名
    const outputFile = path.join(tempDir, `${uuidv4()}.json`);

    try {
      // 执行 ffmpeg 命令
      await this.executeFFmpeg(filePath, outputFile);

      // 读取结果文件
      if (!fs.existsSync(outputFile)) {
        throw new Error(`Whisper 未生成结果文件: ${outputFile}`);
      }

      // 读取 JSONL 文件（每行一个 JSON 对象）
      const resultContent = await fs.readFile(outputFile, "utf-8");
      const segments: WhisperSegment[] = resultContent
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          try {
            return JSON.parse(line) as WhisperSegment;
          } catch (error) {
            this.options.logger.warn(`解析 JSONL 行失败: ${line}`);
            return null;
          }
        })
        .filter((seg): seg is WhisperSegment => seg !== null);

      this.options.logger.info(`Whisper 识别完成: ${filePath}, 共 ${segments.length} 个片段`);

      return { segments };
    } catch (error) {
      this.options.logger.error(`Whisper 识别失败: ${error}`);
      throw error;
    } finally {
      console.log("清理临时文件:", outputFile);
      // 清理临时文件
      // if (fs.existsSync(outputFile)) {
      //   await fs.remove(outputFile);
      // }
    }
  }

  /**
   * 执行 ffmpeg whisper 命令
   * @param inputFile 输入音频文件
   * @param outputFile 输出 JSON 文件
   */
  private async executeFFmpeg(inputFile: string, outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 构建 whisper 滤镜参数（使用 jsonl 格式）
      const whisperFilter = `whisper=model=${escaped(this.options.model)}:language=${escaped(this.options.language)}:destination=${escaped(outputFile)}:format=json:queue=${this.options.queue}`;

      // ffmpeg 命令参数
      const args = [
        "-i",
        inputFile,
        "-af",
        whisperFilter,
        "-f",
        "null",
        "-", // 输出到 null
      ];

      this.options.logger.info(
        `执行 FFmpeg Whisper 命令: ${this.options.ffmpegPath} ${args.join(" ")}`,
      );

      // 使用 spawn 执行命令
      const process = spawn(this.options.ffmpegPath, args);

      let stderr = "";

      // 收集标准错误输出（ffmpeg 的日志）
      process.stderr.on("data", (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        // this.options.logger.debug(`FFmpeg stderr: ${text}`);
      });

      // 处理进程退出
      process.on("close", (code) => {
        if (code === 0) {
          this.options.logger.info("FFmpeg Whisper 执行成功");
          resolve();
        } else {
          this.options.logger.error(`FFmpeg 执行失败，退出码: ${code}`);
          this.options.logger.error(`错误信息: ${stderr}`);
          reject(new Error(`FFmpeg 执行失败，退出码: ${code}\n${stderr}`));
        }
      });

      // 处理错误
      process.on("error", (error) => {
        this.options.logger.error(`FFmpeg 进程错误: ${error}`);
        reject(error);
      });
    });
  }

  /**
   * 识别音频 URL（不支持）
   * 由于 ffmpeg whisper 需要本地文件，URL 需要先下载
   */
  async recognize(_fileUrl: string): Promise<WhisperTranscriptionResult> {
    throw new Error("FFmpeg Whisper 不支持直接识别 URL，请先下载音频文件后使用 recognizeLocalFile");
  }
}
