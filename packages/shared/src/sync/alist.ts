import path from "node:path";

import fs from "fs-extra";
import logger from "../utils/log.js";
import { TypedEmitter } from "tiny-typed-emitter";
import axios, { AxiosInstance } from "axios";
import * as http from "http";
import * as https from "https";
import { URL } from "url";

export interface AlistOptions {
  /**
   * AList服务器地址
   * @default 'http://localhost:5244'
   */
  server?: string;

  /**
   * 用户名
   * @default 'admin'
   */
  username?: string;

  /**
   * 密码
   * @default ''
   */
  password?: string;

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

interface AlistEvents {
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
 * AList上传类
 * 使用AList API进行文件上传
 */
export class Alist extends TypedEmitter<AlistEvents> {
  private server: string;
  private username: string;
  private password: string;
  private remotePath: string;
  private logger: typeof logger | Console;
  private token: string | null = null;
  private client: AxiosInstance;
  private abortController: AbortController | null = null;

  constructor(options?: AlistOptions) {
    super();
    this.server = options?.server || "http://localhost:5244";
    this.username = options?.username || "admin";
    this.password = options?.password || "";
    this.remotePath = options?.remotePath || "/录播";
    this.logger = options?.logger || logger;

    // 创建axios实例
    this.client = axios.create({
      baseURL: this.server,
    });

    // 添加请求拦截器，自动添加token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = this.token;
      }
      return config;
    });

