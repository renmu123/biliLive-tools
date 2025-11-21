import { getRoomInfo, selectRandomAPI } from "./douyin_api.js";
import { globalLoadBalancer } from "./loadBalancer/loadBalancer.js";

import type { Recorder } from "@bililive-tools/manager";
import type { APIType, RealAPIType } from "./types.js";

export async function getInfo(
  channelId: string,
  opts?: {
    cookie?: string;
    api?: APIType;
    uid?: string | number;
  },
): Promise<{
  living: boolean;
  owner: string;
  title: string;
  roomId: string;
  avatar: string;
  cover: string;
  liveId: string;
  uid: string;
  api: RealAPIType;
  liveStartTime: Date;
  recordStartTime: Date;
}> {
  let info;

  // 如果使用 balance 模式，使用负载均衡器
  if (opts?.api === "balance") {
    info = await globalLoadBalancer.callWithLoadBalance(channelId, {
      auth: opts.cookie,
      uid: opts.uid,
    });
  } else {
    info = await getRoomInfo(channelId, opts ?? {});
  }
  const startTime = new Date();
  return {
    living: info.living,
    owner: info.owner,
    title: info.title,
    roomId: info.roomId,
    avatar: info.avatar,
    cover: info.cover,
    liveId: info.liveId,
    uid: info.uid,
    api: info.api,
    liveStartTime: startTime,
    recordStartTime: startTime,
  };
}

export async function getStream(
  opts: Pick<Recorder, "channelId" | "quality" | "streamPriorities" | "sourcePriorities"> & {
    rejectCache?: boolean;
    strictQuality?: boolean;
    cookie?: string;
    formatPriorities?: Array<"flv" | "hls">;
    doubleScreen?: boolean;
    api?: APIType;
    uid?: string | number;
  },
) {
  let api = opts.api ?? "web";
  if (api === "userHTML") {
    // userHTML 接口只能用于状态检测
    api = "web";
  } else if (api === "random") {
    api = selectRandomAPI(["userHTML"]);
  }
  const info = await getRoomInfo(opts.channelId, {
    doubleScreen: opts.doubleScreen ?? true,
    auth: opts.cookie,
    api: api,
    uid: opts.uid,
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

  let onlyAudio = false;
  try {
    const urlObj = new URL(url);
    if (urlObj.searchParams.get("only_audio") == "1") {
      onlyAudio = true;
    }
  } catch (error) {
    console.warn("解析流 URL 失败", error);
  }

  return {
    ...info,
    currentStream: {
      name: qualityName,
      source: "自动",
      url: url,
      onlyAudio,
    },
  };
}
