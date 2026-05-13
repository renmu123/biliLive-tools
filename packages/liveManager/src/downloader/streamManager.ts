import EventEmitter from "node:events";
import fs from "fs/promises";
import fsSync from "fs";

import { createRecordExtraDataController } from "../xml_stream_controller.js";
import {
  ensureFolderExist,
  isFfmpegStartSegment,
  isMesioStartSegment,
  isBililiveStartSegment,
  isFfmpegStart,
  retry,
  cleanTerminalText,
} from "../utils.js";

import type { RecorderCreateOpts } from "../recorder.js";
import type { TrueVideoFormat } from "../index.js";
import type { XmlStreamStats } from "../xml_stream_controller.js";

export type GetSavePath = (data: {
  startTime: number;
  title?: string;
  extraMs?: boolean;
}) => string;
type RecorderType = Exclude<RecorderCreateOpts["recorderType"], undefined | "auto">;

export interface VideoFileCompletedPayload {
  filename: string;
  stats?: XmlStreamStats;
}

export class Segment extends EventEmitter {
  extraDataController: ReturnType<typeof createRecordExtraDataController> | null = null;
  init = true;
  getSavePath: GetSavePath;
  /** 原始的文件名，用于重命名 */
  rawRecordingVideoPath!: string;
  /** 输出文件名名，不包含拓展名 */
  outputVideoFilePath!: string;
  disableDanma: boolean;
  videoExt: TrueVideoFormat;
  options?: { firstStartTime: number };

  constructor(
    getSavePath: GetSavePath,
    disableDanma: boolean,
    videoExt: TrueVideoFormat,
    options?: { firstStartTime: number },
  ) {
    super();
    this.getSavePath = getSavePath;
    this.disableDanma = disableDanma;
    this.videoExt = videoExt;
    this.options = options;
  }

  private getVideoFileCompletedPayload(): VideoFileCompletedPayload {
    return {
      filename: this.outputFilePath,
      stats: this.extraDataController?.getStats(),
    };
  }

  async handleSegmentEnd() {
    if (!this.outputVideoFilePath) {
      this.emit("DebugLog", {
        type: "error",
        text: "Should call onSegmentStart first",
      });
      return;
    }

    const data = this.getVideoFileCompletedPayload();
    try {
      this.emit("DebugLog", {
        type: "info",
        text: `Renaming segment file: ${this.rawRecordingVideoPath} -> ${this.outputFilePath}`,
      });
      await Promise.all([
        retry(() => fs.rename(this.rawRecordingVideoPath, this.outputFilePath), 20, 1000),
        this.extraDataController?.flush(),
      ]);
      this.emit("videoFileCompleted", data);
    } catch (err) {
      this.emit("DebugLog", {
        type: "error",
        text: "videoFileCompleted error " + String(err),
      });
      // 虽然重命名失败了，但是也当作完成处理，避免卡住录制流程
      this.emit("videoFileCompleted", data);
    }
  }

  async onSegmentStart(
    stderrLine: string,
    callBack?: { onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }> },
  ) {
    if (!this.init) {
      await this.handleSegmentEnd();
    }
    // 首次创建使用上次的时间戳，后续创建使用当前时间戳
    const startTime = this.init ? (this.options?.firstStartTime ?? Date.now()) : Date.now();
    this.init = false;
    let liveInfo: {
      title?: string;
      cover?: string;
    } = { title: "", cover: "" };
    if (callBack?.onUpdateLiveInfo) {
      try {
        liveInfo = await callBack.onUpdateLiveInfo();
      } catch (err) {
        this.emit("DebugLog", {
          type: "error",
          text: "onUpdateLiveInfo error " + String(err),
        });
      }
    }
    let recordSavePath = this.getSavePath({
      startTime: startTime,
      title: liveInfo?.title ? liveInfo.title : undefined,
    });
    // 文件重复判断
    if (fsSync.existsSync(recordSavePath + "." + this.videoExt)) {
      recordSavePath = this.getSavePath({
        startTime: startTime,
        title: liveInfo?.title,
        extraMs: true,
      });
    }

    this.outputVideoFilePath = recordSavePath;
    ensureFolderExist(this.outputVideoFilePath);

    if (!this.disableDanma) {
      this.extraDataController = createRecordExtraDataController(`${this.outputVideoFilePath}.xml`);
    }

    // 支持两种格式的正则表达式
    // 1. FFmpeg格式: Opening 'filename' for writing
    // 2. Mesio格式: Opening FLV segment path=filename Processing
    const ffmpegRegex = /'([^']+)'/;
    const mesioRegex = /segment path=(.+?\.(?:flv|ts|m4s))/is;

    let match = stderrLine.match(ffmpegRegex);
    if (!match) {
      match = cleanTerminalText(stderrLine).match(mesioRegex);
    }
    this.emit("DebugLog", { type: "ffmpeg", text: `Segment start line: ${stderrLine}` });

    if (match) {
      const filename = match[1];
      this.rawRecordingVideoPath = filename;
      this.emit("videoFileCreated", {
        rawFilename: filename,
        filename: this.outputFilePath,
        title: liveInfo?.title,
        cover: liveInfo?.cover,
      });
      this.emit("DebugLog", { type: "ffmpeg", text: JSON.stringify(match, null, 2) });
    } else {
      this.emit("DebugLog", { type: "ffmpeg", text: "No match found" });
    }
  }

  get outputFilePath() {
    return `${this.outputVideoFilePath}.${this.videoExt}`;
  }
}

