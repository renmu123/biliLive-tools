import { Recorder, BiliQualities, utils } from "@bililive-tools/manager";
import {
  CodecInfo,
  FormatInfo,
  getRoomInit,
  getRoomPlayInfo,
  getStatusInfoByUIDs,
  ProtocolInfo,
  SourceProfile,
  StreamProfile,
  getRoomBaseInfo,
} from "./bilibili_api.js";
import { assert } from "./utils.js";

import type { RecorderCreateOpts } from "@bililive-tools/manager";

export async function getStrictStream(
  roomId: number,
  options: {
    qn: number;
    cookie?: string;
    protocol_name: string;
    format_name: string;
    codec_name: string;
  },
) {
  const res = await getRoomPlayInfo(roomId, options);
  const streamInfo = res.playurl_info.playurl.stream
    .find(({ protocol_name }) => protocol_name === options.protocol_name)
    ?.format.find(({ format_name }) => format_name === options.format_name)
    ?.codec.find(({ codec_name }) => codec_name === options.codec_name);

  assert(streamInfo, "没有找到支持的流");

  const expectSource = streamInfo.url_info[0];
  const url = expectSource.host + streamInfo.base_url + expectSource.extra;
  return url;
}

export async function getLiveStatus(channelId: string): Promise<{
  living: boolean;
  liveId: string;
}> {
  const roomInit = await getRoomInit(Number(channelId));
  const startTime = new Date(roomInit.live_time * 1000);
  return {
    living: roomInit.live_status === 1 && !roomInit.encrypted,
    liveId: utils.md5(`${roomInit.room_id}-${startTime?.getTime()}`),
    ...roomInit,
  };
}

export async function getInfo(channelId: string): Promise<{
  living: boolean;
  owner: string;
  title: string;
  roomId: number;
  shortId: number;
  avatar: string;
  cover: string;
  startTime: Date;
  uid: number;
  liveId: string;
}> {
  const roomInit = await getRoomInit(Number(channelId));
  const { [roomInit.uid]: status } = await getStatusInfoByUIDs([roomInit.uid]);
  if (!status) {
    // 未获取到直播间信息，可能是加密，尝试换一个接口
    const data = await getRoomBaseInfo(Number(channelId));
    const status = data[channelId];

    const startTime = new Date(status.live_time);
    return {
      uid: roomInit.uid,
      living: roomInit.live_status === 1 && !roomInit.encrypted,
      owner: status.uname,
      title: status.title,
      startTime: startTime,
      avatar: "",
      cover: status.cover,
      roomId: roomInit.room_id,
      shortId: roomInit.short_id,
      liveId: utils.md5(`${roomInit.room_id}-${startTime?.getTime()}`),
    };
  }

  const startTime = new Date(status.live_time * 1000);

  return {
    uid: roomInit.uid,
    living: roomInit.live_status === 1 && !roomInit.encrypted,
    owner: status.uname,
    title: status.title,
    avatar: status.face,
    cover: status.cover_from_user,
    roomId: roomInit.room_id,
    shortId: roomInit.short_id,
    startTime: startTime,
    liveId: utils.md5(`${roomInit.room_id}-${startTime.getTime()}`),
  };
}

