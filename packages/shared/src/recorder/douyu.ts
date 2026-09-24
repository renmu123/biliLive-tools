import { randomBytes } from "node:crypto";

import { appConfig } from "../config.js";
import { decrypt, encrypt } from "../utils/index.js";

import type { DouyuLoginCookies, DouyuUser } from "@biliLive-tools/types";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188";
const QR_GENERATE_URL = "https://passport.douyu.com/scan/generateCode";
const QR_AUTH_URL = "https://passport.douyu.com/japi/scan/auth";
const LOGIN_REFERER = "https://passport.douyu.com/index/login?type=login&client_id=1";
const MAIN_ORIGIN = "https://www.douyu.com";
const MAIN_LOGIN_PATH = "/api/passport/login";

type GenerateResponse = {
  error: number;
  msg?: string;
  data?: { code?: string; expire?: number; url?: string };
};

type CheckResponse = {
  error: number;
  msg?: string;
  message?: string;
  data?: { url?: string };
};

export type DouyuLoginPollResult =
  | { status: "scan" }
  | { status: "completed"; user: DouyuUser }
  | { status: "error"; failReason: string };

const getPassKey = () =>
  process.env.BILILIVE_TOOLS_BILIKEY ||
  "7d628cb145deba521d5b0195924c466cae6559289cf5a335624ad8e6d7ef0085";

const parseCookie = (cookie: string): Record<string, string> =>
  cookie.split(";").reduce<Record<string, string>>((result, chunk) => {
    const [name, ...rest] = chunk.trim().split("=");
    if (name) result[name] = rest.join("=").trim();
    return result;
  }, {});

const buildCookie = (cookies: Record<string, string>) =>
  Object.entries(cookies)
    .filter(([, value]) => value !== "")
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

