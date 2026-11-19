import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Quark, pollQuarkAuth, signedHeaders, startQuarkAuth } from "../../src/sync/quark";
import * as quarkUpload from "../../src/sync/quarkUpload";
import { appConfig } from "../../src/config";
import { addSyncTask } from "../../src/task/sync";
import { taskQueue } from "../../src/task/task";

const dirs: string[] = [];
const running: { client: Quark; promise: Promise<void> }[] = [];
afterEach(async () => {
  for (const { client } of running) client.cancelUpload();
  await Promise.allSettled(running.splice(0).map(({ promise }) => promise));
  vi.restoreAllMocks();
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function file(content: Buffer) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "quark-open-test-"));
  dirs.push(dir);
  const localPath = path.join(dir, "video.mp4");
  await writeFile(localPath, content);
  return localPath;
}

const auth = {
  accessToken: "access",
  refreshToken: "refresh",
  deviceId: "device",
  userId: "user",
  clientDeviceId: "client-device",
};

// Raw SHA-1 states for 64/128 zero bytes, exported by the official CLI 1.0.25.
const zeroPartStates = [
  [2461271269, 1448643821, 1813695822, 3204792168, 167197331],
  [712871892, 2353796357, 3687285030, 4143066580, 1204045434],
];

function mockMultipart() {
  let generation = 0;
  const calls: { pathname: string; data: any }[] = [];
  vi.spyOn(axios, "request").mockImplementation(async (config) => {
    const pathname = new URL(config.url!).pathname;
    calls.push({ pathname, data: config.data });
    if (pathname.endsWith("/user/info")) return { data: { status: 0, data: { user_id: "user" } } };
    if (pathname.endsWith("/upload_pre")) {
      expect(config.data).toMatchObject({ parallel_upload: true, hash_update: true, sha1: "" });
      return { data: { status: 0, data: { task_id: "task", part_size: 64 } } };
    }
    if (pathname.endsWith("/update/hash")) return { data: { status: 0, data: { finish: false } } };
    if (pathname.endsWith("/get_upload_urls")) {
      expect(calls.some((call) => call.pathname.endsWith("/update/hash"))).toBe(true);
      for (const part of config.data.part_info_list) {
        expect(part.parallel_sha1_ctx).toEqual(
          part.part_number === 1
            ? undefined
            : { part_offset: (part.part_number - 1) * 64, h: zeroPartStates[part.part_number - 2] },
        );
      }
      generation++;
      return {
        data: {
          status: 0,
          data: {
            upload_urls: config.data.part_info_list.map(
              ({ part_number }: { part_number: number }) => ({
                part_number,
                upload_url: `https://oss.example.com/part/${part_number}?generation=${generation}`,
                signature_info: { signature: "signed" },
              }),
            ),
          },
        },
      };
    }
    if (pathname.endsWith("/upload_finish")) return { data: { status: 0, data: { finish: true } } };
    throw new Error(`Unexpected request: ${pathname}`);
  });
  const transfers: {
    part: number;
    url: string;
    signal: AbortSignal;
    bytesPerSecond?: number;
    complete: () => void;
    fail: (error: Error) => void;
    progress: (bytes: number) => void;
  }[] = [];
  let active = 0;
  let maxActive = 0;
  vi.spyOn(quarkUpload, "putQuarkPart").mockImplementation((url, stream, config) => {
    const signal = config.signal;
    const part = Number(new URL(url).pathname.split("/").at(-1));
    active++;
    maxActive = Math.max(maxActive, active);
    // The native PUT helper normally consumes the stream and handles its abort error.
    stream.on("error", () => {});
    stream.resume();
    let onAbort: () => void;
    return new Promise<string>((resolve, reject) => {
      onAbort = () => reject(new Error("aborted"));
      signal.addEventListener("abort", onAbort, { once: true });
      transfers.push({
        part,
        url,
        signal,
        bytesPerSecond: config.bytesPerSecond,
        complete: () => resolve(`etag-${part}`),
        fail: reject,
        progress: config.onProgress,
      });
    }).finally(() => {
      active--;
      signal.removeEventListener("abort", onAbort);
    });
  });
  return { calls, transfers, active: () => active, maxActive: () => maxActive };
}

