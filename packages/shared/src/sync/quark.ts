import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import axios from "axios";
import { TypedEmitter } from "tiny-typed-emitter";
import { SpeedCalculator } from "../utils/speedCalculator.js";
import { hashQuarkFile } from "./quarkHash.js";

import type { QuarkAuth } from "@biliLive-tools/types";
import type { ParallelSha1Context } from "./quarkHash.js";

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

const PAUSED = Symbol("quark-upload-paused");
class UploadSession {
  readonly controller = new AbortController();
  readonly requests = new Set<AbortController>();
  paused = false;
  finishing = false;
  generation = 0;
  onStateChange?: () => void;
  private resumed?: Promise<void>;
  private wake?: () => void;

  pause() {
    if (this.paused || this.finishing || this.controller.signal.aborted) return false;
    this.paused = true;
    this.generation++;
    this.resumed = new Promise((resolve) => {
      this.wake = resolve;
    });
    for (const request of this.requests) request.abort(PAUSED);
    this.onStateChange?.();
    return true;
  }

  resume() {
    if (!this.paused || this.controller.signal.aborted) return false;
    this.paused = false;
    this.wake?.();
    this.onStateChange?.();
    return true;
  }

  cancel(reason = new Error("夸克网盘上传已取消")) {
    this.controller.abort(reason);
    for (const request of this.requests) request.abort(reason);
    this.wake?.();
  }

  async wait() {
    this.controller.signal.throwIfAborted();
    while (this.paused) {
      await this.resumed;
      this.controller.signal.throwIfAborted();
    }
  }
}

