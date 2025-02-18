import EventEmitter from "node:events";

import fs from "fs-extra";
import { createRecordExtraDataController } from "./record_extra_data_controller.js";
import { replaceExtName, ensureFolderExist } from "./utils.js";

export type GetSavePath = (data: { startTime: number }) => string;

export class Segment extends EventEmitter {
  extraDataController: ReturnType<typeof createRecordExtraDataController> | null = null;
  init = true;
  getSavePath: GetSavePath;
  /** 原始的ffmpeg文件名，用于重命名 */
  rawRecordingVideoPath!: string;
  /** 输出文件名名，不包含拓展名 */
  outputVideoFilePath!: string;

  constructor(getSavePath: GetSavePath) {
    super();
    this.getSavePath = getSavePath;
  }

  async handleSegmentEnd() {
    if (!this.outputVideoFilePath) {
      this.emit("DebugLog", {
        type: "common",
        text: "Should call onSegmentStart first",
      });
      return;
    }

    try {
      await Promise.all([
        fs.rename(this.rawRecordingVideoPath, `${this.outputVideoFilePath}.ts`),
        this.extraDataController?.flush(),
      ]);
      this.emit("videoFileCompleted", { filename: `${this.outputVideoFilePath}.ts` });
    } catch (err) {
      this.emit("DebugLog", {
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
    const startTime = Date.now();

    this.outputVideoFilePath = this.getSavePath({
      startTime: startTime,
    });

    ensureFolderExist(this.outputVideoFilePath);

    this.extraDataController = createRecordExtraDataController(`${this.outputVideoFilePath}.json`);

    const regex = /'([^']+)'/;
    const match = stderrLine.match(regex);
    if (match) {
      const filename = match[1];
      this.rawRecordingVideoPath = filename;
      this.emit("videoFileCreated", { filename: `${this.outputVideoFilePath}.ts` });
    } else {
      this.emit("DebugLog", { type: "ffmpeg", text: "No match found" });
    }
  }
}

export class StreamManager extends EventEmitter {
  private segmentManager: Segment | null = null;
  private extraDataController: ReturnType<typeof createRecordExtraDataController> | null = null;
  recordSavePath?: string;

  constructor(getSavePath: GetSavePath, hasSegment: boolean) {
    super();

    if (hasSegment) {
      this.segmentManager = new Segment(getSavePath);
      this.segmentManager.on("DebugLog", (data) => {
        this.emit("DebugLog", data);
      });
      this.segmentManager.on("videoFileCreated", (data) => {
        this.emit("videoFileCreated", data);
      });
      this.segmentManager.on("videoFileCompleted", (data) => {
        this.emit("videoFileCompleted", data);
      });
    } else {
      const recordSavePath = getSavePath({ startTime: Date.now() });
      this.recordSavePath = recordSavePath;
      const extraDataSavePath = replaceExtName(recordSavePath, ".json");
      this.extraDataController = createRecordExtraDataController(extraDataSavePath);
    }
  }

  async handleVideoStarted(stderrLine?: string) {
    if (this.segmentManager) {
      if (stderrLine) {
        await this.segmentManager.onSegmentStart(stderrLine);
      }
    } else {
      this.emit("videoFileCreated", { filename: this.videoFilePath });
    }
  }

  async handleVideoCompleted() {
    if (this.segmentManager) {
      await this.segmentManager.handleSegmentEnd();
    } else {
      await this.getExtraDataController()?.flush();
      this.emit("videoFileCompleted", { filename: this.videoFilePath });
    }
  }

  getExtraDataController() {
    return this.segmentManager?.extraDataController || this.extraDataController;
  }

  get videoFilePath() {
    return this.segmentManager ? `${this.recordSavePath}-PART%03d.ts` : `${this.recordSavePath}.ts`;
  }
}
