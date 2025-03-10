import path from "node:path";
import mitt from "mitt";
import {
  Recorder,
  RecorderCreateOpts,
  RecorderProvider,
  createFFMPEGBuilder,
  RecordHandle,
  defaultFromJSON,
  defaultToJSON,
  genRecorderUUID,
  genRecordUUID,
  StreamManager,
  utils,
} from "@bililive-tools/manager";
import type { Comment, GiveGift, SuperChat, Guard } from "@bililive-tools/manager";

import { getInfo, getStream, getLiveStatus, getStrictStream } from "./stream.js";
import { assertStringType, ensureFolderExist, createInvalidStreamChecker } from "./utils.js";
import { startListen, MsgHandler } from "./blive-message-listener/index.js";

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
  "-reconnect",
  "1",
  "-reconnect_streamed",
  "1",
  "-reconnect_delay_max",
  "5",
  "-rw_timeout",
  "5000000",
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
  const { owner, title, roomId, cover } = liveInfo;
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
        stream.url = url;
        this.emit("DebugLog", {
          type: "common",
          text: `update stream: ${url}`,
        });
      },
      50 * 60 * 1000,
    );
  }
  // console.log(streamOptions.protocol_name, url);

  const savePath = getSavePath({ owner, title });
  const hasSegment = !!this.segment;

  try {
    ensureFolderExist(savePath);
  } catch (err) {
    this.state = "idle";
    throw err;
  }

  const streamManager = new StreamManager(this, getSavePath, owner, title, savePath, hasSegment);
  const handleVideoCreated = async ({ filename }) => {
    const extraDataController = streamManager?.getExtraDataController();
    extraDataController?.setMeta({
      room_id: String(roomId),
      platform: provider?.id,
      liveStartTimestamp: liveInfo.startTime?.getTime(),
    });
    if (this.saveCover) {
      const coverPath = utils.replaceExtName(filename, ".jpg");
      utils.downloadImage(cover, coverPath);
    }
  };
  this.on("videoFileCreated", handleVideoCreated);

  let client: ReturnType<typeof startListen> | null = null;
  if (!this.disableProvideCommentsWhenRecording) {
    const handler: MsgHandler = {
      onIncomeDanmu: (msg) => {
        const extraDataController = streamManager.getExtraDataController();
        if (!extraDataController) return;

        let content = msg.body.content;
        // 去除前后空格，回车，换行
        content = content.replace(/(^\s*)|(\s*$)/g, "").replace(/[\r\n]/g, "");
        if (content === "") return;

        const comment: Comment = {
          type: "comment",
          timestamp: msg.timestamp,
          text: content,
          color: msg.body.content_color,
          mode: msg.body.type,

          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            extra: {
              badgeName: msg.body.user.badge?.name,
              badgeLevel: msg.body.user.badge?.level,
            },
          },
        };
        this.emit("Message", comment);
        extraDataController.addMessage(comment);
      },
      onIncomeSuperChat: (msg) => {
        const extraDataController = streamManager.getExtraDataController();
        if (!extraDataController) return;
        if (this.saveSCDanma === false) return;

        const content = msg.body.content.replaceAll(/[\r\n]/g, "");
        // console.log(msg.id, msg.body);
        const comment: SuperChat = {
          type: "super_chat",
          timestamp: msg.timestamp,
          text: content,
          price: msg.body.price,
          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            extra: {
              badgeName: msg.body.user.badge?.name,
              badgeLevel: msg.body.user.badge?.level,
            },
          },
        };
        this.emit("Message", comment);
        extraDataController.addMessage(comment);
      },
      onGuardBuy: (msg) => {
        const extraDataController = streamManager.getExtraDataController();
        if (!extraDataController) return;

        // console.log("guard", msg);
        if (this.saveGiftDanma === false) return;
        const gift: Guard = {
          type: "guard",
          timestamp: msg.timestamp,
          name: msg.body.gift_name,
          price: msg.body.price,
          count: 1,
          level: msg.body.guard_level,
          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            extra: {
              badgeName: msg.body.user.badge?.name,
              badgeLevel: msg.body.user.badge?.level,
            },
          },
        };
        this.emit("Message", gift);
        extraDataController.addMessage(gift);
      },
      onGift: (msg) => {
        const extraDataController = streamManager.getExtraDataController();
        if (!extraDataController) return;

        // console.log("gift", msg);
        if (this.saveGiftDanma === false) return;

        const gift: GiveGift = {
          type: "give_gift",
          timestamp: msg.timestamp,
          name: msg.body.gift_name,
          count: msg.body.amount,
          price: msg.body.coin_type === "silver" ? 0 : msg.body.price / 1000,
          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            extra: {
              badgeName: msg.body.user.badge?.name,
              badgeLevel: msg.body.user.badge?.level,
            },
          },
          extra: {
            hits: msg.body.combo?.combo_num,
          },
        };
        this.emit("Message", gift);
        extraDataController.addMessage(gift);
      },
    };
    // 弹幕协议不能走短 id，所以不能直接用 channelId。
    client = startListen(roomId, handler, {
      ws: {
        headers: {
          Cookie: this.auth ?? "",
        },
        uid: this.uid ?? 0,
      },
    });
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

  const isInvalidStream = createInvalidStreamChecker();
  const timeoutChecker = utils.createTimeoutChecker(() => onEnd("ffmpeg timeout"), 3 * 10e3);
  const command = createFFMPEGBuilder()
    .input(url)
    .addInputOptions(
      "-user_agent",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:107.0) Gecko/20100101 Firefox/107.0",
      "-headers",
      "Referer: https://live.bilibili.com/",
    )
    .outputOptions(ffmpegOutputOptions)
    .output(streamManager.videoFilePath)
    .on("start", async () => {
      try {
        await streamManager.handleVideoStarted();
      } catch (err) {
        onEnd("ffmpeg start error");
        this.emit("DebugLog", { type: "common", text: String(err) });
      }
    })
    .on("error", onEnd)
    .on("end", () => onEnd("finished"))
    .on("stderr", async (stderrLine) => {
      assertStringType(stderrLine);
      if (utils.isFfmpegStartSegment(stderrLine)) {
        try {
          await streamManager.handleVideoStarted(stderrLine);
        } catch (err) {
          onEnd("ffmpeg start error");
          this.emit("DebugLog", { type: "common", text: String(err) });
        }
      }
      this.emit("DebugLog", { type: "ffmpeg", text: stderrLine });

      if (isInvalidStream(stderrLine)) {
        onEnd("invalid stream");
      }
    })
    .on("stderr", timeoutChecker.update);
  if (hasSegment) {
    command.outputOptions(
      "-f",
      "segment",
      "-segment_time",
      String(this.segment! * 60),
      "-reset_timestamps",
      "1",
    );
  }
  const ffmpegArgs = command._getArguments();
  command.run();

  const stop = utils.singleton<RecordHandle["stop"]>(async (reason?: string) => {
    if (!this.recordHandle) return;

    this.state = "stopping-record";
    // TODO: emit update event

    timeoutChecker.stop();

    try {
      // @ts-ignore
      command.ffmpegProc?.stdin?.write("q");
      client?.close();
      this.usedStream = undefined;
      this.usedSource = undefined;

      await streamManager.handleVideoCompleted();
    } catch (err) {
      // TODO: 这个 stop 经常报错，这里先把错误吞掉，以后再处理。
      this.emit("DebugLog", { type: "common", text: String(err) });
    }
    this.emit("RecordStop", { recordHandle: this.recordHandle, reason });
    this.off("videoFileCreated", handleVideoCreated);
    this.recordHandle = undefined;
    this.liveInfo = undefined;
    this.state = "idle";
    this.qualityRetry = this.qualityMaxRetry;
    intervalId && clearInterval(intervalId);
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
