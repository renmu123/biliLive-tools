import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const MODEL_URL = "https://huggingface.co/mydubber-org/yamnet-onnx/resolve/fc1697c/yamnet.onnx";
const MODEL_SHA256 = "844ee869ca5426d12c6aa1876280c40099487bda74827da1ccbeeaffbe7143dd";
const modelPath = fileURLToPath(
  new URL("../packages/app/resources/models/yamnet.onnx", import.meta.url),
);

export async function verifyModel(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  if (hash.digest("hex") !== MODEL_SHA256) throw new Error(`YAMNet 模型 SHA-256 校验失败：${file}`);
}

/** 仅供构建使用，应用运行时不下载模型。 */
export async function installModel(target = modelPath) {
  try {
    await verifyModel(target);
    console.log(`YAMNet 模型已就绪：${target}`);
    return;
  } catch (error) {
    if (error.code && error.code !== "ENOENT") throw error;
  }
  await mkdir(path.dirname(target), { recursive: true });
  for (let attempt = 1; attempt <= 3; attempt++) {
    const partial = `${target}.${randomUUID()}.part`;
    try {
      console.log(`下载 YAMNet 模型 (${attempt}/3)`);
      const response = await fetch(MODEL_URL, { signal: AbortSignal.timeout(180_000) });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
      await verifyModel(partial);
      await rename(partial, target);
      console.log(`YAMNet 模型下载并校验完成：${target}`);
      return;
    } catch (error) {
      if (attempt === 3) throw error;
      console.warn(`YAMNet 模型下载失败，重试：${error.message}`);
    } finally {
      await rm(partial, { force: true });
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await installModel();
}
