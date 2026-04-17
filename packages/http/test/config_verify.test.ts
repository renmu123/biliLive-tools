import { expect, describe, it, vi, beforeEach } from "vitest";

// 模拟所有外部依赖，防止由于缺失 node_modules 导致导入失败
vi.mock("@koa/cors", () => ({ default: () => {} }));
vi.mock("@koa/bodyparser", () => ({ bodyParser: () => {} }));
vi.mock("@biliLive-tools/shared/utils/log.js", () => ({ default: { info: vi.fn(), error: vi.fn() } }));
vi.mock("koa", () => ({ default: class Koa {} }));
vi.mock("@koa/router", () => {
  return {
    default: class Router {
      stack: any[] = [];
      prefix: string = "";
      constructor(opts?: any) {
        this.prefix = opts?.prefix || "";
      }
      post(path: string, ...stack: any[]) {
        this.stack.push({ path: (this.prefix + path).replace(/\/+/g, "/"), methods: ["POST"], stack });
      }
      get(path: string, ...stack: any[]) {
        this.stack.push({ path: (this.prefix + path).replace(/\/+/g, "/"), methods: ["GET"], stack });
      }
    }
  };
});
vi.mock("fs-extra", () => ({ default: {} }));
vi.mock("jszip", () => ({ default: {} }));
vi.mock("../src/middleware/multer.js", () => ({ default: () => ({ single: () => (ctx, next) => next() }) }));
vi.mock("@biliLive-tools/shared/notify.js", () => ({ _send: vi.fn() }));
vi.mock("@biliLive-tools/shared/utils/index.js", () => ({ getTempPath: vi.fn() }));
vi.mock("@biliLive-tools/shared/db/index.js", () => ({ reconnectDB: vi.fn(), backupDB: vi.fn(), closeDB: vi.fn() }));
vi.mock("../src/index.js", () => ({ appConfig: {}, container: { resolve: vi.fn() } }));
vi.mock("../src/routes/webhook.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/assets.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/llm.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/user.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/common.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/preset.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/recorder.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/bili.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/task.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/video.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/recordHistory.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/danma.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/sync.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/ai.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/routes/sse.js", () => ({ default: { routes: () => (ctx, next) => next() } }));
vi.mock("../src/middleware/error.js", () => ({ default: (ctx, next) => next() }));
vi.mock("../src/services/webhook/webhook.js", () => ({ WebhookHandler: class {} }));
vi.mock("../src/services/fileCache.js", () => ({ createFileCache: () => ({}) }));
vi.mock("../src/middleware/multer.js", () => ({ default: () => ({ single: () => (ctx, next) => next() }) }));

import router from "../src/routes/config.js";

describe("POST /config/verifyBiliKey", () => {
  let ctx: any;

  beforeEach(() => {
    vi.resetModules();
    // 模拟 Koa context
    ctx = {
      request: {
        body: {}
      },
      body: null,
      status: 200
    };
    // 清理环境变量
    delete process.env.BILILIVE_TOOLS_BILIKEY;
  });

  it("当 BILILIVE_TOOLS_BILIKEY 未配置时，应返回 configured: false 和 reason: missing", async () => {
    const handler = router.stack.find(s => s.path === "/config/verifyBiliKey" && s.methods.includes("POST"))?.stack[0];
    expect(handler).toBeDefined();

    await handler(ctx, async () => {});

    expect(ctx.body).toEqual({
      configured: false,
      valid: false,
      matched: false,
      reason: "missing",
    });
  });

  it("当输入正确的 Key 时，应返回 matched: true 和 reason: ok", async () => {
    const secretKey = "correct-key-123";
    process.env.BILILIVE_TOOLS_BILIKEY = secretKey;
    ctx.request.body = { key: secretKey };

    const handler = router.stack.find(s => s.path === "/config/verifyBiliKey" && s.methods.includes("POST"))?.stack[0];
    await handler(ctx, async () => {});

    expect(ctx.body).toEqual({
      configured: true,
      valid: true,
      matched: true,
      reason: "ok",
    });
  });

  it("当输入错误的 Key 时，应返回 matched: false 和 reason: mismatch", async () => {
    process.env.BILILIVE_TOOLS_BILIKEY = "server-key";
    ctx.request.body = { key: "wrong-key" };

    const handler = router.stack.find(s => s.path === "/config/verifyBiliKey" && s.methods.includes("POST"))?.stack[0];
    await handler(ctx, async () => {});

    expect(ctx.body).toEqual({
      configured: true,
      valid: false,
      matched: false,
      reason: "mismatch",
    });
  });

  it("响应体中不应包含 BILILIVE_TOOLS_BILIKEY 的真实值", async () => {
    const secretKey = "SUPER_SECRET_TOKEN";
    process.env.BILILIVE_TOOLS_BILIKEY = secretKey;
    ctx.request.body = { key: "any-input" };

    const handler = router.stack.find(s => s.path === "/config/verifyBiliKey" && s.methods.includes("POST"))?.stack[0];
    await handler(ctx, async () => {});

    const responseString = JSON.stringify(ctx.body);
    expect(responseString).not.toContain(secretKey);
  });

  it("当处理过程中抛出异常时，应返回 reason: error", async () => {
    // 通过 mock 制造异常，例如让 ctx.request 为空导致读取 ctx.request.body 报错
    const faultyCtx = {
      get request() {
        throw new Error("Simulated Error");
      },
      body: null
    };

    const handler = router.stack.find(s => s.path === "/config/verifyBiliKey" && s.methods.includes("POST"))?.stack[0];
    await handler(faultyCtx, async () => {});

    expect(faultyCtx.body).toEqual({
      configured: false,
      valid: false,
      matched: false,
      reason: "error",
    });
  });

  it("应对输入进行 trim 处理", async () => {
    const secretKey = "key";
    process.env.BILILIVE_TOOLS_BILIKEY = secretKey;
    ctx.request.body = { key: "  key  " };

    const handler = router.stack.find(s => s.path === "/config/verifyBiliKey" && s.methods.includes("POST"))?.stack[0];
    await handler(ctx, async () => {});

    expect(ctx.body.matched).toBe(true);
    expect(ctx.body.reason).toBe("ok");
  });
});
