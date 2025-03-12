import { getRoomInfo, SourceProfile, StreamProfile } from "./douyin_api.js";
import { sortBy } from "lodash-es";

import type { Recorder } from "@bililive-tools/manager";

export async function getInfo(channelId: string): Promise<{
  living: boolean;
  owner: string;
  title: string;
  roomId: string;
  avatar: string;
  cover: string;
  startTime: Date;
  liveId?: string;
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
  console.log("opts.quality", opts.quality);
  const sources = info.sources[0];

  let url = sources.streamMap[opts.quality]?.main?.flv;
  let qualityName: string = qualityMap.find((q) => q.key === opts.quality)?.desc ?? "未知";
  // 如果url不存在，那么按照优先级选择
  if (!url) {
    for (const quality of qualityMap) {
      url = sources.streamMap[quality.key]?.main?.flv;
      if (url) {
        console.log("quality", quality);
        qualityName = quality.desc;
        break;
      }
    }
  }
  if (!url) {
    throw new Error("未找到对应的流");
  }
  console.log("url", url, qualityName);

  return {
    ...info,
    currentStream: {
      name: qualityName,
      source: "自动",
      url: url,
    },
  };
}

/**
 * 按提供的流优先级去给流列表排序，并过滤掉不在优先级配置中的流
 */
function sortAndFilterStreamsByPriority(
  streams: StreamProfile[],
  streamPriorities: Recorder["streamPriorities"],
): (StreamProfile & {
  priority: number;
})[] {
  if (streamPriorities.length === 0) return [];

  return sortBy(
    // 分配优先级属性，数字越大优先级越高
    streams
      .map((stream) => ({
        ...stream,
        priority: streamPriorities.toReversed().indexOf(stream.desc),
      }))
      .filter(({ priority }) => priority !== -1),
    "priority",
  );
}

/**
 * 按提供的源优先级去给源列表排序，并过滤掉不在优先级配置中的源
 */
function sortAndFilterSourcesByPriority(
  sources: SourceProfile[],
  sourcePriorities: Recorder["sourcePriorities"],
): (SourceProfile & {
  priority: number;
})[] {
  if (sourcePriorities.length === 0) return [];

  return sortBy(
    // 分配优先级属性，数字越大优先级越高
    sources
      .map((source) => ({
        ...source,
        priority: sourcePriorities.toReversed().indexOf(source.name),
      }))
      .filter(({ priority }) => priority !== -1),
    "priority",
  );
}
