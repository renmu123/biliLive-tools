import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import { streamVideoFile } from "../src/services/videoFile.js";

describe("video file HTTP streaming", () => {
  const largeVideo = Buffer.alloc(2 * 1024 * 1024 + 17, "flv-test");
  const smallVideo = Buffer.from("small-flv-video");
  let directory: string;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), "bililive-video-stream-"));
    await Promise.all([
      writeFile(path.join(directory, "large.flv"), largeVideo),
      writeFile(path.join(directory, "small.flv"), smallVideo),
    ]);
    const app = new Koa();
    app.use(async (ctx) => {
      const file = ctx.path === "/large.flv" ? "large.flv" : "small.flv";
      await streamVideoFile(ctx, path.join(directory, file));
    });
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
    await rm(directory, { recursive: true, force: true });
  });

  it.each([
    ["large.flv", largeVideo],
    ["small.flv", smallVideo],
  ])("returns the entire %s without a Range header", async (file, expected) => {
    const response = await fetch(`${baseUrl}/${file}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Length")).toBe(String(expected.length));
    expect(response.headers.get("Content-Range")).toBeNull();
    expect(response.headers.get("Content-Type")).toBe("video/x-flv");
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
    expect(Buffer.from(await response.arrayBuffer()).equals(expected)).toBe(true);
  });

  it.each([
    ["bytes=3-7", 3, 7],
    ["bytes=1048576-", 1048576, largeVideo.length - 1],
    ["bytes=-7", largeVideo.length - 7, largeVideo.length - 1],
    ["bytes=3-9999999", 3, largeVideo.length - 1],
    ["bytes=-9999999", 0, largeVideo.length - 1],
  ])("returns exactly the requested range for %s", async (range, start, end) => {
    const response = await fetch(`${baseUrl}/large.flv`, { headers: { Range: range } });
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe(
      `bytes ${start}-${end}/${largeVideo.length}`,
    );
    expect(response.headers.get("Content-Length")).toBe(String(end - start + 1));
    expect(
      Buffer.from(await response.arrayBuffer()).equals(largeVideo.subarray(start, end + 1)),
    ).toBe(true);
  });

  it.each([
    `bytes=${largeVideo.length}-`,
    "bytes=10-2",
    "bytes=-0",
    "bytes=-",
    "bytes=invalid",
    "bytes=0-1garbage",
  ])("rejects invalid or unsatisfiable range %s", async (range) => {
    const response = await fetch(`${baseUrl}/large.flv`, { headers: { Range: range } });
    expect(response.status).toBe(416);
    expect(response.headers.get("Content-Range")).toBe(`bytes */${largeVideo.length}`);
    expect(await response.text()).toBe("");
  });

  it.each(["items=0-1", "bytes=0-1,4-5"])("ignores unsupported range %s", async (range) => {
    const response = await fetch(`${baseUrl}/small.flv`, { headers: { Range: range } });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Range")).toBeNull();
    expect(Buffer.from(await response.arrayBuffer()).equals(smallVideo)).toBe(true);
  });

  it("returns full file headers without a body for HEAD", async () => {
    const response = await fetch(`${baseUrl}/large.flv`, {
      method: "HEAD",
      headers: { Range: "bytes=3-7" },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Length")).toBe(String(largeVideo.length));
    expect(response.headers.get("Content-Range")).toBeNull();
    expect(await response.text()).toBe("");
  });
});
