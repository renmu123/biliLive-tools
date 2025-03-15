import path from "node:path";
import mitt from "mitt";
import {
  defaultFromJSON,
  defaultToJSON,
  genRecorderUUID,
  genRecordUUID,
  utils,
  FFMPEGRecorder,
} from "@bililive-tools/manager";

import { getInfo, getStream, getLiveStatus, getStrictStream } from "./stream.js";
import { ensureFolderExist } from "./utils.js";
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

    availableStreams: [],
    availableSources: [],
    state: "idle",
    qualityMaxRetry: opts.qualityRetry ?? 0,
    qualityRetry: opts.qualityRetry ?? 0,
    useM3U8Proxy: opts.useM3U8Proxy ?? false,
    m3u8ProxyUrl: opts.m3u8ProxyUrl,
    formatName: opts.formatName ?? "auto",
    codecName: opts.codecName ?? "auto",

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

const ffmpegOutputOptions: string[] = [
  "-c",
  "copy",
  "-movflags",
  "faststart+frag_keyframe+empty_moov",
  "-min_frag_duration",
  "60000000",
];
const ffmpegInputOptions: string[] = [
  "-reconnect",
  "1",
  "-reconnect_streamed",
  "1",
  "-reconnect_delay_max",
  "5",
  "-rw_timeout",
  "5000000",
  "-headers",
  "Referer:https://live.bilibili.com/",
];
const checkLiveStatusAndRecord: Recorder["checkLiveStatusAndRecord"] = async function ({
  getSavePath,
  qualityRetry,
  banLiveId,
}) {
  if (this.recordHandle != null) return this.recordHandle;
  const { living, liveId } = await getLiveStatus(this.channelId);
  this.liveInfo = {
    living,
    owner: "",
    title: "",
    avatar: "",
    cover: "",
    liveId: "",
  };

  if (liveId === banLiveId) {
    this.tempStopIntervalCheck = true;
  } else {
    this.tempStopIntervalCheck = false;
  }
  if (this.tempStopIntervalCheck) return null;
  if (!living) return null;

  const liveInfo = await getInfo(this.channelId);
  const { owner, title, roomId } = liveInfo;
  this.liveInfo = liveInfo;

  this.state = "recording";
  let res: Awaited<ReturnType<typeof getStream>>;
  // TODO: 先不做什么错误处理，就简单包一下预期上会有错误的地方
  try {
    let strictQuality = !!this.qualityRetry;
    if (qualityRetry !== undefined) {
      strictQuality = !!qualityRetry;
    }
    res = await getStream({
      channelId: this.channelId,
      quality: this.quality,
      cookie: this.auth,
      strictQuality: strictQuality,
      formatName: this.formatName,
      codecName: this.codecName,
    });
  } catch (err) {
    this.qualityRetry -= 1;
    this.state = "idle";
    throw err;
  }
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
    url = `${this.m3u8ProxyUrl}?id=${this.id}`;
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
      inputOptions: ffmpegInputOptions,
      segment: this.segment,
      getSavePath: (opts) => getSavePath({ owner, title, startTime: opts.startTime }),
      isHls: streamOptions.protocol_name === "http_hls",
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
      room_id: String(roomId),
      platform: provider?.id,
      liveStartTimestamp: liveInfo.startTime?.getTime(),
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

  let danmaClient = new DanmaClient(roomId, this.auth, this.uid);
  if (!this.disableProvideCommentsWhenRecording) {
    danmaClient = danmaClient.on("Message", (msg) => {
      const extraDataController = recorder.getExtraDataController();
      if (!extraDataController) return;

      if (msg.type === "super_chat" && this.saveSCDanma === false) return;
      if ((msg.type === "give_gift" || msg.type === "guard") && this.saveGiftDanma === false)
        return;

      this.emit("Message", msg);
      extraDataController.addMessage(msg);
    });
    danmaClient.start();
  }

  const ffmpegArgs = recorder.getArguments();
  recorder.run();

  const stop = utils.singleton<RecordHandle["stop"]>(async (reason?: string) => {
    if (!this.recordHandle) return;

    this.state = "stopping-record";
    intervalId && clearInterval(intervalId);
    this.usedStream = undefined;
    this.usedSource = undefined;
    danmaClient.stop();
    recorder.stop();

    try {
      await recorder.handleVideoCompleted();
    } catch (err) {
      this.emit("DebugLog", { type: "common", text: String(err) });
    }
    this.emit("RecordStop", { recordHandle: this.recordHandle, reason });
    this.recordHandle = undefined;
    this.liveInfo = undefined;
    this.state = "idle";
    this.qualityRetry = this.qualityMaxRetry;
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
