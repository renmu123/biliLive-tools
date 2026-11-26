// 100% 为播放器高度的 4%：720px 高的播放区域约 29px，1080px 高约 43px。
export const FONT_SIZE_BASE_RATIO = 0.04;
export const FONT_SIZE_MIN = 50;
export const FONT_SIZE_MAX = 200;
export const FONT_SIZE_DEFAULT = 100;

export function normalizeFontSize(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return FONT_SIZE_DEFAULT;
  return Math.round(Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, value)));
}

export function getFontSize(playerHeight: number, percentage: number): number {
  // 隐藏或尚未布局的播放器使用 720px 作为临时基准。
  const height = playerHeight > 0 ? playerHeight : 720;
  return Math.max(
    1,
    Math.round((height * FONT_SIZE_BASE_RATIO * normalizeFontSize(percentage)) / 100),
  );
}
