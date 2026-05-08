import filenamify from "filenamify/browser";
import CryptoJS from "crypto-js";

export const deepRaw = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

export const uuid = () => {
  return Math.random().toString(36).slice(2);
};

export function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours === 0 && minutes === 0) {
    return `${String(remainingSeconds)}秒`;
  }
  if (hours === 0) {
    return `${String(minutes)}分钟${String(remainingSeconds).padStart(2, "0")}秒`;
  }
  const formattedTime = `${String(hours).padStart(2, "0")}小时${String(minutes).padStart(
    2,
    "0",
  )}分钟${String(remainingSeconds).padStart(2, "0")}秒`;
  return formattedTime;
}

export function sanitizeFileName(fileName: string) {
  return filenamify(fileName, { replacement: "_" });
}

/**
 * 将秒数转换为时间标记，格式为 HH:mm:ss 或 HH:mm:ss.SSS
 * @param seconds 秒数
 * @param showMilliseconds 是否显示毫秒，默认显示
 * @returns 时间标记字符串
 */
export function secondsToTimemark(seconds: number, showMilliseconds = true) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const milliseconds = Math.round((secs % 1) * 1000);
  const secsFloor = Math.floor(secs);

  // 构建字符串，确保小时、分钟和秒都是双位数，毫秒是三位数
  const hoursStr = hours.toString().padStart(2, "0");
  const minutesStr = minutes.toString().padStart(2, "0");
  const secsStr = secsFloor.toString().padStart(2, "0");
  const millisecondsStr = milliseconds.toString().padStart(3, "0");

  if (!showMilliseconds) {
    // 根据是否有小时来决定是否包含小时部分
    const timemark = `${hoursStr}:${minutesStr}:${secsStr}.${millisecondsStr}`;
    return timemark;
  } else {
    const timemark = `${hoursStr}:${minutesStr}:${secsStr}`;
    return timemark;
  }
}

/**
 * 格式化时间戳为 YYYY-MM-DD HH:mm:ss 格式
 * @param date 时间戳，单位毫秒
 * @returns
 */
export const formatTime = (date: number | null) => {
  if (!date) return "--";

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化持续时间，返回 HH:mm:ss 格式
 * @param duration
 * @param zeroText
 * @returns
 */
export const formatDuration = (duration?: number | null, zeroText: string = "--") => {
  if (!duration || duration <= 0) return zeroText;

  return secondsToTimemark(duration);
};

const normalizeTimestamp = (timestamp?: number | null) => {
  if (!timestamp) return null;
  return timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
};

export function formatRecentRecordTime(
  timestamp?: number | null,
  options?: {
    now?: number;
    fallback?: (normalizedTimestamp: number) => string;
  },
) {
  const normalizedTimestamp = normalizeTimestamp(timestamp);
  if (!normalizedTimestamp) return "--";

  const now = options?.now ?? Date.now();
  const diff = now - normalizedTimestamp;
  if (diff < 0) {
    return "--";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const fiveDays = 5 * day;

  if (diff < minute) {
    return "刚刚";
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`;
  }

  if (diff <= fiveDays) {
    return `${Math.floor(diff / day)} 天前`;
  }

  return formatTime(normalizedTimestamp);
}

export const supportedVideoExtensions = [
  "mp4",
  "flv",
  "avi",
  "wmv",
  "mov",
  "webm",
  "mpeg",
  "ts",
  "mpg",
  "rm",
  "rmvb",
  "mkv",
  "m4s",
];

export function formatFile(filepath: string) {
  const formatFile = window.path.parse(filepath);
  return { ...formatFile, path: filepath, filename: formatFile.base };
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateHMACSHA256(message, secretKey) {
  // 将消息和密钥编码为 UTF-8
  const messageUtf8 = CryptoJS.enc.Utf8.parse(message);
  const secretKeyUtf8 = CryptoJS.enc.Utf8.parse(secretKey);

  // 计算 HMAC-SHA256
  const hmac = CryptoJS.HmacSHA256(messageUtf8, secretKeyUtf8);

  // 转换为十六进制字符串
  return hmac.toString(CryptoJS.enc.Hex);
}

export function sha256(message: string) {
  return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
}

/**
 * 替换文件扩展名
 * @param filePath 文件路径
 * @param newExtName 新的扩展名，包含点号
 */
export function replaceExtName(filePath: string, newExtName: string) {
  return window.path.join(
    window.path.dirname(filePath),
    window.path.basename(filePath, window.path.extname(filePath)) + newExtName,
  );
}

/**
 * 生成有辨识度的颜色
 * 使用 HSL 色彩空间,固定饱和度和亮度,通过黄金角度分割色相环
 */
export const generateDistinctColor = (index: number, active = true): string => {
  const goldenRatio = 0.618033988749895;
  const hue = (index * goldenRatio * 360) % 360;
  let saturation = 65; // 饱和度 65%
  let lightness = 60; // 亮度 60%
  let alpha = 0.5; // 透明度
  if (!active) {
    saturation = 30;
    lightness = 50;
    alpha = 0.35;
  }
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
};

/**
 * 根据平台和房间ID构建房间链接
 * @param platform
 * @param roomId
 * @returns
 */
export function buildRoomLink(platform: string, roomId: string): string | null {
  const platformLower = platform.toLowerCase();
  const platformRoomLinkMap: Record<string, (roomId: string) => string> = {
    bilibili: (id: string) => `https://live.bilibili.com/${id}`,
    huya: (id: string) => `https://www.huya.com/${id}`,
    douyu: (id: string) => `https://www.douyu.com/${id}`,
    douyin: (id: string) => `https://live.douyin.com/${id}`,
    xhs: (id: string) => `https://www.xiaohongshu.com/user/profile/${id}`,
  };
  const link = platformRoomLinkMap[platformLower]?.(roomId);
  return link ?? null;
}

export { verifyBiliKey } from "./security";
