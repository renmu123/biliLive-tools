import mitt from "mitt";
import {
  defaultFromJSON,
  defaultToJSON,
  genRecorderUUID,
  genRecordUUID,
  utils,
  createDownloader,
} from "@bililive-tools/manager";
import { XhsParser } from "@bililive-tools/stream-get";

import { getInfo, getStream, check } from "./stream.js";
import { ensureFolderExist } from "./utils.js";

import type {
  Recorder,
  RecorderCreateOpts,
  RecorderProvider,
  RecordHandle,
} from "@bililive-tools/manager";

function createRecorder(opts: RecorderCreateOpts): Recorder {
  // 内部实现时，应该只有 proxy 包裹的那一层会使用这个 recorder 标识符，不应该有直接通过
  // 此标志来操作这个对象的地方，不然会跳过 proxy 的拦截。
  const recorder: Recorder = {
    id: opts.id ?? genRecorderUUID(),
    extra: opts.extra ?? {},
    // @ts-ignore
    ...mitt(),
    ...opts,
    cache: null as any,
    availableStreams: [],
    availableSources: [],
    qualityRetry: opts.qualityRetry ?? 0,
    state: "idle",
    api: opts.api ?? "auto",
    formatPriorities: opts.formatPriorities ?? ["flv", "hls"],

    getChannelURL() {
      return `https://www.xiaohongshu.com/user/profile/${this.channelId}`;
    },
    checkLiveStatusAndRecord: utils.singleton(checkLiveStatusAndRecord),

    toJSON() {
      return defaultToJSON(provider, this);
    },

    async getLiveInfo() {
      const channelId = String(this.uid);
      const info = await getInfo(channelId);
      return {
        channelId: channelId,
        ...info,
      };
    },
    async getStream() {
      const res = await getStream({
        channelId: String(this.uid),
        quality: this.quality,
        streamPriorities: this.streamPriorities,
        sourcePriorities: this.sourcePriorities,
      });
      return res.currentStream;
    },
  };

  const recorderWithSupportUpdatedEvent = new Proxy(recorder, {
    set(obj, prop, value) {
      Reflect.set(obj, prop, value);

      if (typeof prop === "string") {
        obj.emit("Updated", [prop]);
      }

      return true;
    },
  });

  return recorderWithSupportUpdatedEvent;
}

const ffmpegOutputOptions: string[] = [];
const ffmpegInputOptions: string[] = ["-rw_timeout", "10000000", "-timeout", "10000000"];

