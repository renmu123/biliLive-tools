import { execSync, spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";
import logger from "../utils/log.js";
import { TypedEmitter } from "tiny-typed-emitter";

export interface AliyunPanOptions {
  /**
   * aliyunpan 可执行文件的路径
   * @default 'aliyunpan'
   */
  binary?: string;

  /**
   * 上传目标路径
   * @default '/BiliLive'
   */
  remotePath?: string;

  /**
   * 日志记录器
   */
  logger?: typeof logger;
}

interface AliyunPanEvents {
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
 * 阿里云盘上传类
 * 使用 aliyunpan 工具进行文件上传
 */
export class AliyunPan extends TypedEmitter<AliyunPanEvents> {
  private binary: string;
  private remotePath: string;
  private logger: typeof logger | Console;
  private cmd: ChildProcess | null = null;
  private loginCmd: ChildProcess | null = null; // 专门用于登录的进程

  constructor(options?: AliyunPanOptions) {
    super();
    this.binary = options?.binary || "aliyunpan";
    this.remotePath = options?.remotePath || "/录播";
    this.logger = options?.logger || logger;

    // 检查aliyunpan是否安装
    // this.checkInstallation();
  }

  /**
   * 检查aliyunpan是否已安装
   */
  // private checkInstallation(): void {
  //   try {
  //     execSync(`${this.binary} --version`, { stdio: "ignore" });
  //   } catch (error) {
  //     this.logger.error("aliyunpan 未安装或不在PATH中，请先安装 aliyunpan 工具");
  //     throw new Error("aliyunpan not installed");
  //   }
  // }

  /**
   * 检查用户是否已登录
   * @returns 是否已登录
   */
  public isLoggedIn(): boolean {
    try {
      const output = execSync(`${this.binary} who`, { encoding: "utf8" });
      return !output.includes("未登录") && !output.includes("not logged in");
    } catch (error) {
      return false;
    }
  }

  /**
   * 执行aliyunpan命令
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
        // 检查完整的stdout是否包含上传失败信息
        const uploadFailed = stdout.includes("数据总量: 0B") || stdout.includes("upload failed");

        if (code === 0 && !uploadFailed) {
          this.logger.info(`命令执行成功: ${args.join(" ")}`);
          this.cmd = null;
          resolve(stdout);
        } else {
          const errorMsg = uploadFailed
            ? `上传失败: 检测到"上传失败"信息`
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
   * 解析上传进度信息
   * @param output 命令输出字符串
   */
  private parseProgress(output: string): void {
    // 匹配上传进度信息，根据aliyunpan的输出格式调整
    const progressRegex =
      /(\d+\.\d+)% \[\=+>\s*\] (\d+(?:\.\d+)?(?:B|KB|MB|GB))\/(\d+(?:\.\d+)?(?:B|KB|MB|GB)) (\d+(?:\.\d+)?(?:B|KB|MB|GB)\/s)/;
    const match = output.match(progressRegex);

    if (match) {
      const [, percentageStr, uploaded, total, speed] = match;

      // 发送进度事件
      this.emit("progress", {
        percentage: parseFloat(percentageStr),
        uploaded,
        total,
        speed,
      });
    }
  }

  /**
   * 将大小字符串转换为字节数
   * @param sizeStr 大小字符串，如 "305.06MB"
   * @returns 字节数
   */
  // private parseSize(sizeStr: string): number | null {
  //   const match = sizeStr.match(/([\d.]+)([KMGT]?B)/i);
  //   if (!match) return null;

  //   const [, size, unit] = match;
  //   const sizeNum = parseFloat(size);

  //   switch (unit.toUpperCase()) {
  //     case "B":
  //       return sizeNum;
  //     case "KB":
  //       return sizeNum * 1024;
  //     case "MB":
  //       return sizeNum * 1024 * 1024;
  //     case "GB":
  //       return sizeNum * 1024 * 1024 * 1024;
  //     case "TB":
  //       return sizeNum * 1024 * 1024 * 1024 * 1024;
  //     default:
  //       return sizeNum;
  //   }
  // }

  /**
   * 上传文件到阿里云盘
   * @param localFilePath 本地文件路径
   * @param remoteDir 远程目录路径（相对于基础远程路径）
   * @returns Promise<void> 上传成功时resolve，失败时reject
   */
  public async uploadFile(
    localFilePath: string,
    remoteDir: string = "",
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

    // 确保目标文件夹存在
    const targetDir = path.join(this.remotePath, remoteDir).replace(/\\/g, "/");

    try {
      // 执行上传
      this.logger.info(`开始上传: ${localFilePath} 到 ${targetDir}`);
      const args = ["upload", localFilePath, targetDir, "--norapid"];

      // 添加覆盖策略选项
      if (options?.policy === "overwrite") {
        args.push("--ow");
      }
      if (options?.policy === "skip") {
        args.push("--skip");
      }

      // 添加重试次数
      if (options?.retry !== undefined) {
        args.push("--retry", options.retry.toString());
      }

      await this.executeCommand(args);
      const successMsg = `上传成功: ${localFilePath}`;
      this.logger.info(successMsg);
      this.emit("success", successMsg);
    } catch (error: any) {
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * 通过浏览器链接登录阿里云盘
   * 此方法会显示登录链接，并等待用户在浏览器中完成登录后按 Enter 键继续
   * @returns Promise<boolean> 登录是否成功
   */
  public async loginByBrowser(): Promise<string> {
    try {
      // 创建一个新的命令，由于需要用户输入，所以不能使用普通的executeCommand方法
      this.logger.info("尝试通过浏览器链接登录阿里云盘...");

      return new Promise((resolve, reject) => {
        // 使用专用的loginCmd而不是通用的cmd
        this.loginCmd = spawn(this.binary, ["login"], {
          stdio: ["pipe", "pipe", "pipe"],
        });

        let stdout = "";

        // 五秒钟后没有输出，认为获取链接失败
        const interval = setTimeout(() => {
          if (!stdout.includes("https:")) {
            this.logger.error("获取链接失败");
            reject(new Error("获取链接失败，请重新尝试，或根据文档手动登录"));
          }
          console.log("获取链接失败", this.loginCmd);
        }, 5000);

        // @ts-expect-error
        this.loginCmd.stdout.on("data", (data) => {
          const output = data.toString();
          stdout += output;
          if (output.includes("https:")) {
            this.logger.info(output);
            clearTimeout(interval); // 清除超时检查
            resolve(stdout);
          }
        });

        this.loginCmd.on("error", (error) => {
          reject(new Error(`登录进程错误: ${error}`));
          this.loginCmd = null;
        });
      });
    } catch (error: any) {
      this.logger.error(`阿里云盘登录失败: ${error.message}`);
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * 在登录命令行中发送 Enter 键
   * 用于在出现登录链接后，用户完成浏览器授权操作，需要在命令行中按 Enter 继续
   */
  public confirmLogin(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.loginCmd && this.loginCmd.stdin) {
        let hasLoginSuccess = true;

        try {
          this.loginCmd.on("close", (code) => {
            if (code === 0) {
              if (hasLoginSuccess) {
                this.logger.info("close: 阿里云盘登录成功");
                this.loginCmd = null;
                resolve();
              } else {
                const errorMsg = `阿里云盘登录失败: `;
                this.logger.error(errorMsg);
                reject(new Error(errorMsg));
              }
            } else {
              const errorMsg = `阿里云盘登录失败: `;
              this.logger.error(errorMsg);
              this.loginCmd = null;
              reject(new Error(errorMsg));
            }
          });
          this.loginCmd.on("error", (error) => {
            reject(new Error(`登录进程错误: ${error}`));
            this.loginCmd = null;
          });

          // @ts-expect-error
          this.loginCmd.stderr.on("data", (data) => {
            console.error("stderr", data.toString());
          });

          // @ts-expect-error
          this.loginCmd.stdout.on("data", (data) => {
            const output = data.toString();
            if (output.includes("登录失败")) {
              hasLoginSuccess = false;
            }
          });

          this.loginCmd.stdin.write("\n");
          this.logger.info("已发送 Enter 键到登录进程");
        } catch (error) {
          reject(new Error(`发送 Enter 键失败: ${error}`));
          this.logger.error(`发送 Enter 键失败: ${error}`);
        }
      } else {
        reject(new Error("没有活动的登录进程，无法发送 Enter 键，请关闭后重新登录"));
        this.logger.warn("没有活动的登录进程，无法发送 Enter 键");
      }
    });
  }

  /**
   * 取消登录进程
   */
  public cancelLogin(): void {
    if (this.loginCmd) {
      this.logger.info("取消登录过程");
      this.loginCmd.kill();
      this.loginCmd = null;
    }
  }

  /**
   * 在当前命令行中发送 Enter 键
   * 用于在出现登录链接后，用户完成浏览器授权操作，需要在命令行中按 Enter 继续
   */
  public sendEnterKeyToProcess(): void {
    if (this.cmd && this.cmd.stdin) {
      try {
        this.cmd.stdin.write("\n");
        this.logger.info("已发送 Enter 键");
      } catch (error) {
        this.logger.error(`发送 Enter 键失败: ${error}`);
      }
    } else {
      this.logger.warn("没有活动的命令行进程，无法发送 Enter 键");
    }
  }

  // /**
  //  * 获取文件列表
  //  * @param remotePath 远程目录路径（相对于基础远程路径）
  //  * @returns Promise<string[]> 文件列表
  //  */
  // public async listFiles(remotePath: string = ""): Promise<string[]> {
  //   try {
  //     const targetPath = path.join(this.remotePath, remotePath).replace(/\\/g, "/");
  //     const output = await this.executeCommand(["ls", targetPath]);

  //     // 解析输出获取文件列表
  //     const lines = output.split("\n").filter((line) => line.trim());
  //     // 提取文件名
  //     const fileList = lines
  //       .filter((line) => !line.startsWith("-") && !line.includes("-----"))
  //       .map((line) => {
  //         const parts = line.trim().split(/\s+/);
  //         return parts[parts.length - 1];
  //       });

  //     return fileList;
  //   } catch (error: any) {
  //     this.logger.error(`获取文件列表失败: ${error.message}`);
  //     return [];
  //   }
  // }

  // /**
  //  * 删除远程文件
  //  * @param remotePath 远程文件路径（相对于基础远程路径）
  //  * @returns Promise<boolean> 删除是否成功
  //  */
  // public async deleteFile(remotePath: string): Promise<boolean> {
  //   try {
  //     const targetPath = path.join(this.remotePath, remotePath).replace(/\\/g, "/");
  //     await this.executeCommand(["rm", targetPath]);
  //     this.logger.info(`删除成功: ${targetPath}`);
  //     return true;
  //   } catch (error: any) {
  //     this.logger.error(`删除失败: ${error.message}`);
  //     return false;
  //   }
  // }

  /**
   * 创建远程目录
   * @param remotePath 远程目录路径（相对于基础远程路径）
   * @returns Promise<boolean> 创建是否成功
   */
  public async mkdir(remotePath: string): Promise<boolean> {
    try {
      const targetPath = path.join(this.remotePath, remotePath).replace(/\\/g, "/");
      await this.executeCommand(["mkdir", targetPath]);
      this.logger.info(`创建目录成功: ${targetPath}`);
      return true;
    } catch (error: any) {
      this.logger.error(`创建目录失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取当前登录用户的信息
   * @returns Promise<object> 用户信息
   */
  public async getUserInfo(): Promise<any> {
    try {
      const output = await this.executeCommand(["who"]);
      // 解析用户信息（根据实际输出格式调整）
      return { rawOutput: output };
    } catch (error: any) {
      this.logger.error(`获取用户信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 取消当前上传任务
   */
  public cancelUpload(): void {
    if (this.cmd) {
      this.logger.info("取消上传任务");
      this.cmd.kill();
      this.cmd = null;
    }
  }
}
