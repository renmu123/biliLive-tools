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
  Comment,
  GiveGift,
} from "@bililive-tools/manager";

import { getInfo, getStream } from "./stream.js";
import { ensureFolderExist, singleton } from "./utils.js";
import { resolveShortURL, parseUser } from "./douyin_api.js";

import DouYinDanmaClient from "douyin-danma-listener";

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
    state: "idle",

    getChannelURL() {
      return `https://live.douyin.com/${this.channelId}`;
    },
    checkLiveStatusAndRecord: singleton(checkLiveStatusAndRecord),

    toJSON() {
      return defaultToJSON(provider, this);
    },

    async getLiveInfo() {
      const channelId = this.channelId;
      const info = await getInfo(channelId, {
        cookie: this.auth,
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
      });
      return res.currentStream;
    },
    async getQualityRetryLeft() {
      console.log("getQualityRetryLeft", this.cache.get("qualityRetryLeft"), this.qualityRetry);
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
  // 如果已经在录制中,只在需要检查标题关键词时才获取最新信息
  if (this.recordHandle != null) {
    const shouldStop = await utils.checkTitleKeywordsWhileRecording(
      this,
      isManualStart,
      (channelId) =>
        getInfo(channelId, {
          cookie: this.auth,
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
  try {
    const liveInfo = await getInfo(this.channelId, {
      cookie: this.auth,
      api: this.api as APIType,
      uid: this.uid,
    });
    this.liveInfo = liveInfo;
    this.state = "idle";
  } catch (error) {
    this.state = "check-error";
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

  const qualityRetryLeft = await this.getQualityRetryLeft();
  const strictQuality = utils.shouldUseStrictQuality(
    qualityRetryLeft,
    this.qualityRetry,
    isManualStart,
  );
  console.log("11111strictQuality", strictQuality, qualityRetryLeft, this.qualityRetry);

  let res: Awaited<ReturnType<typeof getStream>>;
  try {
    // TODO: 检查mobile接口处理双屏录播流
    res = await getStream({
      channelId: this.channelId,
      quality: this.quality,
      streamPriorities: this.streamPriorities,
      sourcePriorities: this.sourcePriorities,
      strictQuality: strictQuality,
      cookie: this.auth,
      formatPriorities: this.formatPriorities,
      doubleScreen: this.doubleScreen,
      api: this.api as APIType,
      uid: this.uid,
    });
    this.liveInfo.owner = res.owner;
    this.liveInfo.title = res.title;
    this.liveInfo.cover = res.cover;
    this.liveInfo.liveId = res.liveId;
    this.liveInfo.avatar = res.avatar;
    this.liveInfo.startTime = new Date();

    // 再检查一次，上一个接口可能不存在标题参数
    if (utils.checkTitleKeywordsBeforeRecord(this.liveInfo.title, this, isManualStart)) return null;
  } catch (err) {
    if (qualityRetryLeft > 0) await this.cache.set("qualityRetryLeft", qualityRetryLeft - 1);

    this.state = "check-error";
    throw err;
  }
  const { owner, title, startTime } = this.liveInfo;

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
      onlyAudio: stream.onlyAudio,
      headers: {
        Cookie: this.auth,
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
      // liveStartTimestamp: liveInfo.startTime?.getTime(),
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

  // 礼物消息缓存管理
  const giftMessageCache = new Map<
    string,
    {
      gift: GiveGift;
      timer: NodeJS.Timeout;
    }
  >();

  // 礼物延迟处理时间(毫秒),可根据实际情况调整
  const GIFT_DELAY = 5000;

  const client = new DouYinDanmaClient(this?.liveInfo?.liveId as string, {
    cookie: this.auth,
  });
  client.on("chat", (msg) => {
    const extraDataController = downloader.getExtraDataController();
    if (!extraDataController) return;
    const comment: Comment = {
      type: "comment",
      timestamp: this.useServerTimestamp ? Number(msg.eventTime) * 1000 : Date.now(),
      text: msg.content,
      color: "#ffffff",
      sender: {
        uid: msg.user.id,
        name: msg.user.nickName,
        // avatar: msg.user.AvatarThumb.urlListList[0],
        // extra: {
        //   level: msg.level,
        // },
      },
    };
    this.emit("Message", comment);
    extraDataController.addMessage(comment);
  });
  client.on("gift", (msg) => {
    const extraDataController = downloader.getExtraDataController();
    if (!extraDataController) return;
    if (this.saveGiftDanma === false) return;

    const serverTimestamp =
      Number(msg.common.createTime) > 9999999999
        ? Number(msg.common.createTime)
        : Number(msg.common.createTime) * 1000;

    const gift: GiveGift = {
      type: "give_gift",
      timestamp: this.useServerTimestamp ? serverTimestamp : Date.now(),
      name: msg.gift.name,
      price: msg.gift.diamondCount / 10 || 0,
      count: Number(msg.totalCount ?? 1),
      color: "#ffffff",
      sender: {
        uid: msg.user.id,
        name: msg.user.nickName,
        // avatar: msg.ic,
        // extra: {
        //   level: msg.level,
        // },
      },
    };

    // 单独使用groupId并不可靠
    const groupId = `${msg.groupId}_${msg.user.id}_${msg.giftId}`;

    // 如果已存在相同 groupId 的礼物,清除旧的定时器
    const existing = giftMessageCache.get(groupId);
    if (existing) {
      clearTimeout(existing.timer);
    }

    // 创建新的定时器
    const timer = setTimeout(() => {
      const cachedGift = giftMessageCache.get(groupId);
      if (cachedGift) {
        // 延迟时间到,添加最终的礼物消息
        this.emit("Message", cachedGift.gift);
        extraDataController.addMessage(cachedGift.gift);
        giftMessageCache.delete(groupId);
      }
    }, GIFT_DELAY);

    // 更新缓存
    giftMessageCache.set(groupId, { gift, timer });
  });
  client.on("reconnect", (attempts: number) => {
    this.emit("DebugLog", {
      type: "common",
      text: `douyin ${this.channelId}  danma has reconnect ${attempts}`,
    });
  });
  client.on("error", (err) => {
    this.emit("DebugLog", {
      type: "common",
      text: `douyin ${this.channelId}  danma error: ${String(err)}`,
    });
  });
  client.on("init", (url) => {
    this.emit("DebugLog", {
      type: "common",
      text: `douyin ${this.channelId}  danma init ${url}`,
    });
  });
  client.on("open", () => {
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

  const cut = singleton<RecordHandle["cut"]>(async () => {
    if (!this.recordHandle) return;
    if (isCutting) return;
    isCutting = true;
    await downloader.stop();
    downloader.createCommand();
    downloader.run();
  });

  const stop = singleton<RecordHandle["stop"]>(async (reason?: string) => {
    if (!this.recordHandle) return;
    this.state = "stopping-record";

    try {
      // 清理所有礼物缓存定时器
      for (const [_groupId, cached] of giftMessageCache.entries()) {
        clearTimeout(cached.timer);
        // 立即添加剩余的礼物消息
        const extraDataController = downloader.getExtraDataController();
        if (extraDataController) {
          this.emit("Message", cached.gift);
          extraDataController.addMessage(cached.gift);
        }
      }
      giftMessageCache.clear();

      client.close();
      await downloader.stop();
    } catch (err) {
      this.emit("DebugLog", {
        type: "common",
        text: `stop ffmpeg error: ${String(err)}`,
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
