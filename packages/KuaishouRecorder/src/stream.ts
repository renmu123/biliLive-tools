import { KuaishouParser } from "@bililive-tools/stream-get";
import type { Recorder } from "@bililive-tools/manager";

/**
 * 从录播机选项中获取快手直播信息
 */
export async function getInfo(channelId: string): Promise<{
  living: boolean;
  owner: string;
  title: string;
  roomId: string;
  avatar: string;
  cover: string;
  liveStartTime: Date;
  liveId: string;
  recordStartTime: Date;
  area: string;
}> {
  const parser = new KuaishouParser();
  const info = await parser.getRoomInfo(channelId);
  const now = new Date();

  return {
    living: info.living,
    owner: info.owner,
    title: info.title,
    avatar: info.avatar || "",
    cover: info.cover || "",
    roomId: info.roomId,
    liveStartTime: now,
    liveId: info.roomId,
    recordStartTime: now,
    area: "",
  };
}

/**
 * 获取快手直播流地址
 */
export async function getStream(
  opts: Pick<Recorder, "channelId" | "quality" | "streamPriorities" | "sourcePriorities" | "formatPriorities">,
): Promise<{
  living: true;
  sources: { name: string }[];
  streams: { desc: string }[];
  currentStream: {
    source: string;
    name: string;
    url: string;
  };
}> {
  const parser = new KuaishouParser();
  const sources = await parser.getStreams(opts.channelId);

  if (!sources.length) {
    throw new Error("没有可用的直播流");
  }

  // 优先选择第一个 source
  const firstSource = sources[0];

  // 流选择逻辑：优先 FLV，然后选最高码率画质
  const formatPrios = opts.formatPriorities ?? ["flv", "hls"];
  let stream = firstSource.streams[0];

  // 按 format 优先级选流，同 format 优先最高 bitrate
  for (const fmt of formatPrios) {
    const sameFmt = firstSource.streams.filter((s: any) => s.format === fmt);
    if (sameFmt.length > 0) {
      // 按 bitrate 降序，取最高画质
      sameFmt.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
      stream = sameFmt[0];
      break;
    }
  }

  return {
    living: true,
    sources: sources.map((s) => ({ name: s.name })),
    streams: firstSource.streams.map((s: any) => ({
      desc: s.bitrate > 0
        ? `${s.qualityDesc} (${(s.bitrate / 1000).toFixed(0)}Mbps)`
        : s.qualityDesc,
    })),
    currentStream: {
      name: stream.qualityDesc || "自动",
      source: firstSource.name,
      url: stream.url,
    },
  };
}
