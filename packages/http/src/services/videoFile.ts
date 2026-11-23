import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { Context } from "koa";

const contentTypes: Record<string, string> = {
  ".mp4": "video/mp4",
  ".flv": "video/x-flv",
  ".m4s": "video/iso.segment",
  ".ts": "video/mp2t",
  ".mkv": "video/x-matroska",
  ".webm": "video/webm",
};

/** Stream a complete file, or the single byte range requested by the player. */
export async function streamVideoFile(ctx: Context, videoPath: string): Promise<void> {
  const { size } = await stat(videoPath);
  ctx.type = contentTypes[path.extname(videoPath).toLowerCase()] || "application/octet-stream";
  ctx.set("Accept-Ranges", "bytes");

  // Range is only defined for GET. Ignore unsupported units and multipart ranges.
  const range = ctx.method === "GET" ? ctx.get("Range") : "";
  if (!range || !range.startsWith("bytes=") || range.includes(",")) {
    ctx.status = 200;
    ctx.length = size;
    if (ctx.method !== "HEAD") ctx.body = createReadStream(videoPath);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  let start = Number.NaN;
  let end = Number.NaN;
  if (match && (match[1] || match[2])) {
    if (!match[1]) {
      const suffixLength = Number(match[2]);
      if (Number.isSafeInteger(suffixLength) && suffixLength > 0) {
        start = Math.max(0, size - suffixLength);
        end = size - 1;
      }
    } else {
      start = Number(match[1]);
      end = match[2] ? Number(match[2]) : size - 1;
    }
  }

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end) {
    ctx.status = 416;
    ctx.set("Content-Range", `bytes */${size}`);
    ctx.body = "";
    return;
  }

  end = Math.min(end, size - 1);
  ctx.status = 206;
  ctx.set("Content-Range", `bytes ${start}-${end}/${size}`);
  ctx.length = end - start + 1;
  ctx.body = createReadStream(videoPath, { start, end });
}
