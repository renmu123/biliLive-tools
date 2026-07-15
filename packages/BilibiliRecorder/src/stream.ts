import { Recorder, utils } from "@bililive-tools/manager";
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

const BiliQualities = [30000, 20000, 25000, 15000, 10000, 400, 250, 150, 80] as const;

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
  owner: string;
  title: string;
}> {
  const obj = await getRoomBaseInfo(Number(channelId));
  const data = obj[Number(channelId)];
  if (data) {
    const startTime = new Date(data.live_time);
    return {
      // living 仅反映主播是否在播(live_status===1)；加密/付费/权限等"房间特殊状态"
      // 不并入 living，由 getInfo 的 liveType/canRecord 单独判定。
      living: data.live_status === 1,
      liveId: utils.md5(`${channelId}-${startTime?.getTime()}`),
      owner: data.uname,
      title: data.title,
    };
  }

  const roomInit = await getRoomInit(Number(channelId));
  const startTime = new Date(roomInit.live_time * 1000);
  return {
    living: roomInit.live_status === 1,
    liveId: utils.md5(`${roomInit.room_id}-${startTime?.getTime()}`),
    ...roomInit,
    owner: "",
    title: "",
  };
}

/**
 * 直播类型(B站专属)：
 * - normal:   普通直播，可正常录制
 * - paid:     付费/充电直播，流为 DRM(SAMPLE-AES + Widevine/FairPlay/com.bilidrm)加密，无法录制
 * - guard:    大航海/权限专属直播(舰长/提督/总督等)，无观看权限时拿不到流
 * - password: 密码加密直播间，未验证密码拿不到流
 */
export type BiliLiveType = "normal" | "paid" | "guard" | "password";

const LIVE_TYPE_DESC: Record<BiliLiveType, string> = {
  normal: "普通直播",
  paid: "付费直播(DRM 加密)",
  guard: "大航海/权限专属直播",
  password: "密码加密直播",
};

export async function getInfo(
  channelId: string,
  opts: { cookie?: string } = {},
): Promise<{
  living: boolean;
  owner: string;
  title: string;
  roomId: number;
  avatar: string;
  cover: string;
  uid: number;
  liveId: string;
  liveStartTime: Date;
  recordStartTime: Date;
  area: string;
  // 直播类型 + 中文提示
  liveType: BiliLiveType;
  liveTypeDesc: string;
  // 能否录制(= 在播 && 普通直播 && 能拿到非加密流)
  canRecord: boolean;
  // 是否为付费/充电直播(DRM)。保留向后兼容，等价于 liveType==="paid"
  isCharge: boolean;
}> {
  const roomInit = await getRoomInit(Number(channelId));
  // 判断 1：是否在直播。仅看 live_status，不混入加密/付费等房间特殊状态。
  const living = roomInit.live_status === 1;
  const recordStartTime = new Date();

  // 基础信息(主播名/标题/封面等)始终获取，供频道预览(离线也要展示)。
  let owner = "";
  let title = "";
  let avatar = "";
  let cover = "";
  let area = "";
  let liveStartTime = new Date(0);
  const { [roomInit.uid]: status } = await getStatusInfoByUIDs([roomInit.uid]);
  if (status) {
    owner = status.uname;
    title = status.title;
    avatar = status.face;
    cover = status.cover_from_user;
    area = status.area_v2_parent_name;
    liveStartTime = new Date(status.live_time * 1000);
  } else {
    // 未获取到直播间信息(可能是加密房等)，换一个接口取基础信息
    const data = await getRoomBaseInfo(Number(channelId));
    const base = data[Number(channelId)];
    if (base) {
      owner = base.uname;
      title = base.title;
      cover = base.cover;
      liveStartTime = new Date(base.live_time);
    }
  }

  // 判断 2 + 3：直播类型与能否录制。仅在播时才探测流(不在播无需多余请求)。
  // 判定优先级(自上而下，命中即止)：
  //   1. 密码房   → 未验证密码拿不到流，优先判定，不再请求取流接口
  //   2. 付费标记 → room_init 的 is_sp/special_type 在付费直播进行时翻 1，无需取流即可确认
  //   3. 取流探测 → 上面都未命中时才请求 getRoomPlayInfo，区分 DRM付费 / 权限受限 / 普通可录
  let liveType: BiliLiveType = "normal";
  let canRecord = false;
  if (living) {
    const paidByRoomInit = roomInit.is_sp === 1 || roomInit.special_type === 1;
    if (roomInit.encrypted) {
      liveType = "password";
    } else if (paidByRoomInit) {
      liveType = "paid";
    } else {
      try {
        const playInfo = await getRoomPlayInfo(Number(channelId), { cookie: opts.cookie });
        // all_special_types 含 203 = B站播放器自身判定的 DRM 加密直播
        const allSpecialTypes = playInfo.all_special_types ?? [];
        const isDRM = Array.isArray(allSpecialTypes) && allSpecialTypes.includes(203);
        const hasStream = (playInfo.playurl_info?.playurl?.stream?.length ?? 0) > 0;
        if (isDRM) {
          liveType = "paid";
        } else if (!hasStream) {
          // 取流接口正常返回、却拿不到任何流 → 权限受限(舰长/大航海等专属直播)
          liveType = "guard";
        } else {
          liveType = "normal";
          canRecord = true;
        }
      } catch {
        // 取流接口异常(网络/瞬时错误)：不臆断为权限受限，按普通直播放行，
        // 交由后续 getStream 重试并产生 check-error，避免误跳过导致漏录。
        liveType = "normal";
        canRecord = true;
      }
    }
  }

  const liveTypeDesc = LIVE_TYPE_DESC[liveType];

  return {
    uid: roomInit.uid,
    living,
    liveType,
    liveTypeDesc,
    canRecord,
    isCharge: liveType === "paid",
    owner,
    title,
    avatar,
    cover,
    roomId: roomInit.room_id,
    liveStartTime,
    liveId: utils.md5(`${roomInit.room_id}-${liveStartTime.getTime()}`),
    recordStartTime,
    area,
  };
}

