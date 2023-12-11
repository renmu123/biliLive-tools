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
