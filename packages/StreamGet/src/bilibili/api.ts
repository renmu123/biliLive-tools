/**
 * Bilibili API 层
 * API 参考：https://github.com/SocialSisterYi/bilibili-API-collect
 */

import type { HttpClient } from "../http.js";
import { ParseError } from "../errors.js";
import type { BilibiliResp, LiveStatus, ProtocolInfo, StreamProfile } from "./types.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new ParseError(message, "bilibili");
  }
}

export async function getRoomInit(http: HttpClient, roomIdOrShortId: number) {
  const data = await http.get<
    BilibiliResp<{
      room_id: number;
      short_id: number;
      uid: number;
      live_status: LiveStatus;
      live_time: number;
      encrypted: boolean;
      is_sp: 0 | 1;
    }>
  >(`https://api.live.bilibili.com/room/v1/Room/room_init?id=${roomIdOrShortId}`);

  assert(data.code === 0, `Unexpected resp, code ${data.code}, msg ${data.message}`);

  return data.data;
}

export async function getRoomBaseInfo<RoomId extends number>(http: HttpClient, roomId: RoomId) {
  const url = new URL("https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomBaseInfo");
  url.searchParams.set("room_ids", String(roomId));
  url.searchParams.set("req_biz", "web_room_componet");

  const response = await http.get<
    BilibiliResp<{
      by_uids: {};
      by_room_ids: Record<
        RoomId,
        {
          title: string;
          uname: string;
          live_time: string;
          live_status: LiveStatus;
          cover: string;
          keyframe: string;
          is_encrypted: boolean;
          uid: number;
          area_name: string;
          area_id: number;
        }
      >;
    }>
  >(url.toString());

  assert(response.code === 0, `Unexpected resp, code ${response.code}, msg ${response.message}`);

  return response.data.by_room_ids;
}

export async function getStatusInfoByUIDs<UID extends number>(http: HttpClient, userIds: UID[]) {
  const url = new URL("http://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids");
  url.searchParams.set("uids[]", userIds.join(","));

  const response = await http.get<
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
  >(url.toString());

  assert(response.code === 0, `Unexpected resp, code ${response.code}, msg ${response.message}`);

  return response.data;
}

export async function getRoomPlayInfo(
  http: HttpClient,
  roomIdOrShortId: number,
  opts: {
    qn?: number;
    cookie?: string;
    onlyAudio?: boolean;
  } = {},
) {
  const url = new URL("https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo");
  url.searchParams.set("room_id", String(roomIdOrShortId));
  url.searchParams.set("qn", String(opts.qn || 10000));
  url.searchParams.set("protocol", "0,1");
  url.searchParams.set("codec", "0,1");
  url.searchParams.set("format", "0,1,2");
  url.searchParams.set("only_audio", opts.onlyAudio ? "1" : "0");

  const response = await http.get<
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
  >(url.toString(), {
    headers: {
      Cookie: opts.cookie || "",
    },
  });

  assert(response.code === 0, `Unexpected resp, code ${response.code}, msg ${response.message}`);

  return response.data;
}
