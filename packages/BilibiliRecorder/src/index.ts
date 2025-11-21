import path from "node:path";
import mitt from "mitt";
import {
  defaultFromJSON,
  defaultToJSON,
  genRecorderUUID,
  genRecordUUID,
  utils,
  createDownloader,
} from "@bililive-tools/manager";

import { getInfo, getStream, getLiveStatus, getStrictStream } from "./stream.js";
import { ensureFolderExist, hasKeyword } from "./utils.js";
import DanmaClient from "./danma.js";

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
    state: "idle",
    qualityRetry: opts.qualityRetry ?? 0,
    useM3U8Proxy: opts.useM3U8Proxy ?? false,
    useServerTimestamp: opts.useServerTimestamp ?? true,
    m3u8ProxyUrl: opts.m3u8ProxyUrl,
    formatName: opts.formatName ?? "auto",
    codecName: opts.codecName ?? "auto",
    recorderType: opts.recorderType ?? "ffmpeg",

    getChannelURL() {
      return `https://live.bilibili.com/${this.channelId}`;
    },
    checkLiveStatusAndRecord: utils.singleton(checkLiveStatusAndRecord),

    toJSON() {
      return defaultToJSON(provider, this);
    },
    async getLiveInfo() {
      const channelId = this.channelId;
      const info = await getInfo(channelId);
      return {
        channelId,
        ...info,
      };
    },
    async getStream() {
      const res = await getStream({
        channelId: this.channelId,
        quality: this.quality,
        formatName: this.formatName,
        codecName: this.codecName,
      });
      return res.currentStream;
    },
    // batchLiveStatusCheck: async function (channels: string[]) {
    //   const data = await getStatusInfoByUIDs([roomInit.uid]);
    // },
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
const ffmpegInputOptions: string[] = [
  "-rw_timeout",
  "10000000",
  "-timeout",
  "10000000",
  "-headers",
  "Referer:https://live.bilibili.com/",
];

