import EventEmitter from "node:events";

import fs from "fs/promises";
import { createRecordExtraDataController } from "../record_extra_data_controller.js";
import {
  replaceExtName,
  ensureFolderExist,
  isFfmpegStartSegment,
  isMesioStartSegment,
  isFfmpegStart,
  retry,
  cleanTerminalText,
} from "../utils.js";

export type GetSavePath = (data: { startTime: number; title?: string }) => string;
type RecorderType = "ffmpeg" | "mesio";
type VideoFormat = "auto" | "ts" | "mkv" | "flv" | "mp4" | "m4s";

export class Segment extends EventEmitter {
  extraDataController: ReturnType<typeof createRecordExtraDataController> | null = null;
  init = true;
  getSavePath: GetSavePath;
  /** 原始的文件名，用于重命名 */
  rawRecordingVideoPath!: string;
  /** 输出文件名名，不包含拓展名 */
  outputVideoFilePath!: string;
  disableDanma: boolean;
  videoExt: VideoFormat;

  constructor(getSavePath: GetSavePath, disableDanma: boolean, videoExt: VideoFormat) {
    super();
    this.getSavePath = getSavePath;
    this.disableDanma = disableDanma;
    this.videoExt = videoExt;
  }

  async handleSegmentEnd() {
    if (!this.outputVideoFilePath) {
      this.emit("DebugLog", {
        type: "error",
        text: "Should call onSegmentStart first",
      });
      return;
    }

    try {
      await Promise.all([
        retry(() => fs.rename(this.rawRecordingVideoPath, this.outputFilePath), 10, 2000),
        this.extraDataController?.flush(),
      ]);
      this.emit("videoFileCompleted", { filename: this.outputFilePath });
    } catch (err) {
      this.emit("DebugLog", {
        type: "error",
        text: "videoFileCompleted error " + String(err),
      });
    }
  }

  async onSegmentStart(
    stderrLine: string,
    callBack?: { onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }> },
  ) {
    if (!this.init) {
      await this.handleSegmentEnd();
    }
    this.init = false;
    const startTime = Date.now();
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
    this.outputVideoFilePath = this.getSavePath({
      startTime: startTime,
      title: liveInfo?.title,
    });

    ensureFolderExist(this.outputVideoFilePath);

    if (!this.disableDanma) {
      this.extraDataController = createRecordExtraDataController(
        `${this.outputVideoFilePath}.json`,
      );
    }

    // 支持两种格式的正则表达式
    // 1. FFmpeg格式: Opening 'filename' for writing
    // 2. Mesio格式: Opening FLV segment path=filename Processing
    const ffmpegRegex = /'([^']+)'/;
    const mesioRegex = /segment path=([^\n]*)/i;

    let match = stderrLine.match(ffmpegRegex);
    if (!match) {
      match = cleanTerminalText(stderrLine).match(mesioRegex);
    }

    if (match) {
      const filename = match[1];
      this.rawRecordingVideoPath = filename;
      this.emit("videoFileCreated", {
        filename: this.outputFilePath,
        title: liveInfo?.title,
        cover: liveInfo?.cover,
      });
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
  recorderType: RecorderType = "ffmpeg";
  private videoFormat: VideoFormat;
  private callBack?: {
    onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>;
  };

  constructor(
    getSavePath: GetSavePath,
    hasSegment: boolean,
    disableDanma: boolean,
    recorderType: RecorderType,
    videoFormat: VideoFormat,
    callBack?: {
      onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>;
    },
  ) {
    super();
    const recordSavePath = getSavePath({ startTime: Date.now() });
    this.recordSavePath = recordSavePath;
    this.videoFormat = videoFormat ?? "auto";
    this.recorderType = recorderType;
    this.hasSegment = hasSegment;
    this.callBack = callBack;

    if (hasSegment) {
      this.segment = new Segment(getSavePath, disableDanma, this.videoExt);
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
      const extraDataSavePath = replaceExtName(recordSavePath, ".json");
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
          await this.getExtraDataController()?.flush();
          this.emit("videoFileCompleted", { filename: this.videoFilePath });
        }
      }
    } else if (this.recorderType === "mesio") {
      if (this.segment) {
        await this.segment.handleSegmentEnd();
      }
    }
  }

  getExtraDataController() {
    return this.segment?.extraDataController || this.extraDataController;
  }

  get videoExt() {
    if (this.recorderType === "ffmpeg") {
      return this.videoFormat;
    } else if (this.recorderType === "mesio") {
      return this.videoFormat;
    } else {
      throw new Error("Unknown recorderType");
    }
  }

  get videoFilePath() {
    if (this.recorderType === "ffmpeg") {
      return this.segment
        ? `${this.recordSavePath}-PART%03d.${this.videoExt}`
        : `${this.recordSavePath}.${this.videoExt}`;
    } else if (this.recorderType === "mesio") {
      return `${this.recordSavePath}-PART%i.${this.videoExt}`;
    }

    return `${this.recordSavePath}.${this.videoExt}`;
  }
}
