import crypto from "node:crypto";

import safeEval from "safe-eval";
import { uuid } from "./utils.js";

import queryString from "query-string";
import { requester } from "./requester.js";

/**
 * 对斗鱼 getH5Play 接口的封装
 */
export async function getLiveInfo(opts: {
  channelId: string;
  cdn?: string;
  rate?: number;
  rejectSignFnCache?: boolean;
  onlyAudio?: boolean;
}): Promise<
  | {
      living: false;
    }
  | {
      living: true;
      sources: GetH5PlaySuccessData["cdnsWithName"];
      streams: GetH5PlaySuccessData["multirates"];
      isSupportRateSwitch: boolean;
      isOriginalStream: boolean;
      currentStream: {
        source: string;
        name: string;
        rate: number;
        url: string;
      };
    }
> {
  const sign = await getSignFn(opts.channelId, opts.rejectSignFnCache);
  const did = uuid().replace(/-/g, "");
  const time = Math.ceil(Date.now() / 1000);
  const signedStr = String(sign(opts.channelId, did, time));

  // TODO: 这里类型处理的有点问题，先用 as 顶着
  // @ts-ignore
  const signed = queryString.parse(signedStr) as Record<string, string>;

  // TODO: 以后可以试试换成 https://open.douyu.com/source/api/9 里提供的公开接口，
  // 不过公开接口可能会存在最高码率的限制。
  const res = await requester.post<
    | {
        data: GetH5PlaySuccessData;
        error: number;
        msg: string;
      }
    | string
  >(
    `https://www.douyu.com/lapi/live/getH5Play/${opts.channelId}`,
    new URLSearchParams({
      ...signed,
      cdn: opts.cdn ?? "",
      // 相当于清晰度类型的 id，给 -1 会由后端决定，0为原画
      rate: String(opts.rate ?? 0),
      // 是否只录制音频
      fa: opts.onlyAudio ? "1" : "0",
    }),
  );

  if (res.status !== 200) {
    if (res.status === 403 && res.data === "鉴权失败" && !opts.rejectSignFnCache) {
      // 使用非缓存的sign函数再次签名
      return getLiveInfo({ ...opts, rejectSignFnCache: true });
    }

    throw new Error(`Unexpected status code, ${res.status}, ${res.data}`);
  }

  // TODO: assert data not string
  if (typeof res.data === "string") throw new Error();

  const json = res.data;
  // 不存在的房间、已被封禁、未开播
  if ([-3, -4, -5].includes(json.error)) return { living: false };
  // 其他
  if (json.error !== 0) {
    // 时间戳错误，目前不确定原因，但重新获取几次 sign 函数可解决。
    // TODO: 这里与 getSignFn 隐式的耦合了
    if (json.error === -9) delete signCaches[opts.channelId];

    throw new Error("Unexpected error code, " + json.error);
  }

  const streamUrl = `${json.data.rtmp_url}/${json.data.rtmp_live}`;
  let cdn = json.data.rtmp_cdn;
  try {
    const url = new URL(streamUrl);
    cdn = url.searchParams.get("fcdn") ?? "";
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
      source: cdn,
      name:
        json.data.rateSwitch !== 1
          ? "原画"
          : (json.data.multirates.find(({ rate }) => rate === json.data.rate)?.name ?? "未知"),
      rate: json.data.rate,
      url: streamUrl,
    },
  };
}

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

type SignFunction = (channelId: string, did: string, time: number) => string;
const signCaches: Record<string, SignFunction> = {};

async function getSignFn(address: string, rejectCache?: boolean): Promise<SignFunction> {
  if (!rejectCache && Object.hasOwn(signCaches, address)) {
    // 有缓存, 直接使用
    return signCaches[address];
  }

  const res = await requester.get("https://www.douyu.com/swf_api/homeH5Enc?rids=" + address);
  const json = res.data;
  if (json.error !== 0) throw new Error("Unexpected error code, " + json.error);
  const code = json.data && json.data["room" + address];
  if (!code) throw new Error("Unexpected result with homeH5Enc, " + JSON.stringify(json));
  const sign = safeEval(`(function func(a,b,c){${code};return ub98484234(a,b,c)})`, {
    CryptoJS: {
      MD5: (str: string) => {
        return crypto.createHash("md5").update(str).digest("hex");
      },
    },
    window: disguisedNativeMethods,
    document: disguisedNativeMethods,
  });
  signCaches[address] = sign;

  return sign;
}

/**
 * 获取直播间相关信息
 */
export async function getRoomInfo(roomId: number): Promise<{
  room: {
    /** 主播id */
    up_id: string;
    /** 主播昵称 */
    nickname: string;
    /** 主播头像 */
    avatar: {
      big: string;
      middle: string;
      small: string;
    };
    /** 直播间标题 */
    room_name: string;
    /** 直播间封面 */
    room_pic: string;
    /** 直播间号 */
    room_id: number;
    /** 直播状态，1是正在直播 */
    status: "1" | string;
    /** 轮播：1是正在轮播 */
    videoLoop: 1 | number;
    /** 开播时间，秒时间戳 */
    show_time: number;
    [key: string]: any;
  };
  [key: string]: any;
}> {
  const response = await requester.get(`https://www.douyu.com/betard/${roomId}`);

  return response.data;
}

export interface SourceProfile {
  name: string;
  cdn: string;
  isH265: true;
}

export interface StreamProfile {
  name: string;
  rate: number;
  highBit: number;
  bit: number;
  diamondFan: number;
}

interface GetH5PlaySuccessData {
  room_id: number;
  is_mixed: false;
  mixed_live: string;
  mixed_url: string;
  rtmp_cdn: string;
  rtmp_url: string;
  rtmp_live: string;
  client_ip: string;
  inNA: number;
  rateSwitch: number;
  rate: number;
  cdnsWithName: SourceProfile[];
  multirates: StreamProfile[];
  isPassPlayer: number;
  eticket: null;
  online: number;
  mixedCDN: string;
  p2p: number;
  streamStatus: number;
  smt: number;
  p2pMeta: unknown;
  p2pCid: number;
  p2pCids: string;
  player_1: string;
  h265_p2p: number;
  h265_p2p_cid: number;
  h265_p2p_cids: string;
  acdn: string;
  av1_url: string;
  rtc_stream_url: string;
  rtc_stream_config: string;
}
