import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Quark, pollQuarkAuth, signedHeaders, startQuarkAuth } from "../../src/sync/quark";

const dirs: string[] = [];
afterEach(async () => {
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

  it("uses upload_pre, signed OSS parts, and upload_finish", async () => {
    const localPath = await file(Buffer.alloc(5, 7));
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
              part_size: 3,
              common_headers: { "X-Oss-Date": "date", "X-Oss-Content-Sha256": "UNSIGNED-PAYLOAD" },
            },
          },
        };
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
    const put = vi.spyOn(axios, "put").mockResolvedValue({ headers: { etag: '"etag"' } });
    await new Quark({ auth }).uploadFile(localPath);
    expect(calls.map((call) => call.path)).toEqual([
      "/open/v1/user/info",
      "/open/v1/file/upload_pre",
      "/open/v1/file/get_upload_urls",
      "/open/v1/file/upload_finish",
    ]);
    expect(calls[1].data.proof_version).toBe("v1");
    expect(calls[1].data.device_name).toMatch(/^[\p{Script=Han}A-Za-z0-9 ]{1,20}$/u);
    expect(calls[1].data.sha1).toBe(createHash("sha1").update(Buffer.alloc(5, 7)).digest("hex"));
    expect(Number.isInteger(calls[1].data.l_created_at)).toBe(true);
    expect(Number.isInteger(calls[1].data.l_updated_at)).toBe(true);
    expect(put.mock.calls.map((call) => call[2]?.headers?.["Content-Length"])).toEqual([3, 2]);
    expect(put.mock.calls[0][2]?.headers?.Authorization).toBe("signed");
    expect(put.mock.calls[0][2]?.headers?.["X-Oss-Date"]).toBe("date");
    expect(put.mock.calls[0][2]?.headers?.["X-Oss-Content-Sha256"]).toBe("UNSIGNED-PAYLOAD");
    expect(put.mock.calls[0][2]?.headers?.["Content-Type"]).toBe(false);
    expect(calls.at(-1)?.data.part_info_list).toEqual([
      { part_number: 1, etag: '"etag"' },
      { part_number: 2, etag: '"etag"' },
    ]);
  });

  it("reports the OSS error code without exposing its signed URL", async () => {
    const localPath = await file(Buffer.from("ok"));
    vi.spyOn(axios, "request").mockImplementation(async (config) => {
      const pathname = new URL(config.url!).pathname;
      if (pathname.endsWith("/user/info"))
        return { data: { status: 0, data: { user_id: "user" } } };
      if (pathname.endsWith("/file/upload_pre"))
        return { data: { status: 0, data: { task_id: "task", part_size: 2 } } };
      return {
        data: {
          status: 0,
          data: {
            upload_urls: [
              {
                part_number: 1,
                upload_url: "https://oss.example.com/private-key",
                signature_info: { signature: "signed-secret" },
              },
            ],
            common_headers: { "X-Oss-Date": "date" },
          },
        },
      };
    });
    vi.spyOn(axios, "put").mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: "<Error><Code>SignatureDoesNotMatch</Code></Error>" },
    });
    const result = new Quark({ auth }).uploadFile(localPath);
    await expect(result).rejects.toThrow("夸克网盘分片 1 上传失败 (403, SignatureDoesNotMatch)");
    await expect(result).rejects.not.toThrow(/private-key|signed-secret/);
  });
});
