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

import { getInfo, getStream } from "./stream.js";
import { ensureFolderExist } from "./utils.js";
import HuYaDanMu, { HuYaMessage } from "huya-danma-listener";

import type {
  Comment,
  GiveGift,
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

    availableStreams: [],
    availableSources: [],
    qualityRetry: opts.qualityRetry ?? 0,
    state: "idle",
    api: opts.api ?? "auto",
    formatPriorities: opts.formatPriorities ?? ["flv", "hls"],

    getChannelURL() {
      return `https://www.huya.com/${this.channelId}`;
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
        streamPriorities: this.streamPriorities,
        sourcePriorities: this.sourcePriorities,
      });
      return res.currentStream;
    },
    async getQualityRetryLeft() {
      return (await this.cache.get("qualityRetryLeft")) ?? this.qualityRetry;
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

  // 获取直播间信息
  try {
    const liveInfo = await getInfo(this.channelId);
    this.liveInfo = liveInfo;
    this.state = "idle";
  } catch (error) {
    this.state = "check-error";
    throw error;
  }
  const { living, owner, title, startTime } = this.liveInfo;

  if (this.liveInfo.liveId === banLiveId) {
    this.tempStopIntervalCheck = true;
  } else {
    this.tempStopIntervalCheck = false;
  }
  if (this.tempStopIntervalCheck) return null;
  if (!living) return null;

  // 检查标题是否包含关键词
  if (utils.checkTitleKeywordsBeforeRecord(title, this, isManualStart)) return null;

  const qualityRetryLeft = await this.getQualityRetryLeft();
  const strictQuality = utils.shouldUseStrictQuality(
    qualityRetryLeft,
    this.qualityRetry,
    isManualStart,
  );

  let res: Awaited<ReturnType<typeof getStream>>;
  // TODO: 先不做什么错误处理，就简单包一下预期上会有错误的地方
  try {
    res = await getStream({
      channelId: this.channelId,
      quality: this.quality,
      streamPriorities: this.streamPriorities,
      sourcePriorities: this.sourcePriorities,
      api: this.api as "auto" | "web" | "mp",
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
  let isCutting = false;
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

  const recordStartTime = new Date();
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
          liveStartTime: startTime,
          recordStartTime,
        }),
      disableDanma: this.disableProvideCommentsWhenRecording,
      videoFormat: this.videoFormat ?? "auto",
      debugLevel: this.debugLevel ?? "none",
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
    liveStartTime: startTime,
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
      liveStartTimestamp: this?.liveInfo?.startTime?.getTime(),
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

  let client: HuYaDanMu | null = null;
  if (!this.disableProvideCommentsWhenRecording) {
    client = new HuYaDanMu(this.channelId);
    client.on("message", (msg: HuYaMessage) => {
      const extraDataController = downloader.getExtraDataController();
      if (!extraDataController) return;

      switch (msg.type) {
        case "chat": {
          const comment: Comment = {
            type: "comment",
            timestamp: Date.now(),
            text: msg.content,
            color: msg.color,
            sender: {
              uid: msg.from.rid,
              name: msg.from.name,
            },
          };
          this.emit("Message", comment);
          extraDataController.addMessage(comment);
          break;
        }
        case "gift": {
          if (this.saveGiftDanma === false) return;

          // console.log('gift', msg)
          const gift: GiveGift = {
            type: "give_gift",
            timestamp: Date.now(),
            name: msg.name,
            count: msg.count,
            // 保留一位小数
            price: Number((msg.price / msg.count).toFixed(2)),
            sender: {
              uid: msg.from.rid,
              name: msg.from.name,
            },
          };
          this.emit("Message", gift);
          extraDataController.addMessage(gift);
          break;
        }
      }
    });
    client.on("error", (e: unknown) => {
      this.emit("DebugLog", { type: "common", text: String(e) });
    });
    client.on("retry", (e: { count: number; max: number }) => {
      this.emit("DebugLog", {
        type: "common",
        text: `${this?.liveInfo?.owner}:${this.channelId} huya danmu retry: ${e.count}/${e.max}`,
      });
    });
    client.start();
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

    try {
      client?.stop();
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
  id: "HuYa",
  name: "虎牙",
  siteURL: "https://www.huya.com/",

  matchURL(channelURL) {
    return /https?:\/\/(?:.*?\.)?huya.com\//.test(channelURL);
  },

  async resolveChannelInfoFromURL(channelURL) {
    if (!this.matchURL(channelURL)) return null;

    const id = path.basename(new URL(channelURL).pathname);
    const info = await getInfo(id);

    return {
      id: info.roomId.toString(),
      title: info.title,
      owner: info.owner,
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
