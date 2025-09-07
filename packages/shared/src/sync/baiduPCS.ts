import { execSync, spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";
import logger from "../utils/log.js";
import { TypedEmitter } from "tiny-typed-emitter";

export interface BaiduPCSOptions {
  /**
   * BaiduPCS-Go 可执行文件的路径
   * @default 'BaiduPCS-Go'
   */
  binary?: string;

  /**
   * 上传目标路径
   * @default '/apps/BiliLive'
   */
  remotePath?: string;

  /**
   * 日志记录器
   */
  logger?: typeof logger;
}

/**
 * 百度网盘文件元数据接口
 */
export interface BaiduPCSFileMeta {
  /** 文件类型 */
  type?: string;
  /** 文件路径 */
  path?: string;
  /** 文件名称 */
  filename?: string;
  /** 文件大小（字节） */
  size?: number;
  /** 文件大小（可读格式，如：7.5MB） */
  sizeReadable?: string;
  /** 文件MD5值 */
  md5?: string;
  /** 应用ID */
  appId?: number;
  /** 文件系统ID */
  fsId?: number;
  /** 创建时间 */
  createTime?: Date;
  /** 修改时间 */
  modifyTime?: Date;
}

interface BaiduPCSEvents {
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
}

/**
 * 百度网盘上传类
 * 使用 BaiduPCS-Go 工具进行文件上传
 */
export class BaiduPCS extends TypedEmitter<BaiduPCSEvents> {
  private binary: string;
  private remotePath: string;
  private logger: typeof logger | Console;
  private cmd: ChildProcess | null = null;
  private uploadCmd: ChildProcess | null = null;

  constructor(options?: BaiduPCSOptions) {
    super();
    this.binary = options?.binary || "BaiduPCS-Go";
    this.remotePath = options?.remotePath || "/录播";
    this.logger = logger;

    // 检查BaiduPCS-Go是否安装
    // this.checkInstallation();
  }

  /**
   * 检查BaiduPCS-Go是否已安装
   */
  // private checkInstallation(): void {
  //   try {
  //     execSync(`${this.binary} --version`, { stdio: "ignore" });
  //   } catch (error) {
  //     this.logger.error("BaiduPCS-Go 未安装或不在PATH中，请先安装 BaiduPCS-Go");
  //     throw new Error("BaiduPCS-Go not installed");
  //   }
  // }

  /**
   * 检查用户是否已登录
   * @returns 是否已登录
   */
  public isLoggedIn(): boolean {
    try {
      const output = execSync(`${this.binary} who`, { encoding: "utf8" });
      return !output.includes("uid: 0");
    } catch (error) {
      return false;
    }
  }

  /**
   * 执行BaiduPCS-Go命令
   * @param args 命令参数
   * @returns Promise<string> 命令输出
   */
  private async executeCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      this.cmd = spawn(this.binary, args);
      let stdout = "";
      let stderr = "";

      // @ts-expect-error
      this.cmd.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;

        // 解析进度信息并发送事件
        this.parseProgress(output);
      });

      // @ts-expect-error
      this.cmd.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      this.cmd.on("close", (code) => {
        // 检查完整的stdout是否包含上传失败信息
        const uploadFailed = stdout.includes("文件上传失败");

        if (code === 0 && !uploadFailed) {
          if (args.includes("login")) {
            this.logger.info("login 命令执行成功");
          } else {
            this.logger.info(`命令执行成功: ${args.join(" ")}`);
          }
          this.cmd = null;
          resolve(stdout);
        } else {
          const errorMsg = uploadFailed
            ? `上传失败: 检测到"文件上传失败"信息 ${stdout}`
            : `命令执行失败: ${stderr}`;
          this.logger.error(`命令执行失败: ${args.join(" ")}`);
          this.cmd = null;
          reject(new Error(`Command failed with code ${code}: ${errorMsg}`));
        }
      });

      this.cmd.on("error", (error) => {
        this.cmd = null;
        reject(error);
      });
    });
  }

  /**
   * 执行上传命令（与其他操作隔离）
   * @param args 命令参数
   * @returns Promise<string> 命令输出
   */
  private async executeUploadCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      this.uploadCmd = spawn(this.binary, args);
      let stdout = "";
      let stderr = "";

      // @ts-expect-error
      this.uploadCmd.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;

        // 解析进度信息并发送事件
        this.parseProgress(output);
      });

      // @ts-expect-error
      this.uploadCmd.stderr.on("data", (data) => {
        stderr += data.toString();
        // console.error("stderr", data.toString());
      });

      this.uploadCmd.on("close", (code) => {
        // 检查完整的stdout是否包含上传失败信息
        const uploadFailed = stdout.includes("文件上传失败");

        if (code === 0 && !uploadFailed) {
          this.logger.info(`上传命令执行成功: ${args.join(" ")}`);
          this.uploadCmd = null;
          resolve(stdout);
        } else {
          let errorMsg = `命令执行失败: ${stderr}`;
          if (stdout) {
            // 忽略cookie保存到log中
            let stdoutArr = stdout.split("\n").filter((line) => line);
            if (stdoutArr.length > 1) {
              errorMsg += stdoutArr.slice(1, stdoutArr.length).join("\n");
            }
          }
          this.logger.error(`上传命令执行失败: ${args.join(" ")}`);
          this.uploadCmd = null;
          reject(new Error(`Command failed with code ${code}: ${errorMsg}`));
        }
      });

      this.uploadCmd.on("error", (error) => {
        this.uploadCmd = null;
        reject(error);
      });
    });
  }

  /**
   * 解析上传进度信息
   * @param output 命令输出字符串
   */
  private parseProgress(output: string): void {
    // 匹配如 "[1] ↑ 305.06MB/1.01GB 2.15MB/s in 33s" 的格式
    const progressRegex =
      /\[(\d+)\] ↑ ([\d.]+[KMG]B)\/([\d.]+[KMG]B) ([\d.]+[KMG]B\/s) in (\d+[smh])/;
    const match = output.match(progressRegex);

    if (match) {
      const [, indexStr, uploaded, total, speed, elapsed] = match;

      // 计算上传百分比
      let percentage: number | undefined;
      try {
        const uploadedBytes = this.parseSize(uploaded);
        const totalBytes = this.parseSize(total);
        if (uploadedBytes !== null && totalBytes !== null) {
          percentage = (uploadedBytes / totalBytes) * 100;
        }
      } catch (e) {
        // 解析失败，忽略百分比
      }

      // 发送进度事件
      this.emit("progress", {
        index: parseInt(indexStr, 10),
        uploaded,
        total,
        speed,
        elapsed,
        percentage,
      });
    }
  }

  /**
   * 将大小字符串转换为字节数
   * @param sizeStr 大小字符串，如 "305.06MB"
   * @returns 字节数
   */
  private parseSize(sizeStr: string): number | null {
    const match = sizeStr.match(/([\d.]+)([KMG]B)/);
    if (!match) return null;

    const [, size, unit] = match;
    const sizeNum = parseFloat(size);

    switch (unit) {
      case "KB":
        return sizeNum * 1024;
      case "MB":
        return sizeNum * 1024 * 1024;
      case "GB":
        return sizeNum * 1024 * 1024 * 1024;
      default:
        return sizeNum;
    }
  }

  /**
   * 上传文件到百度网盘
   * @param localFilePath 本地文件路径
   * @param remoteDir 远程目录路径（相对于基础远程路径）
   * @returns Promise<void> 上传成功时resolve，失败时reject
   */
  public async uploadFile(
    localFilePath: string,
    remoteDir: string = "",
    options?: {
      retry?: number;
      // fail(默认，直接返回失败)、newcopy(重命名文件)、overwrite(覆盖)、skip(跳过)、rsync(仅跳过大小未变化的文件)
      policy?: "fail" | "newcopy" | "overwrite" | "skip" | "rsync";
    },
  ): Promise<void> {
    if (!(await fs.pathExists(localFilePath))) {
      const error = new Error(`文件不存在: ${localFilePath}`);
      this.logger.error(error.message);
      this.emit("error", error);
      throw error;
    }

    // 确保目标文件夹存在
    const targetDir = path.join(this.remotePath, remoteDir).replace(/\\/g, "/");

    try {
      // 执行上传
      this.logger.info(`开始上传: ${localFilePath} 到 ${targetDir}`);
      const args = ["upload", localFilePath, targetDir];
      console.log(options);
      // if (options?.retry !== undefined) {
      //   args.push("--retry", options.retry.toString());
      // }
      // if (options?.policy) {
      //   args.push("--policy", options.policy);
      // }
      await this.executeUploadCommand(args);

      const remoteFilepath = path.posix.join(targetDir, path.parse(localFilePath).base);
      const data = await this.getFileMeta(remoteFilepath);
      if (data.size === 0) {
        const error = new Error("文件大小为0，上传失败");
        throw error;
      }

      const successMsg = `上传成功: ${localFilePath}`;
      this.logger.info(successMsg);
      this.emit("success", successMsg);
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * 获取文件元数据信息
   * @param remotePath 远程文件路径
   * @returns 文件元数据信息
   */
  async getFileMeta(remotePath: string): Promise<BaiduPCSFileMeta> {
    const data = await this.executeCommand(["meta", remotePath]);

    // 使用正则表达式解析输出
    const typeMatch = data.match(/类型\s+(.+)/);
    const pathMatch = data.match(/文件路径\s+(.+)/);
    const filenameMatch = data.match(/文件名称\s+(.+)/);
    const sizeMatch = data.match(/文件大小\s+(\d+),\s+([\d.]+[KMG]?B)/);
    const md5Match = data.match(/md5 \(可能不正确\)\s+([a-f0-9]{32})/i);
    const appIdMatch = data.match(/app_id\s+(\d+)/);
    const fsIdMatch = data.match(/fs_id\s+(\d+)/);
    const createTimeMatch = data.match(/创建日期\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
    const modifyTimeMatch = data.match(/修改日期\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);

    return {
      type: typeMatch?.[1]?.trim(),
      path: pathMatch?.[1]?.trim() || "",
      filename: filenameMatch?.[1]?.trim() || "",
      size: parseInt(sizeMatch?.[1] || "0", 10) || 0,
      sizeReadable: sizeMatch?.[2]?.trim() || "",
      md5: md5Match?.[1]?.trim() || "",
      appId: parseInt(appIdMatch?.[1] || "0", 10),
      fsId: parseInt(fsIdMatch?.[1] || "0", 10),
      createTime: createTimeMatch?.[1] ? new Date(createTimeMatch[1]) : undefined,
      modifyTime: modifyTimeMatch?.[1] ? new Date(modifyTimeMatch[1]) : undefined,
    };
  }

  /**
   * 通过cookie登录百度网盘
   * @param cookie BDUSS cookie值
   * @returns Promise<boolean> 登录是否成功
   */
  public async baiduPCSLogin(cookie: string): Promise<boolean> {
    try {
      // 确保cookie格式正确
      if (!cookie.trim()) {
        throw new Error("Cookie不能为空");
      }

      // 执行登录命令
      this.logger.info("尝试通过Cookie登录百度网盘...");
      await this.executeCommand(["login", "-cookies", cookie.trim()]);
      return true;
    } catch (error: any) {
      this.logger.error(`百度网盘登录失败: ${error.message}`);
      this.emit("error", error);
      return false;
    }
  }

  /**
   * 取消当前上传操作
   * @returns 是否成功取消上传（如果没有正在进行的上传将返回false）
   */
  public cancelUpload(): boolean {
    if (this.uploadCmd && !this.uploadCmd.killed) {
      this.logger.info("取消上传操作");
      this.uploadCmd.kill("SIGINT");
      this.uploadCmd = null;
      return true;
    }
    return false;
  }
}
