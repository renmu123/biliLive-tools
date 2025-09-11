import fs from "fs-extra";
import logger from "../utils/log.js";
import { TypedEmitter } from "tiny-typed-emitter";
import { Uploader, getAccessToken, Client } from "pan123-uploader";
import statisticsService from "../db/service/statisticsService.js";

export interface Pan123Options {
  /**
   * 访问令牌
   */
  accessToken: string;

  /**
   * 上传目标路径
   * @default '/录播'
   */
  remotePath?: string;

  /**
   * 日志记录器
   */
  logger?: typeof logger;
}

interface Pan123Events {
  progress: (progress: {
    index?: number;
    uploaded?: string;
    total?: string;
    speed?: string;
    elapsed?: string;
    percentage?: number;
  }) => void;
  error: (error: Error) => void;
  success: (message: string) => void;
  canceled: (message: string) => void;
}

/**
 * 123网盘上传类
 * 使用123pan-uploader进行文件上传
 */
export class Pan123 extends TypedEmitter<Pan123Events> {
  private accessToken: string;
  private remotePath: string;
  private logger: typeof logger | Console;
  private client: Client;
  private currentUploader: Uploader | null = null;

  constructor(options: Pan123Options) {
    super();
    this.accessToken = options.accessToken;
    this.remotePath = options?.remotePath || "/录播";
    this.logger = options?.logger || logger;
    this.client = new Client(this.accessToken);
  }

  /**
   * 检查是否已获取访问令牌
   * @returns boolean 是否已获取访问令牌
   */
  public hasToken(): boolean {
    return this.accessToken !== null;
  }
  public async isLoggedIn(): Promise<boolean> {
    return this.hasToken();
  }

  /**
   * 取消当前上传操作
   */
  public cancelUpload(): void {
    if (this.currentUploader) {
      this.logger.info("取消上传操作");
      this.currentUploader.cancel();
      this.currentUploader = null;
    }
  }

  /**
   * 上传文件到123网盘
   * @param localFilePath 本地文件路径
   * @param remoteDir 远程目录路径（相对于基础远程路径）
   * @param options 上传选项
   * @returns Promise<void> 上传成功时resolve，失败时reject
   */
  public async uploadFile(
    localFilePath: string,
    remoteDir: string = "",
    options?: {
      retry?: number;
      // 覆盖选项: overwrite(覆盖)、skip(跳过)
      policy?: "overwrite" | "skip";
      // 并发数
      concurrency?: number;
    },
  ): Promise<void> {
    if (!(await fs.pathExists(localFilePath))) {
      const error = new Error(`文件不存在: ${localFilePath}`);
      this.logger.error(error.message);
      this.emit("error", error);
      throw error;
    }

    try {
      // 需要获取目标目录的ID
      let parentFileID = await this.client.mkdirRecursive(this.remotePath);

      // 如果有子目录路径，需要获取对应的目录ID
      // if (remoteDir) {
      //   // 这里需要实现路径到ID的转换，暂时使用根目录
      //   this.logger.warn(`暂时使用根目录上传，实际路径: ${remoteDir}`);
      // }

      // const fileName = path.basename(localFilePath);
      this.logger.debug(`123网盘开始上传: ${localFilePath} 到 ${this.remotePath}`);
      console.log(remoteDir);

      // 创建上传实例
      this.currentUploader = new Uploader(localFilePath, this.accessToken!, String(parentFileID), {
        concurrency: options?.concurrency || 3,
        retryTimes: options?.retry || 3,
        retryDelay: 3000,
        duplicate: options?.policy === "skip" ? 2 : 1, // 1: 覆盖, 2: 跳过
      });

      // 监听上传进度
      this.currentUploader.on("progress", (data) => {
        const percentage = Math.round(data.progress * 100);

        this.emit("progress", {
          uploaded: this.formatSize(data.data.loaded),
          total: this.formatSize(data.data.total),
          percentage,
          speed: "",
        });
      });

      // 监听上传完成
      this.currentUploader.on("completed", () => {
        const successMsg = `上传成功: ${localFilePath}`;
        this.emit("success", successMsg);
      });

      // 监听上传错误
      this.currentUploader.on("error", (error) => {
        this.logger.error(`上传文件出错: ${error.message}`);
        this.emit("error", error);
      });

      // 监听上传取消
      this.currentUploader.on("cancel", () => {
        this.logger.info("上传已取消");
        this.emit("canceled", "上传已取消");
      });

      // 开始上传
      const result = await this.currentUploader.upload();

      if (result) {
        const successMsg = `上传成功: ${localFilePath}`;
        this.logger.debug(successMsg);
        this.emit("success", successMsg);
      } else {
        throw new Error("上传失败: 未返回结果");
      }
    } catch (error: any) {
      if (error.message?.includes("cancel")) {
        this.logger.info("上传已取消");
        this.emit("canceled", "上传已取消");
      } else {
        this.logger.error(`上传文件出错: ${error.message}`);
        this.emit("error", error);
      }
      throw error;
    } finally {
      this.currentUploader = null;
    }
  }

  /**
   * 格式化文件大小
   * @param size 文件大小（字节）
   * @returns 格式化后的大小字符串
   */
  private formatSize(size: number): string {
    if (size < 1024) {
      return `${size}B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)}KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(2)}MB`;
    } else {
      return `${(size / 1024 / 1024 / 1024).toFixed(2)}GB`;
    }
  }
}

export async function pan123Login(clientId: string, clientSecret: string): Promise<string> {
  try {
    const response = await getAccessToken(clientId, clientSecret);

    if (response.code === 0 && response?.data?.accessToken) {
      const expiredAt = response.data.expiredAt;
      // 保存登录信息到StatisticsService
      const tokenData = {
        clientId: clientId,
        access: response.data.accessToken,
        expired: new Date(expiredAt).getTime(),
      };

      statisticsService.addOrUpdate({
        where: { stat_key: "pan123_token" },
        create: {
          stat_key: "pan123_token",
          value: JSON.stringify(tokenData),
        },
      });

      return response.data.accessToken;
    } else {
      throw new Error(`123网盘访问令牌获取失败: ${response.message}`);
    }
  } catch (error: any) {
    throw new Error(`123网盘访问令牌获取出错: ${error.message}`);
  }
}

export async function getToken(clientId: string, clientSecret: string): Promise<string> {
  if (!clientId || !clientSecret) {
    throw new Error("缺少clientId或clientSecret");
  }
  try {
    // 从数据库查询现有的token信息
    const existingData = statisticsService.query("pan123_token");

    if (existingData) {
      try {
        const tokenData = JSON.parse(existingData.value);

        // 检查clientId是否匹配
        if (tokenData.clientId === clientId) {
          const currentTime = Date.now();
          const expiredTime = tokenData.expired;
          const oneDayInMs = 24 * 60 * 60 * 1000; // 一天的毫秒数

          // 检查是否会在一天后过期或已过期
          if (expiredTime > currentTime + oneDayInMs) {
            // token还有超过一天的有效期，直接返回
            return tokenData.access;
          }
        }
      } catch (parseError) {
        // 数据解析失败，继续执行登录流程
        logger.warn("解析已存储的123网盘token数据失败，将重新登录");
      }
    }

    // 如果没有找到匹配的token，或者token即将过期/已过期，则调用登录
    const newToken = await pan123Login(clientId, clientSecret);
    return newToken;
  } catch (error: any) {
    throw new Error(`获取123网盘token失败: ${error.message}`);
  }
}
