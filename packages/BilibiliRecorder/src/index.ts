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

    availableStreams: [],
    availableSources: [],
    state: "idle",
    qualityMaxRetry: opts.qualityRetry ?? 0,
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

const ffmpegOutputOptions: string[] = [
  "-c",
  "copy",
  "-movflags",
  "faststart+frag_keyframe+empty_moov",
  "-min_frag_duration",
  "10000000",
];
const ffmpegInputOptions: string[] = [
  "-reconnect",
  "1",
  "-reconnect_streamed",
  "1",
  "-reconnect_delay_max",
  "10",
  "-rw_timeout",
  "15000000",
  "-headers",
  "Referer:https://live.bilibili.com/",
];

const checkLiveStatusAndRecord: Recorder["checkLiveStatusAndRecord"] = async function ({
  getSavePath,
  isManualStart,
  banLiveId,
}) {
  if (this.recordHandle != null) return this.recordHandle;
  const { living, liveId, owner: _owner, title: _title } = await getLiveStatus(this.channelId);
  this.liveInfo = {
    living,
    owner: _owner,
    title: _title,
    avatar: "",
    cover: "",
    liveId: liveId,
  };

  if (liveId === banLiveId) {
    this.tempStopIntervalCheck = true;
  } else {
    this.tempStopIntervalCheck = false;
  }
  if (this.tempStopIntervalCheck) return null;
  if (!living) return null;

  // 检查标题是否包含关键词，如果包含则不自动录制
  // 手动开始录制时不检查标题关键词
  if (
    !isManualStart &&
    this.titleKeywords &&
    typeof this.titleKeywords === "string" &&
    this.titleKeywords.trim()
  ) {
    const hasTitleKeyword = hasKeyword(_title, this.titleKeywords);
    if (hasTitleKeyword) {
      this.emit("DebugLog", {
        type: "common",
        text: `跳过录制：直播间标题 "${_title}" 包含关键词 "${this.titleKeywords}"`,
      });
      return null;
    }
  }

  const liveInfo = await getInfo(this.channelId);
  const { owner, title, roomId } = liveInfo;
  this.liveInfo = liveInfo;

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
      cookie: this.auth,
      strictQuality: strictQuality,
      formatName: this.formatName,
      codecName: this.codecName,
      onlyAudio: this.onlyAudio,
    });
  } catch (err) {
    if (this.qualityRetry > 0) this.qualityRetry -= 1;
    this.state = "idle";
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

  let recorderType: "ffmpeg" | "mesio" = this.recorderType ?? "ffmpeg";
  // TODO:测试只录制音频，hls以及fmp4，测试分辨率变化
  const recorder = createBaseRecorder(
    recorderType,
    {
      url: url,
      outputOptions: ffmpegOutputOptions,
      inputOptions: ffmpegInputOptions,
      mesioOptions: ["-H", "Referer:https://live.bilibili.com/"],
      segment: this.segment ?? 0,
      getSavePath: (opts) =>
        getSavePath({ owner, title: opts.title ?? title, startTime: opts.startTime }),
      formatName: streamOptions.format_name as "flv" | "ts" | "fmp4",
      disableDanma: this.disableProvideCommentsWhenRecording,
      videoFormat: this.videoFormat,
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
  });

  try {
    ensureFolderExist(savePath);
  } catch (err) {
    this.state = "idle";
    throw err;
  }

  const handleVideoCreated = async ({ filename, title, cover }) => {
    this.emit("videoFileCreated", { filename, cover });

    if (title && this?.liveInfo) {
      this.liveInfo.title = title;
    }
    if (cover && this?.liveInfo) {
      this.liveInfo.cover = cover;
    }
    const extraDataController = recorder.getExtraDataController();
    extraDataController?.setMeta({
      room_id: String(roomId),
      platform: provider?.id,
      liveStartTimestamp: liveInfo.startTime?.getTime(),
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

  let danmaClient = new DanmaClient(roomId, {
    auth: this.auth,
    uid: this.uid,
    useServerTimestamp: this.useServerTimestamp,
  });
  if (!this.disableProvideCommentsWhenRecording) {
    danmaClient.on("Message", (msg) => {
      const extraDataController = recorder.getExtraDataController();
      if (!extraDataController) return;

      if (msg.type === "super_chat" && this.saveSCDanma === false) return;
      if ((msg.type === "give_gift" || msg.type === "guard") && this.saveGiftDanma === false)
        return;

      this.emit("Message", msg);
      extraDataController.addMessage(msg);
    });
    danmaClient.on("onRoomInfoChange", (msg) => {
      if (
        !isManualStart &&
        this.titleKeywords &&
        typeof this.titleKeywords === "string" &&
        this.titleKeywords.trim()
      ) {
        const title = msg?.body?.title ?? "";
        const hasTitleKeyword = hasKeyword(title, this.titleKeywords);

        if (hasTitleKeyword) {
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
    intervalId && clearInterval(intervalId);

    try {
      danmaClient.stop();
      await recorder.stop();
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