async function getLiveInfo(
  roomIdOrShortId: number,
  opts: {
    qn: number;
    cookie?: string;
    formatName: RecorderCreateOpts["formatName"];
    codecName: RecorderCreateOpts["codecName"];
  },
) {
  const res = await getRoomPlayInfo(roomIdOrShortId, opts);

  // https://github.com/FFmpeg/FFmpeg/commit/b76053d8bf322b197a9d07bd27bbdad14fd5bc15
  let conditons: {
    protocol_name: ProtocolInfo["protocol_name"];
    format_name: FormatInfo["format_name"];
    codec_name: CodecInfo["codec_name"];
    sort: number;
  }[] = [
    {
      protocol_name: "http_stream",
      format_name: "flv",
      codec_name: "avc",
      sort: 9,
    },
    {
      protocol_name: "http_hls",
      format_name: "fmp4",
      codec_name: "avc",
      sort: 8,
    },
    {
      protocol_name: "http_hls",
      format_name: "ts",
      codec_name: "avc",
      sort: 7,
    },
    {
      protocol_name: "http_stream",
      format_name: "flv",
      codec_name: "hevc",
      sort: 6,
    },
    {
      protocol_name: "http_hls",
      format_name: "fmp4",
      codec_name: "hevc",
      sort: 5,
    },
    {
      protocol_name: "http_hls",
      format_name: "ts",
      codec_name: "hevc",
      sort: 4,
    },
  ];

  // 处理formatName
  if (opts.formatName === "flv_only") {
    conditons = conditons.filter((item) => item.format_name === "flv");
  } else if (opts.formatName === "hls_only") {
    conditons = conditons.filter((item) => item.format_name === "ts");
  } else if (opts.formatName === "fmp4_only") {
    conditons = conditons.filter((item) => item.format_name === "fmp4");
  } else if (opts.formatName === "hls") {
    // hls优先,avc比hevc优先
    conditons.forEach((item) => {
      if (item.format_name === "ts") {
        item.sort += 10;
      }
    });
    conditons = conditons.sort((a, b) => b.sort - a.sort);
  } else if (opts.formatName === "fmp4") {
    // fmp4优先,将format_name=fmp4的放在前面,avc比hevc优先
    conditons.forEach((item) => {
      if (item.format_name === "fmp4") {
        item.sort += 10;
      }
    });
    conditons = conditons.sort((a, b) => b.sort - a.sort);
  }

  // 处理codecName
  if (opts.codecName === "avc_only") {
    conditons = conditons.filter((item) => item.codec_name === "avc");
  } else if (opts.codecName === "hevc_only") {
    conditons = conditons.filter((item) => item.codec_name === "hevc");
  } else if (opts.codecName === "hevc") {
    conditons.forEach((item) => {
      if (item.codec_name === "hevc") {
        item.sort += 100;
      }
    });
    conditons = conditons.sort((a, b) => b.sort - a.sort);
  }

  // console.log("conditons", opts.codecName, conditons);

  let streamInfo: CodecInfo | undefined;
  let streamOptions!: {
    protocol_name: "http_stream" | "http_hls";
    format_name: string;
    codec_name: string;
    qn: number;
  };
  for (const condition of conditons) {
    streamInfo = res.playurl_info.playurl.stream
      .find(({ protocol_name }) => protocol_name === condition.protocol_name)
      ?.format.find(({ format_name }) => format_name === condition.format_name)
      ?.codec.find(({ codec_name }) => codec_name === condition.codec_name);

    if (streamInfo) {
      streamOptions = {
        ...condition,
        qn: streamInfo.current_qn,
      };
      break;
    }
  }
  console.log("streamOptions", streamOptions, res.playurl_info.playurl.stream);
  assert(streamInfo, "没有找到支持的流");

  const streams: StreamProfile[] = streamInfo.accept_qn.map((qn) => {
    const qnDesc = res.playurl_info.playurl.g_qn_desc.find((item) => item.qn === qn);
    assert(qnDesc, "Unexpected getRoomPlayInfo resp");
    return qnDesc;
  });

  const sources: SourceProfile[] = streamInfo.url_info.map((info, idx) => ({
    ...info,
    name: idx === 0 ? "主线" : `备线 ${idx}`,
  }));

  const currentStreamName = res.playurl_info.playurl.g_qn_desc.find(
    (item) => item.qn === streamInfo.current_qn,
  )?.desc;
  assert(currentStreamName, "Unexpected getRoomPlayInfo resp");

  return {
    ...streamInfo,
    streams,
    sources,
    name: currentStreamName,
    streamOptions,
  };
}

export async function getStream(
  opts: Pick<Recorder, "channelId" | "quality"> & {
    cookie?: string;
    strictQuality?: boolean;
    formatName: RecorderCreateOpts["formatName"];
    codecName: RecorderCreateOpts["codecName"];
  },
) {
  const roomId = Number(opts.channelId);
  const roomInit = await getRoomInit(roomId);
  if (roomInit.live_status !== 1) {
    throw new Error("It must be called getStream when living");
  }

  const qn = BiliQualities.includes(opts.quality as any) ? (opts.quality as number) : 10000;

  let liveInfo = await getLiveInfo(roomId, {
    qn: qn,
    cookie: opts.cookie,
    formatName: opts.formatName,
    codecName: opts.codecName,
  });
  // console.log(JSON.stringify(liveInfo, null, 2));

  if (liveInfo.current_qn !== qn && opts.strictQuality) {
    throw new Error("Can not get expect quality because of strictQuality");
  }
  if ((liveInfo?.accept_qn ?? []).length !== 0 && liveInfo.current_qn !== qn) {
    // 当前流不是预期的流，需要切换。
    const acceptQn = liveInfo.accept_qn[0];
    liveInfo = await getLiveInfo(roomId, {
      qn: acceptQn,
      cookie: opts.cookie,
      formatName: opts.formatName,
      codecName: opts.codecName,
    });
  }

  let expectSource = liveInfo.sources[0];
  if (!expectSource) {
    throw new Error("Can not get expect source");
  }

  return {
    ...liveInfo,
    currentStream: {
      name: liveInfo.name,
      source: expectSource.name,
      url: expectSource.host + liveInfo.base_url + expectSource.extra,
    },
  };
}
