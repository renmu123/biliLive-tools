import mitt from "mitt";
// @ts-ignore
import * as cheerio from "cheerio";
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
  createRecordExtraDataController,
  Comment,
  GiveGift,
} from "@autorecord/manager";
import { getInfo, getStream } from "./stream.js";
import { assert, ensureFolderExist, replaceExtName, singleton } from "./utils.js";
import { createDYClient } from "./dy_client/index.js";
import { giftMap } from "./gift_map.js";
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

    availableStreams: [],
    availableSources: [],
    state: "idle",

    getChannelURL() {
      return `https://www.douyu.com/${this.channelId}`;
    },
    checkLiveStatusAndRecord: singleton(checkLiveStatusAndRecord),

    toJSON() {
      return defaultToJSON(provider, this);
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
  "frag_keyframe",
  "-min_frag_duration",
  "60000000",
];
const checkLiveStatusAndRecord: Recorder["checkLiveStatusAndRecord"] = async function ({
  getSavePath,
}) {
  if (this.recordHandle != null) return this.recordHandle;

  const { living, owner, title } = await getInfo(this.channelId);
  if (!living) return null;

  this.state = "recording";
  let res;
  // TODO: 先不做什么错误处理，就简单包一下预期上会有错误的地方
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
  this.availableStreams = availableStreams.map((s) => s.name);
  this.availableSources = availableSources.map((s) => s.name);
  this.usedStream = stream.name;
  this.usedSource = stream.source;
  // TODO: emit update event

  const savePath = getSavePath({ owner, title });
  const extraDataSavePath = replaceExtName(savePath, ".json");
  const recordSavePath = savePath;
  try {
    // TODO: 这个 ensure 或许应该放在 createRecordExtraDataController 里实现？
    ensureFolderExist(extraDataSavePath);
    ensureFolderExist(recordSavePath);
  } catch (err) {
    this.state = "idle";
    throw err;
  }

  // TODO: 之后可能要结合 disableRecordMeta 之类的来确认是否要创建文件。
  const extraDataController = createRecordExtraDataController(extraDataSavePath);
  extraDataController.setMeta({ title });

  const client = createDYClient(Number(this.channelId), {
    notAutoStart: true,
  });
  client.on("message", (msg) => {
    switch (msg.type) {
      case "chatmsg": {
        const comment: Comment = {
          type: "comment",
          timestamp: Date.now(),
          text: msg.txt,
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
        const gift: GiveGift = {
          type: "give_gift",
          timestamp: Date.now(),
          name: giftMap[msg.gfid]?.name ?? "未知礼物",
          count: Number(msg.gfcnt),
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

        // TODO: 还有一些其他礼物相关的 msg 要处理，目前先简单点只处理 dgb
      }
    }
  });
  if (!this.disableProvideCommentsWhenRecording) {
    client.start();
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
  const timeoutChecker = createTimeoutChecker(() => onEnd("ffmpeg timeout"), 10e3);
  const command = createFFMPEGBuilder(stream.url)
    .inputOptions(
      "-user_agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36",
    )
    .outputOptions(ffmpegOutputOptions)
    .output(`${recordSavePath}-PART%03d.mp4`)
    .on("error", onEnd)
    .on("end", () => onEnd("finished"))
    .on("stderr", (stderrLine) => {
      assert(typeof stderrLine === "string");
      if (stderrLine.includes("Opening ")) {
        this.emit("RecordSegment", this.recordHandle);
      }
      this.emit("DebugLog", { type: "ffmpeg", text: stderrLine });

      if (isInvalidStream(stderrLine)) {
        onEnd("invalid stream");
      }
    })
    .on("stderr", timeoutChecker.update);
  if (this.segment) {
    command.outputOptions(
      "-f",
      "segment",
      "-segment_time",
      String(this.segment),
      "-reset_timestamps",
      "1",
    );
  }
  const ffmpegArgs = command._getArguments();
  extraDataController.setMeta({
    recordStartTimestamp: Date.now(),
    ffmpegArgs,
  });
  command.run();

  // TODO: 需要一个机制防止空录制，比如检查文件的大小变化、ffmpeg 的输出、直播状态等

  const stop = singleton<RecordHandle["stop"]>(async (reason?: string) => {
    if (!this.recordHandle) return;
    this.state = "stopping-record";
    // TODO: emit update event

    timeoutChecker.stop();

    // 如果给 SIGKILL 信号会非正常退出，SIGINT 可以被 ffmpeg 正常处理。
    // TODO: fluent-ffmpeg 好像没处理好这个 SIGINT 导致的退出信息，会抛一个错。
    command.kill("SIGINT");
    try {
      // TODO: 这里可能会有内存泄露，因为事件还没清，之后再检查下看看。
      client.stop();
    } catch (err) {
      // TODO: 这个 stop 经常报错，这里先把错误吞掉，以后再处理。
      this.emit("DebugLog", { type: "common", text: String(err) });
    }
    extraDataController.setMeta({ recordStopTimestamp: Date.now() });
    extraDataController.flush();

    this.usedStream = undefined;
    this.usedSource = undefined;
    // TODO: other codes
    // TODO: emit update event

    this.emit("RecordStop", { recordHandle: this.recordHandle, reason });
    this.recordHandle = undefined;
    this.state = "idle";
  });

  this.recordHandle = {
    id: genRecordUUID(),
    stream: stream.name,
    source: stream.source,
    url: stream.url,
    ffmpegArgs,
    savePath: recordSavePath,
    stop,
  };
  this.emit("RecordStart", this.recordHandle);

  return this.recordHandle;
};

function createTimeoutChecker(
  onTimeout: () => void,
  time: number,
): {
  update: () => void;
  stop: () => void;
} {
  let timer: NodeJS.Timeout | null = null;
  let stopped: boolean = false;

  const update = () => {
    if (stopped) return;
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      onTimeout();
    }, time);
  };

  update();

  return {
    update,
    stop() {
      stopped = true;
      if (timer != null) clearTimeout(timer);
      timer = null;
    },
  };
}

function createInvalidStreamChecker(): (ffmpegLogLine: string) => boolean {
  let prevFrame = 0;
  let frameUnchangedCount = 0;

  return (ffmpegLogLine) => {
    const streamInfo = ffmpegLogLine.match(
      /frame=\s*(\d+) fps=.*? q=.*? size=\s*(\d+)kB time=.*? bitrate=.*? speed=.*?/,
    );
    if (streamInfo != null) {
      const [, frameText] = streamInfo;
      const frame = Number(frameText);

      if (frame === prevFrame) {
        if (++frameUnchangedCount >= 10) {
          return true;
        }
      } else {
        prevFrame = frame;
        frameUnchangedCount = 0;
      }

      return false;
    }

    if (ffmpegLogLine.includes("HTTP error 404 Not Found")) {
      return true;
    }

    return false;
  };
}

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
    const $ = cheerio.load(html);

    const scriptNode: any = $("script")
      .map((i, tag) => tag.children[0])
      .filter((i, tag: any) => tag.data.includes("$ROOM"))[0];
    if (!scriptNode) return null;
    const matched = scriptNode.data.match(/\$ROOM\.room_id.?=(.*?);/);
    if (!matched) return null;

    return {
      id: matched[1].trim(),
      title: $(".Title-header").text(),
      owner: $(".Title-anchorName").text(),
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
