/**
 * DouYu API 层
 * 基于 DouYuRecorder 的实现迁移
 */

import type { HttpClient } from "../http.js";
import { ParseError, NetworkError } from "../errors.js";
import { uuid, md5 } from "../utils.js";
import type {
  GetH5PlaySuccessData,
  RoomInfo,
  LiveInfoResult,
  SourceProfile,
  StreamProfile,
} from "./types.js";

// 签名函数类型
type SignFunction = (channelId: string, did: string, time: number) => string;

// 签名函数缓存
const signCaches: Record<string, SignFunction> = {};

// 斗鱼为了判断是否是浏览器环境，会在 sign 过程中去验证一些 window / document 上的函数
// 是否是 native 的，这里利用 proxy 来模拟。
const disguisedNativeMethods = new Proxy(
  {},
  {
    get: function () {
      return "function () { [native code] }";
    },
  },
);

/**
 * 获取签名函数
 */
async function getSignFn(
  http: HttpClient,
  address: string,
  rejectCache?: boolean,
): Promise<SignFunction> {
  if (!rejectCache && Object.hasOwn(signCaches, address)) {
    // 有缓存, 直接使用
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

    // 使用 Function 构造器代替 safe-eval（注意：这需要在安全环境下使用）
    const CryptoJS = {
      MD5: (str: string) => md5(str),
    };

    // 创建沙箱环境
    const sandbox = {
      CryptoJS,
      window: disguisedNativeMethods,
      document: disguisedNativeMethods,
    };

    // 构造函数字符串
    const funcStr = `
      (function(CryptoJS, window, document) {
        ${code};
        return function(a, b, c) {
          return ub98484234(a, b, c);
        };
      })
    `;

    // 创建函数
    const createSignFn = new Function("return " + funcStr)();
    const sign = createSignFn(sandbox.CryptoJS, sandbox.window, sandbox.document);

    signCaches[address] = sign;
    return sign;
  } catch (error) {
    throw new NetworkError(`获取签名函数失败: ${(error as Error).message}`, "douyu");
  }
}

/**
 * 解析查询字符串
 */
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

/**
 * 构建查询字符串
 */
function buildQueryString(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}

/**
 * 对斗鱼 getH5Play 接口的封装
 */
export async function getLiveInfo(
  http: HttpClient,
  opts: {
    channelId: string;
    cdn?: string;
    rate?: number;
    rejectSignFnCache?: boolean;
    onlyAudio?: boolean;
  },
): Promise<LiveInfoResult> {
  const sign = await getSignFn(http, opts.channelId, opts.rejectSignFnCache);
  const did = uuid().replace(/-/g, "");
  const time = Math.ceil(Date.now() / 1000);
  const signedStr = String(sign(opts.channelId, did, time));

  const signed = parseQueryString(signedStr);

  const params = {
    ...signed,
    cdn: opts.cdn ?? "",
    // 相当于清晰度类型的 id，给 -1 会由后端决定，0为原画
    rate: String(opts.rate ?? 0),
    // 是否只录制音频
    fa: opts.onlyAudio ? "1" : "0",
  };

  try {
    const response = await http.post<
      | {
          data: GetH5PlaySuccessData;
          error: number;
          msg: string;
        }
      | string
    >(`https://www.douyu.com/lapi/live/getH5Play/${opts.channelId}`, buildQueryString(params), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // 处理字符串响应（鉴权失败等）
    if (typeof response === "string") {
      if (response === "鉴权失败" && !opts.rejectSignFnCache) {
        // 使用非缓存的sign函数再次签名
        return getLiveInfo(http, { ...opts, rejectSignFnCache: true });
      }
      throw new ParseError(`请求失败: ${response}`, "douyu");
    }

    const json = response;

    // 不存在的房间、已被封禁、未开播
    if ([-3, -4, -5].includes(json.error)) {
      return { living: false };
    }

    // 其他错误
    if (json.error !== 0) {
      // 时间戳错误，目前不确定原因，但重新获取几次 sign 函数可解决。
      if (json.error === -9) {
        delete signCaches[opts.channelId];
      }
      throw new ParseError("Unexpected error code: " + json.error, "douyu");
    }

    const streamUrl = `${json.data.rtmp_url}/${json.data.rtmp_live}`;
    let cdn = json.data.rtmp_cdn;
    let onlyAudio = false;

    try {
      const url = new URL(streamUrl);
      cdn = url.searchParams.get("fcdn") ?? "";
      if (url.searchParams.get("only-audio") === "1") {
        onlyAudio = true;
      }
    } catch (error) {
      console.warn("解析 rtmp_url 失败", error);
    }

    return {
      living: true,
      sources: json.data.cdnsWithName,
      streams: json.data.multirates,
      isSupportRateSwitch: json.data.rateSwitch === 1,
      isOriginalStream: json.data.rateSwitch !== 1,
      currentStream: {
        onlyAudio,
        source: cdn,
        name:
          json.data.rateSwitch !== 1
            ? "原画"
            : (json.data.multirates.find(({ rate }) => rate === json.data.rate)?.name ?? "未知"),
        rate: json.data.rate,
        url: streamUrl,
      },
    };
  } catch (error) {
    if (error instanceof ParseError) {
      throw error;
    }
    throw new NetworkError(`请求失败: ${(error as Error).message}`, "douyu");
  }
}

/**
 * 获取直播间相关信息
 */
export async function getRoomInfo(http: HttpClient, roomId: number): Promise<RoomInfo> {
  try {
    const response = await http.get<RoomInfo>(`https://www.douyu.com/betard/${roomId}`);
    return response;
  } catch (error) {
    throw new NetworkError(`获取房间信息失败: ${(error as Error).message}`, "douyu");
  }
}
