import { Qualities, Recorder } from "@autorecord/manager";
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
import { assert, getValuesFromArrayLikeFlexSpaceBetween } from "./utils.js";
import { sortBy } from "lodash-es";

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
  start_time: Date;
}> {
  const roomInit = await getRoomInit(Number(channelId));
  const { [roomInit.uid]: status } = await getStatusInfoByUIDs([roomInit.uid]);
  if (!status) {
    // 未获取到直播间信息，可能是加密，尝试换一个接口
    const data = await getRoomBaseInfo(Number(channelId));
    const status = data[channelId];

    return {
      living: roomInit.live_status === 1 && !roomInit.encrypted,
      owner: status.uname,
      title: status.title,
      start_time: new Date(status.live_time),
      avatar: "",
      cover: status.cover,
      roomId: roomInit.room_id,
      shortId: roomInit.short_id,
    };
  }

  return {
    living: roomInit.live_status === 1 && !roomInit.encrypted,
    owner: status.uname,
    title: status.title,
    avatar: status.face,
    cover: status.cover_from_user,
    roomId: roomInit.room_id,
    shortId: roomInit.short_id,
    start_time: new Date(status.live_time * 1000),
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
  // console.log(JSON.stringify(res.playurl_info.playurl.stream, null, 2));

  const streamInfo = res.playurl_info.playurl.stream
    .find(({ protocol_name }) => protocol_name === (opts.protocol ?? "http_stream"))
    ?.format.find(({ format_name }) => format_name === (opts.format ?? "flv"))
    ?.codec.find(({ codec_name }) => codec_name === (opts.codec ?? "avc"));
  assert(streamInfo, "Unexpected getRoomPlayInfo resp");

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
  opts: Pick<Recorder, "channelId" | "quality" | "streamPriorities" | "sourcePriorities"> & {
    cookie?: string;
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

  const qn = [30000, 20000, 10000, 400, 250, 150, 80].includes(opts.quality as number)
    ? (opts.quality as number)
    : 10000;

  let liveInfo = await getLiveInfo(roomId, {
    ...defaultOpts,
    qn: qn,
    cookie: opts.cookie,
  });
  console.log(JSON.stringify(liveInfo, null, 2));

  // let expectStream: StreamProfile | null = null;
  if (liveInfo.current_qn !== qn) {
    // 当前流不是预期的流，需要切换。
    const acceptQn = liveInfo.accept_qn[0];
    liveInfo = await getLiveInfo(roomId, {
      qn: acceptQn,
      ...defaultOpts,
      cookie: opts.cookie,
    });
  }

  let expectSource: SourceProfile | null = null;
  const sourcesWithPriority = sortAndFilterSourcesByPriority(
    liveInfo.sources,
    opts.sourcePriorities,
  );
  if (sourcesWithPriority.length > 0) {
    expectSource = sourcesWithPriority[0];
  } else {
    expectSource = liveInfo.sources[0];
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
