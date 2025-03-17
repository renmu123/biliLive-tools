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
  },
) {
  const info = await getRoomInfo(opts.channelId);
  if (!info.living) {
    throw new Error("It must be called getStream when living");
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
      key: "标清",
      desc: "ld",
    },
  ];
  const sources = info.sources[0];

  let url = sources.streamMap[opts.quality]?.main?.flv;
  let qualityName: string = qualityMap.find((q) => q.key === opts.quality)?.desc ?? "未知";
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
