import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { SHA1 } from "@noble/hashes/legacy";

export type ParallelSha1Context = { part_offset: number; h: number[] };

class CheckpointSha1 extends SHA1 {
  exportState() {
    // Quark needs the five compression-state words, before SHA-1 padding.
    // Node's Hash.digest() returns a finalized digest and cannot supply this state.
    return this.get().map((word) => word >>> 0);
  }
}

export async function hashQuarkFile(
  file: string,
  size: number,
  partSize: number,
  options: { signal?: AbortSignal; wait?: () => Promise<void> } = {},
) {
  if (!Number.isSafeInteger(partSize) || partSize <= 0 || (size > partSize && partSize % 64))
    throw new Error("夸克网盘返回的分片大小不支持并行 SHA-1 校验");

  const sha1 = new CheckpointSha1();
  const md5 = createHash("md5");
  // Keyed by the part that will consume this state (part 1 has no preceding state).
  const partStates = new Map<number, ParallelSha1Context>();
  let offset = 0;
  try {
    for await (const chunk of createReadStream(file, {
      highWaterMark: 1024 * 1024,
      signal: options.signal,
    })) {
      await options.wait?.();
      options.signal?.throwIfAborted();
      const bytes = chunk as Buffer;
      md5.update(bytes);
      for (let start = 0; start < bytes.length; ) {
        const length = Math.min(bytes.length - start, partSize - (offset % partSize));
        sha1.update(bytes.subarray(start, start + length));
        start += length;
        offset += length;
        if (offset % partSize === 0 && offset < size)
          partStates.set(offset / partSize + 1, {
            part_offset: offset,
            h: sha1.exportState(),
          });
      }
    }
    options.signal?.throwIfAborted();
    if (offset !== size) throw new Error("上传期间源文件发生变化，请重新创建上传任务");
    return {
      sha1: Buffer.from(sha1.digest()).toString("hex"),
      md5: md5.digest("hex"),
      partStates,
    };
  } finally {
    sha1.destroy();
  }
}
