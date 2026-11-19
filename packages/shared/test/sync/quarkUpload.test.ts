import http from "node:http";
import https from "node:https";
import { once } from "node:events";
import { PassThrough, Readable } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";
import Throttle from "@renmu/throttle";
import { afterEach, describe, expect, it, vi } from "vitest";
import { putQuarkPart } from "../../src/sync/quarkUpload";

import type { AddressInfo } from "node:net";
import type { ClientRequest, IncomingMessage, RequestListener } from "node:http";

const servers: http.Server[] = [];
const requests: ClientRequest[] = [];
afterEach(async () => {
  for (const request of requests.splice(0)) request.destroy();
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.closeAllConnections();
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
  vi.restoreAllMocks();
});

async function serve(handler: RequestListener) {
  const server = http.createServer((request, response) => {
    request.on("error", () => {});
    handler(request, response);
  });
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = (server.address() as AddressInfo).port;
  // Keep real ClientRequest/IncomingMessage streams and sockets. Only replace
  // TLS transport with loopback HTTP, without disabling TLS checks in production.
  return vi.spyOn(https, "request").mockImplementation(((
    url: string,
    options: https.RequestOptions,
    callback: (response: IncomingMessage) => void,
  ) => {
    const remote = new URL(url);
    const local = new URL(remote.pathname + remote.search, `http://127.0.0.1:${port}`);
    const request = http.request(local, { ...options, agent: false }, callback);
    requests.push(request);
    return request;
  }) as typeof https.request);
}

function upload(
  source: Readable = Readable.from([Buffer.from("data")]),
  options: Partial<Parameters<typeof putQuarkPart>[2]> = {},
) {
  return putQuarkPart("https://oss.example.com/private-key?signature=secret", source, {
    partNumber: 2,
    size: 4,
    headers: { Authorization: "signed-secret", "X-Oss-Date": "date" },
    signal: new AbortController().signal,
    onProgress: vi.fn(),
    ...options,
  });
}

