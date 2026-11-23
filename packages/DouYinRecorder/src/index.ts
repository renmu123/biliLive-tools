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
import type {
  Recorder,
  RecorderCreateOpts,
  RecorderProvider,
  RecordHandle,
  Message,
} from "@bililive-tools/manager";

import { getInfo, getStream } from "./stream.js";
import { singleton } from "./utils.js";
import { resolveShortURL, parseUser } from "./douyin_api.js";

import DouYinDanmaClient from "douyin-danma-listener";
import { listenDanmaMessages } from "./danmaMessages.js";

import type { APIType } from "./types.js";

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
    useServerTimestamp: opts.useServerTimestamp ?? true,
    cookieMode: opts.cookieMode ?? "all",
    state: "idle",
    cache: null as any,
    appendTimeline: null as any,

    getChannelURL() {
      return `https://live.douyin.com/${this.channelId}`;
    },
    async subscribeComments(listener: (message: Message) => void) {
      const info = await getInfo(this.channelId, {
        auth: this.cookieMode === "danma" ? undefined : this.auth,
        api: this.api as APIType,
        uid: this.uid,
      });
      if (!info.living || !info.liveId) throw new Error("直播间未开播，无法订阅弹幕");

      const client = new DouYinDanmaClient(info.liveId, {
        cookie: this.cookieMode === "stream" ? undefined : this.auth,
      });
      const messages = listenDanmaMessages(
        client,
        { useServerTimestamp: this.useServerTimestamp },
        listener,
      );
      client.on("error", (error) => {
        this.emit("DebugLog", { type: "error", text: `弹幕连接失败: ${String(error)}` });
      });
      let subscribed = true;
      const unsubscribe = () => {
        if (!subscribed) return;
        subscribed = false;
        messages.dispose();
        client.close();
      };
      try {
        await client.connect();
      } catch (error) {
        unsubscribe();
        throw error;
      }
      return unsubscribe;
    },
    checkLiveStatusAndRecord: singleton(checkLiveStatusAndRecord),

    toJSON() {
      return defaultToJSON(provider, this);
    },

    async getLiveInfo() {
      const channelId = this.channelId;
      const info = await getInfo(channelId, {
        auth: this.cookieMode === "danma" ? undefined : this.auth,
        uid: this.uid,
      });
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
        strictQuality: false,
        auth: this.cookieMode === "danma" ? undefined : this.auth,
        formatPriorities: this.formatPriorities,
        doubleScreen: this.doubleScreen,
        api: this.api as APIType,
        uid: this.uid,
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
  streamRetryHint,
}) {
  // 如果已经在录制中,只在需要检查标题关键词时才获取最新信息
  if (this.recordHandle != null) {
    const shouldStop = await utils.checkTitleKeywordsWhileRecording(
      this,
      isManualStart,
      (channelId) =>
        getInfo(channelId, {
          auth: this.cookieMode === "danma" ? undefined : this.auth,
          api: this.api as APIType,
          uid: this.uid,
        }),
    );
    if (shouldStop) {
      return null;
    }

    // 已经在录制中，直接返回
    return this.recordHandle;
  }

  // 获取直播间信息
  let isLiveRadio = false;
  try {
    const liveInfo = await getInfo(this.channelId, {
      auth: this.cookieMode === "danma" ? undefined : this.auth,
      api: this.api as APIType,
      uid: this.uid,
    });
    this.liveInfo = liveInfo;
    isLiveRadio = liveInfo.isLiveRadio;
    this.emit("stateChange", { state: "idle" });
  } catch (error) {
    this.emit("stateChange", {
      state: "check-error",
      msg: `检查失败，` + (error instanceof Error ? error.message : String(error)),
    });
    throw error;
  }

  if (this.liveInfo.liveId && this.liveInfo.liveId === banLiveId) {
    this.tempStopIntervalCheck = true;
  } else {
    this.tempStopIntervalCheck = false;
  }
  if (this.tempStopIntervalCheck) return null;
  if (!this.liveInfo.living) return null;

  // 检查标题是否包含关键词
  if (utils.checkTitleKeywordsBeforeRecord(this.liveInfo.title, this, isManualStart)) return null;

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
      streamPriorities: this.streamPriorities,
      sourcePriorities: this.sourcePriorities,
      strictQuality: strictQuality,
      auth: this.cookieMode === "danma" ? undefined : this.auth,
      formatPriorities: this.formatPriorities,
      doubleScreen: this.doubleScreen,
      api: this.api as APIType,
      uid: this.uid,
      isLiveRadio: isLiveRadio,
      preferAlternativeStream:
        streamRetryHint?.preferAlternativeStream === true &&
        streamRetryHint.liveId === this.liveInfo.liveId,
    });
    this.liveInfo.owner = res.owner;
    this.liveInfo.title = res.title;
    this.liveInfo.cover = res.cover;
    this.liveInfo.liveId = res.liveId;
    this.liveInfo.avatar = res.avatar;

    // 再检查一次，上一个接口可能不存在标题参数
    if (utils.checkTitleKeywordsBeforeRecord(this.liveInfo.title, this, isManualStart)) return null;
  } catch (err) {
    if (qualityRetryLeft > 0) await this.cache.set("qualityRetryLeft", qualityRetryLeft - 1);

    this.emit("stateChange", {
      state: "check-error",
      msg: `检查失败，` + (err instanceof Error ? err.message : String(err)),
    });
    throw err;
  }
  const { owner, title, liveStartTime, recordStartTime } = this.liveInfo;

  this.emit("stateChange", { state: "recording" });
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
          liveStartTime: liveStartTime,
          recordStartTime,
          extraMs: opts.extraMs,
        }),
      disableDanma: this.disableProvideCommentsWhenRecording,
      videoFormat: this.videoFormat ?? "auto",
      debugLevel: this.debugLevel ?? "none",
      onlyAudio: stream.onlyAudio,
      headers: {
        Origin: "https://live.douyin.com",
        Referer: "https://live.douyin.com/",
        // Cookie: this.auth,
      },
      proxy: this.proxy,
    },
    onEnd,
    async () => {
      const info = await getInfo(this.channelId, {
        auth: this.cookieMode === "danma" ? undefined : this.auth,
      });
      return info;
    },
  );

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
      // liveStartTimestamp: liveInfo.startTime?.getTime(),
      // recordStopTimestamp: Date.now(),
      title: title,
      user_name: owner,
    });
  };
  downloader.on("videoFileCreated", handleVideoCreated);
  downloader.on("videoFileCompleted", (data) => {
    this.emit("videoFileCompleted", data);
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

  const client = new DouYinDanmaClient(this.liveInfo.liveId, {
    cookie: this.cookieMode === "stream" ? undefined : this.auth,
  });
  const messages = listenDanmaMessages(
    client,
    {
      useServerTimestamp: this.useServerTimestamp,
      saveGiftDanma: this.saveGiftDanma,
      canReceive: () => Boolean(downloader.getExtraDataController()),
      captureGiftDelivery: () => {
        const controller = downloader.getExtraDataController();
        return (message) => {
          this.emit("Message", message);
          controller?.addMessage(message);
        };
      },
    },
    (message) => {
      const extraDataController = downloader.getExtraDataController();
      if (!extraDataController) return;
      this.emit("Message", message);
      extraDataController.addMessage(message);
    },
  );
  client.on("reconnect", (attempts: number) => {
    this.appendTimeline({ text: `弹幕连接断开，正在重试: ${attempts}` });
    this.emit("DebugLog", {
      type: "common",
      text: `douyin ${this.channelId} danma has reconnect ${attempts}`,
    });
  });
  client.on("error", (err) => {
    this.emit("DebugLog", {
      type: "common",
      text: `douyin ${this.channelId} danma error: ${String(err)}`,
    });
  });
  client.on("init", (url) => {
    this.emit("DebugLog", {
      type: "common",
      text: `douyin ${this.channelId} danma init ${url}`,
    });
  });
  client.on("open", () => {
    this.appendTimeline({ text: `弹幕连接已建立` });
    this.emit("DebugLog", {
      type: "common",
      text: `douyin ${this.channelId} danma open`,
    });
  });
  client.on("close", () => {
    this.emit("DebugLog", {
      type: "common",
      text: `douyin danma close`,
    });
  });

  // client.on("open", () => {
  //   console.log("open");
  // });
  // client.on("close", () => {
  //   console.log("close");
  // });
  // client.on("error", (err) => {
  //   console.log("error", err);
  // });
  // client.on("heartbeat", () => {
  //   // console.log("heartbeat");
  // });

  if (!this.disableProvideCommentsWhenRecording) {
    client.connect();
  }

  const downloaderArgs = downloader.getArguments();
  downloader.run();

  const cut = utils.singleton<RecordHandle["cut"]>(async () => {
    if (!this.recordHandle) return;
    downloader.cut();
  });

  const stop = singleton<RecordHandle["stop"]>(async (reason?: string) => {
    if (!this.recordHandle) return;
    this.emit("stateChange", { state: "stopping-record" });

    try {
      messages.dispose(true);
      client.close();
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
    this.emit("stateChange", { state: "idle" });
    this.cache.set("qualityRetryLeft", this.qualityRetry);
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

export const provider: RecorderProvider<{}> = {
  id: "DouYin",
  name: "抖音",
  siteURL: "https://live.douyin.com/",

  matchURL(channelURL) {
    // 支持 v.douyin.com 和 live.douyin.com
    return /https?:\/\/(live|v|www)\.douyin\.com\//.test(channelURL);
  },

  async resolveChannelInfoFromURL(channelURL) {
    if (!this.matchURL(channelURL)) return null;

    let id: string;
    if (channelURL.includes("v.douyin.com")) {
      // 处理短链接
      try {
        id = await resolveShortURL(channelURL);
      } catch (err: any) {
        throw new Error(`解析抖音短链接失败: ${err?.message}`);
      }
    } else if (channelURL.includes("/user/")) {
      // 解析用户主页
      id = await parseUser(channelURL);
      if (!id) {
        throw new Error(`解析抖音用户主页失败`);
      }
    } else {
      // 处理常规直播链接
      id = path.basename(new URL(channelURL).pathname);
    }
    const info = await getInfo(id);

    return {
      id: info.roomId,
      title: info.title,
      owner: info.owner,
      avatar: info.avatar,
      uid: info.uid,
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
