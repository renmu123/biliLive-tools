/**
 * API 参考自 https://github.com/SocialSisterYi/bilibili-API-collect
 */
import axios from "axios";
import { assert } from "./utils.js";

const requester = axios.create({
  timeout: 10e3,
  // axios 会自动读取环境变量中的 http_proxy 和 https_proxy 并应用，
  // 但会导致请求报错 "Client network socket disconnected before secure TLS connection was established"。
  proxy: false,
});

interface BilibiliResp<T = unknown> {
  code: number;
  message: string;
  msg?: string;
  data: T;
}

export type LiveStatus =
  // 未开播
  | 0
  // 直播中
  | 1
  // 轮播中
  | 2;

export async function getRoomInit(roomIdOrShortId: number) {
  const res = await requester.get<
    BilibiliResp<{
      room_id: number;
      short_id: number;
      uid: number;
      live_status: LiveStatus;
      live_time: number;
      // 是否加密
      encrypted: boolean;
      // 普通直播间 / 付费直播间
      is_sp: 0 | 1;
    }>
  >(`https://api.live.bilibili.com/room/v1/Room/room_init?id=${roomIdOrShortId}`);

  assert(res.data.code === 0, `Unexpected resp, code ${res.data.code}, msg ${res.data.message}`);

  return res.data.data;
}

export async function getRoomInfo(roomIdOrShortId: number) {
  const res = await requester.get<
    BilibiliResp<{
      room_id: number;
      short_id: number;
      uid: number;
      attention: number;
      online: number;
      description: string;
      title: string;
      user_cover: string;
      live_status: LiveStatus;
      // YYYY-MM-DD HH:mm:ss
      live_time: string;
      pk_status: number;
    }>
  >(`https://api.live.bilibili.com/room/v1/Room/get_info?id=${roomIdOrShortId}`);

  assert(res.data.code === 0, `Unexpected resp, code ${res.data.code}, msg ${res.data.message}`);

  return res.data.data;
}

export async function getMasterInfo(userId: number) {
  const res = await requester.get<
    BilibiliResp<{
      info: {
        uname: string;
        face: string;
      };
      exp: {
        level: number;
      };
      follower_num: number;
      medal_name: string;
    }>
  >(`http://api.live.bilibili.com/live_user/v1/Master/info?uid=${userId}`);

  assert(res.data.code === 0, `Unexpected resp, code ${res.data.code}, msg ${res.data.message}`);

  return res.data.data;
}

export async function getStatusInfoByUIDs<UID extends number>(userIds: UID[]) {
  const res = await requester.get<
    BilibiliResp<
      Record<
        UID,
        {
          title: string;
          uname: string;
          face: string;
          live_status: LiveStatus;
          cover_from_user: string;
          live_time: number;
          online: number;
          room_id: number;
          short_id: number;
        }
      >
    >
  >("http://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids", {
    params: { uids: userIds },
  });

  assert(res.data.code === 0, `Unexpected resp, code ${res.data.code}, msg ${res.data.message}`);

  return res.data.data;
}

export async function getRoomBaseInfo<RoomId extends number>(roomId: RoomId) {
  const res = await requester.get<
    BilibiliResp<{
      by_uids: {};
      by_room_ids: Record<
        RoomId,
        {
          title: string;
          uname: string;
          live_time: string;
          // face: string;
          live_status: LiveStatus;
          cover: string;
          is_encrypted: boolean;
          // live_time: number;
          // online: number;
          // room_id: number;
          // short_id: number;
        }
      >;
    }>
  >("https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomBaseInfo", {
    params: { room_ids: roomId, req_biz: "web_room_componet" },
  });

  assert(res.data.code === 0, `Unexpected resp, code ${res.data.code}, msg ${res.data.message}`);

  return res.data.data.by_room_ids;
}

export async function getPlayURL(
  roomId: number,
  opts: {
    useHLS?: boolean;
    quality?: number;
    qn?: string;
  } = {},
) {
  const res = await requester.get<
    BilibiliResp<{
      current_quality: number;
      accept_quality: string[];
      current_qn: number;
      quality_description: StreamProfile[];
      durl: {
        url: string;
        length: number;
        order: number;
        stream_type: number;
        p2p_type: number;
      }[];
    }>
  >(`https://api.live.bilibili.com/room/v1/Room/playUrl`, {
    params: {
      cid: roomId,
      platform: opts.useHLS ? "h5" : "web",
      quality: opts.quality,
      qn: opts.qn,
    },
  });

  assert(res.data.code === 0, `Unexpected resp, code ${res.data.code}, msg ${res.data.message}`);

  return res.data.data;
}

export async function getRoomPlayInfo(
  roomIdOrShortId: number,
  opts: {
    qn?: number;
    cookie?: string;
    onlyAudio?: boolean;
  } = {},
) {
  const res = await requester.get<
    BilibiliResp<{
      uid: number;
      room_id: number;
      short_id: number;
      live_status: LiveStatus;
      live_time: number;
      playurl_info: {
        conf_json: string;
        playurl: {
          g_qn_desc: StreamProfile[];
          stream: ProtocolInfo[];
        };
      };
    }>
  >("https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo", {
    params: {
      room_id: roomIdOrShortId,
      qn: opts.qn,
      // 0 http_stream, 1 http_hls
      protocol: "0,1",
      // 0 avc, 1 hevc
      codec: "0,1",
      // 0 flv, 1 ts, 2 fmp4
      format: "0,1,2",
      only_audio: opts.onlyAudio ? "1" : "0",
    },
    headers: {
      Cookie: opts.cookie,
    },
  });

  assert(res.data.code === 0, `Unexpected resp, code ${res.data.code}, msg ${res.data.message}`);

  return res.data.data;
}

export interface ProtocolInfo {
  protocol_name: "http_stream" | "http_hls";
  format: FormatInfo[];
}

export interface FormatInfo {
  format_name: string | "flv" | "ts" | "fmp4";
  codec: CodecInfo[];
}

export interface CodecInfo {
  codec_name: string | "avc" | "hevc";
  accept_qn: number[];
  base_url: string;
  current_qn: number;
  url_info: Omit<SourceProfile, "name">[];
}

export interface StreamProfile {
  desc: string;
  qn: number;
}

export interface SourceProfile {
  name: string;
  host: string;
  extra: string;
  stream_ttl: number;
}
