import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

export const MODEL_SHA256 = "844ee869ca5426d12c6aa1876280c40099487bda74827da1ccbeeaffbe7143dd";

async function validModel(file: string) {
  try {
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(file)) hash.update(chunk);
    return hash.digest("hex") === MODEL_SHA256;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

/** Fixed model revision: preprocessing, label indices and cached scores depend on it. */
export async function ensureModel(modelPath: string) {
  const target = process.env.BILILIVE_YAMNET_MODEL || modelPath;
  if (await validModel(target)) return target;
  throw new Error(`YAMNet 模型不存在或 SHA-256 校验失败，请检查模型文件：${target}`);
}