type UploadPre = {
  finish?: boolean;
  task_id: string;
  part_size?: number;
  common_headers?: Record<string, string>;
};
type UploadUrls = {
  upload_urls: {
    part_number: number;
    upload_url: string;
    signature_info: { signature: string };
  }[];
  common_headers?: Record<string, string>;
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
  signal?: AbortSignal,
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
      signal,
    });
  } catch (error) {
    signal?.throwIfAborted();
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
  private session: UploadSession | null = null;
  private concurrency: number;
  private refreshing?: Promise<void>;

  constructor(options: {
    auth: QuarkAuth;
    remotePath?: string;
    onAuthChange?: (auth: QuarkAuth) => void;
    concurrency?: number;
  }) {
    super();
    this.auth = { ...options.auth };
    this.remotePath = options.remotePath || "/";
    this.onAuthChange = options.onAuthChange;
    this.concurrency = Number.isFinite(options.concurrency)
      ? Math.max(1, Math.min(10, Math.trunc(options.concurrency!)))
      : 3;
  }

  private async request<T>(
    method: "GET" | "POST",
    apiPath: string,
    body?: unknown,
    headers?: ReturnType<typeof signedHeaders>,
    signal?: AbortSignal,
  ): Promise<T> {
    const params = () => ({ access_token: this.auth.accessToken, device_id: this.auth.deviceId });
    try {
      return await apiRequest<T>(method, apiPath, params(), body, headers, signal);
    } catch (error) {
      if (!this.auth.refreshToken || !(error instanceof QuarkApiError && error.errno === 11001))
        throw error;
      await this.refresh();
      signal?.throwIfAborted();
      return apiRequest<T>(method, apiPath, params(), body, headers, signal);
    }
  }

  private async refresh() {
    this.refreshing ??= this.rotateToken().finally(() => {
      this.refreshing = undefined;
    });
    return this.refreshing;
  }

  private async rotateToken() {
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

  private async directory(parent: string, name: string, session: UploadSession): Promise<string> {
    let cursor: { version: string; token: string } | undefined;
    do {
      await session.wait();
      const data: {
        file_list?: FileItem[];
        last_page?: boolean;
        next_query_cursor?: { version: string; token: string };
      } = await this.request(
        "POST",
        "/open/v1/file/list",
        {
          parent_fid: parent,
          size: 100,
          sort: "file_name:asc",
          ...(cursor?.token ? { query_cursor: cursor } : {}),
        },
        undefined,
        session.controller.signal,
      );
      const match = data.file_list?.find(
        (item) =>
          (item.filename || item.file_name) === name &&
          (item.dir || String(item.file_type) === "0"),
      );
      if (match) return match.fid;
      cursor = data.last_page ? undefined : data.next_query_cursor;
    } while (cursor?.token);
    await session.wait();
    const created = await this.request<{ fid: string }>(
      "POST",
      "/open/v1/dir",
      {
        dir_path: name,
        pdir_fid: parent,
      },
      undefined,
      session.controller.signal,
    );
    return created.fid;
  }

  private async targetDirectory(remotePath: string, session: UploadSession): Promise<string> {
    let parent = "0";
    for (const name of remotePath.split("/").filter(Boolean))
      parent = await this.directory(parent, name, session);
    return parent;
  }

  public cancelUpload() {
    this.session?.cancel();
  }

  public pauseUpload() {
    return this.session?.pause() ?? false;
  }

  public resumeUpload() {
    return this.session?.resume() ?? false;
  }

  private async uploadParts(
    input: string,
    size: number,
    pre: UploadPre,
    partSize: number,
    partStates: Map<number, ParallelSha1Context>,
    session: UploadSession,
    assertUnchanged: () => Promise<void>,
  ) {
    const signal = session.controller.signal;
    const completed = new Map<number, string>();
    const inFlight = new Map<number, number>();
    const speed = new SpeedCalculator();
    let completedBytes = 0;
    const report = () => {
      const loaded = completedBytes + [...inFlight.values()].reduce((sum, bytes) => sum + bytes, 0);
      this.emit("progress", {
        percentage: size ? Math.min(99, (loaded / size) * 100) : 0,
        speed: session.paused ? "0.00 MB/s" : speed.calculateSpeed(loaded, Date.now()),
      });
    };
    session.onStateChange = () => {
      inFlight.clear();
      speed.reset();
      report();
    };

    const totalParts = Math.ceil(size / partSize);
    for (let first = 1; first <= totalParts; first += 100) {
      const batch = Array.from({ length: Math.min(100, totalParts - first + 1) }, (_, index) => {
        const part_number = first + index;
        const context = partStates.get(part_number);
        if (part_number > 1 && !context)
          throw new Error(`夸克网盘分片 ${part_number} 缺少并行 SHA-1 校验状态`);
        return {
          part_number,
          part_size: Math.min(partSize, size - (part_number - 1) * partSize),
          ...(context ? { parallel_sha1_ctx: context } : {}),
        };
      });
      let cached: UploadUrls | undefined;
      let cachedGeneration = -1;
      let loading: Promise<void> | undefined;
      const getUrl = async (part: number) => {
        while (true) {
          await session.wait();
          if (cachedGeneration === session.generation && cached) {
            const target = cached.upload_urls.find((item) => item.part_number === part);
            if (!target) throw new Error(`夸克网盘未返回分片 ${part} 的上传地址`);
            return {
              target,
              headers: cached.common_headers || pre.common_headers,
              generation: cachedGeneration,
            };
          }
          // All workers share one URL request. Resume invalidates every unused signed URL.
          loading ??= (async () => {
            await assertUnchanged();
            await session.wait();
            const generation = session.generation;
            const result = await this.request<UploadUrls>(
              "POST",
              "/open/v1/file/get_upload_urls",
              {
                task_id: pre.task_id,
                part_info_list: batch.filter((part) => !completed.has(part.part_number)),
              },
              undefined,
              signal,
            );
            if (generation === session.generation) {
              cached = result;
              cachedGeneration = generation;
            }
          })().finally(() => {
            loading = undefined;
          });
          await loading;
        }
      };

      let next = 0;
      const worker = async () => {
        try {
          while (next < batch.length) {
            const { part_number, part_size } = batch[next++];
            while (true) {
              const url = await getUrl(part_number);
              if (session.paused || url.generation !== session.generation) continue;
              signal.throwIfAborted();
              const request = new AbortController();
              session.requests.add(request);
              const start = (part_number - 1) * partSize;
              const stream = fs.createReadStream(input, {
                start,
                end: start + part_size - 1,
                signal: request.signal,
              });
              try {
                const response = await axios.put(url.target.upload_url, stream, {
                  signal: request.signal,
                  headers: {
                    "Content-Type": false,
                    ...url.headers,
                    Authorization: url.target.signature_info.signature,
                    "Content-Length": part_size,
                  },
                  maxBodyLength: Infinity,
                  timeout: 120000,
                  onUploadProgress: ({ loaded }) => {
                    if (
                      request.signal.aborted ||
                      session.paused ||
                      completed.has(part_number) ||
                      !session.requests.has(request)
                    )
                      return;
                    inFlight.set(part_number, Math.min(loaded, part_size));
                    report();
                  },
                });
                signal.throwIfAborted();
                const etag = response.headers.etag;
                if (!etag) throw new Error(`夸克网盘上传分片 ${part_number} 后未返回 ETag`);
                completed.set(part_number, etag);
                completedBytes += part_size;
                inFlight.delete(part_number);
                report();
                break;
              } catch (error) {
                signal.throwIfAborted();
                // Pause aborts only the current PUT, keeping this worker and the upload task alive.
                if (request.signal.reason === PAUSED) continue;
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
              } finally {
                stream.destroy();
                session.requests.delete(request);
                inFlight.delete(part_number);
              }
            }
          }
        } catch (error) {
          session.cancel(error instanceof Error ? error : new Error(String(error)));
          throw error;
        }
      };
      // Drain aborted workers before releasing the session, so a retry cannot overlap this run.
      await Promise.allSettled(
        Array.from({ length: Math.min(this.concurrency, batch.length) }, worker),
      );
      signal.throwIfAborted();
    }
    session.onStateChange = undefined;
    return [...completed]
      .sort(([a], [b]) => a - b)
      .map(([part_number, etag]) => ({ part_number, etag }));
  }

  public async uploadFile(
    input: string,
    output = "",
    options: { retry?: number; policy?: string } = {},
  ) {
    if (this.session) throw new Error("夸克网盘已有上传任务正在进行");
    const session = new UploadSession();
    this.session = session;
    const signal = session.controller.signal;
    try {
      const stat = await fsp.stat(input);
      if (!stat.isFile()) throw new Error("夸克网盘上传源必须是文件");
      const assertUnchanged = async () => {
        const current = await fsp.stat(input);
        if (current.size !== stat.size || current.mtimeMs !== stat.mtimeMs)
          throw new Error("上传期间源文件发生变化，请重新创建上传任务");
      };
      const parent = await this.targetDirectory(output || this.remotePath, session);
      await session.wait();
      await assertUnchanged();
      const user = await this.request<{ user_id: string }>(
        "GET",
        "/open/v1/user/info",
        undefined,
        undefined,
        signal,
      );
      if (!user.user_id) throw new Error("夸克网盘授权信息缺少用户 ID");
      if (user.user_id !== this.auth.userId) {
        this.auth = { ...this.auth, userId: user.user_id };
        this.onAuthChange?.({ ...this.auth });
      }
      await session.wait();
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
      const pre = await this.request<UploadPre>(
        "POST",
        "/open/v1/file/upload_pre",
        {
          file_name: path.basename(input),
          size: stat.size,
          // The server chooses part_size. Hash after pre-upload so every parallel
          // part can carry the SHA-1 state at its exact starting offset.
          sha1: "",
          parallel_upload: true,
          hash_update: true,
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
        signal,
      );
      await session.wait();
      if (pre.finish) {
        await assertUnchanged();
        await session.wait();
        session.finishing = true;
        this.emit("progress", { percentage: 100, speed: "0 MB/s" });
        return;
      }
      if (!pre.task_id || !Number.isSafeInteger(pre.part_size) || pre.part_size! <= 0)
        throw new Error("夸克网盘未返回有效的上传任务或分片大小");
      const {
        sha1,
        md5: fileMd5,
        partStates,
      } = await hashQuarkFile(input, stat.size, pre.part_size!, {
        signal,
        wait: () => session.wait(),
      });
      await assertUnchanged();
      await session.wait();
      const updated = await this.request<{ finish?: boolean }>(
        "POST",
        "/open/v1/file/update/hash",
        { task_id: pre.task_id, sha1, md5: fileMd5 },
        undefined,
        signal,
      );
      await session.wait();
      if (updated.finish) {
        await assertUnchanged();
        await session.wait();
        session.finishing = true;
        this.emit("progress", { percentage: 100, speed: "0 MB/s" });
        return;
      }
      const parts = await this.uploadParts(
        input,
        stat.size,
        pre,
        pre.part_size!,
        partStates,
        session,
        assertUnchanged,
      );
      await session.wait();
      await assertUnchanged();
      await session.wait();
      session.finishing = true;
      const finished = await this.request<{ finish: boolean }>(
        "POST",
        "/open/v1/file/upload_finish",
        {
          task_id: pre.task_id,
          part_info_list: parts,
        },
        undefined,
        signal,
      );
      signal.throwIfAborted();
      if (!finished.finish) throw new Error("夸克网盘未确认上传完成");
      this.emit("progress", { percentage: 100, speed: "0 MB/s" });
    } finally {
      session.onStateChange = undefined;
      this.session = null;
    }
  }
}
