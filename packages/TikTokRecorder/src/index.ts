import mitt from "mitt";
import {
  createDownloader,
  defaultFromJSON,
  defaultToJSON,
  genRecorderUUID,
  genRecordUUID,
  utils,
} from "@bililive-tools/manager";
import { TikTokParser } from "@bililive-tools/stream-get";

import { getInfo, getStream } from "./stream.js";

import type {
  Recorder,
  RecorderCreateOpts,
  RecorderProvider,
  RecordHandle,
  VideoFileCreatedPayload,
} from "@bililive-tools/manager";
const TIKTOK_REFERER = "https://www.tiktok.com/";

function createRecorder(opts: RecorderCreateOpts): Recorder {
  const recorder: Recorder = {
    id: opts.id ?? genRecorderUUID(),
    extra: opts.extra ?? {},
    // @ts-ignore mitt 的事件类型由 Recorder 接口约束。
    ...mitt(),
    ...opts,
    cache: null as any,
    appendTimeline: null as any,

    availableStreams: [],
    availableSources: [],
    qualityRetry: opts.qualityRetry ?? 0,
    state: "idle",
    api: opts.api ?? "auto",
    codecName: opts.codecName ?? "auto",
    formatPriorities: opts.formatPriorities ?? ["flv", "hls"],
    disableProvideCommentsWhenRecording: true,

    getChannelURL() {
      return `https://www.tiktok.com/@${encodeURIComponent(this.channelId)}/live`;
    },
    checkLiveStatusAndRecord: utils.singleton(checkLiveStatusAndRecord),

    toJSON() {
      return defaultToJSON(provider, this);
    },

    async getLiveInfo() {
      const info = await getInfo(this.channelId, {
        api: this.api,
        auth: this.auth,
        proxy: this.proxy,
      });
      return {
        channelId: this.channelId,
        ...info,
      };
    },

    async getStream(opts: { formatPriorities?: Array<"flv" | "hls"> } = {}) {
      const result = await getStream({
        channelId: this.channelId,
        quality: this.quality,
        api: this.api,
        auth: this.auth,
        proxy: this.proxy,
        codecName: this.codecName,
        formatPriorities: opts.formatPriorities ?? this.formatPriorities,
        strictQuality: false,
      });
      return result.currentStream;
    },
  };

  return new Proxy(recorder, {
    set(obj, prop, value) {
      Reflect.set(obj, prop, value);
      if (typeof prop === "string") {
        obj.emit("Updated", [prop]);
      }
      return true;
    },
  });
}

const ffmpegOutputOptions: string[] = [];

