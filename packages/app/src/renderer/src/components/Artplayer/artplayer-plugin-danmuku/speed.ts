// speed 表示弹幕持续秒数，时间越短，滚动越快。
export const SPEED_DEFAULT = 7.5;
export const SPEED_MIN = 1.5;
export const SPEED_MAX = 15;

export function normalizeSpeed(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return SPEED_DEFAULT;
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, value));
}
