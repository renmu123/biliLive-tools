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
  Comment,
  GiveGift,
  SuperChat,
  Recorder,
  RecorderCreateOpts,
  RecorderProvider,
  RecordHandle,
} from "@bililive-tools/manager";

import { getInfo, getStream } from "./stream.js";
import { getRoomInfo } from "./dy_api.js";
import { ensureFolderExist } from "./utils.js";
import { createDYClient } from "./dy_client/index.js";
import { giftMap, colorTab } from "./danma.js";
import { requester } from "./requester.js";

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
    useServerTimestamp: opts.useServerTimestamp ?? true,
    state: "idle",

    getChannelURL() {
      return `https://www.douyu.com/${this.channelId}`;
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
      source: this.source,
      strictQuality,
      onlyAudio: this.onlyAudio,
      avoidEdgeCDN: true,
    });
  } catch (err) {
    if (qualityRetryLeft > 0) await this.cache.set("qualityRetryLeft", qualityRetryLeft - 1);

    this.state = "check-error";
    throw err;
  }

  this.state = "recording";
  const { currentStream: stream, sources: availableSources, streams: availableStreams } = res;
  this.availableStreams = availableStreams.map((s) => s.name);
  this.availableSources = availableSources.map((s) => s.name);
  this.usedStream = stream.name;
  this.usedSource = stream.source;

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
  let isEnded = false;
  let isCutting = false;

  const recordStartTime = new Date();
  const downloader = createDownloader(
    this.recorderType,
    {
      url: stream.url,
      // @ts-ignore
      outputOptions: ffmpegOutputOptions,
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

  const client = createDYClient(Number(this.channelId), {
    notAutoStart: true,
  });
  client.on("message", (msg) => {
    const extraDataController = downloader.getExtraDataController();
    if (!extraDataController) return;
    switch (msg.type) {
      case "chatmsg": {
        // 某些情况下cst不存在，可能是其他平台发送的弹幕？
        const timestamp = this.useServerTimestamp && msg.cst ? Number(msg.cst) : Date.now();
        const comment: Comment = {
          type: "comment",
          timestamp: timestamp,
          text: msg.txt,
          color: colorTab[msg.col] ?? "#ffffff",
          sender: {
            uid: msg.uid,
            name: msg.nn,
            avatar: msg.ic,
            extra: {
              level: msg.level,
            },
          },
        };
        this.emit("Message", comment);
        extraDataController.addMessage(comment);
        break;
      }
      case "dgb": {
        if (this.saveGiftDanma === false) return;
        const gift: GiveGift = {
          type: "give_gift",
          timestamp: Date.now(),
          name: giftMap[msg.gfid]?.name ?? msg.gfn,
          price: (giftMap[msg.gfid]?.pc ?? 0) / 100,
          count: Number(msg.gfcnt),
          color: "#ffffff",
          sender: {
            uid: msg.uid,
            name: msg.nn,
            avatar: msg.ic,
            extra: {
              level: msg.level,
            },
          },
          extra: {
            hits: Number(msg.hits),
          },
        };
        this.emit("Message", gift);
        extraDataController.addMessage(gift);
        break;
      }
      // 开通钻粉
      case "odfbc": {
        if (this.saveGiftDanma === false) return;
        const gift: GiveGift = {
          type: "give_gift",
          timestamp: Date.now(),
          name: "钻粉",
          price: Number(msg.price) / 100,
          count: 1,
          color: "#ffffff",
          sender: {
            uid: msg.uid,
            name: msg.nick,
            // avatar: msg.ic,
            // extra: {
            //   level: msg.level,
            // },
          },
          // extra: {
          //   hits: Number(msg.hits),
          // },
        };
        this.emit("Message", gift);
        extraDataController.addMessage(gift);
        break;
      }
      // 续费钻粉
      case "rndfbc": {
        if (this.saveGiftDanma === false) return;
        const gift: GiveGift = {
          type: "give_gift",
          timestamp: Date.now(),
          name: "钻粉",
          price: Number(msg.price) / 100,
          count: 1,
          color: "#ffffff",
          sender: {
            uid: msg.uid,
            name: msg.nick,
            // avatar: msg.ic,
            // extra: {
            //   level: msg.level,
            // },
          },
          // extra: {
          //   hits: Number(msg.hits),
          // },
        };
        this.emit("Message", gift);
        extraDataController.addMessage(gift);
        break;
      }
      case "comm_chatmsg": {
        if (this.saveSCDanma === false) return;
        switch (msg.btype) {
          case "voiceDanmu": {
            const comment: SuperChat = {
              type: "super_chat",
              timestamp: Date.now(),
              text: msg?.chatmsg?.txt,
              price: Number(msg.cprice) / 100,
              sender: {
                uid: msg.uid,
                name: msg?.chatmsg?.nn,
                avatar: msg?.chatmsg?.ic,
                extra: {
                  level: msg?.chatmsg?.level,
                },
              },
            };
            this.emit("Message", comment);
            extraDataController.addMessage(comment);
            break;
          }
        }
        break;
      }
    }
  });
  client.on("error", (err) => {
    this.emit("DebugLog", { type: "common", text: String(err) });
  });
  if (!this.disableProvideCommentsWhenRecording) {
    client.start();
  }

  const downloaderArgs = downloader.getArguments();
  downloader.run();

  // TODO: 需要一个机制防止空录制，比如检查文件的大小变化、ffmpeg 的输出、直播状态等

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
      client.stop();
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
  id: "DouYu",
  name: "斗鱼",
  siteURL: "https://douyu.com/",

  matchURL(channelURL) {
    return /https?:\/\/(?:.*?\.)?douyu.com\//.test(channelURL);
  },

  async resolveChannelInfoFromURL(channelURL) {
    if (!this.matchURL(channelURL)) return null;

    channelURL = channelURL.trim();
    const res = await requester.get(channelURL);
    const html = res.data;

    const matched = html.match(/\$ROOM\.room_id.?=(.*?);/);
    let roomId: string | undefined = undefined;
    if (matched) {
      roomId = matched[1].trim();
    } else {
      // 解析出query中的rid参数
      const rid = new URL(channelURL).searchParams.get("rid");
      if (rid) {
        roomId = rid;
      } else {
        // 解析<link rel="canonical" href="xxxxxxx"/>中的href
        const canonicalLink = html.match(/<link rel="canonical" href="(.*?)"/);
        if (canonicalLink) {
          const url = canonicalLink[1];
          roomId = url.split("/").pop();
        }
      }
    }
    if (!roomId) return null;

    const roomInfo = await getRoomInfo(Number(roomId));

    return {
      id: roomId,
      title: roomInfo.room.room_name,
      owner: roomInfo.room.nickname,
      avatar: roomInfo.room.avatar?.big,
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