async function startMultipart(content = Buffer.alloc(192), concurrency = 2, limitRate = 0) {
  const input = await file(content);
  const client = new Quark({ auth, concurrency, limitRate });
  const promise = client.uploadFile(input);
  // Tests may intentionally leave an upload pending while checking pause/cancel.
  promise.catch(() => {});
  running.push({ client, promise });
  return { client, promise, input };
}

describe("Quark concurrent upload controls", () => {
  it("keeps the configured number of parts in flight and commits ETags in part order", async () => {
    const mock = mockMultipart();
    const { client, promise } = await startMultipart();
    const progress = vi.fn();
    client.on("progress", progress);
    await vi.waitFor(() => expect(mock.transfers).toHaveLength(2));
    expect(mock.transfers.every(({ bytesPerSecond }) => bytesPerSecond === 0)).toBe(true);
    mock.transfers[0].progress(32);
    mock.transfers[1].progress(32);
    expect(progress.mock.lastCall![0].percentage).toBeCloseTo(100 / 3);
    mock.transfers[1].complete();
    await vi.waitFor(() => expect(mock.transfers).toHaveLength(3));
    expect(mock.maxActive()).toBe(2);
    mock.transfers[2].complete();
    mock.transfers[0].complete();
    await promise;
    expect(mock.calls.at(-1)?.data.part_info_list).toEqual([
      { part_number: 1, etag: "etag-1" },
      { part_number: 2, etag: "etag-2" },
      { part_number: 3, etag: "etag-3" },
    ]);
    expect(progress.mock.lastCall![0].percentage).toBe(100);
  });

  it("aborts active parts on pause and resumes only unfinished parts with fresh URLs", async () => {
    const mock = mockMultipart();
    const { client, promise } = await startMultipart(Buffer.alloc(192), 2, 1024);
    await vi.waitFor(() => expect(mock.transfers).toHaveLength(2));
    mock.transfers[0].complete();
    await vi.waitFor(() => expect(mock.transfers).toHaveLength(3));
    expect(client.pauseUpload()).toBe(true);
    expect(client.pauseUpload()).toBe(false);
    await vi.waitFor(() => expect(mock.active()).toBe(0));
    expect(mock.calls.some((call) => call.pathname.endsWith("/upload_finish"))).toBe(false);
    expect(client.resumeUpload()).toBe(true);
    await vi.waitFor(() => expect(mock.transfers).toHaveLength(5));
    expect(
      mock.transfers
        .slice(3)
        .map(({ part }) => part)
        .sort(),
    ).toEqual([2, 3]);
    expect(mock.transfers.slice(3).every(({ url }) => url.endsWith("generation=2"))).toBe(true);
    expect(mock.transfers.every(({ bytesPerSecond }) => bytesPerSecond === 512 * 1024)).toBe(true);
    mock.transfers.slice(3).forEach((transfer) => transfer.complete());
    await promise;
    expect(mock.calls.filter((call) => call.pathname.endsWith("/upload_pre"))).toHaveLength(1);
    expect(mock.calls.filter((call) => call.pathname.endsWith("/update/hash"))).toHaveLength(1);
    const urlRequests = mock.calls.filter((call) => call.pathname.endsWith("/get_upload_urls"));
    expect(urlRequests[1].data).toEqual({
      task_id: "task",
      part_info_list: urlRequests[0].data.part_info_list.slice(1),
    });
    expect(mock.calls.at(-1)?.data.part_info_list).toHaveLength(3);
  });

  it("handles immediate resume before aborted PUTs have settled", async () => {
    const mock = mockMultipart();
    const { client, promise } = await startMultipart(Buffer.alloc(128));
    await vi.waitFor(() => expect(mock.transfers).toHaveLength(2));
    client.pauseUpload();
    client.resumeUpload();
    await vi.waitFor(() => expect(mock.transfers).toHaveLength(4));
    mock.transfers.slice(2).forEach((transfer) => transfer.complete());
    await promise;
    expect(mock.maxActive()).toBe(2);
  });

  it("cancels a paused upload without committing it or leaving workers waiting", async () => {
    const mock = mockMultipart();
    const { client, promise } = await startMultipart();
    await vi.waitFor(() => expect(mock.transfers).toHaveLength(2));
    client.pauseUpload();
    await vi.waitFor(() => expect(mock.active()).toBe(0));
    client.cancelUpload();
    await expect(promise).rejects.toThrow("上传已取消");
    expect(client.resumeUpload()).toBe(false);
    expect(mock.calls.some((call) => call.pathname.endsWith("/upload_finish"))).toBe(false);
  });

  it("stops sibling PUTs and queued parts when one part fails", async () => {
    const mock = mockMultipart();
    const { promise } = await startMultipart();
    await vi.waitFor(() => expect(mock.transfers).toHaveLength(2));
    mock.transfers[0].fail(new Error("part failed"));
    await expect(promise).rejects.toThrow("part failed");
    expect(mock.active()).toBe(0);
    expect(mock.transfers).toHaveLength(2);
    expect(mock.calls.some((call) => call.pathname.endsWith("/upload_finish"))).toBe(false);
  });

  it("rejects a changed source file when resuming", async () => {
    const mock = mockMultipart();
    const { client, promise, input } = await startMultipart();
    await vi.waitFor(() => expect(mock.transfers).toHaveLength(2));
    client.pauseUpload();
    await vi.waitFor(() => expect(mock.active()).toBe(0));
    await writeFile(input, "changed file");
    client.resumeUpload();
    await expect(promise).rejects.toThrow("源文件发生变化");
    expect(mock.transfers).toHaveLength(2);
  });

  it("can pause and cancel before preparing the upload task", async () => {
    const mock = mockMultipart();
    const { client, promise } = await startMultipart();
    client.pauseUpload();
    client.cancelUpload();
    await expect(promise).rejects.toThrow();
    expect(mock.calls).toHaveLength(0);
  });

  it.each([1, 2])(
    "shares the task rate across only %i part(s) when concurrency is larger",
    async (parts) => {
      const mock = mockMultipart();
      const { promise } = await startMultipart(Buffer.alloc(64 * parts), 5, 1024);
      await vi.waitFor(() => expect(mock.transfers).toHaveLength(parts));
      expect(mock.transfers.map(({ bytesPerSecond }) => bytesPerSecond)).toEqual(
        Array(parts).fill((1024 * 1024) / parts),
      );
      mock.transfers.forEach((transfer) => transfer.complete());
      await promise;
    },
  );

  it.each([
    [undefined, 512],
    [0, 0],
    [256, 256],
  ])("uses the configured task rate or explicit override %s", async (limitRate, expectedRate) => {
    const mock = mockMultipart();
    vi.spyOn(appConfig, "getAll").mockReturnValue({
      sync: { quark: { auth, concurrency: 5, limitRate: 512 } },
    } as ReturnType<typeof appConfig.getAll>);
    vi.spyOn(taskQueue, "addTask").mockImplementation(() => {});
    const input = await file(Buffer.alloc(64));
    const task = await addSyncTask({ type: "quark", input, limitRate });
    const client = task.instance as Quark;
    const promise = client.uploadFile(input);
    promise.catch(() => {});
    running.push({ client, promise });
    await vi.waitFor(() => expect(mock.transfers).toHaveLength(1));
    expect(mock.transfers[0].bytesPerSecond).toBe(expectedRate! * 1024);
    mock.transfers[0].complete();
    await promise;
  });
});

