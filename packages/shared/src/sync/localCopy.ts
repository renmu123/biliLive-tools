import fs from "fs-extra";
import path from "node:path";
import { TypedEmitter } from "tiny-typed-emitter";
import logger from "../utils/log.js";

export interface LocalCopyOptions {
  /**
   * 目标根路径
   * @default './output'
   */
  targetPath?: string;

  /**
   * 缓冲区大小（字节）
   * @default 64 * 1024 (64KB)
   */
  bufferSize?: number;

  /**
   * 日志记录器
   */
  logger?: typeof logger;
}

interface LocalCopyEvents {
  progress: (progress: {
    copied?: string;
    total?: string;
    speed?: string;
    elapsed?: string;
    percentage?: number;
    fileName?: string;
  }) => void;
  error: (error: Error) => void;
  success: (message: string) => void;
}

/**
 * 本地文件复制类
 * 提供带进度反馈的本地文件复制功能
 */
export class LocalCopy extends TypedEmitter<LocalCopyEvents> {
  private targetPath: string;
  private bufferSize: number;
  private logger: typeof logger | Console;
  private isOperating: boolean = false;
  private startTime: number = 0;

  constructor(options?: LocalCopyOptions) {
    super();
    this.targetPath = options?.targetPath || "./output";
    this.bufferSize = options?.bufferSize || 64 * 1024; // 64KB
    this.logger = options?.logger || logger;
  }

  /**
   * 将字节数转换为可读的大小字符串
   * @param bytes 字节数
   * @returns 可读大小字符串
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  }

  /**
   * 计算传输速度
   * @param copiedBytes 已复制字节数
   * @param elapsedMs 已用时间（毫秒）
   * @returns 速度字符串
   */
  private calculateSpeed(copiedBytes: number, elapsedMs: number): string {
    if (elapsedMs === 0) return "0B/s";
    const bytesPerSecond = (copiedBytes / elapsedMs) * 1000;
    return `${this.formatSize(bytesPerSecond)}/s`;
  }

  /**
   * 格式化时间
   * @param ms 毫秒
   * @returns 时间字符串
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h${minutes % 60}m`;
  }

  public isLoggedIn() {
    return true;
  }

  public uploadFile(
    sourceFilePath: string,
    relativeDir?: string,
    options?: {
      overwrite?: boolean;
      preserveTimestamps?: boolean;
      retry?: number;
      policy?: "fail" | "newcopy" | "overwrite" | "skip" | "rsync";
    },
  ) {
    return this.copyFile(sourceFilePath, relativeDir, options);
  }

  /**
   * 复制文件
   * @param sourceFilePath 源文件路径
   * @param relativeDir 相对目标目录路径
   * @param options 复制选项
   * @returns Promise<void>
   */
  public async copyFile(
    sourceFilePath: string,
    relativeDir: string = "",
    options?: {
      overwrite?: boolean;
      preserveTimestamps?: boolean;
    },
  ): Promise<void> {
    if (this.isOperating) {
      throw new Error("复制操作正在进行中，请等待完成或先取消当前操作");
    }

    // 检查源文件是否存在
    if (!(await fs.pathExists(sourceFilePath))) {
      const error = new Error(`源文件不存在: ${sourceFilePath}`);
      this.logger.error(error.message);
      this.emit("error", error);
      throw error;
    }

    this.isOperating = true;
    this.startTime = Date.now();

    try {
      // 获取文件信息
      const sourceStats = await fs.stat(sourceFilePath);
      const fileName = path.basename(sourceFilePath);
      const targetDir = path.join(this.targetPath, relativeDir);
      const targetFilePath = path.join(targetDir, fileName);

      // 确保目标目录存在
      await fs.ensureDir(targetDir);

      // 检查目标文件是否存在
      if (!options?.overwrite && (await fs.pathExists(targetFilePath))) {
        const error = new Error(`目标文件已存在: ${targetFilePath}`);
        this.logger.error(error.message);
        this.emit("error", error);
        throw error;
      }

      this.logger.info(`开始复制: ${sourceFilePath} 到 ${targetFilePath}`);

      // 如果文件小于缓冲区大小，直接复制
      if (sourceStats.size <= this.bufferSize) {
        await fs.copy(sourceFilePath, targetFilePath, {
          overwrite: options?.overwrite,
          preserveTimestamps: options?.preserveTimestamps ?? true,
        });

        const elapsed = Date.now() - this.startTime;
        this.emit("progress", {
          copied: this.formatSize(sourceStats.size),
          total: this.formatSize(sourceStats.size),
          speed: this.calculateSpeed(sourceStats.size, elapsed),
          elapsed: this.formatTime(elapsed),
          percentage: 100,
          fileName,
        });
      } else {
        // 流式复制大文件，提供进度反馈
        await this.copyFileWithProgress(sourceFilePath, targetFilePath, sourceStats.size, fileName);
      }

      // 保持时间戳
      if (options?.preserveTimestamps) {
        await fs.utimes(targetFilePath, sourceStats.atime, sourceStats.mtime);
      }

      const successMsg = `复制成功: ${sourceFilePath} -> ${targetFilePath}`;
      this.logger.info(successMsg);
      this.emit("success", successMsg);
    } catch (error: any) {
      this.logger.error(`复制失败: ${error.message}`);
      this.emit("error", error);
      throw error;
    } finally {
      this.isOperating = false;
    }
  }

  /**
   * 带进度的文件复制
   * @param sourcePath 源文件路径
   * @param targetPath 目标文件路径
   * @param totalSize 文件总大小
   * @param fileName 文件名
   */
  private async copyFileWithProgress(
    sourcePath: string,
    targetPath: string,
    totalSize: number,
    fileName: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const readable = fs.createReadStream(sourcePath, {
        highWaterMark: this.bufferSize,
      });
      const writable = fs.createWriteStream(targetPath);

      let copiedBytes = 0;
      let lastProgressTime = Date.now();

      readable.on("data", (chunk) => {
        copiedBytes += chunk.length;
        const now = Date.now();
        const elapsed = now - this.startTime;

        // 每100ms或每个缓冲区发送一次进度更新
        if (now - lastProgressTime >= 100 || copiedBytes === totalSize) {
          const percentage = (copiedBytes / totalSize) * 100;
          this.emit("progress", {
            copied: this.formatSize(copiedBytes),
            total: this.formatSize(totalSize),
            speed: this.calculateSpeed(copiedBytes, elapsed),
            elapsed: this.formatTime(elapsed),
            percentage,
            fileName,
          });
          lastProgressTime = now;
        }
      });

      readable.on("error", (error) => {
        reject(error);
      });

      writable.on("error", (error) => {
        reject(error);
      });

      writable.on("finish", () => {
        resolve();
      });

      readable.pipe(writable);
    });
  }
  public cancelUpload() {
    return this.cancelCopy();
  }

  /**
   * 取消当前复制操作
   * @returns 是否成功取消复制（如果没有正在进行的复制将返回false）
   */
  public cancelCopy(): boolean {
    if (this.isOperating) {
      this.logger.info("取消复制操作");
      this.isOperating = false;
      return true;
    }
    return false;
  }

  /**
   * 检查是否正在执行复制操作
   * @returns 是否正在操作
   */
  public isBusy(): boolean {
    return this.isOperating;
  }

  /**
   * 设置目标路径
   * @param targetPath 新的目标路径
   */
  public setTargetPath(targetPath: string): void {
    this.targetPath = targetPath;
  }

  /**
   * 获取当前目标路径
   * @returns 当前目标路径
   */
  public getTargetPath(): string {
    return this.targetPath;
  }
}
