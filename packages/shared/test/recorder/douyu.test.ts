import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { appConfig } from "../../src/config.js";
import {
  deleteDouyuUser,
  DouyuQrcodeLogin,
  readDouyuUser,
  readDouyuUserList,
  writeDouyuUser,
} from "../../src/recorder/douyu.js";

const jsonResponse = (data: unknown, cookies: string[] = []) => {
  const headers = new Headers({ "content-type": "application/json" });
  cookies.forEach((cookie) => headers.append("set-cookie", cookie));
  return new Response(JSON.stringify(data), { status: 200, headers });
};

const textResponse = (data: string, cookies: string[] = []) => {
  const headers = new Headers();
  cookies.forEach((cookie) => headers.append("set-cookie", cookie));
  return new Response(data, { status: 200, headers });
};

describe("DouyuQrcodeLogin", () => {
  let tempDir: string;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "douyu-login-test-"));
    appConfig.init(path.join(tempDir, "config.json"), { douyuUser: {} });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("按 passport、main 两组获取并保存全部 Cookie", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: 0,
            data: {
              code: "qr-code",
              expire: 120,
              url: "https://passport.douyu.com/scan/checkLogin?scan_code=qr-code",
            },
          },
          ["generate_extra=generate-value; Path=/"],
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ error: -2, msg: "等待扫码" }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: 0,
            data: { url: "https://www.douyu.com/api/passport/login?code=token&uid=123" },
          },
          [
            "LTP0=passport-token; Path=/",
            "dy_accounts_main=1; Path=/",
            "passport_extra=passport-value; Path=/",
          ],
        ),
      )
      .mockResolvedValueOnce(
        textResponse('appClient_json_callback({"error":0,"data":{"nickname":"测试用户"}})', [
          "acf_uid=123; Path=/",
          "acf_username=123; Path=/",
          "acf_auth=main-auth; Path=/",
          "dy_auth=dy-auth; Path=/",
          "acf_stk=main-stk; Path=/",
          "acf_ltkid=456; Path=/",
          "acf_biz=1; Path=/",
          "acf_ct=0; Path=/",
          "main_extra=main-value; Path=/",
        ]),
      );
    globalThis.fetch = fetchMock;

    const login = await DouyuQrcodeLogin.create();
    expect(login.url).toContain("scan_code=qr-code");
    await expect(login.poll()).resolves.toEqual({ status: "scan" });
    const result = await login.poll();
    expect(result.status).toBe("completed");
    if (result.status === "completed") {
      expect(result.user).toMatchObject({ uid: 123, name: "测试用户" });
      expect(result.user.loginCookies.passport).toContain("LTP0=passport-token");
      expect(result.user.loginCookies.passport).toContain("generate_extra=generate-value");
      expect(result.user.loginCookies.passport).toContain("passport_extra=passport-value");
      expect(result.user.loginCookies.passport).toMatch(/dy_did=b[a-z0-9]{31}/);
      expect(result.user.loginCookies.main).toContain("acf_auth=main-auth");
      expect(result.user.loginCookies.main).toContain("acf_uid=123");
      expect(result.user.loginCookies.main).toContain("main_extra=main-value");
      expect(result.user.loginCookies.main).not.toContain("LTP0=");
    }

    const generateHeaders = fetchMock.mock.calls[0][1].headers;
    expect(generateHeaders.cookie).toMatch(/dy_did=b[a-z0-9]{31}/);
    expect(String(fetchMock.mock.calls[0][1].body)).toContain("isMultiAccount=0");
    expect(fetchMock.mock.calls[1][0]).toContain("/japi/scan/auth");
    expect(fetchMock.mock.calls[3][1].headers.get("cookie")).toContain("LTP0=passport-token");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("处理生成失败、取消以及主站 UID 缺失", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(jsonResponse({ error: 2, msg: "繁忙" }));
    await expect(DouyuQrcodeLogin.create()).rejects.toThrow("繁忙");

    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        error: 0,
        data: { code: "code", expire: 120, url: "https://passport.douyu.com/scan/test" },
      }),
    );
    const cancelled = await DouyuQrcodeLogin.create();
    cancelled.cancel();
    await expect(cancelled.poll()).resolves.toEqual({ status: "error", failReason: "登录已取消" });

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          error: 0,
          data: { code: "code", expire: 120, url: "https://passport.douyu.com/scan/test" },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: 0,
            data: { url: "https://www.douyu.com/api/passport/login?uid=1" },
          },
          ["LTP0=passport-token; Path=/"],
        ),
      )
      .mockResolvedValueOnce(
        textResponse('appClient_json_callback({"error":0})', [
          "acf_auth=auth; Path=/",
          "acf_stk=stk; Path=/",
          "acf_ltkid=1; Path=/",
          "acf_biz=1; Path=/",
          "acf_ct=0; Path=/",
        ]),
      );
    const missingUid = await DouyuQrcodeLogin.create();
    const result = await missingUid.poll();
    expect(result).toMatchObject({ status: "error" });
    if (result.status === "error") expect(result.failReason).toBe("登录成功但未获取到斗鱼 UID");
  });

  it("加密保存、覆盖、列出和删除账号", () => {
    writeDouyuUser({
      uid: 1,
      name: "旧昵称",
      loginCookies: { passport: "LTP0=old", main: "acf_uid=1" },
    });
    expect(appConfig.get("douyuUser")[1]).not.toContain("acf_uid=1");
    writeDouyuUser({
      uid: 1,
      name: "新昵称",
      loginCookies: { passport: "LTP0=new", main: "acf_uid=1; token=new", yuba: "yb=1" },
    } as unknown as Parameters<typeof writeDouyuUser>[0]);
    expect(readDouyuUser(1)?.name).toBe("新昵称");
    expect(readDouyuUser(1)?.loginCookies.main).toContain("token=new");
    expect("yuba" in (readDouyuUser(1)?.loginCookies || {})).toBe(false);
    expect(readDouyuUserList()).toHaveLength(1);
    deleteDouyuUser(1);
    expect(readDouyuUser(1)).toBeUndefined();
  });
});