describe("Quark OAuth", () => {
  it("signs open API requests with the official header scheme", () => {
    const headers = signedHeaders("post", "/open/v1/file/upload_pre", "123");
    const expected = createHash("sha256")
      .update("POST&/open/v1/file/upload_pre&123&cf134812e2de4032bd1cb7c3727e84b3")
      .digest("hex");
    expect(headers["x-pan-client-id"]).toBe("third_party_agent");
    expect(headers["x-pan-token"]).toBe(expected);
  });

  it("starts browser authorization and exchanges the page code", async () => {
    const request = vi.spyOn(axios, "request").mockImplementation(async (config) => {
      const pathname = new URL(config.url!).pathname;
      if (pathname.endsWith("get_authorize_page_url"))
        return {
          data: {
            status: 0,
            data: {
              authorize_page_url: "https://example.com/auth",
              page_code: "page",
              device_id: "device",
            },
          },
        };
      if (pathname.endsWith("get_aac_by_pagecode"))
        return { data: { status: 0, data: { status: "success", agent_auth_code: "code" } } };
      return {
        data: {
          status: 0,
          data: {
            status: 0,
            access_token: "access",
            refresh_token: "refresh",
            device_id: "device",
            user_id: "user",
          },
        },
      };
    });
    const session = await startQuarkAuth("client-device");
    expect(new URL(session.url).searchParams.get("scope")).toBe(
      "clouddrive.base clouddrive.netdisk",
    );
    expect(session.pageCode).toBe("page");
    expect(await pollQuarkAuth(session.pageCode, session.clientDeviceId)).toEqual(auth);
    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls[0][0].data.device_name).toMatch(
      /^[\p{Script=Han}A-Za-z0-9 ]{1,20}$/u,
    );
    expect(new URL(request.mock.calls[2][0].url!).searchParams.get("agent_auth_code")).toBe("code");
  });

  it("refreshes expired tokens and persists the rotated pair", async () => {
    const onAuthChange = vi.fn();
    vi.spyOn(axios, "request").mockImplementation(async (config) => {
      const url = new URL(config.url!);
      if (url.pathname.endsWith("user/info") && url.searchParams.get("access_token") === "access")
        return { data: { status: -1, errno: 11001, error_info: "expired" } };
      if (url.pathname.endsWith("access_token/rotate"))
        return {
          data: { status: 0, data: { access_token: "new-access", refresh_token: "new-refresh" } },
        };
      return { data: { status: 0, data: { user_id: "user" } } };
    });
    const client = new Quark({ auth, onAuthChange });
    expect(await client.isLoggedIn()).toBe(true);
    expect(onAuthChange).toHaveBeenCalledWith({
      ...auth,
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
  });
});

describe("Quark upload", () => {
  it("reports upload_pre validation errors without exposing the access token", async () => {
    const localPath = await file(Buffer.from("ok"));
    const request = vi.spyOn(axios, "request").mockImplementation(async (config) => {
      const pathname = new URL(config.url!).pathname;
      if (pathname.endsWith("/user/info"))
        return { status: 200, data: { status: 0, data: { user_id: "user" } } };
      return {
        status: 400,
        data: { status: -1, errno: 14001, error_info: "device_name invalid" },
      };
    });
    const result = new Quark({ auth }).uploadFile(localPath);
    await expect(result).rejects.toThrow(/upload_pre: device_name invalid \(14001\)/);
    await expect(result).rejects.not.toThrow(/access_token|client-device/);
    expect(
      request.mock.calls.some(([config]) => new URL(config.url!).pathname.endsWith("/rotate")),
    ).toBe(false);
  });

  it("finds existing directories by filename and creates missing descendants", async () => {
    const localPath = await file(Buffer.from("ok"));
    const calls: { path: string; data: any }[] = [];
    vi.spyOn(axios, "request").mockImplementation(async (config) => {
      const pathname = new URL(config.url!).pathname;
      calls.push({ path: pathname, data: config.data });
      if (pathname.endsWith("/file/list")) {
        return {
          data: {
            status: 0,
            data: {
              file_list:
                config.data.parent_fid === "0"
                  ? [{ fid: "existing", filename: "Recordings", file_type: "0" }]
                  : [],
              last_page: true,
            },
          },
        };
      }
      if (pathname.endsWith("/dir")) return { data: { status: 0, data: { fid: "created" } } };
      if (pathname.endsWith("/user/info"))
        return { data: { status: 0, data: { user_id: "user" } } };
      return { data: { status: 0, data: { finish: true } } };
    });
    await new Quark({ auth, remotePath: "/Recordings/2026" }).uploadFile(localPath);
    expect(calls.find((call) => call.path.endsWith("/dir"))?.data).toEqual({
      dir_path: "2026",
      pdir_fid: "existing",
    });
    expect(calls.find((call) => call.path.endsWith("/file/upload_pre"))?.data.pdir_fid).toBe(
      "created",
    );
  });

  it("prepares parallel upload, reports hashes, signs part contexts, and commits OSS parts", async () => {
    const content = Buffer.alloc(69, 7);
    const localPath = await file(content);
    const calls: { path: string; data: any }[] = [];
    vi.spyOn(axios, "request").mockImplementation(async (config) => {
      const pathname = new URL(config.url!).pathname;
      calls.push({ path: pathname, data: config.data });
      if (pathname.endsWith("/file/upload_pre"))
        return {
          data: {
            status: 0,
            data: {
              task_id: "task",
              part_size: 64,
              common_headers: { "X-Oss-Date": "date", "X-Oss-Content-Sha256": "UNSIGNED-PAYLOAD" },
            },
          },
        };
      if (pathname.endsWith("/file/update/hash"))
        return { data: { status: 0, data: { finish: false } } };
      if (pathname.endsWith("/file/get_upload_urls"))
        return {
          data: {
            status: 0,
            data: {
              upload_urls: config.data.part_info_list.map((part: { part_number: number }) => ({
                part_number: part.part_number,
                upload_url: "https://oss.example.com/part",
                signature_info: { signature: "signed" },
              })),
            },
          },
        };
      if (pathname.endsWith("/file/upload_finish"))
        return { data: { status: 0, data: { finish: true } } };
      if (pathname.endsWith("/user/info"))
        return { data: { status: 0, data: { user_id: "user" } } };
      return { data: { status: 0, data: { file_list: [], last_page: true } } };
    });
    const uploaded = new Map<number, Buffer>();
    const put = vi
      .spyOn(quarkUpload, "putQuarkPart")
      .mockImplementation(async (_url, stream, config) => {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) chunks.push(chunk);
        uploaded.set(config.size, Buffer.concat(chunks));
        return '"etag"';
      });
    await new Quark({ auth }).uploadFile(localPath);
    expect(calls.map((call) => call.path)).toEqual([
      "/open/v1/user/info",
      "/open/v1/file/upload_pre",
      "/open/v1/file/update/hash",
      "/open/v1/file/get_upload_urls",
      "/open/v1/file/upload_finish",
    ]);
    expect(calls[1].data.proof_version).toBe("v1");
    expect(calls[1].data.device_name).toMatch(/^[\p{Script=Han}A-Za-z0-9 ]{1,20}$/u);
    expect(calls[1].data).toMatchObject({ parallel_upload: true, hash_update: true, sha1: "" });
    expect(calls[1].data.md5).toBeUndefined();
    expect(calls[2].data).toEqual({
      task_id: "task",
      sha1: createHash("sha1").update(content).digest("hex"),
      md5: createHash("md5").update(content).digest("hex"),
    });
    expect(calls[3].data.part_info_list).toEqual([
      { part_number: 1, part_size: 64 },
      {
        part_number: 2,
        part_size: 5,
        parallel_sha1_ctx: {
          part_offset: 64,
          h: [4060247101, 199602875, 971764049, 2007040865, 3511376091],
        },
      },
    ]);
    expect(Number.isInteger(calls[1].data.l_created_at)).toBe(true);
    expect(Number.isInteger(calls[1].data.l_updated_at)).toBe(true);
    expect(put.mock.calls.map((call) => call[2].size)).toEqual([64, 5]);
    expect(uploaded.get(64)).toEqual(content.subarray(0, 64));
    expect(uploaded.get(5)).toEqual(content.subarray(64));
    expect(put.mock.calls[0][2]?.headers?.Authorization).toBe("signed");
    expect(put.mock.calls[0][2]?.headers?.["X-Oss-Date"]).toBe("date");
    expect(put.mock.calls[0][2]?.headers?.["X-Oss-Content-Sha256"]).toBe("UNSIGNED-PAYLOAD");
    expect(put.mock.calls[0][2]?.headers?.["Content-Type"]).toBeUndefined();
    expect(calls.at(-1)?.data.part_info_list).toEqual([
      { part_number: 1, etag: '"etag"' },
      { part_number: 2, etag: '"etag"' },
    ]);
  });

  it("completes an instant upload after reporting hashes without starting any OSS parts", async () => {
    const content = Buffer.alloc(129, 7);
    const localPath = await file(content);
    const request = vi.spyOn(axios, "request").mockImplementation(async (config) => {
      const pathname = new URL(config.url!).pathname;
      if (pathname.endsWith("/user/info"))
        return { data: { status: 0, data: { user_id: "user" } } };
      if (pathname.endsWith("/upload_pre"))
        return { data: { status: 0, data: { task_id: "task", part_size: 64 } } };
      if (pathname.endsWith("/update/hash"))
        return { data: { status: 0, data: { finish: true, fid: "instant" } } };
      throw new Error(`Unexpected request: ${pathname}`);
    });
    const put = vi.spyOn(quarkUpload, "putQuarkPart");
    const progress = vi.fn();
    const client = new Quark({ auth });
    client.on("progress", progress);
    await client.uploadFile(localPath);
    expect(request).toHaveBeenCalledTimes(3);
    expect(put).not.toHaveBeenCalled();
    expect(progress.mock.lastCall![0].percentage).toBe(100);
  });
});