export class StreamManager extends EventEmitter {
  private segment: Segment | null = null;
  private extraDataController: ReturnType<typeof createRecordExtraDataController> | null = null;
  recordSavePath: string;
  recordStartTime?: number;
  hasSegment: boolean;
  recorderType: RecorderType;
  private videoFormat: TrueVideoFormat;
  private callBack?: {
    onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>;
  };

  constructor(
    getSavePath: GetSavePath,
    hasSegment: boolean,
    disableDanma: boolean,
    recorderType: RecorderType,
    videoFormat: TrueVideoFormat,
    callBack?: {
      onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>;
    },
  ) {
    super();
    const startTime = Date.now();
    let recordSavePath = getSavePath({ startTime });
    this.videoFormat = videoFormat;
    this.recorderType = recorderType;
    this.hasSegment = hasSegment;
    this.callBack = callBack;

    console.log("Initial recordSavePath:", recordSavePath);
    // 文件重复判断
    if (fsSync.existsSync(recordSavePath + "." + videoFormat)) {
      console.log("File already exists, generating new save path with extraMs");
      recordSavePath = getSavePath({ startTime, extraMs: true });
    }
    this.recordSavePath = recordSavePath;

    if (hasSegment) {
      this.segment = new Segment(getSavePath, disableDanma, this.videoExt, {
        firstStartTime: startTime,
      });
      this.segment.on("DebugLog", (data) => {
        this.emit("DebugLog", data);
      });
      this.segment.on("videoFileCreated", (data) => {
        this.emit("videoFileCreated", data);
      });
      this.segment.on("videoFileCompleted", (data) => {
        this.emit("videoFileCompleted", data);
      });
    } else {
      ensureFolderExist(recordSavePath);

      const extraDataSavePath = `${recordSavePath}.xml`;

      if (!disableDanma) {
        this.extraDataController = createRecordExtraDataController(extraDataSavePath);
      }
    }
  }

  async handleVideoStarted(stderrLine: string) {
    if (this.recorderType === "ffmpeg") {
      if (this.segment) {
        if (isFfmpegStartSegment(stderrLine)) {
          await this.segment.onSegmentStart(stderrLine, this.callBack);
        }
      } else {
        // 不能直接在onStart回调进行判断，在某些情况下会链接无法录制的情况
        if (isFfmpegStart(stderrLine)) {
          if (this.recordStartTime) return;
          this.recordStartTime = Date.now();
          this.emit("videoFileCreated", { filename: this.videoFilePath });
        }
      }
    } else if (this.recorderType === "mesio") {
      if (this.segment && isMesioStartSegment(stderrLine)) {
        for (let line of stderrLine.split("\n")) {
          if (isMesioStartSegment(line)) {
            await this.segment.onSegmentStart(line, this.callBack);
          }
        }
      }
    } else if (this.recorderType === "bililive") {
      if (this.segment && isBililiveStartSegment(stderrLine)) {
        await this.segment.onSegmentStart(stderrLine, this.callBack);
      }
    }
  }

  async handleVideoCompleted() {
    if (this.recorderType === "ffmpeg") {
      if (this.segment) {
        await this.segment.handleSegmentEnd();
      } else {
        if (this.recordStartTime) {
          const stats = this.extraDataController?.getStats();
          const extraDataController = this.getExtraDataController();
          await extraDataController?.flush();
          this.emit("videoFileCompleted", {
            filename: this.videoFilePath,
            stats: stats,
          });
        }
      }
    } else if (this.recorderType === "mesio") {
      if (this.segment) {
        await this.segment.handleSegmentEnd();
      }
    } else if (this.recorderType === "bililive") {
      if (this.segment) {
        await this.segment.handleSegmentEnd();
      }
    }
  }

  getExtraDataController() {
    return this.segment?.extraDataController || this.extraDataController;
  }

  get videoExt() {
    return this.videoFormat;
  }

  get videoFilePath() {
    if (this.recorderType === "ffmpeg") {
      return this.segment
        ? `${this.recordSavePath}-PART%03d.${this.videoExt}`
        : `${this.recordSavePath}.${this.videoExt}`;
    } else if (this.recorderType === "mesio") {
      return `${this.recordSavePath}-PART%i.${this.videoExt}`;
    } else if (this.recorderType === "bililive") {
      return `${this.recordSavePath}.${this.videoExt}`;
    }

    return `${this.recordSavePath}.${this.videoExt}`;
  }
}
