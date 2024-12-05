import fs from "fs-extra";
import { createRecordExtraDataController } from "./record_extra_data_controller.js";
import { replaceExtName } from "./utils.js";

import type { Recorder } from "./recorder.js";

export class Segment {
  extraDataController: ReturnType<typeof createRecordExtraDataController>;
  init = true;
  recorder: Recorder;
  /** 原始的ffmpeg文件名，用于重命名 */
  rawRecordingVideoPath!: string;
  /** 输出文件名名，不包含拓展名 */
  outputVideoFilePath: string;

  constructor(recorder: Recorder, outputVideoFilePath: string) {
    this.recorder = recorder;
    this.outputVideoFilePath = outputVideoFilePath;

    this.extraDataController = createRecordExtraDataController(`${this.outputVideoFilePath}.json`);
  }

  async handleSegmentEnd() {
    if (!this.outputVideoFilePath) {
      throw new Error("Should call onSegmentStart first");
    }

    try {
      await Promise.all([
        fs.rename(this.rawRecordingVideoPath, `${this.outputVideoFilePath}.ts`),
        this.extraDataController?.flush(),
      ]);
      this.recorder.emit("videoFileCompleted", { filename: `${this.outputVideoFilePath}.ts` });
    } catch (err) {
      this.recorder.emit("DebugLog", {
        type: "common",
        text: "videoFileCompleted error " + String(err),
      });
    }
  }

  async onSegmentStart(stderrLine: string) {
    if (!this.init) {
      await this.handleSegmentEnd();
    }
    this.init = false;

    const regex = /'([^']+)'/;
    const match = stderrLine.match(regex);
    if (match) {
      const filename = match[1];
      this.rawRecordingVideoPath = filename;
      this.recorder.emit("videoFileCreated", { filename: `${this.outputVideoFilePath}.ts` });
    } else {
      this.recorder.emit("DebugLog", { type: "ffmpeg", text: "No match found" });
    }
  }
}

export class StreamManager {
  private segmentManager: Segment | null = null;
  private extraDataController: ReturnType<typeof createRecordExtraDataController> | null = null;
  recorder: Recorder;
  owner: string;
  title: string;
  recordSavePath: string;
  hasSegment: boolean;
  getSavePath: (opts: any) => string;

  constructor(
    recorder: Recorder,
    getSavePath: (opts: any) => string,
    owner: string,
    title: string,
    recordSavePath: string,
    hasSegment: boolean,
  ) {
    this.recordSavePath = recordSavePath;
    this.recorder = recorder;
    this.hasSegment = hasSegment;
    this.owner = owner;
    this.title = title;
    this.getSavePath = getSavePath;
  }

  async handleVideoStarted(stderrLine?: string) {
    if (this.hasSegment) {
      if (stderrLine) {
        const outputVideoFilePath = this.getSavePath({
          owner: this.owner,
          title: this.title,
          startTime: Date.now(),
        });
        this.segmentManager = new Segment(this.recorder, outputVideoFilePath);
        this.segmentManager.extraDataController.setMeta({ title: this.title });

        await this.segmentManager.onSegmentStart(stderrLine);
      } else {
        console.error("StderrLine should not be empty");
        this.recorder.emit("DebugLog", { type: "common", text: "StderrLine should not be empty" });
      }
    } else {
      const extraDataSavePath = replaceExtName(this.recordSavePath, ".json");
      this.extraDataController = createRecordExtraDataController(extraDataSavePath);
      this.extraDataController.setMeta({ title: this.title });
      this.recorder.emit("videoFileCreated", { filename: this.videoFilePath });
    }
  }

  async handleVideoCompleted() {
    this.getExtraDataController()?.setMeta({ recordStopTimestamp: Date.now() });

    if (this.hasSegment) {
      if (this.segmentManager) {
        await this.segmentManager.handleSegmentEnd();
      } else {
        console.error("Segment should not be empty");
        this.recorder.emit("DebugLog", { type: "common", text: "Segment should not be empty" });
        // throw new Error("Segment should not be empty");
      }
    } else {
      await this.getExtraDataController()?.flush();
      this.recorder.emit("videoFileCompleted", { filename: this.videoFilePath });
    }
  }

  getExtraDataController() {
    return this.segmentManager?.extraDataController || this.extraDataController;
  }

  get videoFilePath() {
    return this.hasSegment ? `${this.recordSavePath}-PART%03d.ts` : `${this.recordSavePath}.ts`;
  }
}
