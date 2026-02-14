/**
 * DouYu 工具函数
 */

import crypto from "node:crypto";

/**
 * 生成 UUID
 */
export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * MD5 哈希
 */
export function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}
