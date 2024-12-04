import fs from "fs-extra";
import { createRecordExtraDataController } from "./record_extra_data_controller.js";
import { replaceExtName } from "./utils.js";

import type { Recorder } from "./recorder.js";

export class SegmentManager {
  segmentData: { startTime: number; rawname: string };
  extraDataController: ReturnType<typeof createRecordExtraDataController> | null = null;
  init = true;
  getSavePath: (opts: any) => string;
  owner: string;
  title: string;
  recorder: Recorder;

  constructor(
    recorder: Recorder,
    getSavePath: (opts: any) => string,
    owner: string,
    title: string,
    recordSavePath: string,
  ) {
    this.getSavePath = getSavePath;
    this.owner = owner;
    this.title = title;
    this.recorder = recorder;

    this.segmentData = { startTime: Date.now(), rawname: recordSavePath };
  }

  async handleSegmentEnd() {
    this.getExtraDataController()?.setMeta({ recordStopTimestamp: Date.now() });
    console.log("handle segmentData", this.segmentData);

    const trueFilepath = this.getSavePath({
      owner: this.owner,
      title: this.title,
      startTime: this.segmentData.startTime,
    });

    try {
      await Promise.all([
        fs.rename(this.segmentData.rawname, `${trueFilepath}.ts`),
        this.extraDataController?.flush(),
      ]);
      this.recorder.emit("videoFileCompleted", { filename: `${trueFilepath}.ts` });
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
    this.segmentData.startTime = Date.now();

    const trueFilepath = this.getSavePath({
      owner: this.owner,
      title: this.title,
      startTime: this.segmentData.startTime,
    });
    this.extraDataController = createRecordExtraDataController(`${trueFilepath}.json`);
    this.extraDataController.setMeta({ title: this.title });

    const regex = /'([^']+)'/;
    const match = stderrLine.match(regex);
    if (match) {
      const filename = match[1];
      this.segmentData.rawname = filename;
      this.recorder.emit("videoFileCreated", { filename: `${trueFilepath}.ts` });
    } else {
      this.recorder.emit("DebugLog", { type: "ffmpeg", text: "No match found" });
      console.log("No match found");
    }
  }

  getSegmentData() {
    return this.segmentData;
  }

  getExtraDataController() {
    return this.extraDataController;
  }
}

export class StreamManager {
  private segmentManager: SegmentManager | null = null;
  private extraDataController: ReturnType<typeof createRecordExtraDataController> | null = null;
  extraDataSavePath: string;
  videoFilePath: string;
  recorder: Recorder;
  owner: string;
  title: string;
  recordSavePath: string;

  constructor(
    recorder: Recorder,
    getSavePath: (opts: any) => string,
    owner: string,
    title: string,
    recordSavePath: string,
    hasSegment: boolean,
  ) {
    this.extraDataSavePath = replaceExtName(recordSavePath, ".json");
    this.videoFilePath = this.getVideoFilepath();
    this.recorder = recorder;
    this.owner = owner;
    this.title = title;
    this.recordSavePath = recordSavePath;

    if (hasSegment) {
      this.segmentManager = new SegmentManager(recorder, getSavePath, owner, title, recordSavePath);
    } else {
      this.extraDataController = createRecordExtraDataController(this.extraDataSavePath);
      this.extraDataController.setMeta({ title });
    }
  }

  async handleVideoStarted(stderrLine?: string) {
    // if (!stderrLine && this.segmentManager) {
    //   this.segmentManager.segmentData.startTime = Date.now();
    // }

    if (this.segmentManager) {
      if (stderrLine) {
        await this.segmentManager.onSegmentStart(stderrLine);
      }
    } else {
      this.recorder.emit("videoFileCreated", { filename: this.videoFilePath });
    }
  }

  async handleVideoCompleted() {
    if (this.segmentManager) {
      await this.segmentManager.handleSegmentEnd();
    } else {
      this.getExtraDataController()?.setMeta({ recordStopTimestamp: Date.now() });
      await this.getExtraDataController()?.flush();
      this.recorder.emit("videoFileCompleted", { filename: this.videoFilePath });
    }
  }

  getExtraDataController() {
    return this.segmentManager?.getExtraDataController() || this.extraDataController;
  }

  getSegmentData() {
    return this.segmentManager?.getSegmentData();
  }

  getVideoFilepath() {
    return this.segmentManager ? `${this.recordSavePath}-PART%03d.ts` : `${this.recordSavePath}.ts`;
  }
}
