import { Recorder } from "@bililive-tools/manager";
import { XhsParser } from "@bililive-tools/stream-get";

export async function check(redId: string, cookie: string) {
  const parser = new XhsParser();
  const response = await parser.check(redId, cookie);
  if (response?.success !== true) {
    throw new Error("自动检查失败，可能是cookie无效了");
  }
  const user = response?.data?.users?.[0];
  if (!user) {
    throw new Error("自动检查失败，未找到用户信息，确认小红书号是否修改");
  }
  let data = {
    living: user?.live_info?.status === 2,
    roomId: user?.live_info?.room_id,
    xsecToken: response?.data?.xsec_token,
    liveStartTime: user?.live_info?.start_time ? new Date(user.live_info.start_time) : new Date(),
    owner: user.name,
    avatar: user.image,
  };
  return data;
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
  area: string;
}> {
  const parser = new XhsParser();
  const info = await parser.getLiveInfo(channelId);
  const recordStartTime = new Date();
  return {
    living: info.living,
    owner: info.owner,
    title: info.title,
    avatar: info.avatar || "",
    cover: info.cover || "",
    roomId: info.roomId,
    liveStartTime: recordStartTime,
    liveId: info.roomId,
    recordStartTime: recordStartTime,
    area: "",
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
