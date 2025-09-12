import axios from "axios";
import { isEmpty } from "lodash-es";
import { assert, get__ac_signature } from "./utils.js";
import { ABogus } from "./sign.js";

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
 * 通过解析html页面来获取房间数据
 * @param webRoomId
 * @param opts
 */
async function getRoomInfoByHtml(
  webRoomId: string,
  opts: {
    auth?: string;
    doubleScreen?: boolean;
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
    doubleScreen?: boolean;
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
    room: {
      title: room.title,
      cover: room.cover?.url_list?.[0],
      id_str: room.id_str,
      stream_url: room.stream_url,
    },
  };
}

export async function getRoomInfo(
  webRoomId: string,
  opts: {
    auth?: string;
    doubleScreen?: boolean;
    api?: "web" | "webHTML";
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
}> {
  let data: Awaited<ReturnType<typeof getRoomInfoByWeb> | ReturnType<typeof getRoomInfoByHtml>>;

  if (opts.api === "webHTML") {
    data = await getRoomInfoByHtml(webRoomId, opts);
  } else {
    data = await getRoomInfoByWeb(webRoomId, opts);
  }
  const room = data.room;
  assert(room, `No room data, id ${webRoomId}`);
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
  };
}

/**
 * 解析抖音号
 * @param url
 */
export async function parseUser(url: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0";
  const nonce = generateNonce();
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
