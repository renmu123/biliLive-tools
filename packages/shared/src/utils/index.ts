import os from "node:os";
import { exec } from "node:child_process";
import path from "node:path";
import readline from "node:readline";
import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import { isAxiosError } from "axios";

import fs from "fs-extra";
import trash from "trash";

import { appConfig } from "../config.js";
export * from "./webhook.js";
export * from "./crypto.js";
import { videoEncoders } from "../enum.js";

import type { FfmpegOptions, VideoCodec } from "@biliLive-tools/types";

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
    if (options.preset) {
      const encoder = videoEncoders.find((item) => item.value === options.encoder);
      if ((encoder?.presets ?? []).findIndex((item) => item.value === options.preset) !== -1) {
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
  // 更加安全的UUID生成方法
  return crypto.randomUUID();
};

export const pathExists = async (path: string) => {
  return await fs.pathExists(path);
};

export const deleteFile = async (path: string) => {
  try {
    await fs.unlink(path);
  } catch (error) {
    console.error(error);
  }
};

export const trashItem = async (path: string) => {
  const trashConfig = appConfig.get("trash");
  if (trashConfig) {
    return trash(path);
  } else {
    return deleteFile(path);
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

export function getTempPath() {
  let cacheFolder = appConfig.get("cacheFolder");
  if (!cacheFolder) {
    cacheFolder = path.join(os.tmpdir(), "biliLive-tools");
  }

  if (cacheFolder) {
    try {
      fs.ensureDirSync(cacheFolder);
      return cacheFolder;
    } catch (e) {
      console.error("缓存文件夹创建失败，使用系统临时文件夹", e);
    }
  }

  fs.ensureDirSync(cacheFolder);
  return cacheFolder;
}

export async function readLines(
  filePath: string,
  startLine: number,
  endLine: number,
): Promise<string[]> {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const lines: string[] = [];
  let currentLine = 0;

  for await (const line of rl) {
    currentLine++;
    if (currentLine >= startLine) {
      lines.push(line);
    }
    if (currentLine >= endLine) {
      break;
    }
  }

  rl.close();
  return lines;
}

/**
 * 替换文件扩展名
 * @param filePath 文件路径
 * @param newExtName 新的扩展名，包含点号
 */
export function replaceExtName(filePath: string, newExtName: string) {
  return path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath)) + newExtName,
  );
}

/**
 * 根据时间间隔统计有序时间数组的计数（起始时间默认为 0）
 * @param times 时间数组（以秒为单位）
 * @param interval 时间间隔（秒）
 * @param maxTime 最大时间（秒），超过此时间的时间点将被丢弃
 * @returns 一个数组，每个元素表示该时间间隔内的计数
 */
export function countByIntervalInSeconds(
  times: number[],
  interval: number,
  maxTime: number,
): { start: number; count: number }[] {
  const result: { start: number; count: number }[] = [];
  let currentIntervalStart = 0; // 当前分组的起始时间固定为 0
  let count = 0;

  for (const time of times) {
    if (time >= maxTime) break; // 超过最大时间，停止计数

    while (time >= currentIntervalStart + interval) {
      // 时间超出当前分组范围，保存当前分组并移动到下一个分组
      result.push({ start: currentIntervalStart, count });
      currentIntervalStart += interval;
      count = 0; // 重置计数
    }
    count++; // 当前时间点计入当前分组
  }

  result.push({ start: currentIntervalStart, count });

  // 按间隔补齐到 maxTime
  while (currentIntervalStart + interval <= maxTime) {
    currentIntervalStart += interval;
    result.push({ start: currentIntervalStart, count: 0 });
  }

  return result;
}

// 归一化函数
export function normalizePoints(points: { x: number; y: number }[], width: number, height: number) {
  const xMin = Math.min(...points.map((p) => p.x));
  const xMax = Math.max(...points.map((p) => p.x));
  const yMin = Math.min(...points.map((p) => p.y));
  const yMax = Math.max(...points.map((p) => p.y));

  const xRange = xMax - xMin || 1; // Avoid division by zero
  const yRange = yMax - yMin || 1; // Avoid division by zero

  return points.map((p) => ({
    x: ((p.x - xMin) / xRange) * width,
    y: ((p.y - yMin) / yRange) * height,
  }));
}

/**
 * 解析出保存文件夹
 */
export const parseSavePath = async (
  input: string,
  options: {
    saveType?: 1 | 2;
    savePath?: string;
  },
  createDir = true,
) => {
  let savePath: string;
  if (options.saveType === 1) {
    savePath = path.dirname(input);
  } else if (options.saveType === 2) {
    if (!options.savePath) {
      throw new Error("没有找到保存路径");
    }
    savePath = path.resolve(path.dirname(input), options.savePath);
  } else {
    throw new Error("保存类型错误");
  }

  if (!savePath) {
    throw new Error("没有找到保存路径");
  }
  if (createDir && !(await pathExists(savePath))) {
    await fs.ensureDir(savePath);
  }

  return savePath;
};

