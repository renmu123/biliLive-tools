import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { DebouncedFunc, throttle, range } from "lodash-es";
import filenamify from "filenamify";

import type { Recorder } from "./recorder.js";

export type AnyObject = Record<string, any>;
export type UnknownObject = Record<string, unknown>;
export type PickRequired<T, K extends keyof T> = T & Pick<Required<T>, K>;

export function asyncThrottle(
  fn: () => Promise<void>,
  time: number,
  opts: {
    immediateRunWhenEndOfDefer?: boolean;
  } = {},
): DebouncedFunc<() => void> {
  let savingPromise: Promise<void> | null = null;
  let hasDeferred = false;

  const wrappedWithAllowDefer = () => {
    if (savingPromise != null) {
      hasDeferred = true;
      return;
    }

    savingPromise = fn().finally(() => {
      savingPromise = null;
      if (hasDeferred) {
        hasDeferred = false;
        if (opts.immediateRunWhenEndOfDefer) {
          wrappedWithAllowDefer();
        } else {
          throttled();
        }
      }
    });
  };

  const throttled = throttle(wrappedWithAllowDefer, time);

  return throttled;
}

export function replaceExtName(filePath: string, newExtName: string) {
  return path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath)) + newExtName,
  );
}

/**
 * 接收 fn ，返回一个和 fn 签名一致的函数 fn'。当已经有一个 fn' 在运行时，再调用
 * fn' 会直接返回运行中 fn' 的 Promise，直到 Promise 结束 pending 状态
 */
export function singleton<Fn extends (...args: any) => Promise<any>>(fn: Fn): Fn {
  let latestPromise: Promise<unknown> | null = null;

  return function (...args) {
    if (latestPromise) return latestPromise;
    // @ts-ignore
    const promise = fn.apply(this, args).finally(() => {
      if (promise === latestPromise) {
        latestPromise = null;
      }
    });

    latestPromise = promise;
    return promise;
  } as Fn;
}

/**
 * 从数组中按照特定算法提取一些值（允许同个索引重复提取）。
 * 算法的行为类似 flex 的 space-between。
 *
 * examples:
 * ```
 * console.log(getValuesFromArrayLikeFlexSpaceBetween([1, 2, 3, 4, 5, 6, 7], 1))
 * // [1]
 * console.log(getValuesFromArrayLikeFlexSpaceBetween([1, 2, 3, 4, 5, 6, 7], 3))
 * // [1, 4, 7]
 * console.log(getValuesFromArrayLikeFlexSpaceBetween([1, 2, 3, 4, 5, 6, 7], 4))
 * // [1, 3, 5, 7]
 * console.log(getValuesFromArrayLikeFlexSpaceBetween([1, 2, 3, 4, 5, 6, 7], 11))
 * // [1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7]
 * ```
 */
export function getValuesFromArrayLikeFlexSpaceBetween<T>(array: T[], columnCount: number): T[] {
  if (columnCount < 1) return [];
  if (columnCount === 1) return [array[0]];

  const spacingCount = columnCount - 1;
  const spacingLength = array.length / spacingCount;

  const columns = range(1, columnCount + 1);
  const columnValues = columns.map((column, idx, columns) => {
    // 首个和最后的列是特殊的，因为它们不在范围内，而是在两端
    if (idx === 0) {
      return array[0];
    } else if (idx === columns.length - 1) {
      return array[array.length - 1];
    }

    const beforeSpacingCount = column - 1;
    const colPos = beforeSpacingCount * spacingLength;

    return array[Math.floor(colPos)];
  });

  return columnValues;
}

