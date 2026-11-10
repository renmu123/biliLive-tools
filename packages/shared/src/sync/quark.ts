import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import axios from "axios";
import { TypedEmitter } from "tiny-typed-emitter";

import type { QuarkAuth } from "@biliLive-tools/types";

const API = "https://open-api-drive.quark.cn";
// Public third-party client credentials distributed with the official CLI.
const CLIENT_ID = "third_party_agent";
const SIGN_KEY = "cf134812e2de4032bd1cb7c3727e84b3";
const AGENT_ID = "bililive-tools";
const DEVICE_NAME = "Windows";
const SCOPE = "clouddrive.base clouddrive.netdisk";
const md5 = (value: string) => createHash("md5").update(value).digest("hex");
const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mkv": "video/x-matroska",
  ".flv": "video/x-flv",
  ".ts": "video/mp2t",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".xml": "application/xml",
  ".json": "application/json",
  ".txt": "text/plain",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

interface QuarkEvents {
  progress: (value: { percentage: number; speed: string }) => void;
  error: (error: Error) => void;
  success: (message: string) => void;
  canceled: (message: string) => void;
}
type Envelope<T> = {
  status: number;
  errno?: number;
  error_info?: string;
  agent_msg?: string;
  data: T;
};
class QuarkApiError extends Error {
  constructor(
    message: string,
    readonly errno?: number,
  ) {
    super(message);
  }
}
type FileItem = {
  fid: string;
  filename?: string;
  file_name?: string;
  dir?: boolean;
  file_type?: number | string;
};