describe("Quark native HTTPS PUT", () => {
  it("limits simultaneous PUT streams using their shares of a task's byte rate", async () => {
    const received: Buffer[] = [];
    await serve((request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk) => chunks.push(chunk));
      request.on("end", () => {
        received.push(Buffer.concat(chunks));
        response.writeHead(200, { ETag: '"etag"' });
        response.end();
      });
    });
    const content = Buffer.alloc(32 * 1024, 7);
    const progress = [vi.fn(), vi.fn()];
    const started = performance.now();
    await Promise.all(
      progress.map((onProgress) =>
        upload(Readable.from([content]), {
          size: content.length,
          bytesPerSecond: 32 * 1024, // 64 KB/s total across two concurrent streams.
          onProgress,
        }),
      ),
    );
    expect(performance.now() - started).toBeGreaterThanOrEqual(850);
    expect(received).toEqual([content, content]);
    for (const report of progress) {
      expect(report.mock.calls[0][0]).toBeLessThanOrEqual(Math.floor((32 * 1024) / 10));
      expect(report.mock.lastCall![0]).toBe(content.length);
    }
  });

  it("bypasses the throttle when the limit is zero", async () => {
    await serve((request, response) => {
      request.resume();
      request.on("end", () => {
        response.writeHead(200, { ETag: '"etag"' });
        response.end();
      });
    });
    const throttle = vi.spyOn(Throttle.prototype, "_onchunk");
    await expect(upload(undefined, { bytesPerSecond: 0 })).resolves.toBe('"etag"');
    expect(throttle).not.toHaveBeenCalled();
  });

  it("stops a throttled upload promptly and does not keep processing buffered data after cancellation", async () => {
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    await serve((request) => {
      request.once("data", started);
      request.resume();
    });
    const throttle = vi.spyOn(Throttle.prototype, "_onchunk");
    const controller = new AbortController();
    const content = Buffer.alloc(64 * 1024);
    const source = Readable.from([content]);
    const progress = vi.fn();
    const result = upload(source, {
      size: content.length,
      bytesPerSecond: 1024,
      signal: controller.signal,
      onProgress: progress,
    });
    const rejected = expect(result).rejects.toThrow("canceled");
    await ready;
    controller.abort(new Error("canceled"));
    await rejected;
    expect(source.destroyed).toBe(true);
    expect(requests[0].destroyed).toBe(true);
    const scheduled = throttle.mock.calls.length;
    const reported = progress.mock.calls.length;
    // Let the library's pending 100 ms delay expire; it must not schedule more.
    await delay(250);
    expect(throttle).toHaveBeenCalledTimes(scheduled);
    expect(progress).toHaveBeenCalledTimes(reported);
  });

  it.each([undefined, "video/mp4"])(
    "streams the exact bytes and signed headers with Content-Type %s",
    async (contentType) => {
      const content = Buffer.alloc(512 * 1024, 7);
      const chunks: Buffer[] = [];
      let received!: IncomingMessage;
      const native = await serve((request, response) => {
        received = request;
        request.on("data", (chunk) => chunks.push(chunk));
        request.on("end", () => {
          response.writeHead(200, { ETag: '"part-etag"' });
          response.end();
        });
      });
      const source = Readable.from(
        Array.from({ length: 32 }, (_, i) => content.subarray(i * 16384, (i + 1) * 16384)),
        { objectMode: false },
      );
      const progress = vi.fn();
      expect(
        await upload(source, {
          size: content.length,
          headers: {
            Authorization: "signed-secret",
            "X-Oss-Date": "date",
            "X-Oss-Content-Sha256": "UNSIGNED-PAYLOAD",
            ...(contentType ? { "Content-Type": contentType } : {}),
          },
          onProgress: progress,
        }),
      ).toBe('"part-etag"');
      expect(native).toHaveBeenCalledTimes(1);
      expect(received.method).toBe("PUT");
      expect(received.url).toBe("/private-key?signature=secret");
      expect(received.headers).toMatchObject({
        authorization: "signed-secret",
        "content-length": String(content.length),
        "x-oss-date": "date",
        "x-oss-content-sha256": "UNSIGNED-PAYLOAD",
      });
      expect(received.headers["content-type"]).toBe(contentType);
      expect(received.headers["transfer-encoding"]).toBeUndefined();
      expect(Buffer.concat(chunks)).toEqual(content);
      const loaded = progress.mock.calls.map(([bytes]) => bytes);
      expect(loaded).toEqual([...loaded].sort((a, b) => a - b));
      expect(loaded.at(-1)).toBe(content.length);
      expect(source.destroyed).toBe(true);
    },
  );

  it.each([
    [403, "SignatureDoesNotMatch"],
    [400, "PartNotSequential"],
  ])("reports OSS status %i and code %s without exposing credentials", async (status, code) => {
    await serve((request, response) => {
      request.resume();
      response.writeHead(Number(status));
      response.write("<Error><Co");
      response.end(`de>${code}</Code><Message>signed-secret private-key</Message></Error>`);
    });
    const result = upload();
    await expect(result).rejects.toThrow(`夸克网盘分片 2 上传失败 (${status}, ${code})`);
    await expect(result).rejects.not.toThrow(/private-key|signed-secret|signature=secret/);
  });

  it("stops reading the source when OSS rejects an unfinished body", async () => {
    await serve((request, response) => {
      request.once("data", () => {
        response.writeHead(403);
        response.end("<Error><Code>AccessDenied</Code></Error>");
      });
    });
    const source = new PassThrough();
    const result = upload(source, { size: 1024 * 1024 });
    source.write("data");
    await expect(result).rejects.toThrow("403, AccessDenied");
    expect(source.destroyed).toBe(true);
    expect(requests[0].destroyed).toBe(true);
  });

  it("does not follow redirects carrying the signed Authorization header", async () => {
    const native = await serve((request, response) => {
      request.resume();
      response.writeHead(307, { Location: "https://elsewhere.example.com/secret" });
      response.end();
    });
    await expect(upload()).rejects.toThrow("上传失败 (307)");
    expect(native).toHaveBeenCalledTimes(1);
  });

  it("rejects successful responses without ETag", async () => {
    await serve((request, response) => {
      request.resume();
      request.on("end", () => response.end());
    });
    await expect(upload()).rejects.toThrow("分片 2 后未返回 ETag");
  });

  it("closes a stalled request on timeout", async () => {
    await serve((request) => request.resume());
    const source = Readable.from([Buffer.from("data")]);
    await expect(upload(source, { timeout: 30 })).rejects.toThrow("ETIMEDOUT");
    expect(source.destroyed).toBe(true);
    expect(requests[0].destroyed).toBe(true);
  });

  it.each([false, true])(
    "aborts while waiting for body/response (body complete: %s)",
    async (endBody) => {
      let started!: () => void;
      const ready = new Promise<void>((resolve) => {
        started = resolve;
      });
      await serve((request) => {
        request.on(endBody ? "end" : "data", started);
        request.resume();
      });
      const source = new PassThrough();
      const controller = new AbortController();
      const result = upload(source, { signal: controller.signal, size: endBody ? 4 : 1024 });
      const rejected = expect(result).rejects.toThrow("canceled");
      if (endBody) source.end("data");
      else source.write("data");
      await ready;
      controller.abort(new Error("canceled"));
      await rejected;
      expect(source.destroyed).toBe(true);
      expect(requests[0].destroyed).toBe(true);
    },
  );

  it("does not create a request for an already aborted part", async () => {
    const native = vi.spyOn(https, "request");
    const controller = new AbortController();
    controller.abort(new Error("canceled"));
    const source = new PassThrough();
    await expect(upload(source, { signal: controller.signal })).rejects.toThrow("canceled");
    expect(native).not.toHaveBeenCalled();
    expect(source.destroyed).toBe(true);
  });

  it("rejects a response that disconnects before its declared body ends", async () => {
    await serve((request, response) => {
      request.resume();
      request.on("end", () => {
        response.writeHead(200, { ETag: '"etag"', "Content-Length": 100 });
        response.write("partial", () => setImmediate(() => response.destroy()));
      });
    });
    await expect(upload()).rejects.toThrow("ECONNRESET");
  });

  it("closes the request after a file read error and omits the original error message", async () => {
    await serve((request) => request.resume());
    const source = new PassThrough();
    const result = upload(source);
    source.destroy(Object.assign(new Error("private file path"), { code: "EIO" }));
    await expect(result).rejects.toThrow("上传失败 (EIO)");
    await expect(result).rejects.not.toThrow("private file path");
    expect(requests[0].destroyed).toBe(true);
  });

  it("rejects a shortened source instead of waiting for the server to time out", async () => {
    await serve((request) => request.resume());
    await expect(upload(Readable.from([Buffer.from("x")]))).rejects.toThrow(
      "ERR_CONTENT_LENGTH_MISMATCH",
    );
    expect(requests[0].destroyed).toBe(true);
  });

  it("handles cancellation from a progress listener without uncaught stream errors", async () => {
    await serve((request) => request.resume());
    const controller = new AbortController();
    const source = Readable.from([Buffer.from("data")]);
    const onProgress = vi.fn(() => controller.abort(new Error("canceled")));
    await expect(upload(source, { signal: controller.signal, onProgress })).rejects.toThrow(
      "canceled",
    );
    expect(source.destroyed).toBe(true);
    expect(requests[0].destroyed).toBe(true);
    expect(onProgress).toHaveBeenCalledTimes(1);
  });
});
