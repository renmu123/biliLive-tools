import { sortBy } from "lodash-es";
import { live } from "douyu-api";

import { Qualities, Recorder } from "@autorecord/manager";
import { getLiveInfo, SourceProfile, StreamProfile } from "./dy_api.js";
import { getValuesFromArrayLikeFlexSpaceBetween } from "./utils.js";
import { requester } from "./requester.js";

export async function getInfo(channelId: string): Promise<{
  living: boolean;
  owner: string;
  title: string;
  startTime: Date;
  avatar: string;
  cover: string;
  // gifts: {
  //   id: string;
  //   name: string;
  //   img: string;
  //   cost: number;
  // }[];
}> {
  const res = await requester.get<
    | {
        error: number;
        data: {
          room_status: string;
          owner_name: string;
          avatar: string;
          room_name: string;
          start_time: string;
          gift: {
            id: string;
            name: string;
            himg: string;
            pc: number;
          }[];
        };
      }
    | string
  >(`http://open.douyucdn.cn/api/RoomApi/room/${channelId}`);

  if (res.status !== 200) {
    if (res.status === 404 && res.data === "Not Found") {
      throw new Error("错误的地址 " + channelId);
    }

    throw new Error(`Unexpected status code, ${res.status}, ${res.data}`);
  }

  if (typeof res.data !== "object")
    throw new Error(`Unexpected response, ${res.status}, ${res.data}`);

  const json = res.data;
  if (json.error === 101) throw new Error("错误的地址 " + channelId);
  if (json.error !== 0) throw new Error("Unexpected error code, " + json.error);
  let living = json.data.room_status === "1";

  const data = await live.getRoomInfo(Number(channelId));
  if (living) {
    const isVideoLoop = data.room.videoLoop === 1;
    if (isVideoLoop) {
      living = false;
    }
  }

  return {
    living,
    owner: data.room.nickname,
    title: data.room.room_name,
    avatar: data.room.avatar.big,
    cover: data.room.room_pic,
    startTime: new Date(data.room.show_time * 1000),
    // gifts: data.gift.map((g) => ({
    //   id: g.id,
    //   name: g.name,
    //   img: g.himg,
    //   cost: g.pc,
    // })),
  };
}

export async function getStream(
  opts: Pick<
    Recorder,
    | "channelId"
    | "quality"
    | "streamPriorities"
    | "sourcePriorities"
    | "segment"
    | "saveSCDanma"
    | "saveGiftDanma"
  > & {
    rejectCache?: boolean;
  },
) {
  let liveInfo = await getLiveInfo({
    channelId: opts.channelId,
    cdn: opts.sourcePriorities[0],
  });
  // console.log("liveInfo", liveInfo);
  if (!liveInfo.living) throw new Error();

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
    // const isHighestAsExpected = opts.quality === "highest";
    // if (!isHighestAsExpected) {
    //   console.log("非最高画质", isHighestAsExpected, liveInfo.isOriginalStream);
    const streams = getValuesFromArrayLikeFlexSpaceBetween(
      // 斗鱼给的画质列表是按照清晰到模糊的顺序的，这里翻转下
      liveInfo.streams.toReversed(),
      Qualities.length,
    );
    // console.log("画质列表", streams);

    expectStream = streams[Qualities.indexOf(opts.quality)];
    // }
  }

  let expectSource: SourceProfile | null = null;
  const sourcesWithPriority = sortAndFilterSourcesByPriority(
    liveInfo.sources,
    opts.sourcePriorities,
  );
  if (sourcesWithPriority.length > 0) {
    expectSource = sourcesWithPriority[0];
  }

  // console.log("流", expectStream, expectSource, sourcesWithPriority, opts.sourcePriorities);

  if (
    (expectStream != null && liveInfo.currentStream.rate !== expectStream.rate) ||
    (expectSource != null && liveInfo.currentStream.source !== expectSource.cdn)
  ) {
    // console.log("切换流", expectStream, expectSource);
    // 当前流不是预期的流或源，需要切换。
    // TODO: 这一步可能会导致原画的流被切走并且没法再取得，需要额外进行提示。
    if (!liveInfo.isSupportRateSwitch) {
      // TODO: 无法切换
    } else {
      liveInfo = await getLiveInfo({
        channelId: opts.channelId,
        rate: expectStream?.rate,
        cdn: expectSource?.cdn,
      });
      if (!liveInfo.living) throw new Error();
    }
  }

  // 流未准备好，防止刚开播时的无效录制。
  // 该判断可能导致开播前 30 秒左右无法录制到，因为 streamStatus 在后端似乎有缓存，所以暂时不使用。
  // TODO: 需要在 ffmpeg 那里加处理，防止无效录制
  // if (!json.data.streamStatus) return

  return liveInfo;
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
        priority: streamPriorities.toReversed().indexOf(stream.name),
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
        priority: sourcePriorities.toReversed().indexOf(source.cdn),
      }))
      .filter(({ priority }) => priority !== -1),
    "priority",
  );
}