export function ensureFolderExist(fileOrFolderPath: string): void {
  const folder = path.dirname(fileOrFolderPath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

export function assert(assertion: unknown, msg?: string): asserts assertion {
  if (!assertion) {
    throw new Error(msg);
  }
}

export function assertStringType(data: unknown, msg?: string): asserts data is string {
  assert(typeof data === "string", msg);
}

export function assertNumberType(data: unknown, msg?: string): asserts data is number {
  assert(typeof data === "number", msg);
}

export function assertObjectType(data: unknown, msg?: string): asserts data is object {
  assert(typeof data === "object", msg);
}

export function formatDate(date: Date, format: string): string {
  const map: { [key: string]: string } = {
    yyyy: date.getFullYear().toString(),
    MM: (date.getMonth() + 1).toString().padStart(2, "0"),
    dd: date.getDate().toString().padStart(2, "0"),
    HH: date.getHours().toString().padStart(2, "0"),
    mm: date.getMinutes().toString().padStart(2, "0"),
    ss: date.getSeconds().toString().padStart(2, "0"),
  };

  return format.replace(/yyyy|MM|dd|HH|mm|ss/g, (matched) => map[matched]);
}

export function removeSystemReservedChars(str: string) {
  return filenamify(str, { replacement: "_" });
}

export function isFfmpegStartSegment(line: string) {
  return line.includes("Opening ") && line.includes("for writing");
}

export function isMesioStartSegment(line: string) {
  return line.includes("Opening segment");
}

export function isBililiveStartSegment(line: string) {
  return line.includes("创建录制文件");
}

export function isFfmpegStart(line: string) {
  return (
    (line.includes("frame=") && line.includes("fps=")) ||
    (line.includes("speed=") && line.includes("time="))
  );
}

export function cleanTerminalText(text: string) {
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").replace(/[\x00-\x1F\x7F]/g, "");
}

export const formatTemplate = function template(string: string, ...args: any[]) {
  const nargs = /\{([0-9a-zA-Z_]+)\}/g;

  let params;

  if (args.length === 1 && typeof args[0] === "object") {
    params = args[0];
  } else {
    params = args;
  }

  if (!params || !params.hasOwnProperty) {
    params = {};
  }

  return string.replace(nargs, function replaceArg(match, i, index) {
    let result;

    if (string[index - 1] === "{" && string[index + match.length] === "}") {
      return i;
    } else {
      result = Object.hasOwn(params, i) ? params[i] : null;
      if (result === null || result === undefined) {
        return "";
      }

      return result;
    }
  });
};

/**
 * 检查ffmpeg无效流
 * @param count 连续多少次帧数不变就判定为无效流
 * @returns
 * "receive repart stream": b站最后的无限流
 * "receive invalid aac stream": ADTS无法被解析的flv流
 * "invalid stream": 一段时间内帧数不变
 */
export function createInvalidStreamChecker(
  count: number = 15,
): (ffmpegLogLine: string) => [boolean, string] {
  let prevFrame = 0;
  let frameUnchangedCount = 0;

  return (ffmpegLogLine) => {
    // B站某些cdn在直播结束后仍会返回一些数据 https://github.com/renmu123/biliLive-tools/issues/123
    if (ffmpegLogLine.includes("New subtitle stream with index")) {
      return [true, "receive repart stream"];
    }
    // 虎牙某些cdn会返回无法解析ADTS的flv流 https://github.com/renmu123/biliLive-tools/issues/150
    if (ffmpegLogLine.includes("AAC bitstream not in ADTS format and extradata missing")) {
      return [true, "receive invalid aac stream"];
    }

    const streamInfo = ffmpegLogLine.match(
      /frame=\s*(\d+) fps=.*? q=.*? size=.*? time=.*? bitrate=.*? speed=.*?/,
    );
    if (streamInfo != null) {
      const [, frameText] = streamInfo;
      const frame = Number(frameText);

      if (frame === prevFrame) {
        if (++frameUnchangedCount >= count) {
          return [true, "invalid stream"];
        }
      } else {
        prevFrame = frame;
        frameUnchangedCount = 0;
      }

      return [false, ""];
    }

    return [false, ""];
  };
}

export function createTimeoutChecker(
  onTimeout: () => void,
  time: number,
  autoStart: boolean = true,
): {
  update: () => void;
  stop: () => void;
  start: () => void;
} {
  let timer: NodeJS.Timeout | null = null;
  let stopped: boolean = false;

  const update = () => {
    if (stopped) return;
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      onTimeout();
    }, time);
  };

  const start = () => {
    stopped = false;
    update();
  };

  if (autoStart) {
    start();
  }

  return {
    update,
    stop() {
      stopped = true;
      if (timer != null) clearTimeout(timer);
      timer = null;
    },
    start,
  };
}

