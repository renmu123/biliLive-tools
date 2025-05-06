import { getRoomInfo } from "./douyin_api.js";

import type { Recorder } from "@bililive-tools/manager";

export async function getInfo(channelId: string): Promise<{
  living: boolean;
  owner: string;
  title: string;
  roomId: string;
  avatar: string;
  cover: string;
  startTime: Date;
  liveId: string;
}> {
  const info = await getRoomInfo(channelId);

  return {
    living: info.living,
    owner: info.owner,
    title: info.title,
    roomId: info.roomId,
    avatar: info.avatar,
    cover: info.cover,
    startTime: new Date(),
    liveId: info.liveId,
  };
}

export async function getStream(
  opts: Pick<Recorder, "channelId" | "quality" | "streamPriorities" | "sourcePriorities"> & {
    rejectCache?: boolean;
    strictQuality?: boolean;
    cookie?: string;
  },
) {
  const info = await getRoomInfo(opts.channelId, true, opts.cookie);
  if (!info.living) {
    throw new Error("It must be called getStream when living");
  }
  let quality = opts.quality;
  if (quality === "real_origin") {
    quality = "ao";
  }

  const qualityMap = [
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
  const sources = info.sources[0];
  console.log(JSON.stringify(sources.streamMap, null, 2));

  let url = sources.streamMap[quality]?.main?.flv;
  let qualityName: string = qualityMap.find((q) => q.key === opts.quality)?.desc ?? "未知";

  if (opts.quality === "real_origin") {
    url = url.replace("&only_audio=1", "");
    qualityName = "真原画";
  }

  if (!url && opts.strictQuality) {
    throw new Error("Can not get expect quality because of strictQuality");
  }
  // 如果url不存在，那么按照优先级选择
  if (!url) {
    for (const quality of qualityMap) {
      url = sources.streamMap[quality.key]?.main?.flv;
      if (url) {
        qualityName = quality.desc;
        break;
      }
    }
  }
  if (!url) {
    throw new Error("未找到对应的流");
  }

  return {
    ...info,
    currentStream: {
      name: qualityName,
      source: "自动",
      url: url,
    },
  };
}