async function getLiveInfo(
  roomIdOrShortId: number,
  opts: {
    qn: number;
    cookie?: string;
    formatName: RecorderCreateOpts["formatName"];
    codecName: RecorderCreateOpts["codecName"];
    onlyAudio?: boolean;
  },
) {
  const res = await getRoomPlayInfo(roomIdOrShortId, opts);
  assert(res.playurl_info, "没有找到流");

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
  // console.log("conditons", JSON.stringify(res.playurl_info.playurl.stream, null, 2));
  for (const condition of conditons) {
    const streamList = res.playurl_info.playurl.stream
      .find(({ protocol_name }) => protocol_name === condition.protocol_name)
      ?.format.find(({ format_name }) => format_name === condition.format_name)
      ?.codec.filter(({ codec_name }) => codec_name === condition.codec_name);

    if (streamList && streamList.length > 1) {
      // 由于直播姬直推hevc时，指定qn，服务端仍会返回其他画质的流，这里需要指定找一下流
      streamInfo = streamList.find((item) => item.current_qn === opts.qn);
    }

    if (!streamInfo) {
      streamInfo = streamList?.[0];
    }

    if (streamInfo) {
      streamOptions = {
        ...condition,
        qn: streamInfo.current_qn,
      };
      break;
    }
  }
  // console.log(
  //   "streamOptions",
  //   streamOptions,
  //   JSON.stringify(res.playurl_info.playurl.stream, null, 2),
  // );
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
    onlyAudio?: boolean;
    customHost?: string;
  },
) {
  const roomId = Number(opts.channelId);
  const qn = BiliQualities.includes(opts.quality as any) ? (opts.quality as number) : 10000;

  let liveInfo = await getLiveInfo(roomId, {
    qn: qn,
    cookie: opts.cookie,
    formatName: opts.formatName,
    codecName: opts.codecName,
    onlyAudio: opts.onlyAudio,
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
      onlyAudio: opts.onlyAudio,
    });
  }

  let expectSource = liveInfo.sources[0];
  if (!expectSource) {
    throw new Error("Can not get expect source");
  }

  const host = opts.customHost ? `https://${opts.customHost}` : expectSource.host;
  const url = host + liveInfo.base_url + expectSource.extra;

  return {
    ...liveInfo,
    currentStream: {
      name: liveInfo.name,
      source: expectSource.name,
      url: url,
    },
  };
}