export function signedHeaders(method: string, apiPath: string, timestamp = String(Date.now())) {
  return {
    "x-pan-client-id": CLIENT_ID,
    "x-pan-tm": timestamp,
    "x-pan-token": createHash("sha256")
      .update(`${method.toUpperCase()}&${apiPath}&${timestamp}&${SIGN_KEY}`)
      .digest("hex"),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function apiRequest<T>(
  method: "GET" | "POST",
  apiPath: string,
  params: Record<string, string> = {},
  body?: unknown,
  headers = signedHeaders(method, apiPath),
): Promise<T> {
  const url = new URL(apiPath, API);
  url.searchParams.set("req_id", randomUUID());
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  let response;
  try {
    response = await axios.request<Envelope<T>>({
      url: url.toString(),
      method,
      headers,
      data: body,
      timeout: 30000,
      validateStatus: () => true,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`夸克网盘 ${apiPath} 请求失败 (${error.code || "网络错误"})`);
    }
    throw error;
  }
  const result = response.data;
  if (response.status >= 400 || result?.status !== 0 || !result.data) {
    throw new QuarkApiError(
      `夸克网盘 ${apiPath}: ${result?.agent_msg || result?.error_info || "接口错误"} (${result?.errno ?? response.status})`,
      result?.errno,
    );
  }
  return result.data;
}

export async function startQuarkAuth(clientDeviceId = randomUUID()) {
  const data = await apiRequest<{
    authorize_page_url: string;
    page_code: string;
    device_id: string;
  }>(
    "POST",
    "/agent/v1/get_authorize_page_url",
    {},
    {
      client_device_id: clientDeviceId,
      device_name: DEVICE_NAME,
      agent_id: AGENT_ID,
      client_id: CLIENT_ID,
      work_dir: "",
      is_cloud_agent: "false",
      is_unsure_agent: "false",
    },
  );
  const url = new URL(data.authorize_page_url);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("redirect_uri", "");
  if (!url.searchParams.has("device_id")) url.searchParams.set("device_id", data.device_id);
  url.searchParams.set("client_device_id", clientDeviceId);
  url.searchParams.set("device_name", DEVICE_NAME);
  url.searchParams.set("agent_id", AGENT_ID);
  return { url: url.toString(), pageCode: data.page_code, clientDeviceId };
}

export async function pollQuarkAuth(
  pageCode: string,
  clientDeviceId: string,
): Promise<QuarkAuth | null> {
  const pending = await apiRequest<{ status: string; agent_auth_code?: string }>(
    "GET",
    "/agent/v1/oauth/get_aac_by_pagecode",
    { page_code: pageCode },
  );
  if (!pending.agent_auth_code) return null;
  const token = await apiRequest<{
    status: number;
    access_token: string;
    refresh_token: string;
    device_id: string;
    user_id: string;
  }>("GET", "/agent/v1/oauth/agent_auth_code", {
    agent_auth_code: pending.agent_auth_code,
    client_device_id: clientDeviceId,
    device_name: DEVICE_NAME,
    agent_id: AGENT_ID,
    work_dir: "",
  });
  if (!token.access_token || !token.refresh_token) throw new Error("夸克网盘未返回完整的授权令牌");
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    deviceId: token.device_id,
    userId: token.user_id,
    clientDeviceId,
  };
}

async function fileHashes(file: string, signal: AbortSignal) {
  const sha1 = createHash("sha1");
  const digest = createHash("md5");
  for await (const chunk of fs.createReadStream(file, { signal })) {
    sha1.update(chunk as Buffer);
    digest.update(chunk as Buffer);
  }
  return { sha1: sha1.digest("hex"), md5: digest.digest("hex") };
}

async function proofCode(handle: fsp.FileHandle, size: number, seed: string) {
  if (!size) return "";
  const start = Number(BigInt(`0x${seed.slice(0, 16)}`) % BigInt(size));
  const length = Math.min(8, size - start);
  const data = Buffer.alloc(length);
  await handle.read(data, 0, length, start);
  return data.toString("base64");
}

export class Quark extends TypedEmitter<QuarkEvents> {
  private auth: QuarkAuth;
  private remotePath: string;
  private onAuthChange?: (auth: QuarkAuth) => void;
  private abortController: AbortController | null = null;

  constructor(options: {
    auth: QuarkAuth;
    remotePath?: string;
    onAuthChange?: (auth: QuarkAuth) => void;
  }) {
    super();
    this.auth = { ...options.auth };
    this.remotePath = options.remotePath || "/";
    this.onAuthChange = options.onAuthChange;
  }

  private async request<T>(
    method: "GET" | "POST",
    apiPath: string,
    body?: unknown,
    headers?: ReturnType<typeof signedHeaders>,
  ): Promise<T> {
    const params = () => ({ access_token: this.auth.accessToken, device_id: this.auth.deviceId });
    try {
      return await apiRequest<T>(method, apiPath, params(), body, headers);
    } catch (error) {
      if (!this.auth.refreshToken || !(error instanceof QuarkApiError && error.errno === 11001))
        throw error;
      await this.refresh();
      return apiRequest<T>(method, apiPath, params(), body);
    }
  }

  private async refresh() {
    const data = await apiRequest<{ access_token: string; refresh_token: string }>(
      "POST",
      "/agent/v1/oauth/access_token/rotate",
      {},
      { refresh_token: this.auth.refreshToken, device_id: this.auth.deviceId },
    );
    this.auth = { ...this.auth, accessToken: data.access_token, refreshToken: data.refresh_token };
    this.onAuthChange?.({ ...this.auth });
  }

  public async isLoggedIn(): Promise<boolean> {
    if (!this.auth.accessToken) return false;
    try {
      const info = await this.request<{ user_id?: string }>("GET", "/open/v1/user/info");
      if (info.user_id && info.user_id !== this.auth.userId) {
        this.auth = { ...this.auth, userId: info.user_id };
        this.onAuthChange?.({ ...this.auth });
      }
      return !!info.user_id;
    } catch {
      return false;
    }
  }

  private async directory(parent: string, name: string): Promise<string> {
    let cursor: { version: string; token: string } | undefined;
    do {
      const data: {
        file_list?: FileItem[];
        last_page?: boolean;
        next_query_cursor?: { version: string; token: string };
      } = await this.request("POST", "/open/v1/file/list", {
        parent_fid: parent,
        size: 100,
        sort: "file_name:asc",
        ...(cursor?.token ? { query_cursor: cursor } : {}),
      });
      const match = data.file_list?.find(
        (item) =>
          (item.filename || item.file_name) === name &&
          (item.dir || String(item.file_type) === "0"),
      );
      if (match) return match.fid;
      cursor = data.last_page ? undefined : data.next_query_cursor;
    } while (cursor?.token);
    const created = await this.request<{ fid: string }>("POST", "/open/v1/dir", {
      dir_path: name,
      pdir_fid: parent,
    });
    return created.fid;
  }

  private async targetDirectory(remotePath: string): Promise<string> {
    let parent = "0";
    for (const name of remotePath.split("/").filter(Boolean))
      parent = await this.directory(parent, name);
    return parent;
  }

  public cancelUpload() {
    this.abortController?.abort();
  }

  public async uploadFile(
    input: string,
    output = "",
    options: { retry?: number; policy?: string } = {},
  ) {
    const controller = new AbortController();
    this.abortController = controller;
    const { signal } = controller;
    try {
      const stat = await fsp.stat(input);
      const parent = await this.targetDirectory(output || this.remotePath);
      const digests = await fileHashes(input, signal);
      const user = await this.request<{ user_id: string }>("GET", "/open/v1/user/info");
      if (!user.user_id) throw new Error("夸克网盘授权信息缺少用户 ID");
      if (user.user_id !== this.auth.userId) {
        this.auth = { ...this.auth, userId: user.user_id };
        this.onAuthChange?.({ ...this.auth });
      }
      const headers = signedHeaders("POST", "/open/v1/file/upload_pre");
      const seed1 = md5(md5(this.auth.userId + headers["x-pan-token"]));
      const seed2 = md5(md5(String(stat.size)));
      const handle = await fsp.open(input, "r");
      let codes: [string, string];
      try {
        codes = [
          await proofCode(handle, stat.size, seed1),
          await proofCode(handle, stat.size, seed2),
        ];
      } finally {
        await handle.close();
      }
      const pre = await this.request<{
        finish?: boolean;
        task_id: string;
        part_size?: number;
        common_headers?: Record<string, string>;
      }>(
        "POST",
        "/open/v1/file/upload_pre",
        {
          file_name: path.basename(input),
          size: stat.size,
          sha1: digests.sha1,
          md5: digests.md5,
          pdir_fid: parent,
          format_type:
            CONTENT_TYPES[path.extname(input).toLowerCase()] || "application/octet-stream",
          l_created_at: Math.trunc(stat.birthtimeMs),
          l_updated_at: Math.trunc(stat.mtimeMs),
          same_path_file_reuse: options.policy !== "newcopy",
          same_path_reuse: options.policy !== "newcopy",
          device_id: this.auth.deviceId,
          device_name: DEVICE_NAME,
          agent_id: AGENT_ID,
          proof_version: "v1",
          proof_seed1: seed1,
          proof_seed2: seed2,
          proof_code1: codes[0],
          proof_code2: codes[1],
        },
        headers,
      );
      if (pre.finish) {
        this.emit("progress", { percentage: 100, speed: "0 MB/s" });
        return;
      }
      if (!pre.task_id || !pre.part_size) throw new Error("夸克网盘未返回上传任务或分片大小");
      const parts: { part_number: number; etag: string }[] = [];
      const started = Date.now();
      let uploaded = 0;
      const totalParts = Math.ceil(stat.size / pre.part_size);
      for (let first = 1; first <= totalParts; first += 100) {
        signal.throwIfAborted();
        const batch = Array.from({ length: Math.min(100, totalParts - first + 1) }, (_, index) => {
          const part_number = first + index;
          return {
            part_number,
            part_size: Math.min(pre.part_size!, stat.size - (part_number - 1) * pre.part_size!),
          };
        });
        const urls = await this.request<{
          upload_urls: {
            part_number: number;
            upload_url: string;
            signature_info: { signature: string };
          }[];
          common_headers?: Record<string, string>;
        }>("POST", "/open/v1/file/get_upload_urls", {
          task_id: pre.task_id,
          part_info_list: batch,
        });
        for (const { part_number, part_size } of batch) {
          signal.throwIfAborted();
          const target = urls.upload_urls.find((item) => item.part_number === part_number);
          if (!target) throw new Error(`夸克网盘未返回分片 ${part_number} 的上传地址`);
          const start = (part_number - 1) * pre.part_size;
          const stream = fs.createReadStream(input, { start, end: start + part_size - 1, signal });
          let response;
          try {
            response = await axios.put(target.upload_url, stream, {
              signal,
              headers: {
                ...(urls.common_headers || pre.common_headers),
                Authorization: target.signature_info.signature,
                "Content-Type": false,
                "Content-Length": part_size,
              },
              maxBodyLength: Infinity,
              timeout: 120000,
            });
          } catch (error) {
            if (axios.isAxiosError(error)) {
              const data = error.response?.data;
              const xml =
                typeof data === "string"
                  ? data
                  : Buffer.isBuffer(data)
                    ? data.toString("utf8")
                    : "";
              const ossCode = /<Code>([A-Za-z0-9_-]+)<\/Code>/.exec(xml)?.[1];
              throw new Error(
                `夸克网盘分片 ${part_number} 上传失败 (${error.response?.status || error.code || "网络错误"}${ossCode ? `, ${ossCode}` : ""})`,
              );
            }
            throw error;
          }
          const etag = response.headers.etag;
          if (!etag) throw new Error(`夸克网盘上传分片 ${part_number} 后未返回 ETag`);
          parts.push({ part_number, etag });
          uploaded += part_size;
          const elapsed = Math.max(1, Date.now() - started);
          this.emit("progress", {
            percentage: Math.round((uploaded / stat.size) * 100),
            speed: `${(((uploaded / elapsed) * 1000) / 1048576).toFixed(2)} MB/s`,
          });
        }
      }
      const finished = await this.request<{ finish: boolean }>(
        "POST",
        "/open/v1/file/upload_finish",
        {
          task_id: pre.task_id,
          part_info_list: parts,
        },
      );
      if (!finished.finish) throw new Error("夸克网盘未确认上传完成");
    } finally {
      this.abortController = null;
    }
  }
}
