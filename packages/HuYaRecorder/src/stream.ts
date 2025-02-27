import { sortBy } from "lodash-es";
import { HuYaQualities, Recorder } from "@bililive-tools/manager";

import { getRoomInfo as getRoomInfoByWeb } from "./huya_api.js";
import { getRoomInfo as getRoomInfoByMobile } from "./huya_mobile_api.js";
import { assert } from "./utils.js";

import type { SourceProfile, StreamProfile } from "./huya_api.js";

export async function getInfo(channelId: string): Promise<{
  living: boolean;
  owner: string;
  title: string;
  roomId: number;
  avatar: string;
  cover: string;
  startTime: Date;
  liveId?: string;
}> {
  const info = await getRoomInfoByWeb(channelId);

  return {
    living: info.living,
    owner: info.owner,
    title: info.title,
    avatar: info.avatar,
    cover: info.cover,
    roomId: info.roomId,
    startTime: info.startTime,
    liveId: info.liveId,
  };
}

async function getRoomInfo(
  channelId: string,
  api: "auto" | "mobile" | "web" = "auto",
): ReturnType<typeof getRoomInfoByMobile> {
  if (api == "auto") {
    const info = await getRoomInfoByWeb(channelId);
    if (info.gid == 1663) {
      return getRoomInfoByMobile(channelId);
    }
    return info;
  } else if (api == "mobile") {
    return getRoomInfoByMobile(channelId);
  } else if (api == "web") {
    return getRoomInfoByWeb(channelId);
  }
  assert(false, "Invalid api");
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
  if (info.streams.length === 0) {
    throw new Error(`No stream found in huya ${opts.channelId} room`);
  }

  const qn = (
    HuYaQualities.includes(opts.quality as any) ? opts.quality : 0
  ) as (typeof HuYaQualities)[number];
  let expectStream: StreamProfile | undefined = info.streams.find(
    (stream) => stream.bitRate === qn,
  );
  if (!expectStream) {
    expectStream = info.streams[0];
  }
  // const streamsWithPriority = sortAndFilterStreamsByPriority(info.streams, opts.streamPriorities);
  // if (streamsWithPriority.length > 0) {
  //   // 通过优先级来选择对应流
  //   expectStream = streamsWithPriority[0];
  // } else {
  //   // 通过设置的画质选项来选择对应流
  //   const flexedStreams = getValuesFromArrayLikeFlexSpaceBetween(
  //     // 接口给的画质列表是按照清晰到模糊的顺序的，这里翻转下
  //     info.streams.toReversed(),
  //     Qualities.length,
  //   );
  //   const qn = (
  //     Qualities.includes(opts.quality as any) ? opts.quality : "highest"
  //   ) as (typeof Qualities)[number];
  //   expectStream = flexedStreams[Qualities.indexOf(qn)];
  // }

  let expectSource: SourceProfile | null = null;
  const sourcesWithPriority = sortAndFilterSourcesByPriority(info.sources, opts.sourcePriorities);
  if (sourcesWithPriority.length > 0) {
    expectSource = sourcesWithPriority[0];
  } else {
    expectSource = info.sources.find((source) => source.name === "TX");
    if (!expectSource) {
      expectSource = info.sources[0];
    }
  }

  return {
    ...info,
    currentStream: {
      name: expectStream.desc,
      source: expectSource.name,
      url: expectSource.url + "&ratio=" + expectStream.bitRate,
    },
  };
}

// /**
//  * 按提供的流优先级去给流列表排序，并过滤掉不在优先级配置中的流
//  */
// function sortAndFilterStreamsByPriority(
//   streams: StreamProfile[],
//   streamPriorities: Recorder["streamPriorities"],
// ): (StreamProfile & {
//   priority: number;
// })[] {
//   if (streamPriorities.length === 0) return [];

//   return sortBy(
//     // 分配优先级属性，数字越大优先级越高
//     streams
//       .map((stream) => ({
//         ...stream,
//         priority: streamPriorities.toReversed().indexOf(stream.desc),
//       }))
//       .filter(({ priority }) => priority !== -1),
//     "priority",
//   );
// }

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
