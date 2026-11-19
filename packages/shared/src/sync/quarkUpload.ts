import https from "node:https";
import { Transform } from "node:stream";
import Throttle from "@renmu/throttle";

import type { ClientRequest, IncomingMessage } from "node:http";
import type { Readable } from "node:stream";

type ThrottleCallback = (error?: Error) => void;
const ThrottleStream: new (options: { bps: number; chunkSize: number }) => Transform & {
  _onchunk(output: (chunk: Buffer) => void, done: ThrottleCallback): void;
} = Throttle;

class UploadThrottle extends ThrottleStream {
  // throttle 1.0.3's parser otherwise keeps scheduling the remainder of its
  // current input buffer after destroy(). Stop it when the pending delay ends.
  _onchunk(output: (chunk: Buffer) => void, done: ThrottleCallback) {
    if (this.destroyed) {
      done(new Error("Upload throttle destroyed"));
      return;
    }
    super._onchunk(output, (error) => {
      done(error || (this.destroyed ? new Error("Upload throttle destroyed") : undefined));
    });
  }
}

export function putQuarkPart(
  url: string,
  source: Readable,
  options: {
    partNumber: number;
    size: number;
    headers: Record<string, string>;
    signal: AbortSignal;
    onProgress: (loaded: number) => void;
    timeout?: number;
    /** This part's share of the task limit, in bytes per second. 0 means unlimited. */
    bytesPerSecond?: number;
  },
): Promise<string> {
  return new Promise((resolve, reject) => {
    let request: ClientRequest | undefined;
    let response: IncomingMessage | undefined;
    let settled = false;
    let loaded = 0;
    let lastProgress = 0;
    const uploadError = (detail: string | number) =>
      new Error(`夸克网盘分片 ${options.partNumber} 上传失败 (${detail})`);
    const bps = options.bytesPerSecond ?? 0;
    const throttle =
      Number.isFinite(bps) && bps > 0
        ? new UploadThrottle({
            bps,
            chunkSize: Math.max(1, Math.min(64 * 1024, Math.floor(bps / 10))),
          })
        : undefined;
    const meter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        loaded += chunk.length;
        const now = Date.now();
        if (!settled && (loaded === options.size || now - lastProgress >= 250)) {
          lastProgress = now;
          options.onProgress(loaded);
        }
        callback(null, chunk);
      },
      flush(callback) {
        callback(
          loaded === options.size
            ? undefined
            : Object.assign(new Error("Incomplete part"), { code: "ERR_CONTENT_LENGTH_MISMATCH" }),
        );
      },
    });
    const settle = (error?: Error, etag?: string) => {
      if (settled) return;
      settled = true;
      options.signal.removeEventListener("abort", abort);
      source.unpipe();
      throttle?.unpipe();
      if (request) {
        meter.unpipe(request);
        request.setTimeout(0);
      }
      source.destroy();
      throttle?.destroy();
      meter.destroy();
      if (error) {
        response?.destroy();
        request?.destroy();
        reject(error);
      } else {
        resolve(etag!);
      }
    };
    const fail = (error: NodeJS.ErrnoException) => {
      // Never include raw network errors, signed URLs, or OSS response bodies in logs.
      const code = /^[A-Z0-9_]+$/.test(error.code || "") ? error.code! : "网络错误";
      settle(uploadError(code));
    };
    const abort = () =>
      settle(
        options.signal.reason instanceof Error
          ? options.signal.reason
          : new Error("夸克网盘分片上传已中止"),
      );
    source.on("error", fail);
    throttle?.on("error", fail);
    meter.on("error", fail);
    source.once("close", () => {
      if (!source.readableEnded && !response) settle(uploadError("ERR_STREAM_PREMATURE_CLOSE"));
    });
    if (options.signal.aborted) {
      abort();
      return;
    }
    options.signal.addEventListener("abort", abort, { once: true });

    try {
      request = https.request(
        url,
        {
          method: "PUT",
          headers: { ...options.headers, "Content-Length": options.size },
        },
        (incoming) => {
          response = incoming;
          const status = incoming.statusCode || 0;
          const success = status >= 200 && status < 300;
          // A server can reject a part before it has received the whole body.
          if (!success) {
            source.unpipe();
            throttle?.unpipe();
            meter.unpipe(request!);
            source.destroy();
            throttle?.destroy();
            meter.destroy();
          }
          const chunks: Buffer[] = [];
          let bytes = 0;
          incoming.on("data", (chunk: Buffer) => {
            // OSS error XML is small. Drain larger responses without retaining them.
            if (!success && bytes < 64 * 1024) {
              const kept = chunk.subarray(0, 64 * 1024 - bytes);
              chunks.push(kept);
              bytes += kept.length;
            }
          });
          incoming.on("error", fail);
          incoming.once("aborted", () => settle(uploadError("ECONNRESET")));
          incoming.once("end", () => {
            if (!success) {
              const xml = Buffer.concat(chunks).toString("utf8");
              const code = /<Code>([A-Za-z0-9_-]+)<\/Code>/.exec(xml)?.[1];
              settle(uploadError(`${status}${code ? `, ${code}` : ""}`));
            } else if (loaded !== options.size) {
              settle(uploadError("ERR_CONTENT_LENGTH_MISMATCH"));
            } else if (!incoming.headers.etag) {
              settle(new Error(`夸克网盘上传分片 ${options.partNumber} 后未返回 ETag`));
            } else {
              settle(undefined, incoming.headers.etag);
            }
          });
        },
      );
      request.on("error", fail);
      request.once("close", () => {
        if (!response) settle(uploadError("ECONNRESET"));
      });
      request.setTimeout(options.timeout ?? 120000, () => settle(uploadError("ETIMEDOUT")));
      // pipe propagates backpressure, keeping memory bounded even for large parts.
      // Measure bytes after throttling, so progress follows the limited upload.
      (throttle ? source.pipe(throttle) : source).pipe(meter).pipe(request);
    } catch (error) {
      fail(error as NodeJS.ErrnoException);
    }
  });
}
