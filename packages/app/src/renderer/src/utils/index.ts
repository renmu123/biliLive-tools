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
  // 定义不允许出现在文件名中的字符
  const invalidChars = ["/", "\\\\", ":", "*", "?", '"', "<", ">", "|"];

  // 替换不允许的字符为空格
  const sanitizedFileName = fileName.replace(
    new RegExp("[" + invalidChars.join("") + "]", "g"),
    " ",
  );
  // sanitizedFileName = sanitizedFileName.replaceAll("\\", "");

  return sanitizedFileName;
}

export function secondsToTimemark(seconds: number) {
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

  // 根据是否有小时来决定是否包含小时部分
  const timemark = `${hoursStr}:${minutesStr}:${secsStr}.${millisecondsStr}`;

  return timemark;
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
];
