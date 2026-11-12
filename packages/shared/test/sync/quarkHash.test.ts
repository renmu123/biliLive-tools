import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SHA1 } from "@noble/hashes/legacy";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hashQuarkFile } from "../../src/sync/quarkHash";
import type { ParallelSha1Context } from "../../src/sync/quarkHash";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function file(content: Buffer) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "quark-hash-test-"));
  dirs.push(dir);
  const input = path.join(dir, "video.mp4");
  await writeFile(input, content);
  return input;
}

// Emulate the server continuing SHA-1 from the supplied state and byte count.
class ResumedSha1 extends SHA1 {
  constructor(context: ParallelSha1Context) {
    super();
    this.set(...(context.h as [number, number, number, number, number]));
    this.length = context.part_offset;
  }
}

describe("Quark parallel SHA-1 contexts", () => {
  it.each([0, 1, 55, 56, 63, 64, 65, 127, 128, 129])(
    "matches Node hashes and resumes every part for a %i-byte file",
    async (size) => {
      const content = Buffer.from(Array.from({ length: size }, (_, i) => i % 256));
      const result = await hashQuarkFile(await file(content), size, 64);
      const sha1 = createHash("sha1").update(content).digest("hex");
      expect(result.sha1).toBe(sha1);
      expect(result.md5).toBe(createHash("md5").update(content).digest("hex"));
      expect(result.partStates.size).toBe(Math.max(0, Math.ceil(size / 64) - 1));
      for (const [part, context] of result.partStates) {
        expect(context.part_offset).toBe((part - 1) * 64);
        expect(context.h).toHaveLength(5);
        expect(
          context.h.every((word) => Number.isInteger(word) && word >= 0 && word <= 0xffffffff),
        ).toBe(true);
        const resumed = new ResumedSha1(context).update(content.subarray(context.part_offset));
        expect(Buffer.from(resumed.digest()).toString("hex")).toBe(sha1);
      }
    },
  );

  it("preserves checkpoints across read boundaries that do not match part boundaries", async () => {
    const content = Buffer.alloc(3 * 1024 * 1024 + 17, 7);
    const partSize = 1024 * 1024 + 64;
    const result = await hashQuarkFile(await file(content), content.length, partSize);
    const sha1 = createHash("sha1").update(content).digest("hex");
    expect(result.sha1).toBe(sha1);
    expect(result.md5).toBe(createHash("md5").update(content).digest("hex"));
    expect([...result.partStates.keys()]).toEqual([2, 3]);
    for (const [part, context] of result.partStates) {
      expect(context.part_offset).toBe((part - 1) * partSize);
      const resumed = new ResumedSha1(context).update(content.subarray(context.part_offset));
      expect(Buffer.from(resumed.digest()).toString("hex")).toBe(sha1);
    }
  });

  it("waits for resume while hashing and honors cancellation before processing more data", async () => {
    const content = Buffer.alloc(2 * 1024 * 1024, 7);
    const input = await file(content);
    const controller = new AbortController();
    let resume!: () => void;
    const gate = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const wait = vi.fn(() => gate);
    const hashing = hashQuarkFile(input, content.length, 1024 * 1024, {
      signal: controller.signal,
      wait,
    });
    await vi.waitFor(() => expect(wait).toHaveBeenCalledTimes(1));
    const rejected = expect(hashing).rejects.toThrow("canceled");
    controller.abort(new Error("canceled"));
    resume();
    await rejected;
    expect(wait).toHaveBeenCalledTimes(1);
  });

  it("rejects part boundaries that cannot be represented by SHA-1 state words", async () => {
    const input = await file(Buffer.alloc(100));
    await expect(hashQuarkFile(input, 100, 63)).rejects.toThrow("分片大小");
  });

  it("rejects a file whose size changed since pre-upload", async () => {
    const input = await file(Buffer.alloc(63));
    await expect(hashQuarkFile(input, 64, 64)).rejects.toThrow("源文件发生变化");
  });
});