export async function downloadImage(imageUrl: string, savePath: string) {
  const res = await fetch(imageUrl);
  if (!res.body) {
    throw new Error("No body in response");
  }
  const fileStream = fs.createWriteStream(savePath, { flags: "wx" });
  // @ts-ignore
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

const md5 = (str: string) => {
  return crypto.createHash("md5").update(str).digest("hex");
};

const uuid = () => {
  return crypto.randomUUID();
};

/**
 * 根据指定的顺序对对象数组进行排序
 * @param objects 要排序的对象数组
 * @param order 指定的顺序
 * @param key 用于排序的键
 * @returns 排序后的对象数组
 */
export function sortByKeyOrder<T, K extends keyof T>(objects: T[], order: T[K][], key: K): T[] {
  const orderMap = new Map(order.map((value, index) => [value, index]));

  return [...objects].sort((a, b) => {
    const indexA = orderMap.get(a[key]) ?? Number.MAX_VALUE;
    const indexB = orderMap.get(b[key]) ?? Number.MAX_VALUE;
    return indexA - indexB;
  });
}

/**
 * 重试执行异步函数
 * @param fn 要重试的异步函数
 * @param retries 重试次数,默认为3次
 * @param delay 重试延迟时间(毫秒),默认为1000ms
 * @returns Promise
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) {
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
}

export const isBetweenTimeRange = (range: undefined | [] | [string | null, string | null]) => {
  if (!range) return true;
  if (range.length !== 2) return true;
  if (range[0] === null || range[1] === null) return true;

  try {
    const status = isBetweenTime(new Date(), range as [string, string]);
    return status;
  } catch (error) {
    return true;
  }
};

/**
 * 当前时间是否在两个时间'HH:mm:ss'之间，如果是["22:00:00","05:00:00"]，当前时间是凌晨3点，返回true
 * @param {string} currentTime 当前时间
 * @param {string[]} timeRange 时间范围
 */
function isBetweenTime(currentTime: Date, timeRange: [string, string]): boolean {
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
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 判断是否应该使用严格画质模式
 * @param qualityRetryLeft 剩余的画质重试次数
 * @param qualityRetry 初始画质重试次数配置
 * @param isManualStart 是否手动启动
 * @returns 是否使用严格画质模式
 */
export function shouldUseStrictQuality(
  qualityRetryLeft: number,
  qualityRetry: number,
  isManualStart?: boolean,
): boolean {
  // 手动启动时不使用严格模式
  if (isManualStart) {
    return false;
  }
  // 如果配置为0，不使用严格模式
  if (qualityRetry === 0) {
    return false;
  }

  // 如果还有重试次数，使用严格模式
  if (qualityRetryLeft > 0) {
    return true;
  }

  // 如果配置为负数（无限重试），使用严格模式
  if (qualityRetry < 0) {
    return true;
  }

  return false;
}

/**
 * 检查标题是否包含黑名单关键词
 * @param title 直播间标题
 * @param titleKeywords 关键词配置，支持两种格式：
 *   1. 逗号分隔的关键词：'关键词1,关键词2,关键词3'
 *   2. 正则表达式：'/pattern/flags'（如：'/回放|录播/i'）
 * @returns 如果标题包含关键词返回 true，否则返回 false
 */
function hasBlockedTitleKeywords(title: string, titleKeywords: string | undefined): boolean {
  if (!titleKeywords || !titleKeywords.trim()) {
    return false;
  }

  const trimmedKeywords = titleKeywords.trim();

  // 检测是否为正则表达式格式 /pattern/flags
  const regexMatch = trimmedKeywords.match(/^\/(.+?)\/([gimsuvy]*)$/);

  if (regexMatch) {
    try {
      const [, pattern, flags] = regexMatch;
      const regex = new RegExp(pattern, flags);
      return regex.test(title);
    } catch (error) {
      // 正则表达式无效，降级到普通匹配，并记录日志
      console.warn(
        `Invalid regex pattern: ${trimmedKeywords}, falling back to normal matching`,
        error,
      );
      // 继续使用普通匹配逻辑
    }
  }

  // 普通关键词匹配（逗号分隔）
  const keywords = trimmedKeywords
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k);

  return keywords.some((keyword) => title.toLowerCase().includes(keyword.toLowerCase()));
}

/**
 * 检查是否需要进行标题关键词检查
 */
function shouldCheckTitleKeywords(
  isManualStart: boolean | undefined,
  titleKeywords: string | undefined,
): boolean {
  return (
    !isManualStart && !!titleKeywords && typeof titleKeywords === "string" && !!titleKeywords.trim()
  );
}

/**
 * 逆向格式化"xxxB", "xxxKB", "xxxMB", "xxxGB"为字节数，如果值为空返回0，如果为数字则直接返回数字，如果带单位则转换为字节数
 * @param sizeStr 大小字符串
 * @returns 字节数
 */
export function parseSizeToBytes(sizeStr: string): number | string {
  if (!sizeStr) {
    return 0;
  }

  // 字符类型的数字
  if (!isNaN(Number(sizeStr))) {
    return Number(sizeStr);
  }

  const sizePattern = /^(\d+(?:\.\d+)?)(B|KB|MB|GB)$/i;
  const match = sizeStr.toUpperCase().trim().match(sizePattern);
  if (match) {
    const size = parseFloat(match[1]);
    const unit = match[2];
    switch (unit) {
      case "B":
        return String(size);
      case "KB":
        return String(size * 1024);
      case "MB":
        return String(size * 1024 * 1024);
      case "GB":
        return String(size * 1024 * 1024 * 1024);
      default:
        return 0;
    }
  } else {
    return 0;
  }
}

export const byte2MB = (bytes: number) => {
  return bytes / (1024 * 1024);
};

/*
 * 检查录制中的标题关键词
 * @param recorder 录制器实例
 * @param isManualStart 是否手动启动
 * @param getInfo 获取直播间信息的函数
 * @returns 如果标题包含关键词返回 true（需要停止），否则返回 false
 */
export async function checkTitleKeywordsWhileRecording(
  recorder: Recorder,
  isManualStart: boolean | undefined,
  getInfo: (channelId: string) => Promise<{ title: string }>,
): Promise<boolean> {
  // 只有当设置了标题关键词时，并且不是手动启动的录制，才获取最新的直播间信息
  if (!shouldCheckTitleKeywords(isManualStart, recorder.titleKeywords)) {
    return false;
  }

  const now = Date.now();
  // 每5分钟检查一次标题变化
  const titleCheckInterval = 5 * 60 * 1000; // 5分钟

  // 获取上次检查时间
  const lastCheckTime = await recorder.cache.get<number>("lastTitleCheckTime");

  // 如果距离上次检查时间不足指定间隔，则跳过检查
  if (lastCheckTime && now - lastCheckTime < titleCheckInterval) {
    return false;
  }

  // 更新检查时间
  await recorder.cache.set("lastTitleCheckTime", now);

  // 获取直播间信息
  const liveInfo = await getInfo(recorder.channelId);
  const { title } = liveInfo;

  // 检查标题是否包含关键词
  if (hasBlockedTitleKeywords(title, recorder.titleKeywords)) {
    recorder.state = "title-blocked";
    recorder.emit("DebugLog", {
      type: "common",
      text: `检测到标题包含关键词，停止录制：直播间标题 "${title}" 包含关键词 "${recorder.titleKeywords}"`,
    });

    // 停止录制
    await recorder?.recordHandle?.stop("直播间标题包含关键词");
    return true;
  }

  return false;
}

/**
 * 检查开始录制前的标题关键词
 * @param title 直播间标题
 * @param recorder 录制器实例
 * @param isManualStart 是否手动启动
 * @returns 如果标题包含关键词返回 true（不应录制），否则返回 false
 */
export function checkTitleKeywordsBeforeRecord(
  title: string,
  recorder: Recorder,
  isManualStart: boolean | undefined,
): boolean {
  // 检查标题是否包含关键词，如果包含则不自动录制
  // 手动开始录制时不检查标题关键词
  if (!shouldCheckTitleKeywords(isManualStart, recorder.titleKeywords)) {
    return false;
  }

  if (hasBlockedTitleKeywords(title, recorder.titleKeywords)) {
    recorder.state = "title-blocked";
    recorder.emit("DebugLog", {
      type: "common",
      text: `跳过录制：直播间标题 "${title}" 包含关键词 "${recorder.titleKeywords}"`,
    });
    return true;
  }

  return false;
}

export default {
  replaceExtName,
  singleton,
  getValuesFromArrayLikeFlexSpaceBetween,
  ensureFolderExist,
  assert,
  assertStringType,
  assertNumberType,
  assertObjectType,
  asyncThrottle,
  isFfmpegStartSegment,
  createInvalidStreamChecker,
  createTimeoutChecker,
  downloadImage,
  md5,
  uuid,
  sortByKeyOrder,
  retry,
  isBetweenTimeRange,
  hasBlockedTitleKeywords,
  shouldCheckTitleKeywords,
  shouldUseStrictQuality,
  sleep,
  checkTitleKeywordsWhileRecording,
  checkTitleKeywordsBeforeRecord,
};
