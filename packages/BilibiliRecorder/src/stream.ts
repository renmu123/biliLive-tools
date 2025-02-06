import { Recorder, BiliQualities, utils } from "@autorecord/manager";
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

export async function getLiveStatus(channelId: string): Promise<boolean> {
  const roomInit = await getRoomInit(Number(channelId));
  return roomInit.live_status === 1 && !roomInit.encrypted;
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
    qn?: number;
    protocol?: ProtocolInfo["protocol_name"];
    format?: FormatInfo["format_name"];
    codec?: CodecInfo["codec_name"];
    cookie?: string;
  } = {},
) {
  const res = await getRoomPlayInfo(roomIdOrShortId, opts);

  // 由于b站的flv hevc 是非标，ffmpeg并不支持
  const conditons = [
    {
      protocol_name: opts.protocol,
      format_name: opts.format,
      codec_name: opts.codec,
    },
    {
      protocol_name: "http_stream",
      format_name: "flv",
      codec_name: "avc",
    },
    {
      protocol_name: "http_hls",
      format_name: "ts",
      codec_name: "avc",
    },
    {
      protocol_name: "http_hls",
      format_name: "fmp4",
      codec_name: "avc",
    },
    {
      protocol_name: "http_hls",
      format_name: "ts",
      codec_name: "hevc",
    },
    {
      protocol_name: "http_hls",
      format_name: "fmp4",
      codec_name: "hevc",
    },
  ];

  let streamInfo: CodecInfo | undefined;
  for (const condition of conditons) {
    streamInfo = res.playurl_info.playurl.stream
      .find(({ protocol_name }) => protocol_name === condition.protocol_name)
      ?.format.find(({ format_name }) => format_name === condition.format_name)
      ?.codec.find(({ codec_name }) => codec_name === condition.codec_name);

    if (streamInfo) {
      break;
    }
  }
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
  };
}

export async function getStream(
  opts: Pick<Recorder, "channelId" | "quality"> & {
    cookie?: string;
    strictQuality?: boolean;
  },
) {
  const roomId = Number(opts.channelId);
  const roomInit = await getRoomInit(roomId);
  if (roomInit.live_status !== 1) {
    throw new Error("It must be called getStream when living");
  }

  const defaultOpts = {
    protocol: "http_stream",
    format: "flv",
    codec: "avc",
  };

  const qn = BiliQualities.includes(opts.quality as any) ? (opts.quality as number) : 10000;

  let liveInfo = await getLiveInfo(roomId, {
    ...defaultOpts,
    qn: qn,
    cookie: opts.cookie,
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
      ...defaultOpts,
      cookie: opts.cookie,
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
