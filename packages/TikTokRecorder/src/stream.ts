import { utils } from "@bililive-tools/manager";
import { TikTokParser } from "@bililive-tools/stream-get";

import type { Recorder } from "@bililive-tools/manager";
import type {
  SourceInfo,
  StreamInfo,
  TikTokApiMode,
  TikTokStreamFormat,
} from "@bililive-tools/stream-get";

export interface TikTokRequestOptions {
  api?: TikTokApiMode | string;
  auth?: string;
  proxy?: string;
}

export async function getInfo(
  channelId: string,
  opts: TikTokRequestOptions = {},
): Promise<{
  living: boolean;
  owner: string;
  title: string;
  avatar: string;
  cover: string;
  liveStartTime: Date;
  liveId: string;
  webcastRoomId?: string;
  recordStartTime: Date;
  area: string;
}> {
  const parser = new TikTokParser({
    cookie: opts.auth,
    proxy: opts.proxy,
  });
  const info = await parser.getRoomInfo(channelId, {
    api: opts.api as TikTokApiMode | undefined,
    raw: true,
  });
  const rawRoomInfo = info.raw?.LiveRoom?.liveRoomUserInfo ?? info.raw?.data;
  const rawWebcastRoomId = rawRoomInfo?.user?.roomId;
  const recordStartTime = new Date();
  const liveStartTime = info.liveStartTime ?? recordStartTime;

  return {
    living: info.living,
    owner: info.owner,
    title: info.title,
    avatar: info.avatar || "",
    cover: info.cover || "",
    liveStartTime,
    liveId: utils.md5(`${channelId}-${liveStartTime.getTime()}`),
    webcastRoomId:
      rawWebcastRoomId === undefined || rawWebcastRoomId === null
        ? undefined
        : String(rawWebcastRoomId),
    recordStartTime,
    area: info.area || "",
  };
}

type TikTokRecorderStreamOptions = Pick<
  Recorder,
  "channelId" | "quality" | "api" | "auth" | "proxy" | "codecName" | "formatPriorities"
> & {
  strictQuality?: boolean;
};

type TikTokStream = StreamInfo<string>;

function selectQuality(streams: TikTokStream[], quality: Recorder["quality"]) {
  const qualities = streams.filter(
    (stream, index, list) => list.findIndex((item) => item.quality === stream.quality) === index,
  );
  if (qualities.length === 0) return undefined;

  return qualities.find((stream) => stream.quality === quality)?.quality;
}

function isExpectedCodec(stream: TikTokStream, codecName: Recorder["codecName"]) {
  const codec = String(stream.codec ?? "").toLowerCase();
  if (codecName === "hevc_only") return codec.includes("265") || codec.includes("hevc");
  if (codecName === "avc_only") return codec.includes("264") || codec.includes("avc");
  return true;
}

function selectCodec(streams: TikTokStream[], codecName: Recorder["codecName"]) {
  if (codecName === "hevc" || codecName === "hevc_only") {
    const stream = streams.find((item) => isExpectedCodec(item, "hevc_only"));
    return stream ?? (codecName === "hevc" ? streams[0] : undefined);
  }
  if (codecName === "avc" || codecName === "avc_only") {
    const stream = streams.find((item) => isExpectedCodec(item, "avc_only"));
    return stream ?? (codecName === "avc" ? streams[0] : undefined);
  }
  return streams[0];
}

const qualityList = [
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
];

export async function getStream(opts: TikTokRecorderStreamOptions): Promise<{
  living: true;
  sources: SourceInfo<string>[];
  streams: { desc: string }[];
  currentStream: {
    source: string;
    name: string;
    url: string;
    onlyAudio: boolean;
  };
}> {
  const formatPriorities: TikTokStreamFormat[] = opts.formatPriorities ?? ["flv", "hls"];
  const parser = new TikTokParser({
    cookie: opts.auth,
    proxy: opts.proxy,
  });
  const sources = await parser.getStreams(opts.channelId, {
    api: opts.api as TikTokApiMode | undefined,
    format: formatPriorities,
  });
  const source = sources[0];
  if (!source || source.streams.length === 0) {
    throw new Error("没有可用的 TikTok 直播流");
  }
  const streams = source.streams;

  const selectedQuality = selectQuality(streams, opts.quality);
  if (!selectedQuality && opts.strictQuality) {
    throw new Error("Can not get expect quality because of strictQuality");
  }

  const quality = selectedQuality ?? streams[0].quality;
  const stream = selectCodec(
    streams.filter((item) => item.quality === quality),
    opts.codecName,
  );
  if (!stream) {
    throw new Error("未找到可用的录制流");
  }

  const availableStreams = streams.filter(
    (item, index, list) =>
      list.findIndex((candidate) => candidate.quality === item.quality) === index,
  );

  const qualityDesc =
    qualityList.find((item) => item.key === stream.quality)?.desc ?? stream.qualityDesc;

  let onlyAudio = false;
  try {
    const urlObj = new URL(stream.url);
    if (urlObj.searchParams.get("only_audio") == "1") {
      onlyAudio = true;
    }
  } catch (error) {
    console.warn("解析流 URL 失败", error);
  }

  return {
    living: true,
    sources,
    streams: availableStreams.map((item) => ({
      desc: item.qualityDesc || item.quality,
    })),
    currentStream: {
      source: source.name,
      name: qualityDesc,
      url: stream.url,
      onlyAudio,
    },
  };
}
