// speed 表示弹幕持续秒数，时间越短，滚动越快。
export const SPEED_DEFAULT = 7.5;
export const SPEED_MIN = 1.5;
export const SPEED_MAX = 15;

export function normalizeSpeed(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return SPEED_DEFAULT;
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, value));
}

// 保留用户选择的档位；同时兼容上一版以 2.5 秒为适中的配置。
export function migrateSpeed(value: unknown, version?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return SPEED_DEFAULT;
  if (version === 3) return normalizeSpeed(value);
  return normalizeSpeed(value * (version === 2 ? 3 : 1.5));
}
