import http from "node:http";
import { once } from "node:events";
import axios, { AxiosError, AxiosHeaders } from "axios";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/utils/log.js", () => ({ default: {} }));

import { AliyunASR } from "../../src/ai/asr/aliyun.js";

import type { AddressInfo } from "node:net";

const apiKey = "sk-test-secret";
const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() };
let reply: { status: number; body: unknown; headers?: Record<string, string> };
const server = http.createServer(async (request, response) => {
  for await (const _chunk of request) {
    // 完整消费请求体，让真实 Axios HTTP 请求正常完成。
  }
  response.writeHead(reply.status, { "Content-Type": "application/json", ...reply.headers });
  response.end(typeof reply.body === "string" ? reply.body : JSON.stringify(reply.body));
});

let baseURL: string;
beforeAll(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

beforeEach(() => {
  vi.clearAllMocks();
  reply = {
    status: 403,
    body: {
      code: "Model.AccessDenied",
      message: "Model access denied.",
      request_id: "request-123",
    },
  };
});

afterEach(() => vi.restoreAllMocks());

afterAll(async () => {
  const closed = once(server, "close");
  server.close();
  server.closeAllConnections();
  await closed;
});

function createASR() {
  return new AliyunASR({ apiKey, baseURL, logger });
}

describe("阿里云 ASR 错误诊断", () => {
  it.each(["submit", "query", "upload-policy", "download"])(
    "%s 失败时保留服务端错误信息，不暴露请求鉴权配置",
    async (stage) => {
      const asr = createASR();
      const operation =
        stage === "submit"
          ? asr.submitTask({ fileUrl: "oss://private/audio.mp3" })
          : stage === "query"
            ? asr.queryTask("task-id")
            : stage === "upload-policy"
              ? asr.uploadToTmpfiles("audio.mp3")
              : asr.downloadTranscription(`${baseURL}/result`);
      const error = await operation.catch((error) => error);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain("HTTP 403");
      expect(error.message).toContain("Model.AccessDenied");
      expect(error.message).toContain("Model access denied.");
      expect(error.message).toContain("request-123");
      expect(error).not.toHaveProperty("config");
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 403,
          code: "Model.AccessDenied",
          message: "Model access denied.",
          requestId: "request-123",
        }),
      );
      expect(JSON.stringify(logger.error.mock.calls)).not.toContain(apiKey);
      expect(JSON.stringify(logger.error.mock.calls)).not.toContain("Authorization");
    },
  );

  it("响应正文无 request_id 时从响应头补充", async () => {
    reply.body = { code: "AccessDenied", message: "Access denied." };
    reply.headers = { "x-request-id": "header-request-id" };

    await expect(createASR().submitTask({ fileUrl: "oss://audio.mp3" })).rejects.toThrow(
      "header-request-id",
    );
  });

  it("非 JSON 响应也显示服务端文本", async () => {
    reply.body = "Forbidden by gateway";
    reply.headers = { "Content-Type": "text/plain" };

    await expect(createASR().submitTask({ fileUrl: "oss://audio.mp3" })).rejects.toThrow(
      "Forbidden by gateway",
    );
  });

  it("服务端错误正文回显 API Key 时也会脱敏", async () => {
    reply.body = { code: "InvalidApiKey", message: `Invalid API Key: ${apiKey}` };
    const error = await createASR()
      .submitTask({ fileUrl: "oss://audio.mp3" })
      .catch((error) => error);

    expect(error.message).toContain("[REDACTED]");
    expect(error.message).not.toContain(apiKey);
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(apiKey);
  });

  it("无 HTTP 响应时保留网络错误信息", async () => {
    vi.spyOn(axios.Axios.prototype, "request").mockRejectedValueOnce(
      new AxiosError("socket hang up", "ECONNRESET", {
        headers: new AxiosHeaders({ Authorization: `Bearer ${apiKey}` }),
      }),
    );

    await expect(createASR().submitTask({ fileUrl: "oss://audio.mp3" })).rejects.toThrow(
      "提交ASR任务失败（ECONNRESET）：socket hang up",
    );
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(apiKey);
  });

  it("普通异常保持原始错误对象", async () => {
    const error = new Error("普通错误");
    vi.spyOn(axios.Axios.prototype, "request").mockRejectedValueOnce(error);

    await expect(createASR().submitTask({ fileUrl: "oss://audio.mp3" })).rejects.toBe(error);
  });

  it("成功提交任务时仍返回任务 ID", async () => {
    reply = { status: 200, body: { output: { task_id: "task-123" } } };

    expect(await createASR().submitTask({ fileUrl: "oss://audio.mp3" })).toBe("task-123");
    expect(logger.error).not.toHaveBeenCalled();
  });
});
