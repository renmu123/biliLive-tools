import { getRoomInfo } from "./douyin_api.js";

import type { Recorder } from "@bililive-tools/manager";

export async function getInfo(
  channelId: string,
  opts?: {
    cookie?: string;
    api?: "web" | "webHTML";
  },
): Promise<{
  living: boolean;
  owner: string;
  title: string;
  roomId: string;
  avatar: string;
  cover: string;
  startTime: Date;
  liveId: string;
}> {
  const info = await getRoomInfo(channelId, opts ?? {});

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
    formatPriorities?: Array<"flv" | "hls">;
    doubleScreen?: boolean;
    api?: "web" | "webHTML";
  },
) {
  const info = await getRoomInfo(opts.channelId, {
    doubleScreen: opts.doubleScreen ?? true,
    auth: opts.cookie,
    api: opts.api ?? "web",
  });
  if (!info.living) {
    throw new Error("It must be called getStream when living");
  }

  // 抖音为自动cdn，所以指定选择第一个
  const sources = info.sources[0];
  const formatPriorities = opts.formatPriorities || ["flv", "hls"];

  // 查找指定质量的流
  let targetStream = sources.streams.find((s) => s.quality === opts.quality);
  let qualityName = targetStream?.name ?? "未知";

  if (!targetStream && opts.strictQuality) {
    throw new Error("Can not get expect quality because of strictQuality");
  }

  // 如果找不到指定质量的流，按照流顺序选择第一个可用的流
  if (!targetStream) {
    targetStream = sources.streams.find((stream) => stream.flv || stream.hls);
    if (targetStream) {
      qualityName = targetStream.name;
    }
  }
  if (!targetStream) {
    throw new Error("未找到对应的流");
  }

  // 根据格式优先级选择 URL
  let url: string | undefined;
  for (const format of formatPriorities) {
    url = targetStream[format];
    if (url) break;
  }

  if (!url) {
    throw new Error("未找到对应的流");
  }

  return {
    ...info,
    currentStream: {
      name: qualityName,
      source: "自动",
      url: url!,
    },
  };
}