    // 添加响应拦截器，处理错误
    this.client.interceptors.response.use(
      (response) => {
        if (response.data && response.data.code !== 200) {
          this.logger.error(`AList API错误: ${response.data.message}`);
          throw new Error(response.data.message);
        }
        return response;
      },
      (error) => {
        this.logger.error(`AList请求错误: ${error.message}`);
        throw error;
      },
    );
  }

  /**
   * 登录到AList服务器
   * @returns Promise<boolean> 登录是否成功
   */
  public async login(): Promise<boolean> {
    try {
      this.logger.debug(`正在登录AList服务器: ${this.server}`);
      const response = await this.client.post("/api/auth/login/hash", {
        username: this.username,
        password: this.password,
      });

      if (response.data.code === 200 && response.data.data.token) {
        this.token = response.data.data.token;
        this.logger.debug("AList登录成功");
        return true;
      } else {
        this.logger.error(`AList登录失败: ${response.data.message}`);
        return false;
      }
    } catch (error: any) {
      this.logger.error(`AList登录出错: ${error.message}`);
      this.emit("error", error);
      return false;
    }
  }

  /**
   * 检查是否已登录
   * @returns boolean 是否已登录
   */
  public isLoggedIn(): boolean {
    return this.token !== null;
  }

  /**
   * 创建远程目录
   * @param remotePath 远程目录路径
   * @returns Promise<boolean> 创建是否成功
   */
  public async mkdir(remotePath: string): Promise<boolean> {
    try {
      if (!this.isLoggedIn()) {
        await this.login();
      }

      const fullPath = path.join(this.remotePath, remotePath).replace(/\\/g, "/");
      this.logger.debug(`创建AList目录: ${fullPath}`);

      const response = await this.client.post("/api/fs/mkdir", {
        path: fullPath,
      });

      if (response.data.code === 200) {
        this.logger.debug(`AList目录创建成功: ${fullPath}`);
        return true;
      } else {
        this.logger.error(`AList目录创建失败: ${response.data.message}`);
        return false;
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.code === 500) {
        // 目录可能已存在，忽略错误
        this.logger.warn(`创建目录时出现错误，目录可能已存在: ${error.message}`);
        return true;
      }
      this.logger.error(`创建AList目录出错: ${error}`);
      this.emit("error", error);
      return false;
    }
  }

  /**
   * 列出指定目录下的文件和文件夹
   * @param remotePath 远程目录路径
   * @returns Promise<any[]> 文件列表
   */
  public async listFiles(remotePath: string = ""): Promise<any[]> {
    try {
      if (!this.isLoggedIn()) {
        await this.login();
      }

      const fullPath = path.join(this.remotePath, remotePath).replace(/\\/g, "/");
      this.logger.debug(`列出AList目录内容: ${fullPath}`);

      const response = await this.client.post("/api/fs/list", {
        path: fullPath,
      });

      if (response.data.code === 200) {
        return response.data.data.content || [];
      } else {
        this.logger.error(`列出AList目录内容失败: ${response.data.message}`);
        return [];
      }
    } catch (error: any) {
      this.logger.error(`列出AList目录内容出错: ${error.message}`);
      this.emit("error", error);
      return [];
    }
  }

  /**
   * 取消当前上传操作
   */
  public cancelUpload(): void {
    if (this.abortController) {
      this.logger.info("取消上传操作");
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * 上传文件到AList
   * @param localFilePath 本地文件路径
   * @param remoteDir 远程目录路径（相对于基础远程路径）
   * @returns Promise<void> 上传成功时resolve，失败时reject
   */
  public async uploadFile(
    localFilePath: string,
    remoteDir: string = "",
    // @ts-ignore
    options?: {
      retry?: number;
      // 覆盖选项: overwrite(覆盖)、skip(跳过)
      policy?: "overwrite" | "skip";
    },
  ): Promise<void> {
    if (!(await fs.pathExists(localFilePath))) {
      const error = new Error(`文件不存在: ${localFilePath}`);
      this.logger.error(error.message);
      this.emit("error", error);
      throw error;
    }

    if (!this.isLoggedIn()) {
      await this.login();
    }

    // 确保目标文件夹存在
    const targetDir = path.join(this.remotePath, remoteDir).replace(/\\/g, "/");
    await this.mkdir(remoteDir);

    const fileName = path.basename(localFilePath);
    const remotePath = path.join(targetDir, fileName).replace(/\\/g, "/");

    this.logger.debug(`开始上传: ${localFilePath} 到 ${remotePath}`);

    // 获取文件信息以获取大小
    const stat = await fs.stat(localFilePath);
    const fileSize = stat.size;

    // 创建文件流
    const fileStream = fs.createReadStream(localFilePath, {
      highWaterMark: 1024 * 1024, // 每次读取 1MB
    });

    // 进度监听
    let uploaded = 0;
    let lastUploaded = 0;
    let lastTime = Date.now();
    fileStream.on("data", (chunk) => {
      uploaded += chunk.length;
      const now = Date.now();
      const timeDiff = (now - lastTime) / 1000; // 秒
      let speedStr = "";
      if (timeDiff > 0) {
        const speed = (uploaded - lastUploaded) / timeDiff; // B/s
        speedStr = this.formatSize(speed) + "/s";
        lastUploaded = uploaded;
        lastTime = now;
      }
      this.emit("progress", {
        uploaded: this.formatSize(uploaded),
        total: this.formatSize(fileSize),
        percentage: Math.round((uploaded / fileSize) * 100),
        speed: speedStr,
      });
    });

    // 用于取消上传
    let req: http.ClientRequest;
    this.abortController = {
      signal: new AbortController().signal,
      abort: () => {
        const uploadCancelError = new Error("上传已取消");
        uploadCancelError.name = "AbortError";
        fileStream.destroy();
        req?.destroy(uploadCancelError);
        this.emit("canceled", "上传已取消");
      },
    };

    const url = new URL(`${this.server}/api/fs/put`);
    const httpModule = url.protocol === "https:" ? https : http;

    try {
      await new Promise<void>((resolve, reject) => {
        req = httpModule.request(
          {
            method: "PUT",
            hostname: url.hostname,
            port: url.port ? Number(url.port) : (url.protocol === "https:" ? 443 : 80),
            path: url.pathname,
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Length": fileSize.toString(),
              ...(this.token ? { "Authorization": this.token } : {}),
              "File-Path": encodeURIComponent(remotePath),
              "As-Task": "true",
            },
          },
          (res) => {
            let body = "";
            res.on("data", (chunk) => {
              body += chunk;
            });
            res.on("end", () => {
              try {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                  const result = JSON.parse(body);
                  if (result.code === 200) {
                    const successMsg = `上传成功: ${localFilePath}`;
                    this.logger.debug(successMsg);
                    this.emit("success", successMsg);
                    resolve();
                  } else {
                    reject(new Error(`上传失败: ${result.message || body}`));
                  }
                } else {
                  reject(new Error(`上传失败: ${res.statusCode} ${res.statusMessage}`));
                }
              } catch (err) {
                reject(err);
              }
            });
          }
        );
        req.on("error", (error: any) => {
          reject(error);
        });
        fileStream.pipe(req);
      });
    } catch (error: any) {
      if (error?.name === "AbortError") {
        this.logger.info("上传已取消");
        this.emit("canceled", "上传已取消");
      } else {
        this.logger.error(`上传文件出错: ${error?.message || 'unknown error'}`);
        this.emit("error", error);
      }
      throw error;
    } finally {
      this.abortController = null;
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
