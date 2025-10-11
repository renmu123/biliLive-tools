import { URL, URLSearchParams } from "url";
import axios from "axios";
import { isEmpty } from "lodash-es";
import { assert, get__ac_signature } from "./utils.js";
import { ABogus } from "./sign.js";
import type { APIType } from "./types.js";

const requester = axios.create({
  timeout: 10e3,
  // axios 会自动读取环境变量中的 http_proxy 和 https_proxy 并应用，这会让请求发往代理的 host。
  // 所以这里需要主动禁用代理功能。
  proxy: false,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  },
});

/**
 * 从抖音短链接解析得到直播间ID
 * @param shortURL 短链接，如 https://v.douyin.com/DpfoBLAXoHM/
 * @returns webRoomId 直播间ID
 */
export async function resolveShortURL(shortURL: string): Promise<string> {
  // 获取跳转后的页面内容
  const response = await requester.get(shortURL);
  const redirectedURL = response.request.res.responseUrl;
  if (redirectedURL.includes("/user/")) {
    const secUid = new URL(redirectedURL).searchParams.get("sec_uid");
    if (!secUid) {
      throw new Error("无法从短链接解析出直播间ID");
    }
    return parseUser(`https://www.douyin.com/user/${secUid}`);
  }

  // 尝试从页面内容中提取webRid
  const webRidMatch = response.data.match(/"webRid\\":\\"(\d+)\\"/);
  if (webRidMatch) {
    return webRidMatch[1];
  }

  throw new Error("无法从短链接解析出直播间ID");
}

const qualityList = [
  {
    key: "origin",
    desc: "原画",
  },
  {
    key: "uhd",
    desc: "蓝光",
  },
  {
    key: "hd",
    desc: "超清",
  },
  {
    key: "sd",
    desc: "高清",
  },
  {
    key: "ld",
    desc: "标清",
  },
  {
    key: "ao",
    desc: "音频流",
  },
  {
    key: "real_origin",
    desc: "真原画",
  },
];

let cookieCache: {
  startTimestamp: number;
  cookies: string;
};

export const getCookie = async () => {
  const now = new Date().getTime();
  // 缓存6小时
  if (cookieCache?.startTimestamp && now - cookieCache.startTimestamp < 6 * 60 * 60 * 1000) {
    return cookieCache.cookies;
  }
  const res = await requester.get("https://live.douyin.com/");
  if (!res.headers["set-cookie"]) {
    throw new Error("No cookie in response");
  }
  const cookies = (res.headers["set-cookie"] ?? [])
    .map((cookie) => {
      return cookie.split(";")[0];
    })
    .join("; ");

  if (!cookies.includes("ttwid")) {
    // 如果不含ttwid，且已经存在含ttwid的cookie，将缓存时间直接增加1小时，复用之前的参数
    if (cookieCache?.cookies) {
      cookieCache.startTimestamp += 60 * 60 * 1000; // 增加1小时
      return cookieCache.cookies;
    }
  }

  cookieCache = {
    startTimestamp: now,
    cookies,
  };
  return cookies;
};

