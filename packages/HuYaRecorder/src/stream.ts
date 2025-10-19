import { sortBy } from "lodash-es";
import { HuYaQualities, Recorder } from "@bililive-tools/manager";

import { getRoomInfo as getRoomInfoByWeb } from "./huya_api.js";
import { getRoomInfo as getRoomInfoByMobile } from "./huya_mobile_api.js";
import { assert } from "./utils.js";

import type { SourceProfile, StreamProfile } from "./types.js";

export async function getInfo(channelId: string): Promise<{
  living: boolean;
  owner: string;
  title: string;
  roomId: number;
  avatar: string;
  cover: string;
  startTime: Date;
  liveId: string;
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
  options: {
    api: "auto" | "mp" | "web";
    formatPriorities: Array<"flv" | "hls">;
    quality?: Recorder["quality"];
  },
): ReturnType<typeof getRoomInfoByMobile> {
  if (options.api == "auto") {
    const info = await getRoomInfoByWeb(channelId, {
      formatPriorities: options.formatPriorities,
      quality: options.quality,
    });
    if (info.gid == 1663) {
      return getRoomInfoByMobile(channelId, options.formatPriorities);
    }
    return info;
  } else if (options.api == "mp") {
    return getRoomInfoByMobile(channelId, options.formatPriorities);
  } else if (options.api == "web") {
    return getRoomInfoByWeb(channelId, {
      formatPriorities: options.formatPriorities,
      quality: options.quality,
    });
  }
  assert(false, "Invalid api");
}

export async function getStream(
  opts: Pick<
    Recorder,
    "channelId" | "quality" | "streamPriorities" | "sourcePriorities" | "api" | "formatPriorities"
  > & {
    strictQuality?: boolean;
    api?: "web" | "mp" | "auto";
  },
) {
  const info = await getRoomInfo(opts.channelId, {
    api: opts.api ?? "auto",
    formatPriorities: opts.formatPriorities ?? ["flv", "hls"],
    quality: opts.quality,
  });
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
  if (!expectStream && opts.strictQuality) {
    throw new Error("Can not get expect quality because of strictQuality");
  }
  if (!expectStream) {
    expectStream = info.streams[0];
  }
  if (!expectStream) {
    throw new Error("未找到对应的流");
  }

  let expectSource: SourceProfile | null = null;
  const sourcesWithPriority = sortAndFilterSourcesByPriority(info.sources, opts.sourcePriorities);
  if (sourcesWithPriority.length > 0) {
    expectSource = sourcesWithPriority[0];
  } else {
    expectSource = info.sources.find((source) => source.name === "TX") ?? null;
    if (!expectSource) {
      expectSource = info.sources[0];
    }
    if (expectSource.name === "TX") {
      expectSource.url = expectSource.url
        .replace("&ctype=tars_mp", "&ctype=huya_webh5")
        .replace("&fs=bhct", "&fs=bgct");
    }
  }

  let url = expectSource.url;
  // MP协议下原画不需要添加ratio参数
  if (expectStream.bitRate && expectStream.bitRate !== -1 && !url.includes("ratio=")) {
    url = url + "&ratio=" + expectStream.bitRate;
  }

  return {
    ...info,
    currentStream: {
      name: expectStream.desc,
      source: expectSource.name,
      url,
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