/**
 * 当前时间是否在两个时间'HH:mm:ss'之间，如果是["22:00:00","05:00:00"]，当前时间是凌晨3点，返回true
 * @param {string} currentTime 当前时间
 * @param {string[]} timeRange 时间范围
 */
export function isBetweenTime(currentTime: Date, timeRange: [string, string]): boolean {
  const [startTime, endTime] = timeRange;
  if (!startTime || !endTime) return true;

  const [startHour, startMinute, startSecond] = startTime.split(":").map(Number);
  const [endHour, endMinute, endSecond] = endTime.split(":").map(Number);
  const [currentHour, currentMinute, currentSecond] = [
    currentTime.getHours(),
    currentTime.getMinutes(),
    currentTime.getSeconds(),
  ];

  const start = startHour * 3600 + startMinute * 60 + startSecond;
  let end = endHour * 3600 + endMinute * 60 + endSecond;
  let current = currentHour * 3600 + currentMinute * 60 + currentSecond;

  // 如果结束时间小于开始时间，说明跨越了午夜
  if (end < start) {
    end += 24 * 3600; // 将结束时间加上24小时
    if (current < start) {
      current += 24 * 3600; // 如果当前时间小于开始时间，也加上24小时
    }
  }

  return start <= current && current <= end;
}

/**
 * 生成一个未被使用的文件名
 * @param filePath 文件路径
 * @returns 未被使用的文件名
 */
export async function getUnusedFileName(filePath: string): Promise<string> {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);

  let newFilePath = filePath;
  let counter = 1;

  while (await fs.pathExists(newFilePath)) {
    newFilePath = path.join(dir, `${baseName}(${counter})${ext}`);
    counter++;
    if (counter > 100) {
      throw new Error("文件名生成失败");
    }
  }

  return newFilePath;
}

/**
 * 计算大文件的MD5值
 * @param filePath 文件路径
 * @param chunkSize 每次读取的块大小，默认64KB
 * @returns MD5哈希值
 */
export function calculateFileMd5(filePath: string, chunkSize: number = 64 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = createReadStream(filePath, { highWaterMark: chunkSize });

    stream.on("data", (chunk) => {
      hash.update(chunk);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * 快速计算文件特征值，只读取文件头部
 * @param filePath 文件路径
 * @param readSize 读取的字节数，默认10MB
 * @returns SHA256哈希值
 */
export function calculateFileQuickHash(
  filePath: string,
  readSize: number = 10 * 1024 * 1024,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = createReadStream(filePath, {
      start: 0,
      end: readSize - 1,
      highWaterMark: 64 * 1024, // 64KB chunks
    });

    stream.on("data", (chunk) => {
      hash.update(chunk);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", (error: NodeJS.ErrnoException) => {
      // 如果文件小于readSize，会触发EOVERFLOW错误
      if (error.code === "EOVERFLOW") {
        // 如果文件较小，直接读取整个文件
        const fullStream = createReadStream(filePath);
        const newHash = crypto.createHash("sha256");

        fullStream.on("data", (chunk) => {
          newHash.update(chunk);
        });

        fullStream.on("end", () => {
          resolve(newHash.digest("hex"));
        });

        fullStream.on("error", reject);
      } else {
        reject(error);
      }
    });
  });
}

/**
 * 重试函数，仅针对axios的错误进行重试
 * @param fn 要重试的函数
 * @param times 重试次数
 * @param delay 重试间隔时间
 */
export function retryWithAxiosError<T>(
  fn: () => Promise<T>,
  times: number = 3,
  delay: number = 1000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    function attempt(currentTimes: number) {
      fn()
        .then(resolve)
        .catch((err) => {
          if (isAxiosError(err)) {
            if (currentTimes === 1) {
              reject(err);
            } else {
              setTimeout(() => {
                attempt(currentTimes - 1);
              }, delay);
            }
          } else {
            reject(err);
          }
        });
    }
    attempt(times);
  });
}

/**
 * 检查是否在时间范围内
 */
export const isBetweenTimeRange = (range: undefined | [] | [string, string]): boolean => {
  if (!range) return true;
  if (range.length !== 2) return true;

  try {
    const status = isBetweenTime(new Date(), range);
    return status;
  } catch (error) {
    return true;
  }
};

/**
 * 替换四字节Unicode字符（如部分emoji表情）为U+FFFD
 * @param str 输入字符串
 * @param replacement 替换字符，默认为_
 * @returns 替换后的字符串
 */
export function replaceFourByteUnicode(str: string, replacement: string = "_"): string {
  return str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, replacement);
}
