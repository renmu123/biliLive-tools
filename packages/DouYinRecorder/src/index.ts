import path from "node:path";
import mitt from "mitt";
import {
  defaultFromJSON,
  defaultToJSON,
  genRecorderUUID,
  genRecordUUID,
  FFMPEGRecorder,
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

import DouYinDanmaClient from "douyin-danma-listener";

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

    getChannelURL() {
      return `https://live.douyin.com/${this.channelId}`;
    },
    checkLiveStatusAndRecord: singleton(checkLiveStatusAndRecord),

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

const ffmpegOutputOptions: string[] = [
  "-c",
  "copy",
  "-movflags",
  "faststart+frag_keyframe+empty_moov",
  "-min_frag_duration",
  "60000000",
];
const checkLiveStatusAndRecord: Recorder["checkLiveStatusAndRecord"] = async function ({
  getSavePath,
  banLiveId,
}) {
  if (this.recordHandle != null) return this.recordHandle;

  const liveInfo = await getInfo(this.channelId);
  const { living, owner, title } = liveInfo;
  this.liveInfo = liveInfo;

  if (liveInfo.liveId === banLiveId) {
    this.tempStopIntervalCheck = true;
  } else {
    this.tempStopIntervalCheck = false;
  }
  if (this.tempStopIntervalCheck) return null;
  if (!living) return null;

  this.state = "recording";
  let res: Awaited<ReturnType<typeof getStream>>;
  try {
    res = await getStream({
      channelId: this.channelId,
      quality: this.quality,
      streamPriorities: this.streamPriorities,
      sourcePriorities: this.sourcePriorities,
    });
  } catch (err) {
    this.state = "idle";
    throw err;
  }
  const { currentStream: stream, sources: availableSources, streams: availableStreams } = res;
  this.availableStreams = availableStreams.map((s) => s.desc);
  this.availableSources = availableSources.map((s) => s.name);
  this.usedStream = stream.name;
  this.usedSource = stream.source;
  // TODO: emit update event

  let isEnded = false;
  const onEnd = (...args: unknown[]) => {
    if (isEnded) return;
    isEnded = true;
    this.emit("DebugLog", {
      type: "common",
      text: `ffmpeg end, reason: ${JSON.stringify(args, (_, v) => (v instanceof Error ? v.stack : v))}`,
    });
    const reason = args[0] instanceof Error ? args[0].message : String(args[0]);
    this.recordHandle?.stop(reason);
  };

  const recorder = new FFMPEGRecorder(
    {
      url: stream.url,
      outputOptions: ffmpegOutputOptions,
      segment: this.segment ?? 0,
      getSavePath: (opts) => getSavePath({ owner, title, startTime: opts.startTime }),
    },
    onEnd,
  );

  const savePath = getSavePath({
    owner,
    title,
  });

  try {
    ensureFolderExist(savePath);
  } catch (err) {
    this.state = "idle";
    throw err;
  }

  const handleVideoCreated = async ({ filename }) => {
    this.emit("videoFileCreated", { filename });
    const extraDataController = recorder?.getExtraDataController();
    extraDataController?.setMeta({
      room_id: this.channelId,
      platform: provider?.id,
      // liveStartTimestamp: liveInfo.startTime?.getTime(),
      recordStopTimestamp: Date.now(),
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

  const client = new DouYinDanmaClient(liveInfo.liveId);
  client.on("chat", (msg) => {
    const extraDataController = recorder.getExtraDataController();
    if (!extraDataController) return;
    const comment: Comment = {
      type: "comment",
      timestamp: Date.now(),
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
    // console.log("comment", comment);
    this.emit("Message", comment);
    extraDataController.addMessage(comment);
  });
  client.on("gift", (msg) => {
    const extraDataController = recorder.getExtraDataController();
    if (!extraDataController) return;
    if (this.saveGiftDanma === false) return;
    // console.log("gift", msg);
    const gift: GiveGift = {
      type: "give_gift",
      timestamp: new Date(msg.sendTime).getTime(),
      name: msg.gift.name,
      price: 1,
      count: Number(msg.totalCount),
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
    // console.log("gift", gift);
    this.emit("Message", gift);
    extraDataController.addMessage(gift);
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

  const ffmpegArgs = recorder.getArguments();
  // extraDataController.setMeta({
  //   recordStartTimestamp: Date.now(),
  //   ffmpegArgs,
  // });
  recorder.run();

  const stop = singleton<RecordHandle["stop"]>(async (reason?: string) => {
    if (!this.recordHandle) return;
    this.state = "stopping-record";

    recorder.stop();
    client.close();

    this.usedStream = undefined;
    this.usedSource = undefined;

    await recorder.handleVideoCompleted();
    this.emit("RecordStop", { recordHandle: this.recordHandle, reason });
    this.recordHandle = undefined;
    this.liveInfo = undefined;
    this.state = "idle";
  });

  this.recordHandle = {
    id: genRecordUUID(),
    stream: stream.name,
    source: stream.source,
    url: stream.url,
    ffmpegArgs,
    savePath: savePath,
    stop,
  };
  this.emit("RecordStart", this.recordHandle);

  return this.recordHandle;
};

export const provider: RecorderProvider<{}> = {
  id: "DouYin",
  name: "抖音",
  siteURL: "https://live.douyin.com/",

  matchURL(channelURL) {
    // TODO: 暂时不支持 v.douyin.com
    return /https?:\/\/live\.douyin\.com\//.test(channelURL);
  },

  async resolveChannelInfoFromURL(channelURL) {
    if (!this.matchURL(channelURL)) return null;

    const id = path.basename(new URL(channelURL).pathname);
    const info = await getInfo(id);

    return {
      id: info.roomId,
      title: info.title,
      owner: info.owner,
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
