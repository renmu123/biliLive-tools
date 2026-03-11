import { v4 as uuid } from "uuid";
import { Recorder } from "@bililive-tools/manager";
import { XhsParser } from "@bililive-tools/stream-get";

export async function check() {
  const parser = new XhsParser();
  const response = await parser.check();
  return response;
}

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
}> {
  const parser = new XhsParser();
  const info = await parser.getLiveInfo(channelId);
  const recordStartTime = new Date();
  return {
    living: info.living,
    owner: info.owner,
    title: info.title,
    avatar: info.avatar,
    cover: info.cover,
    roomId: info.roomId,
    liveStartTime: recordStartTime,
    liveId: uuid(),
    recordStartTime: recordStartTime,
  };
}

export async function getStream(
  opts: Pick<
    Recorder,
    "channelId" | "quality" | "streamPriorities" | "sourcePriorities" | "api" | "formatPriorities"
  > & {
    strictQuality?: boolean;
  },
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
  const parser = new XhsParser();
  const info = await parser.getStreams(opts.channelId, {
    format: opts.formatPriorities ?? ["flv", "hls"],
  });

  let expectSource = info[0] ?? null;
  if (!expectSource.streams.length) {
    throw new Error("没有可用的流");
  }
  let stream = expectSource.streams.find((s) => s.format === "flv");
  if (!stream) {
    stream = expectSource.streams[0];
  }

  let url = stream.url;

  return {
    living: true,
    sources: info,
    streams: stream ? [{ desc: stream.quality }] : [],
    currentStream: {
      name: "原画",
      source: "自动",
      url,
    },
  };
}