const checkLiveStatusAndRecord: Recorder["checkLiveStatusAndRecord"] = async function ({
  getSavePath,
  banLiveId,
  isManualStart,
}) {
  // 如果已经在录制中，只在需要检查标题关键词时才获取最新信息
  if (this.recordHandle != null) {
    const shouldStop = await utils.checkTitleKeywordsWhileRecording(this, isManualStart, getInfo);
    if (shouldStop) {
      return null;
    }

    // 已经在录制中，直接返回
    return this.recordHandle;
  }
  if (!this.uid) {
    throw new Error("缺少uid，无法获取直播信息");
  }
  let [roomId, redId] = String(this.uid).split("-");
  let liveStartTimeFromSearch: Date | undefined = undefined;
  // 获取直播间信息
  try {
    if (this.auth) {
      // 在存在cookie的情况下，可以调用接口进行轮询检查
      const info = await check(redId, this.auth);
      const isLiving = info?.living ?? false;
      this.liveInfo = {
        living: isLiving,
        owner: info.owner,
        title: "",
        avatar: info.avatar,
        cover: "",
        liveStartTime: info.liveStartTime,
        recordStartTime: new Date(),
        liveId: info.roomId,
      };
      if (!isLiving) {
        return null;
      }
      roomId = info.roomId;
      liveStartTimeFromSearch = info.liveStartTime;
    }
    if (!roomId) return null;

    if (this.liveInfo?.liveId === banLiveId) {
      this.tempStopIntervalCheck = true;
    } else {
      this.tempStopIntervalCheck = false;
    }
    if (this.tempStopIntervalCheck) return null;

    const liveInfo = await getInfo(roomId);
    // @ts-ignore
    this.liveInfo = liveInfo!;
    if (liveStartTimeFromSearch) {
      this.liveInfo!.liveStartTime = liveStartTimeFromSearch;
    }

    this.state = "idle";
  } catch (error) {
    this.state = "check-error";
    throw error;
  }

  const { living, owner, title, liveStartTime, recordStartTime } = this.liveInfo!;
  if (!living) return null;

  // 检查标题是否包含关键词
  if (utils.checkTitleKeywordsBeforeRecord(title, this, isManualStart)) return null;

  const qualityRetryLeft = (await this.cache.get("qualityRetryLeft")) ?? this.qualityRetry;
  const strictQuality = utils.shouldUseStrictQuality(
    qualityRetryLeft,
    this.qualityRetry,
    isManualStart,
  );

  let res: Awaited<ReturnType<typeof getStream>>;

  try {
    res = await getStream({
      channelId: roomId,
      quality: this.quality,
      streamPriorities: this.streamPriorities,
      sourcePriorities: this.sourcePriorities,
      api: this.api as "auto" | "web" | "mp" | "wup", //"wup"
      strictQuality,
      formatPriorities: this.formatPriorities,
    });
  } catch (err) {
    if (qualityRetryLeft > 0) await this.cache.set("qualityRetryLeft", qualityRetryLeft - 1);

    this.state = "check-error";
    throw err;
  }

  this.state = "recording";
  const { currentStream: stream, sources: availableSources, streams: availableStreams } = res;
  this.availableStreams = availableStreams.map((s) => s.desc);
  this.availableSources = availableSources.map((s) => s.name);
  this.usedStream = stream.name;
  this.usedSource = stream.source;

  let isEnded = false;
  const onEnd = (...args: unknown[]) => {
    if (isEnded) return;
    isEnded = true;
    this.emit("DebugLog", {
      type: "common",
      text: `record end, reason: ${JSON.stringify(args, (_, v) => (v instanceof Error ? v.stack : v))}`,
    });
    const reason = args[0] instanceof Error ? args[0].message : String(args[0]);
    this.recordHandle?.stop(reason);
  };

  const downloader = createDownloader(
    this.recorderType,
    {
      url: stream.url,
      outputOptions: ffmpegOutputOptions,
      inputOptions: ffmpegInputOptions,
      segment: this.segment ?? 0,
      getSavePath: (opts) =>
        getSavePath({
          owner,
          title: opts.title ?? title,
          startTime: opts.startTime,
          liveStartTime,
          recordStartTime,
        }),
      disableDanma: this.disableProvideCommentsWhenRecording,
      videoFormat: this.videoFormat ?? "auto",
      debugLevel: this.debugLevel ?? "none",
    },
    onEnd,
    async () => {
      const info = await getInfo(roomId);
      return info;
    },
  );

  const savePath = getSavePath({
    owner,
    title,
    startTime: Date.now(),
    liveStartTime,
    recordStartTime,
  });

  try {
    ensureFolderExist(savePath);
  } catch (err) {
    this.state = "idle";
    throw err;
  }

  const handleVideoCreated = async ({ filename, title, cover, rawFilename }) => {
    this.emit("videoFileCreated", { filename, cover, rawFilename });

    if (title && this?.liveInfo) {
      this.liveInfo.title = title;
    }
    if (cover && this?.liveInfo) {
      this.liveInfo.cover = cover;
    }
    const extraDataController = downloader.getExtraDataController();
    extraDataController?.setMeta({
      room_id: this.channelId,
      platform: provider?.id,
      liveStartTimestamp: this?.liveInfo?.liveStartTime?.getTime(),
      // recordStopTimestamp: Date.now(),
      title: title,
      user_name: owner,
    });
  };
  downloader.on("videoFileCreated", handleVideoCreated);
  downloader.on("videoFileCompleted", ({ filename }) => {
    this.emit("videoFileCompleted", { filename });
  });
  downloader.on("DebugLog", (data) => {
    this.emit("DebugLog", data);
  });
  downloader.on("progress", (progress) => {
    if (this.recordHandle) {
      this.recordHandle.progress = progress;
    }
    this.emit("progress", progress);
  });

  const downloaderArgs = downloader.getArguments();
  downloader.run();

  const cut = utils.singleton<RecordHandle["cut"]>(async () => {
    if (!this.recordHandle) return;
    downloader.cut();
  });

  const stop = utils.singleton<RecordHandle["stop"]>(async (reason?: string) => {
    if (!this.recordHandle) return;

    this.state = "stopping-record";

    try {
      await downloader.stop();
    } catch (err) {
      this.emit("DebugLog", {
        type: "error",
        text: `stop record error: ${String(err)}`,
      });
    }
    this.usedStream = undefined;
    this.usedSource = undefined;
    this.emit("RecordStop", { recordHandle: this.recordHandle, reason });
    this.recordHandle = undefined;
    this.liveInfo = undefined;
    this.state = "idle";
    this.cache.set("qualityRetryLeft", this.qualityRetry);
  });

  this.recordHandle = {
    id: genRecordUUID(),
    stream: stream.name,
    source: stream.source,
    recorderType: downloader.type,
    url: stream.url,
    downloaderArgs,
    savePath: savePath,
    stop,
    cut,
  };
  this.emit("RecordStart", this.recordHandle);

  return this.recordHandle;
};

export const provider: RecorderProvider<Record<string, unknown>> = {
  id: "XHS",
  name: "小红书",
  siteURL: "https://www.xiaohongshu.com/",

  matchURL(channelURL) {
    return XhsParser.matchPattern.test(channelURL);
  },

  async resolveChannelInfoFromURL(channelURL) {
    if (!this.matchURL(channelURL)) return null;
    const parser = new XhsParser();
    const roomId = await parser.extractRoomId(channelURL);
    const uid = await parser.extractUserId(channelURL);
    if (!uid) {
      throw new Error(`无法从 URL 提取用户 ID: ${channelURL}`);
    }
    const info = await parser.getLiveInfo(roomId);

    // 小红书ID用于基于cookie的自动监听
    const data = await parser.getUserInfo(uid);
    const redId = data?.user?.userPageData?.basicInfo?.redId;

    return {
      id: uid,
      title: info.title,
      owner: info.owner,
      avatar: info.avatar,
      uid: `${roomId}-${redId}`,
    };
  },

  createRecorder(opts) {
    return createRecorder({ providerId: provider.id, ...opts });
  },

  fromJSON(recorder) {
    return defaultFromJSON(this, recorder);
  },

  setFFMPEGOutputArgs(args) {
    ffmpegOutputOptions.splice(0, ffmpegOutputOptions.length, ...args);
  },
};
