import safeEval from "safe-eval";
import type { HttpClient } from "../http.js";
import { ParseError, NetworkError } from "../errors.js";
import { uuid, md5 } from "../utils.js";
import type { GetH5PlaySuccessData } from "./types.js";

type SignFunction = (channelId: string, did: string, time: number) => string;

const signCaches: Record<string, SignFunction> = {};

const disguisedNativeMethods = new Proxy(
  {},
  {
    get: function () {
      return "function () { [native code] }";
    },
  },
);

function parseQueryString(str: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = str.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key) {
      result[key] = decodeURIComponent(value || "");
    }
  }
  return result;
}

function buildQueryString(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}

async function getSignFn(
  http: HttpClient,
  address: string,
  rejectCache?: boolean,
): Promise<SignFunction> {
  if (!rejectCache && Object.hasOwn(signCaches, address)) {
    return signCaches[address];
  }

  try {
    const json = await http.get<{
      error: number;
      data?: Record<string, string>;
    }>("https://www.douyu.com/swf_api/homeH5Enc?rids=" + address);

    if (json.error !== 0) {
      throw new ParseError("Unexpected error code: " + json.error, "douyu");
    }

    const code = json.data && json.data["room" + address];
    if (!code) {
      throw new ParseError("Unexpected result with homeH5Enc: " + JSON.stringify(json), "douyu");
    }

    const CryptoJS = {
      MD5: (str: string) => md5(str),
    };

    const sandbox = {
      CryptoJS,
      window: disguisedNativeMethods,
      document: disguisedNativeMethods,
    };

    const sign = safeEval(`(function func(a,b,c){${code};return ub98484234(a,b,c)})`, sandbox);

    signCaches[address] = sign;
    return sign;
  } catch (error) {
    throw new NetworkError(`获取签名函数失败: ${(error as Error).message}`, "douyu");
  }
}

export function invalidateSignCache(channelId: string) {
  delete signCaches[channelId];
}

export interface GetH5PlayOptions {
  channelId: string;
  cdn?: string;
  rate?: number;
  rejectSignFnCache?: boolean;
  onlyAudio?: boolean;
  hevc?: boolean;
}

export interface GetH5PlayResponse {
  data: GetH5PlaySuccessData;
  error: number;
  msg: string;
}

export async function getH5Play(
  http: HttpClient,
  opts: GetH5PlayOptions,
): Promise<GetH5PlayResponse> {
  const sign = await getSignFn(http, opts.channelId, opts.rejectSignFnCache);
  const did = uuid().replace(/-/g, "");
  const time = Math.ceil(Date.now() / 1000);
  const signedStr = String(sign(opts.channelId, did, time));

  const signed = parseQueryString(signedStr);
  const params = {
    ...signed,
    cdn: opts.cdn ?? "",
    rate: String(opts.rate ?? 0),
    fa: opts.onlyAudio ? "1" : "0",
  };

  try {
    const response = await http.post<GetH5PlayResponse | string>(
      `https://www.douyu.com/lapi/live/getH5Play/${opts.channelId}`,
      buildQueryString(params),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    if (typeof response === "string") {
      if (response === "鉴权失败" && !opts.rejectSignFnCache) {
        return getH5Play(http, { ...opts, rejectSignFnCache: true });
      }
      throw new ParseError(`请求失败: ${response}`, "douyu");
    }

    // 时间戳错误，目前不确定原因，但重新获取几次 sign 函数可解决。
    if (response.error === -9) {
      invalidateSignCache(opts.channelId);
    }

    return response;
  } catch (error) {
    console.error("getH5Play error", error);
    if (error instanceof ParseError) {
      throw error;
    }
    throw new NetworkError(`请求失败: ${(error as Error).message}`, "douyu");
  }
}
