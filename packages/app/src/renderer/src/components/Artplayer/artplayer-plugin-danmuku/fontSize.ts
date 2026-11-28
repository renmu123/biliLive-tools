// 100% 为实际视频显示区域短边的 4%，基准字号限制在 18–36px。
export const FONT_SIZE_BASE_RATIO = 0.04;
export const FONT_SIZE_BASE_MIN = 18;
export const FONT_SIZE_BASE_MAX = 36;
export const FONT_SIZE_MIN = 50;
export const FONT_SIZE_MAX = 200;
export const FONT_SIZE_DEFAULT = 100;

export function normalizeFontSize(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return FONT_SIZE_DEFAULT;
  return Math.round(Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, value)));
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function getBaseFontSize(
  playerWidth: number,
  playerHeight: number,
  videoWidth = 0,
  videoHeight = 0,
): number {
  // 隐藏或尚未布局时使用 720px 的短边作为临时基准。
  let shortSide = 720;
  if (isPositiveFinite(playerWidth) && isPositiveFinite(playerHeight)) {
    shortSide = Math.min(playerWidth, playerHeight);
    if (isPositiveFinite(videoWidth) && isPositiveFinite(videoHeight)) {
      // 默认等比完整显示视频，扣除容器内的上下或左右黑边。
      const scale = Math.min(playerWidth / videoWidth, playerHeight / videoHeight);
      shortSide = Math.min(videoWidth, videoHeight) * scale;
    }
  }

  return Math.min(
    FONT_SIZE_BASE_MAX,
    Math.max(FONT_SIZE_BASE_MIN, shortSide * FONT_SIZE_BASE_RATIO),
  );
}

export function getFontSize(
  playerWidth: number,
  playerHeight: number,
  percentage: number,
  videoWidth = 0,
  videoHeight = 0,
): number {
  const base = getBaseFontSize(playerWidth, playerHeight, videoWidth, videoHeight);
  return Math.round((base * normalizeFontSize(percentage)) / 100);
}

export function getImageSize(
  playerWidth: number,
  playerHeight: number,
  percentage: number,
  videoWidth = 0,
  videoHeight = 0,
): number {
  // 与文字共用显示区域及基准限制；720px 短边对应 60px，基准范围 37.5–75px。
  const base = getBaseFontSize(playerWidth, playerHeight, videoWidth, videoHeight);
  const imageRatio = 60 / (720 * FONT_SIZE_BASE_RATIO);
  return Math.round((base * imageRatio * normalizeFontSize(percentage)) / 100);
}