const checkLiveStatusAndRecord: Recorder["checkLiveStatusAndRecord"] = async function ({
  getSavePath,
  banLiveId,
  isManualStart,
}) {
  const requestOptions = {
    api: this.api,
    auth: this.auth,
    proxy: this.proxy,
  };

  if (this.recordHandle != null) {
    const shouldStop = await utils.checkTitleKeywordsWhileRecording(
      this,
      isManualStart,
      (channelId) => getInfo(channelId, requestOptions),
    );
    if (shouldStop) return null;
    return this.recordHandle;
  }

  try {
    this.liveInfo = await getInfo(this.channelId, requestOptions);
    this.emit("stateChange", { state: "idle" });
  } catch (error) {
    this.emit("stateChange", {
      state: "check-error",
      msg: `检查失败，${error instanceof Error ? error.message : String(error)}`,
    });
    throw error;
  }

  const { living, owner, title, liveStartTime, recordStartTime } = this.liveInfo;
  this.tempStopIntervalCheck = this.liveInfo.liveId === banLiveId;
  if (this.tempStopIntervalCheck || !living) return null;
  if (utils.checkTitleKeywordsBeforeRecord(title, this, isManualStart)) return null;

  const qualityRetryLeft = (await this.cache.get("qualityRetryLeft")) ?? this.qualityRetry;
  const strictQuality = utils.shouldUseStrictQuality(
    qualityRetryLeft,
    this.qualityRetry,
    isManualStart,
  );

  let result: Awaited<ReturnType<typeof getStream>>;
  try {
    result = await getStream({
      channelId: this.channelId,
      quality: this.quality,
      api: this.api,
      auth: this.auth,
      proxy: this.proxy,
      codecName: this.codecName,
      formatPriorities: this.formatPriorities,
      strictQuality,
    });
  } catch (error) {
    if (qualityRetryLeft > 0) {
      await this.cache.set("qualityRetryLeft", qualityRetryLeft - 1);
    }
    this.emit("stateChange", {
      state: "check-error",
      msg: `检查失败，${error instanceof Error ? error.message : String(error)}`,
    });
    throw error;
  }

  this.emit("stateChange", { state: "recording" });
  const { currentStream: stream, sources: availableSources, streams: availableStreams } = result;
  this.availableStreams = availableStreams.map((item) => item.desc);
  this.availableSources = availableSources.map((item) => item.name);
  this.usedStream = stream.name;
  this.usedSource = stream.source;

  let isEnded = false;
  const onEnd = (...args: unknown[]) => {
    if (isEnded) return;
    isEnded = true;
    this.emit("DebugLog", {
      type: "common",
      text: `record end, reason: ${JSON.stringify(args, (_, value) =>
        value instanceof Error ? value.stack : value,
      )}`,
    });
    const reason = args[0] instanceof Error ? args[0].message : String(args[0]);
    void this.recordHandle?.stop(reason);
  };

  const downloader = createDownloader(
    this.recorderType,
    {
      url: stream.url,
      outputOptions: ffmpegOutputOptions,
      segment: this.segment ?? 0,
      getSavePath: (pathOptions) =>
        getSavePath({
          owner,
          title: pathOptions.title ?? title,
          startTime: pathOptions.startTime,
          liveStartTime,
          recordStartTime,
          extraMs: pathOptions.extraMs,
        }),
      disableDanma: true,
      videoFormat: this.videoFormat ?? "auto",
      debugLevel: this.debugLevel ?? "none",
      proxy: this.proxy,
      onlyAudio: stream.onlyAudio,
      // headers: {
      //   Referer: TIKTOK_REFERER,
      //   "User-Agent": TIKTOK_USER_AGENT,
      // },
    },
    onEnd,
    () => getInfo(this.channelId, requestOptions),
  );

  downloader.on(
    "videoFileCreated",
    ({ filename, title: updatedTitle, cover, rawFilename }: VideoFileCreatedPayload) => {
      this.emit("videoFileCreated", { filename, cover, rawFilename });
      if (updatedTitle && this.liveInfo) this.liveInfo.title = updatedTitle;
      if (cover && this.liveInfo) this.liveInfo.cover = cover;

      downloader.getExtraDataController()?.setMeta({
        room_id: this.channelId,
        platform: provider.id,
        liveStartTimestamp: this.liveInfo?.liveStartTime?.getTime(),
        title: updatedTitle,
        user_name: owner,
      });
    },
  );
  downloader.on("videoFileCompleted", (data) => this.emit("videoFileCompleted", data));
  downloader.on("DebugLog", (data) => this.emit("DebugLog", data));
  downloader.on("progress", (progress) => {
    if (this.recordHandle) this.recordHandle.progress = progress;
    this.emit("progress", progress);
  });

  const downloaderArgs = downloader.getArguments();
  downloader.run();

  const cut = utils.singleton<RecordHandle["cut"]>(async () => {
    if (this.recordHandle) downloader.cut();
  });
  const stop = utils.singleton<RecordHandle["stop"]>(async (reason?: string) => {
    if (!this.recordHandle) return;
    this.emit("stateChange", { state: "stopping-record" });
    try {
      await downloader.stop();
    } catch (error) {
      this.emit("DebugLog", {
        type: "error",
        text: `stop record error: ${String(error)}`,
      });
    }
    this.usedStream = undefined;
    this.usedSource = undefined;
    this.emit("RecordStop", { recordHandle: this.recordHandle, reason });
    this.recordHandle = undefined;
    this.liveInfo = undefined;
    this.emit("stateChange", { state: "idle" });
    await this.cache.set("qualityRetryLeft", this.qualityRetry);
  });

  this.recordHandle = {
    id: genRecordUUID(),
    stream: stream.name,
    source: stream.source,
    recorderType: downloader.type,
    url: stream.url,
    downloaderArgs,
    savePath: downloader.videoFilePath,
    stop,
    cut,
  };
  this.emit("RecordStart", this.recordHandle);
  return this.recordHandle;
};

export const provider: RecorderProvider<Record<string, unknown>> = {
  id: "TikTok",
  name: "TikTok",
  siteURL: TIKTOK_REFERER,

  matchURL(channelURL) {
    return new TikTokParser().matchURL(channelURL);
  },

  async resolveChannelInfoFromURL(channelURL, options) {
    if (!this.matchURL(channelURL)) return null;

    const parser = new TikTokParser({
      proxy: options?.proxy,
    });
    const id = await parser.extractRoomId(channelURL);
    const info = await parser.getRoomInfo(id, {
      api: "auto",
    });
    return {
      id,
      title: info.title,
      owner: info.owner || id,
      avatar: info.avatar,
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
