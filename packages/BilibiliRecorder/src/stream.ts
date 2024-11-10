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
} from "./bilibili_api.js";
import { assert, getValuesFromArrayLikeFlexSpaceBetween } from "./utils.js";
import { sortBy } from "lodash-es";

export async function getInfo(channelId: string): Promise<{
  living: boolean;
  owner: string;
  title: string;
  roomId: number;
  shortId: number;
  avatar: string;
  cover: string;
}> {
  const roomInit = await getRoomInit(Number(channelId));
  const { [roomInit.uid]: status } = await getStatusInfoByUIDs([roomInit.uid]);

  return {
    living: status.live_status === 1,
    owner: status.uname,
    title: status.title,
    avatar: status.face,
    cover: status.cover_from_user,
    roomId: roomInit.room_id,
    shortId: roomInit.short_id,
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
    protocol: "http_hls",
    format: "ts",
    codec: "avc",
  };

  let liveInfo = await getLiveInfo(roomId, {
    // 本来是用的 b 站首选的的 http_hls，但是录制后经常出现视频卡顿然后音画不同步的情况，没有
    // 具体调查，猜测是 ffmpeg 对于 b 站的 fmp4 源处理的有问题，这里先改成用 http_stream 的 flv。
    ...defaultOpts,
    cookie: opts.cookie,
  });

  let expectStream: StreamProfile | null = null;
  const streamsWithPriority = sortAndFilterStreamsByPriority(
    liveInfo.streams,
    opts.streamPriorities,
  );
  if (streamsWithPriority.length > 0) {
    // 通过优先级来选择对应流
    expectStream = streamsWithPriority[0];
  } else {
    // 通过设置的画质选项来选择对应流
    const flexedStreams = getValuesFromArrayLikeFlexSpaceBetween(
      // 接口给的画质列表是按照清晰到模糊的顺序的，这里翻转下
      liveInfo.streams.toReversed(),
      Qualities.length,
    );
    expectStream = flexedStreams[Qualities.indexOf(opts.quality)];
  }

  if (expectStream != null && liveInfo.current_qn !== expectStream.qn) {
    // 当前流不是预期的流，需要切换。
    liveInfo = await getLiveInfo(roomId, {
      qn: expectStream.qn,
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
 * 按提供的流优先级去给流列表排序，并过滤掉不在优先级配置中的流
 */
function sortAndFilterStreamsByPriority(
  streams: StreamProfile[],
  streamPriorities: Recorder["streamPriorities"],
): (StreamProfile & {
  priority: number;
})[] {
  if (streamPriorities.length === 0) return [];

  return sortBy(
    // 分配优先级属性，数字越大优先级越高
    streams
      .map((stream) => ({
        ...stream,
        priority: streamPriorities.toReversed().indexOf(stream.desc),
      }))
      .filter(({ priority }) => priority !== -1),
    "priority",
  );
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