const getSetCookieHeaders = (headers: Headers): string[] =>
  typeof (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
    ? (headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
    : headers.get("set-cookie")
      ? [headers.get("set-cookie")!]
      : [];

const parseSetCookiePair = (header: string): [string, string] | null => {
  const pair = header.split(";", 1)[0];
  const index = pair.indexOf("=");
  return index > 0 ? [pair.slice(0, index).trim(), pair.slice(index + 1)] : null;
};

const mergeCookies = (currentCookie: string, headers: Headers) => {
  const cookies = parseCookie(currentCookie);
  for (const header of getSetCookieHeaders(headers)) {
    const pair = parseSetCookiePair(header);
    if (pair) cookies[pair[0]] = pair[1];
  }
  return buildCookie(cookies);
};

const decodeCookieValue = (value: string | undefined) => {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const createDeviceCookie = () => {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  const suffix = [...randomBytes(31)].map((byte) => alphabet[byte % alphabet.length]).join("");
  const deviceId = `b${suffix}`;
  return `dy_did=${deviceId}; acf_did=${deviceId}; game_did=${deviceId}`;
};

const normalizeMainLoginUrl = (value: string) => {
  const url = new URL(value);
  if (url.origin !== MAIN_ORIGIN || url.pathname !== MAIN_LOGIN_PATH) {
    throw new Error("扫码登录主站地址无效");
  }
  if (!url.searchParams.has("callback"))
    url.searchParams.set("callback", "appClient_json_callback");
  if (!url.searchParams.has("_")) url.searchParams.set("_", String(Date.now()));
  return url.toString();
};

const parseJsonp = (text: string): Record<string, unknown> | undefined => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
};

export class DouyuQrcodeLogin {
  readonly code: string;
  readonly url: string;
  readonly expiresAt: number;

  private passportCookie: string;
  private cancelled = false;
  private controller: AbortController | null = null;
  private pollPromise: Promise<DouyuLoginPollResult> | null = null;

  private constructor(code: string, url: string, expiresAt: number, passportCookie: string) {
    this.code = code;
    this.url = url;
    this.expiresAt = expiresAt;
    this.passportCookie = passportCookie;
  }

  static async create(): Promise<DouyuQrcodeLogin> {
    const passportCookie = createDeviceCookie();
    const body = new URLSearchParams({ client_id: "1", isMultiAccount: "0" });
    const response = await fetch(QR_GENERATE_URL, {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest",
        "user-agent": USER_AGENT,
        referer: LOGIN_REFERER,
        cookie: passportCookie,
      },
    });
    if (!response.ok) throw new Error(`斗鱼接口请求失败（${response.status}）`);
    const data = (await response.json()) as GenerateResponse;
    const expiresIn = data.data?.expire || 300;
    if (data.error !== 0 || !data.data?.code || !data.data.url) {
      throw new Error(data.msg || "获取斗鱼登录二维码失败");
    }
    return new DouyuQrcodeLogin(
      data.data.code,
      data.data.url,
      Date.now() + expiresIn * 1000,
      mergeCookies(passportCookie, response.headers),
    );
  }

  cancel() {
    this.cancelled = true;
    this.controller?.abort();
  }

  poll(): Promise<DouyuLoginPollResult> {
    if (!this.pollPromise) {
      this.pollPromise = this.pollInternal().finally(() => {
        this.pollPromise = null;
      });
    }
    return this.pollPromise;
  }

  private async pollInternal(): Promise<DouyuLoginPollResult> {
    if (this.cancelled) return { status: "error", failReason: "登录已取消" };
    if (Date.now() >= this.expiresAt) return { status: "error", failReason: "二维码已过期" };

    try {
      const checkUrl = new URL(QR_AUTH_URL);
      checkUrl.searchParams.set("time", String(Date.now()));
      checkUrl.searchParams.set("code", this.code);
      const response = await this.request(checkUrl.toString(), {
        headers: { cookie: this.passportCookie, "x-requested-with": "XMLHttpRequest" },
      });
      const result = (await response.json()) as CheckResponse;
      if (result.error === -2 || result.error === 1) return { status: "scan" };
      if (result.error !== 0) {
        const fallback =
          result.error === -3 || result.error === 2 ? "二维码已过期" : "斗鱼登录失败";
        return { status: "error", failReason: result.msg || result.message || fallback };
      }
      if (!result.data?.url) throw new Error("扫码登录已确认，但斗鱼未返回主站登录地址");

      this.passportCookie = mergeCookies(this.passportCookie, response.headers);
      const { mainCookie, profile } = await this.fetchMainCookie(result.data.url);

      const mainCookies = parseCookie(mainCookie);
      const uid = Number(mainCookies.acf_uid);
      if (!Number.isSafeInteger(uid) || uid <= 0) throw new Error("登录成功但未获取到斗鱼 UID");
      const user: DouyuUser = {
        uid,
        name:
          decodeCookieValue(profile.name) ||
          decodeCookieValue(mainCookies.acf_nickname) ||
          String(uid),
        avatar: decodeCookieValue(mainCookies.acf_avatar) || undefined,
        loginCookies: { passport: this.passportCookie, main: mainCookie },
      };
      return { status: "completed", user };
    } catch (error) {
      if (this.cancelled) return { status: "error", failReason: "登录已取消" };
      return {
        status: "error",
        failReason: error instanceof Error ? error.message : "斗鱼登录失败",
      };
    }
  }

  private async fetchMainCookie(loginUrl: string) {
    const response = await this.request(normalizeMainLoginUrl(loginUrl), {
      headers: { cookie: this.passportCookie, referer: `${MAIN_ORIGIN}/` },
    });
    const body = parseJsonp(await response.text());
    if (body && Number(body.error) !== 0) {
      throw new Error(`扫码登录主站失败: ${String(body.msg || body.message || body.error)}`);
    }
    const passportCookies = parseCookie(this.passportCookie);
    const baseCookie = passportCookies.dy_did ? `dy_did=${passportCookies.dy_did}` : "";
    const mainCookie = mergeCookies(baseCookie, response.headers);
    const data =
      body?.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : {};
    return {
      mainCookie,
      profile: {
        name: typeof data.nickname === "string" ? data.nickname : undefined,
        avatar: typeof data.avatar === "string" ? data.avatar : undefined,
      },
    };
  }

  private async request(url: string, init: RequestInit = {}) {
    if (this.cancelled) throw new Error("登录已取消");
    this.controller = new AbortController();
    const headers = new Headers(init.headers);
    headers.set("user-agent", USER_AGENT);
    if (!headers.has("referer")) headers.set("referer", LOGIN_REFERER);
    const response = await fetch(url, { ...init, headers, signal: this.controller.signal });
    if (!response.ok) throw new Error(`斗鱼接口请求失败（${response.status}）`);
    return response;
  }
}

export const writeDouyuUser = (user: DouyuUser) => {
  const users = appConfig.get("douyuUser") || {};
  const storedUser: DouyuUser = {
    uid: user.uid,
    name: user.name,
    avatar: user.avatar,
    loginCookies: {
      passport: user.loginCookies.passport,
      main: user.loginCookies.main,
    },
  };
  users[user.uid] = encrypt(JSON.stringify(storedUser), getPassKey());
  appConfig.set("douyuUser", users);
};

export const readDouyuUser = (uid: number): DouyuUser | undefined => {
  const value = (appConfig.get("douyuUser") || {})[uid];
  if (!value) return undefined;
  const storedUser = JSON.parse(decrypt(value, getPassKey())) as DouyuUser & {
    cookie?: string;
    loginCookies?: DouyuLoginCookies & { yuba?: string };
  };
  const user: DouyuUser = {
    uid: storedUser.uid,
    name: storedUser.name,
    avatar: storedUser.avatar,
    loginCookies: {
      passport: storedUser.loginCookies?.passport || "",
      main: storedUser.loginCookies?.main || storedUser.cookie || "",
    },
  };
  if (storedUser.cookie !== undefined || storedUser.loginCookies?.yuba !== undefined) {
    writeDouyuUser(user);
  }
  return user;
};

export const readDouyuUserList = (): DouyuUser[] => {
  const users = appConfig.get("douyuUser") || {};
  return Object.keys(users)
    .map((uid) => readDouyuUser(Number(uid)))
    .filter((user): user is DouyuUser => Boolean(user));
};

export const deleteDouyuUser = (uid: number) => {
  const users = appConfig.get("douyuUser") || {};
  delete users[uid];
  appConfig.set("douyuUser", users);
};

export type { DouyuLoginCookies };
