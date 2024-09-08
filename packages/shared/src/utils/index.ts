import { exec } from "child_process";
import fs from "fs-extra";
import trash from "trash";
import { appConfig } from "../config.js";
export * from "./webhook.js";
export * from "./crypto.js";

import type { FfmpegOptions, VideoCodec } from "@biliLive-tools/types";
import path from "node:path";

export const executeCommand = (
  command: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        signal,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      },
    );
  });
};

// 检测是否有运行中的 ffmpeg 进程
export async function checkFFmpegRunning(): Promise<boolean> {
  const processes = await getAllFFmpegProcesses();
  return processes.length > 0;
}

// 获取所有所有ffmpeg进程
export async function getAllFFmpegProcesses(): Promise<{ name: string; pid: number }[]> {
  const processes = await getAllProcesses();
  return processes.filter((process) => process.name === "ffmpeg.exe");
}

// 获取所有进程名称以及 PID
export function getAllProcesses(): Promise<{ name: string; pid: number }[]> {
  return new Promise((resolve, reject) => {
    exec("tasklist /fo csv /nh", (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }

      // 解析 stdout 中的进程信息
      const processes = stdout
        .split("\r\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const [name, pid] = line.split(",").map((str) => str.replace(/"/g, ""));
          return { name, pid: parseInt(pid) };
        });

      resolve(processes);
    });
  });
}

// ffmpeg的subtitle参数转义
export const escaped = (s: string) => {
  s = s.replaceAll("\\", "/");
  s = s.replaceAll(":", "\\\\:");
  return s;
};

/**
 * 根据ffmpeg的编码器获取加速硬件
 * @param encoder
 */
export const getHardwareAcceleration = (
  encoder: VideoCodec,
): "nvenc" | "qsv" | "amf" | "copy" | "cpu" => {
  if (["h264_nvenc", "hevc_nvenc", "av1_nvenc"].includes(encoder)) {
    return "nvenc";
  } else if (["h264_qsv", "hevc_qsv", "av1_qsv"].includes(encoder)) {
    return "qsv";
  } else if (["h264_amf", "hevc_amf", "av1_amf"].includes(encoder)) {
    return "amf";
  } else if (["copy"].includes(encoder)) {
    return "copy";
  } else if (["libx264", "libx265", "libsvtav1"].includes(encoder)) {
    return "cpu";
  } else {
    throw new Error(`未知的编码器: ${encoder}`);
  }
};

export const genFfmpegParams = (options: FfmpegOptions) => {
  const result: string[] = [];
  if (options.encoder) {
    result.push(`-c:v ${options.encoder}`);
  }

  if (options.encoder !== "copy") {
    switch (options.bitrateControl) {
      case "CRF":
        if (options.crf) {
          result.push(`-crf ${options.crf}`);
        }
        break;
      case "VBR":
        if (options.bitrate) {
          result.push(`-b:v ${options.bitrate}k`);
        }
        break;
      case "CQ":
        if (options.crf) {
          result.push(`-rc vbr`);
          result.push(`-cq ${options.crf}`);
        }
        break;
      case "ICQ":
        if (options.crf) {
          result.push(`-global_quality ${options.crf}`);
        }
        break;
    }
    if (["cpu", "qsv", "nvenc"].includes(getHardwareAcceleration(options.encoder))) {
      if (options.preset) {
        result.push(`-preset ${options.preset}`);
      }
    }

    if (["libsvtav1"].includes(options.encoder)) {
      if (options.bit10) {
        result.push("-pix_fmt yuv420p10le");
      }
    }
    if (options.ss) {
      result.push(`-ss ${options.ss}`);
    }
  }
  if (options.audioCodec) {
    result.push(`-c:a ${options.audioCodec}`);
  } else {
    result.push(`-c:a copy`);
  }
  if (options.extraOptions) {
    options.extraOptions.split(" ").forEach((option) => {
      result.push(option);
    });
  }
  return result;
};

export const uuid = () => {
  return Math.random().toString(36).slice(2);
};
export const pathExists = async (path: string) => {
  return await fs.pathExists(path);
};

export const trashItem = async (path: string) => {
  const trashConfig = appConfig.get("trash");
  if (trashConfig) {
    return trash(path);
  } else {
    fs.unlink(path);
  }
};

export const isWin32 = process.platform === "win32";

export async function getFileSize(filePath: string) {
  const stats = await fs.promises.stat(filePath);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

type IterationCallback = (counter: number) => Promise<boolean>;
export async function runWithMaxIterations(
  callback: IterationCallback,
  interval: number,
  maxIterations: number,
): Promise<void> {
  return new Promise<void>((resolve) => {
    let counter = 0;

    const intervalId = setInterval(async () => {
      if (counter < maxIterations) {
        if (!(await callback(counter))) {
          clearInterval(intervalId);
          resolve();
        }
        counter++;
      } else {
        clearInterval(intervalId);
        resolve();
      }
    }, interval);
  });
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const formatFile = (filePath: string) => {
  const formatFile = path.parse(filePath);
  return { ...formatFile, path: filePath, filename: formatFile.base };
};

/**
 * 重试函数
 * @param fn 要重试的函数
 * @param times 重试次数
 * @param delay 重试间隔时间
 */
export function retry<T>(
  fn: () => Promise<T>,
  times: number = 3,
  delay: number = 1000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    function attempt(currentTimes: number) {
      fn()
        .then(resolve)
        .catch((err) => {
          setTimeout(() => {
            if (currentTimes === 1) {
              reject(err);
            } else {
              attempt(currentTimes - 1);
            }
          }, delay);
        });
    }
    attempt(times);
  });
}

/**
 * Convert a [[hh:]mm:]ss[.xxx] timemark into seconds
 *
 * @param {String} timemark timemark string
 * @return Number
 * @private
 */
export function timemarkToSeconds(timemark: string) {
  if (typeof timemark === "number") {
    return timemark;
  }

  if (timemark.indexOf(":") === -1 && timemark.indexOf(".") >= 0) {
    return Number(timemark);
  }

  const parts = timemark.split(":");

  // add seconds
  let secs = Number(parts.pop());

  if (parts.length) {
    // add minutes
    secs += Number(parts.pop()) * 60;
  }

  if (parts.length) {
    // add hours
    secs += Number(parts.pop()) * 3600;
  }

  return secs;
}
