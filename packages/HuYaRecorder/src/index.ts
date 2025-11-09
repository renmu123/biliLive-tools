import path from "node:path";
import mitt from "mitt";
import {
  defaultFromJSON,
  defaultToJSON,
  genRecorderUUID,
  genRecordUUID,
  utils,
  createBaseRecorder,
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
    qualityMaxRetry: opts.qualityRetry ?? 0,
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
    // 只有当设置了标题关键词时，并且不是手动启动的录制，才获取最新的直播间信息
    if (utils.shouldCheckTitleKeywords(isManualStart, this.titleKeywords)) {
      const now = Date.now();
      // 每5分钟检查一次标题变化
      const titleCheckInterval = 5 * 60 * 1000; // 5分钟

      // 获取上次检查时间
      const lastCheckTime =
        typeof this.extra.lastTitleCheckTime === "number" ? this.extra.lastTitleCheckTime : 0;

      // 如果距离上次检查时间不足指定间隔，则跳过检查
      if (now - lastCheckTime < titleCheckInterval) {
        return this.recordHandle;
      }

      // 更新检查时间
      this.extra.lastTitleCheckTime = now;

      // 获取直播间信息
      const liveInfo = await getInfo(this.channelId);
      const { title } = liveInfo;

      // 检查标题是否包含关键词
      if (utils.hasBlockedTitleKeywords(title, this.titleKeywords)) {
        this.state = "title-blocked";
        this.emit("DebugLog", {
          type: "common",
          text: `检测到标题包含关键词，停止录制：直播间标题 "${title}" 包含关键词 "${this.titleKeywords}"`,
        });

        // 停止录制
        await this.recordHandle.stop("直播间标题包含关键词");
        // 返回 null，停止录制
        return null;
      }
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

  // 检查标题是否包含关键词，如果包含则不自动录制
  // 手动开始录制时不检查标题关键词
  if (utils.shouldCheckTitleKeywords(isManualStart, this.titleKeywords)) {
    if (utils.hasBlockedTitleKeywords(title, this.titleKeywords)) {
      this.state = "title-blocked";
      this.emit("DebugLog", {
        type: "common",
        text: `跳过录制：直播间标题 "${title}" 包含关键词 "${this.titleKeywords}"`,
      });
      return null;
    }
  }

  let res: Awaited<ReturnType<typeof getStream>>;
  // TODO: 先不做什么错误处理，就简单包一下预期上会有错误的地方
  try {
    let strictQuality = false;
    if (this.qualityRetry > 0) {
      strictQuality = true;
    }
    if (this.qualityMaxRetry < 0) {
      strictQuality = true;
    }
    if (isManualStart) {
      strictQuality = false;
    }
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
    if (this.qualityRetry > 0) this.qualityRetry -= 1;

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
  const recorder = createBaseRecorder(
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
    const extraDataController = recorder.getExtraDataController();
    extraDataController?.setMeta({
      room_id: this.channelId,
      platform: provider?.id,
      liveStartTimestamp: this?.liveInfo?.startTime?.getTime(),
      // recordStopTimestamp: Date.now(),
      title: title,
      user_name: owner,
    });
  };
  recorder.on("videoFileCreated", handleVideoCreated);
  recorder.on("videoFileCompleted", ({ filename }) => {
    this.emit("videoFileCompleted", { filename });
  });
  recorder.on("DebugLog", (data) => {
    this.emit("DebugLog", data);
  });
  recorder.on("progress", (progress) => {
    if (this.recordHandle) {
      this.recordHandle.progress = progress;
    }
    this.emit("progress", progress);
  });

  let client: HuYaDanMu | null = null;
  if (!this.disableProvideCommentsWhenRecording) {
    client = new HuYaDanMu(this.channelId);
    client.on("message", (msg: HuYaMessage) => {
      const extraDataController = recorder.getExtraDataController();
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

  const ffmpegArgs = recorder.getArguments();
  recorder.run();

  const cut = utils.singleton<RecordHandle["cut"]>(async () => {
    if (!this.recordHandle) return;
    if (isCutting) return;
    isCutting = true;
    await recorder.stop();
    recorder.createCommand();
    recorder.run();
  });

  const stop = utils.singleton<RecordHandle["stop"]>(async (reason?: string) => {
    if (!this.recordHandle) return;

    this.state = "stopping-record";

    try {
      client?.stop();
      await recorder.stop();
    } catch (err) {
      this.emit("DebugLog", {
        type: "error",
        text: `stop ffmpeg error: ${String(err)}`,
      });
    }
    this.usedStream = undefined;
    this.usedSource = undefined;

    this.emit("RecordStop", { recordHandle: this.recordHandle, reason });
    this.recordHandle = undefined;
    this.liveInfo = undefined;
    this.state = "idle";
  });

  this.recordHandle = {
    id: genRecordUUID(),
    stream: stream.name,
    source: stream.source,
    recorderType: recorder.type,
    url: stream.url,
    ffmpegArgs,
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
