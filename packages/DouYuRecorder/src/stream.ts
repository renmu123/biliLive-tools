import { live } from "douyu-api";

import { DouyuQualities, Recorder, utils } from "@bililive-tools/manager";
import { getLiveInfo } from "./dy_api.js";
import { requester } from "./requester.js";

export async function getInfo(channelId: string): Promise<{
  living: boolean;
  owner: string;
  title: string;
  startTime: Date;
  avatar: string;
  cover: string;
  liveId: string;
  // gifts: {
  //   id: string;
  //   name: string;
  //   img: string;
  //   cost: number;
  // }[];
}> {
  const res = await requester.get<
    | {
        error: number;
        data: {
          room_status: string;
          owner_name: string;
          avatar: string;
          room_name: string;
          start_time: string;
          gift: {
            id: string;
            name: string;
            himg: string;
            pc: number;
          }[];
        };
      }
    | string
  >(`http://open.douyucdn.cn/api/RoomApi/room/${channelId}`);

  if (res.status !== 200) {
    if (res.status === 404 && res.data === "Not Found") {
      throw new Error("错误的地址 " + channelId);
    }

    throw new Error(`Unexpected status code, ${res.status}, ${res.data}`);
  }

  if (typeof res.data !== "object")
    throw new Error(`Unexpected response, ${res.status}, ${res.data}`);

  const json = res.data;
  if (json.error === 101) throw new Error("错误的地址 " + channelId);
  if (json.error !== 0) throw new Error("Unexpected error code, " + json.error);
  let living = json.data.room_status === "1";

  const data = await live.getRoomInfo(Number(channelId));
  if (living) {
    const isVideoLoop = data.room.videoLoop === 1;
    if (isVideoLoop) {
      living = false;
    }
  }

  const startTime = new Date(data.room.show_time * 1000);
  return {
    living,
    owner: data.room.nickname,
    title: data.room.room_name,
    avatar: data.room.avatar.big,
    cover: data.room.room_pic,
    startTime: startTime,
    liveId: utils.md5(`${channelId}-${startTime?.getTime() ?? Date.now()}`),

    // gifts: data.gift.map((g) => ({
    //   id: g.id,
    //   name: g.name,
    //   img: g.himg,
    //   cost: g.pc,
    // })),
  };
}

export async function getStream(
  opts: Pick<Recorder, "channelId" | "quality"> & {
    rejectCache?: boolean;
    strictQuality?: boolean;
    source?: string;
    onlyAudio?: boolean;
    avoidEdgeCDN?: boolean;
  },
) {
  const qn = (
    DouyuQualities.includes(opts.quality as any) ? opts.quality : 0
  ) as (typeof DouyuQualities)[number];

  let cdn = opts.source === "auto" ? undefined : opts.source;
  if (opts.source === "auto" && opts.avoidEdgeCDN) {
    cdn = "hw-h5";
  }
  let liveInfo = await getLiveInfo({
    channelId: opts.channelId,
    rate: qn,
    cdn,
    onlyAudio: opts.onlyAudio,
  });
  if (!liveInfo.living) throw new Error("It must be called getStream when living");

  // console.log(JSON.stringify(liveInfo, null, 2));

  if (liveInfo.currentStream.rate !== qn && opts.strictQuality) {
    throw new Error("Can not get expect quality because of strictQuality");
  }

  let expectSource = liveInfo.sources[0];
  if (!expectSource) {
    throw new Error("Source list is empty");
  }

  // 是否存在画质下没有source的情况，可能需要切换画质
  if (liveInfo.currentStream.rate !== qn) {
    if (liveInfo.streams.length === 0) {
      throw new Error("Can not get expect quality because of no available stream");
    } else {
      liveInfo = await getLiveInfo({
        channelId: opts.channelId,
        rate: liveInfo.streams[0].rate,
        onlyAudio: opts.onlyAudio,
      });
      if (!liveInfo.living) throw new Error("It must be called getStream when living");
    }
  }

  // 流未准备好，防止刚开播时的无效录制。
  // 该判断可能导致开播前 30 秒左右无法录制到，因为 streamStatus 在后端似乎有缓存，所以暂时不使用。
  // TODO: 需要在 ffmpeg 那里加处理，防止无效录制
  // if (!json.data.streamStatus) return

  return liveInfo;
}