function generateNonce() {
  // 21味随机字母数字组合
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let nonce = "";
  for (let i = 0; i < 21; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

/**
 * 通过解析直播html页面来获取房间数据
 * @param secUserId
 * @param opts
 */
async function getRoomInfoByUserWeb(
  secUserId: string,
  opts: {
    auth?: string;
  } = {},
) {
  // TODO:待实现
  const url = `https://www.douyin.com/user/${secUserId}`;
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0";
  const nonce = "068ea1c0100bb2c06590f";
  // const nonce = (await getNonce(url)) ?? generateNonce();

  let cookies: string | undefined = undefined;
  if (opts.auth) {
    cookies = opts.auth;
  } else {
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = get__ac_signature(timestamp, url, nonce, ua);
    cookies = `__ac_nonce=${nonce}; __ac_signature=${signed}; __ac_referer=__ac_blank`;
  }

  const res = await axios.get(url, {
    headers: {
      "User-Agent": ua,
      cookie: cookies,
    },
  });
  console.log(ua, cookies);

  if (res.data.includes("验证码")) {
    throw new Error("需要验证码，请在浏览器中打开链接获取" + url);
  }
  if (!res.data.includes("直播中")) {
    return {
      living: false,
      nickname: "",
      sec_uid: "",
      avatar: "",
      room: null,
    };
  }

  const userRegex = /(\{\\"user\\":.*?)\]\\n"\]\)/;
  // fs.writeFileSync("douyin.html", res.data);
  const userMatch = res.data.match(userRegex);

  if (!userMatch) {
    throw new Error("No match found in HTML");
  }
  let userJsonStr = userMatch[1];
  userJsonStr = userJsonStr
    .replace(/\\"/g, '"')
    .replace(/\\"/g, '"')
    .replace(/"\$\w+"/g, "null");

  // const roomRegex = /(\{\\"common\\":.*?)"\]\)/;
  // const roomMatch = res.data.match(roomRegex);
  // if (!roomMatch) {
  //   throw new Error("No room match found in HTML");
  // }
  // let roomJsonStr = roomMatch[1];
  // roomJsonStr = roomJsonStr
  //   .replace(/\\"/g, '"')
  //   .replace(/\\"/g, '"')
  //   .replace(/"\$\w+"/g, "null");
  try {
    // console.log(userJsonStr);
    const userData = JSON.parse(userJsonStr);
    // console.log(JSON.stringify(userData, null, 2));

    // const roomData = JSON.parse(roomJsonStr);
    // console.log(roomData);
    // const roomInfo = data.state.roomStore.roomInfo;
    // const streamData = data.state.streamStore.streamData;
    return {
      living: userData?.user?.user?.roomData?.status === 2,
      nickname: userData?.user?.user?.nickname,
      sec_uid: userData?.user?.user?.secUid,
      avatar: "",
      room: {
        title: "",
        cover: "",
        id_str: userData?.user?.user?.roomIdStr,
        stream_url: null,
      },
    };
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    throw e;
  }
}

/**
 * 通过解析用户html页面来获取房间数据
 * @param webRoomId
 * @param opts
 */
async function getRoomInfoByHtml(
  webRoomId: string,
  opts: {
    auth?: string;
  } = {},
) {
  const url = `https://live.douyin.com/${webRoomId}`;
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0";
  const nonce = generateNonce();

  let cookies: string | undefined = undefined;
  if (opts.auth) {
    cookies = opts.auth;
  } else {
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = get__ac_signature(timestamp, url, nonce, ua);
    cookies = `__ac_nonce=${nonce}; __ac_signature=${signed}; __ac_referer=__ac_blank`;
  }

  const res = await axios.get(url, {
    headers: {
      "User-Agent": ua,
      cookie: cookies,
    },
  });
  const regex = /(\{\\"state\\":.*?)\]\\n"\]\)/;
  const match = res.data.match(regex);

  if (!match) {
    throw new Error("No match found in HTML");
  }
  let jsonStr = match[1];
  jsonStr = jsonStr.replace(/\\"/g, '"');
  jsonStr = jsonStr.replace(/\\"/g, '"');
  try {
    const data = JSON.parse(jsonStr);
    const roomInfo = data.state.roomStore.roomInfo;
    const streamData = data.state.streamStore.streamData;
    return {
      living: roomInfo.room.status === 2,
      nickname: roomInfo.anchor.nickname,
      sec_uid: roomInfo.anchor.sec_uid,
      avatar: roomInfo.anchor?.avatar_thumb?.url_list?.[0],
      room: {
        title: roomInfo.room.title,
        cover: roomInfo.room.cover?.url_list?.[0],
        id_str: roomInfo.room.id_str,
        stream_url: {
          pull_datas: roomInfo.room?.stream_url?.pull_datas,
          live_core_sdk_data: {
            pull_data: {
              options: { qualities: streamData.H264_streamData?.options?.qualities ?? [] },
              stream_data: streamData.H264_streamData?.stream ?? {},
            },
          },
        },
      },
    };
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    throw e;
  }
}

async function getRoomInfoByWeb(
  webRoomId: string,
  opts: {
    auth?: string;
  } = {},
) {
  let cookies: string | undefined = undefined;
  if (opts.auth) {
    cookies = opts.auth;
  } else {
    // 抖音的 'webcast/room/web/enter' api 会需要 ttwid 的 cookie，这个 cookie 是由这个请求的响应头设置的，
    // 所以在这里请求一次自动设置。
    cookies = await getCookie();
  }

  const params: Record<any, any> = {
    aid: 6383,
    live_id: 1,
    device_platform: "web",
    language: "zh-CN",
    enter_from: "web_live",
    cookie_enabled: "true",
    screen_width: 1920,
    screen_height: 1080,
    browser_language: "zh-CN",
    browser_platform: "MacIntel",
    browser_name: "Chrome",
    browser_version: "108.0.0.0",
    web_rid: webRoomId,
    "Room-Enter-User-Login-Ab": 0,
    is_need_double_stream: "false",
  };

  const abogus = new ABogus();
  const [query, _, ua] = abogus.generateAbogus(new URLSearchParams(params).toString(), "");

  const res = await requester.get<EnterRoomApiResp>(
    `https://live.douyin.com/webcast/room/web/enter/?${query}`,
    {
      headers: {
        cookie: cookies,
        "User-Agent": ua,
      },
    },
  );

  assert(
    res.data.status_code === 0,
    `Unexpected resp, code ${res.data.status_code}, msg ${JSON.stringify(res.data.data)}, id ${webRoomId}, cookies: ${cookies}`,
  );

  const data = res.data.data;
  const room = data.data[0];
  assert(room, `No room data, id ${webRoomId}`);

  return {
    living: data.room_status === 0,
    nickname: data.user.nickname,
    avatar: data?.user?.avatar_thumb?.url_list?.[0],
    sec_uid: data?.user?.sec_uid,
    room: {
      title: room.title,
      cover: room.cover?.url_list?.[0],
      id_str: room.id_str,
      stream_url: room.stream_url,
    },
  };
}

async function getRoomInfoByMobile(
  secUserId: string | number,
  opts: {
    auth?: string;
  } = {},
) {
  if (!secUserId) {
    throw new Error("Mobile API need secUserId, please set uid field");
  }
  if (typeof secUserId === "number") {
    throw new Error("Mobile API need secUserId string, please set uid field");
  }
  const params: Record<any, any> = {
    app_id: 1128,
    live_id: 1,
    verifyFp: "",
    room_id: 2,
    type_id: 0,
    sec_user_id: secUserId,
  };

  const res = await requester.get<EnterRoomApiResp>(
    `https://webcast.amemv.com/webcast/room/reflow/info/`,
    {
      params,
      headers: {
        cookie: opts.auth,
      },
    },
  );

  // @ts-ignore
  const room = res?.data?.data?.room;
  return {
    living: room?.status === 2,
    nickname: room?.owner?.nickname,
    sec_uid: room?.owner?.sec_uid,
    avatar: room?.owner?.avatar_thumb?.url_list?.[0],
    room: {
      title: room?.title,
      cover: room?.cover?.url_list?.[0],
      id_str: room?.id_str,
      stream_url: room?.stream_url,
    },
  };
}

export async function getRoomInfo(
  webRoomId: string,
  opts: {
    auth?: string;
    doubleScreen?: boolean;
    api?: APIType;
    uid?: string | number;
  } = {},
): Promise<{
  living: boolean;
  roomId: string;
  owner: string;
  title: string;
  streams: StreamProfile[];
  sources: SourceProfile[];
  avatar: string;
  cover: string;
  liveId: string;
  uid: string;
}> {
  let data: Awaited<ReturnType<typeof getRoomInfoByWeb> | ReturnType<typeof getRoomInfoByHtml>>;
  let api = opts.api ?? "web";

  if (api === "mobile" || api === "userHTML") {
    // mobile 接口需要 sec_uid 参数，老数据可能没有，实现兼容
    if (!opts.uid || typeof opts.uid !== "string") {
      api = "web";
    }
  }
  if (api === "webHTML") {
    data = await getRoomInfoByHtml(webRoomId, opts);
  } else if (api === "mobile") {
    data = await getRoomInfoByMobile(opts.uid, opts);
  } else if (api === "userHTML") {
    data = await getRoomInfoByUserWeb(opts.uid as string, opts);
  } else {
    data = await getRoomInfoByWeb(webRoomId, opts);
  }
  // console.log(JSON.stringify(data, null, 2));
  const room = data.room;
  assert(room, `No room data, id ${webRoomId}`);
  if (api === "userHTML") {
    return {
      living: data.living,
      roomId: webRoomId,
      owner: data.nickname,
      title: room?.title ?? data.nickname,
      streams: [],
      sources: [],
      avatar: data.avatar,
      cover: room.cover,
      liveId: room.id_str,
      uid: data.sec_uid,
    };
  }

  if (room?.stream_url == null) {
    return {
      living: false,
      roomId: webRoomId,
      owner: data.nickname,
      title: room?.title ?? data.nickname,
      streams: [],
      sources: [],
      avatar: data.avatar,
      cover: room.cover,
      liveId: room.id_str,
      uid: data.sec_uid,
    };
  }

  let qualities: QualityInfo[] = [];
  let stream_data: string = "";
  if (opts.doubleScreen && !isEmpty(room.stream_url.pull_datas)) {
    const pull_data = Object.values(room.stream_url.pull_datas)[0] ?? {
      options: {
        qualities: [],
      },
      stream_data: "",
    };
    // @ts-ignore
    qualities = pull_data.options.qualities;
    // @ts-ignore
    stream_data = pull_data.stream_data;
  }
  if (!stream_data) {
    qualities = room.stream_url.live_core_sdk_data.pull_data.options.qualities;
    stream_data = room.stream_url.live_core_sdk_data.pull_data.stream_data;
  }
  const streamData =
    typeof stream_data === "string" ? (JSON.parse(stream_data) as StreamData).data : stream_data;

  const streams: StreamProfile[] = qualities.map((info) => ({
    desc: info.name,
    key: info.sdk_key,
    bitRate: info.v_bit_rate,
  }));

  // 转换流数据结构
  const streamList: StreamInfo[] = Object.entries(streamData)
    .map(([quality, info]) => {
      const stream = info?.main;
      const name = qualityList.find((item) => item.key === quality)?.desc;
      return {
        quality: quality,
        name: name ?? "未知",
        flv: stream?.flv,
        hls: stream?.hls,
      };
    })
    .filter((stream) => stream.flv || stream.hls);

  const aoStream = streamList.find((stream) => stream.quality === "ao");
  if (!!aoStream) {
    // 真原画流是在ao流中拿到的
    streamList.push({
      quality: "real_origin",
      name: "真原画",
      flv: (aoStream?.flv ?? "").replace("&only_audio=1", ""),
      hls: (aoStream?.hls ?? "").replace("&only_audio=1", ""),
    });
  }
  streamList.sort((a, b) => {
    const aIndex = qualityList.findIndex((item) => item.key === a.quality);
    const bIndex = qualityList.findIndex((item) => item.key === b.quality);
    // 如果找不到对应的质量等级，将其排在最后
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // 看起来抖音是自动切换 cdn 的，所以这里固定返回一个默认的 source。
  const sources: SourceProfile[] = [
    {
      name: "自动",
      streamMap: streamData,
      streams: streamList,
    },
  ];

  // console.log(JSON.stringify(sources, null, 2), qualities);

  return {
    living: data.living,
    roomId: webRoomId,
    owner: data.nickname,
    title: room.title,
    streams,
    sources,
    avatar: data.avatar,
    cover: room.cover,
    liveId: room.id_str,
    uid: data.sec_uid,
  };
}

/**
 * 获取nonce
 */
async function getNonce(url: string) {
  const res = await requester.get(url);
  if (!res.headers["set-cookie"]) {
    throw new Error("No cookie in response");
  }
  const cookies = {};
  (res.headers["set-cookie"] ?? []).forEach((cookie) => {
    const [key, _] = cookie.split(";");
    const [keyPart, valuePart] = key.split("=");
    if (!keyPart || !valuePart) return;
    cookies[keyPart.trim()] = valuePart.trim();
  });
  return cookies["__ac_nonce"];
}

/**
 * 解析抖音号
 * @param url
 */
export async function parseUser(url: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0";
  const nonce = (await getNonce(url)) ?? generateNonce();
  const signed = get__ac_signature(timestamp, url, nonce, ua);

  const res = await requester.get(url, {
    headers: {
      "User-Agent": ua,
      cookie: `__ac_nonce=${nonce}; __ac_signature=${signed}`,
    },
  });
  const text = res.data;
  const regex = /\\"uniqueId\\":\\"(.*?)\\"/;
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export interface StreamProfile {
  desc: string;
  key: string;
  bitRate: number;
}

export interface StreamInfo {
  quality: string;
  name: string;
  flv?: string;
  hls?: string;
}

export interface SourceProfile {
  name: string;
  streamMap: StreamData["data"];
  streams: StreamInfo[];
}

interface EnterRoomApiResp {
  data: {
    data: [
      | undefined
      | {
          id_str: string;
          status: number;
          status_str: string;
          title: string;
          user_count_str: string;
          cover: {
            url_list: string[];
          };
          stream_url?: {
            flv_pull_url: PullURLMap;
            default_resolution: string;
            hls_pull_url_map: PullURLMap;
            hls_pull_url: string;
            stream_orientation: number;
            live_core_sdk_data: {
              pull_data: {
                options: {
                  default_quality: QualityInfo;
                  qualities: QualityInfo[];
                };
                stream_data: string;
              };
            };
            extra: {
              height: number;
              width: number;
              fps: number;
              max_bitrate: number;
              min_bitrate: number;
              default_bitrate: number;
              bitrate_adapt_strategy: number;
              anchor_interact_profile: number;
              audience_interact_profile: number;
              hardware_encode: boolean;
              video_profile: number;
              h265_enable: boolean;
              gop_sec: number;
              bframe_enable: boolean;
              roi: boolean;
              sw_roi: boolean;
              bytevc1_enable: boolean;
            };
            pull_datas: Record<
              string,
              {
                options: {
                  qualities: QualityInfo[];
                };
                stream_data: string;
              }
            >;
          };
          mosaic_status: number;
          mosaic_status_str: string;
          admin_user_ids: number[];
          admin_user_ids_str: string[];
          owner: UserInfo;
          room_auth: unknown;
          live_room_mode: number;
          stats: {
            total_user_desp: string;
            like_count: number;
            total_user_str: string;
            user_count_str: string;
          };
          has_commerce_goods: boolean;
          linker_map: {};
          linker_detail: unknown;
          room_view_stats: {
            is_hidden: boolean;
            display_short: string;
            display_middle: string;
            display_long: string;
            display_value: number;
            display_version: number;
            incremental: boolean;
            display_type: number;
            display_short_anchor: string;
            display_middle_anchor: string;
            display_long_anchor: string;
          };
          scene_type_info: unknown;
          toolbar_data: unknown;
          room_cart: unknown;
        },
    ];
    enter_room_id: string;
    extra?: {
      digg_color: string;
      pay_scores: string;
      is_official_channel: boolean;
      signature: string;
    };
    user: UserInfo;
    qrcode_url: string;
    enter_mode: number;
    room_status: number;
    partition_road_map?: unknown;
    similar_rooms: unknown[];
    shark_decision_conf: string;
    web_stream_url?: unknown;
  };
  extra: { now: number };
  status_code: number;
}

type PullURLMap = Record<string, string>;

interface QualityInfo {
  name: string;
  sdk_key: string;
  v_codec: string;
  resolution: string;
  level: number;
  v_bit_rate: number;
  additional_content: string;
  fps: number;
  disable: number;
}

interface UserInfo {
  id_str: string;
  sec_uid: string;
  nickname: string;
  avatar_thumb: {
    url_list: string[];
  };
  follow_info: { follow_status: number; follow_status_str: string };
}

interface StreamData {
  common: unknown;
  data: Record<
    string,
    {
      main: {
        flv: string;
        hls: string;
        cmaf: string;
        dash: string;
        lls: string;
        tsl: string;
        tile: string;
        sdk_params: string;
      };
    }
  >;
}