const checkLiveStatusAndRecord: Recorder["checkLiveStatusAndRecord"] = async function ({
  getSavePath,
  isManualStart,
  banLiveId,
}) {
  if (this.recordHandle != null) return this.recordHandle;
  try {
    const { living, liveId, owner: _owner, title: _title } = await getLiveStatus(this.channelId);
    this.liveInfo = {
      living,
      owner: _owner,
      title: _title,
      avatar: "",
      cover: "",
      liveId: liveId,
      liveStartTime: new Date(),
      recordStartTime: new Date(),
    };
    this.state = "idle";
  } catch (error) {
    this.state = "check-error";
    throw error;
  }

  if (this.liveInfo.liveId === banLiveId) {
    this.tempStopIntervalCheck = true;
  } else {
    this.tempStopIntervalCheck = false;
  }
  if (this.tempStopIntervalCheck) return null;
  if (!this.liveInfo.living) return null;

  // 检查标题是否包含关键词，如果包含则不自动录制
  // 手动开始录制时不检查标题关键词
  if (utils.shouldCheckTitleKeywords(isManualStart, this.titleKeywords)) {
    const hasTitleKeyword = hasKeyword(this.liveInfo.title, this.titleKeywords);
    if (hasTitleKeyword) {
      this.state = "title-blocked";
      this.emit("DebugLog", {
        type: "common",
        text: `跳过录制：直播间标题 "${this.liveInfo.title}" 包含关键词 "${this.titleKeywords}"`,
      });
      return null;
    }
  }

  const liveInfo = await getInfo(this.channelId);
  const { owner, title, roomId, liveStartTime, recordStartTime } = liveInfo;
  this.liveInfo = liveInfo;

  const qualityRetryLeft = (await this.cache.get("qualityRetryLeft")) ?? this.qualityRetry;
  const strictQuality = utils.shouldUseStrictQuality(
    qualityRetryLeft,
    this.qualityRetry,
    isManualStart,
  );

  let res: Awaited<ReturnType<typeof getStream>>;
  try {
    res = await getStream({
      channelId: this.channelId,
      quality: this.quality,
      cookie: this.auth,
      strictQuality: strictQuality,
      formatName: this.formatName,
      codecName: this.codecName,
      onlyAudio: this.onlyAudio,
    });
  } catch (err) {
    if (qualityRetryLeft > 0) await this.cache.set("qualityRetryLeft", qualityRetryLeft - 1);
    this.state = "check-error";
    throw err;
  }

  this.state = "recording";
  const {
    streamOptions,
    currentStream: stream,
    sources: availableSources,
    streams: availableStreams,
  } = res;
  this.availableStreams = availableStreams.map((s) => s.desc);
  this.availableSources = availableSources.map((s) => s.name);
  this.usedStream = stream.name;
  this.usedSource = stream.source;
  let url = stream.url;

  let intervalId: NodeJS.Timeout | null = null;
  if (this.useM3U8Proxy && streamOptions.protocol_name === "http_hls") {
    url = `${this.m3u8ProxyUrl}?id=${this.id}&format=hls`;
    this.emit("DebugLog", {
      type: "common",
      text: `is hls stream, use proxy: ${url}`,
    });
    intervalId = setInterval(
      async () => {
        const url = await getStrictStream(Number(this.channelId), {
          qn: streamOptions.qn,
          cookie: this.auth,
          protocol_name: streamOptions.protocol_name,
          format_name: streamOptions.format_name,
          codec_name: streamOptions.codec_name,
        });
        if (this.recordHandle) {
          this.recordHandle.url = url;
        }
        this.emit("DebugLog", {
          type: "common",
          text: `update stream: ${url}`,
        });
      },
      50 * 60 * 1000,
    );
  }

  let isCutting = false;
  let isEnded = false;
  const onEnd = (...args: unknown[]) => {
    if (isCutting) {
      isCutting = false;
      return;
    }
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
      url: url,
      outputOptions: ffmpegOutputOptions,
      inputOptions: ffmpegInputOptions,
      segment: this.segment ?? 0,
      getSavePath: (opts) =>
        getSavePath({
          owner,
          title: opts.title ?? title,
          startTime: opts.startTime,
          liveStartTime: liveStartTime,
          recordStartTime,
        }),
      formatName: streamOptions.format_name as "flv" | "ts" | "fmp4",
      disableDanma: this.disableProvideCommentsWhenRecording,
      videoFormat: this.videoFormat,
      debugLevel: this.debugLevel ?? "none",
      headers: {
        Referer: "https://live.bilibili.com/",
      },
    },
    onEnd,
    async () => {
      const info = await getInfo(this.channelId);
      return info;
    },
  );

  const savePath = getSavePath({
    owner,
    title,
    startTime: Date.now(),
    liveStartTime: liveStartTime,
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
      room_id: String(roomId),
      platform: provider?.id,
      liveStartTimestamp: liveInfo.liveStartTime?.getTime(),
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

  let danmaClient = new DanmaClient(roomId, {
    auth: this.auth,
    uid: Number(this.uid) as number,
    useServerTimestamp: this.useServerTimestamp,
  });
  if (!this.disableProvideCommentsWhenRecording) {
    danmaClient.on("Message", (msg) => {
      const extraDataController = downloader.getExtraDataController();
      if (!extraDataController) return;

      if (msg.type === "super_chat" && this.saveSCDanma === false) return;
      if ((msg.type === "give_gift" || msg.type === "guard") && this.saveGiftDanma === false)
        return;

      this.emit("Message", msg);
      extraDataController.addMessage(msg);
    });
    danmaClient.on("onRoomInfoChange", (msg) => {
      if (utils.shouldCheckTitleKeywords(isManualStart, this.titleKeywords)) {
        const title = msg?.body?.title ?? "";
        const hasTitleKeyword = hasKeyword(title, this.titleKeywords);

        if (hasTitleKeyword) {
          this.state = "title-blocked";
          this.emit("DebugLog", {
            type: "common",
            text: `检测到标题包含关键词，停止录制：直播间标题 "${title}" 包含关键词 "${this.titleKeywords}"`,
          });

          // 停止录制
          this.recordHandle && this.recordHandle.stop("直播间标题包含关键词");
        }
      }
    });
    danmaClient.start();
  }

  const downloaderArgs = downloader.getArguments();
  downloader.run();

  const cut = utils.singleton<RecordHandle["cut"]>(async () => {
    if (!this.recordHandle) return;
    if (isCutting) return;
    isCutting = true;
    await downloader.stop();
    downloader.createCommand();
    downloader.run();
  });

  const stop = utils.singleton<RecordHandle["stop"]>(async (reason?: string) => {
    if (!this.recordHandle) return;

    this.state = "stopping-record";
    intervalId && clearInterval(intervalId);

    try {
      danmaClient.stop();
      await downloader.stop();
    } catch (err) {
      this.emit("DebugLog", {
        type: "common",
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
  id: "Bilibili",
  name: "Bilibili",
  siteURL: "https://live.bilibili.com/",

  matchURL(channelURL) {
    return /https?:\/\/(?:.*?\.)?bilibili.com\//.test(channelURL);
  },

  async resolveChannelInfoFromURL(channelURL) {
    if (!this.matchURL(channelURL)) return null;

    const id = path.basename(new URL(channelURL).pathname);
    const info = await getInfo(id);

    return {
      id: info.roomId.toString(),
      title: info.title,
      owner: info.owner,
      uid: info.uid,
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
