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
  public cmd: ChildProcess | null = null;

  constructor(options?: BaiduPCSOptions) {
    super();
    this.binary = options?.binary || "BaiduPCS-Go";
    this.remotePath = options?.remotePath || "/录播";
    this.logger = logger;

    // 检查BaiduPCS-Go是否安装
    this.checkInstallation();
  }

  /**
   * 检查BaiduPCS-Go是否已安装
   */
  private checkInstallation(): void {
    try {
      execSync(`${this.binary} --version`, { stdio: "ignore" });
    } catch (error) {
      this.logger.error("BaiduPCS-Go 未安装或不在PATH中，请先安装 BaiduPCS-Go");
      throw new Error("BaiduPCS-Go not installed");
    }
  }

  /**
   * 检查用户是否已登录
   * @returns 是否已登录
   */
  public isLoggedIn(): boolean {
    try {
      const output = execSync(`${this.binary} who`, { encoding: "utf8" });
      console.log("BaiduPCS-Go who", output);
      return !output.includes("未登录账号");
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

        console.log(output);
      });

      // @ts-expect-error
      this.cmd.stderr.on("data", (data) => {
        stderr += data.toString();
        console.error("stderr", data.toString());
      });

      this.cmd.on("close", (code) => {
        if (code === 0) {
          this.logger.info(`命令执行成功: ${args.join(" ")}`);
          this.cmd = null;
          resolve(stdout);
        } else {
          this.logger.error(`命令执行失败: ${args.join(" ")}`);
          this.cmd = null;
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      this.cmd.on("error", (error) => {
        this.cmd = null;
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
  public async uploadFile(localFilePath: string, remoteDir: string = ""): Promise<void> {
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
      await this.executeCommand(["upload", localFilePath, targetDir, "--norapid"]);
      const successMsg = `上传成功: ${localFilePath}`;
      this.logger.info(successMsg);
      this.emit("success", successMsg);
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * 通过cookie登录百度网盘
   * @param cookie BDUSS cookie值
   * @returns Promise<boolean> 登录是否成功
   */
  public async loginByCookie(cookie: string): Promise<boolean> {
    try {
      // 确保cookie格式正确
      if (!cookie.trim()) {
        throw new Error("Cookie不能为空");
      }

      // 执行登录命令
      this.logger.info("尝试通过Cookie登录百度网盘...");
      await this.executeCommand(["login", "-cookies=" + cookie.trim()]);
      return true;
    } catch (error) {
      this.logger.error(`百度网盘登录失败: ${error.message}`);
      this.emit("error", error);
      return false;
    }
  }

  /**
   * 获取文件列表
   * @param remotePath 远程目录路径（相对于基础远程路径）
   * @returns Promise<string[]> 文件列表
   */
  public async listFiles(remotePath: string = ""): Promise<string[]> {
    try {
      const targetPath = path.join(this.remotePath, remotePath).replace(/\\/g, "/");
      const output = await this.executeCommand(["ls", targetPath]);

      // 解析输出获取文件列表
      const lines = output.split("\n").filter((line) => line.trim());
      // 简单处理，实际应根据BaiduPCS-Go的输出格式进行调整
      const fileList = lines
        .filter((line) => !line.startsWith("-") && !line.includes("-----"))
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          return parts[parts.length - 1];
        });

      return fileList;
    } catch (error) {
      this.logger.error(`获取文件列表失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 删除远程文件
   * @param remotePath 远程文件路径（相对于基础远程路径）
   * @returns Promise<boolean> 删除是否成功
   */
  public async deleteFile(remotePath: string): Promise<boolean> {
    try {
      const targetPath = path.join(this.remotePath, remotePath).replace(/\\/g, "/");
      await this.executeCommand(["rm", targetPath]);
      this.logger.info(`删除成功: ${targetPath}`);
      return true;
    } catch (error) {
      this.logger.error(`删除失败: ${error.message}`);
      return false;
    }
  }
}
