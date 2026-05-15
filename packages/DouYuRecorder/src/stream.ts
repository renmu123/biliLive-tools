import { DouyuQualities, Recorder, utils } from "@bililive-tools/manager";
import { DouyuParser } from "@bililive-tools/stream-get";

export async function getInfo(channelId: string): Promise<{
  living: boolean;
  owner: string;
  title: string;
  liveStartTime: Date;
  avatar: string;
  cover: string;
  liveId: string;
  recordStartTime: Date;
  area: string;
  // gifts: {
  //   id: string;
  //   name: string;
  //   img: string;
  //   cost: number;
  // }[];
}> {
  const parser = new DouyuParser();
  const data = await parser.getRoomInfo(channelId);

  const startTime = data.liveStartTime || new Date();
  const recordStartTime = new Date();
  return {
    living: data.living,
    owner: data.owner,
    title: data.title,
    avatar: data.avatar,
    cover: data.cover,
    liveStartTime: startTime,
    liveId: utils.md5(`${channelId}-${startTime?.getTime() ?? Date.now()}`),
    recordStartTime: recordStartTime,
    area: data.area || "",
  };
}

export async function getStream(
  opts: Pick<Recorder, "channelId" | "quality"> & {
    rejectCache?: boolean;
    strictQuality?: boolean;
    source?: string;
    onlyAudio?: boolean;
    avoidEdgeCDN?: boolean;
  },
) {
  const qn = (
    DouyuQualities.includes(opts.quality as any) ? opts.quality : 0
  ) as (typeof DouyuQualities)[number];

  let cdn = opts.source === "auto" ? undefined : opts.source;
  if (opts.source === "auto" && opts.avoidEdgeCDN) {
    cdn = "hw-h5";
  }
  const parser = new DouyuParser();
  let liveInfo = await parser.getLiveInfo(opts.channelId, {
    rate: qn,
    cdn,
    onlyAudio: opts.onlyAudio,
    // hevc: true,
  });
  if (!liveInfo.living) throw new Error("It must be called getStream when living");

  //如果是scdn，那么找到第一个非scdn的源，重新请求一次
  if (liveInfo.currentStream.source === "scdn") {
    const nonScdnSource = liveInfo.sources.find((source) => source.cdn !== "scdnctshh");
    if (nonScdnSource) {
      liveInfo = await parser.getLiveInfo(opts.channelId, {
        rate: qn,
        cdn: nonScdnSource?.cdn,
        onlyAudio: opts.onlyAudio,
      });
    }
  }
  if (!liveInfo.living) throw new Error("It must be called getStream when living");

  if (liveInfo.currentStream.rate !== qn && opts.strictQuality) {
    throw new Error("Can not get expect quality because of strictQuality");
  }

  let expectSource = liveInfo.sources[0];
  if (!expectSource) {
    throw new Error("Source list is empty");
  }

  // 是否存在画质下没有source的情况，可能需要切换画质
  if (liveInfo.currentStream.rate !== qn) {
    if (liveInfo.streams.length === 0) {
      throw new Error("Can not get expect quality because of no available stream");
    } else {
      liveInfo = await parser.getLiveInfo(opts.channelId, {
        rate: liveInfo.streams[0].rate,
        onlyAudio: opts.onlyAudio,
      });
      if (!liveInfo.living) throw new Error("It must be called getStream when living");
    }
  }

  return liveInfo;
}
