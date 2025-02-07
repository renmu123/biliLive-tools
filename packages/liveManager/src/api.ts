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

type LiveStatus =
  // 未开播
  | 0
  // 直播中
  | 1
  // 轮播中
  | 2;

export async function getBiliStatusInfoByUIDs<UID extends number>(userIds: UID[]) {
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

  const obj: Record<string, boolean> = {};
  for (const uid of userIds) {
    const data = res.data.data?.[uid];
    obj[uid] = data?.live_status === 1;
  }
  return obj;
}
