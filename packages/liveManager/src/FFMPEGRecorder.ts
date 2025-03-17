import EventEmitter from "node:events";

import { createFFMPEGBuilder, StreamManager, utils } from "./index.js";
import { createInvalidStreamChecker, assert } from "./utils.js";

export class FFMPEGRecorder extends EventEmitter {
  private command: ReturnType<typeof createFFMPEGBuilder>;
  private streamManager: StreamManager;
  private timeoutChecker: ReturnType<typeof utils.createTimeoutChecker>;
  hasSegment: boolean;
  getSavePath: (data: { startTime: number }) => string;
  segment: number;
  ffmpegOutputOptions: string[] = [];
  inputOptions: string[] = [];
  isHls: boolean = false;
  disableDanma: boolean = false;
  url: string;

  constructor(
    opts: {
      url: string;
      getSavePath: (data: { startTime: number }) => string;
      segment: number;
      outputOptions: string[];
      inputOptions?: string[];
      isHls?: boolean;
      disableDanma?: boolean;
    },
    private onEnd: (...args: unknown[]) => void,
  ) {
    super();
    const hasSegment = !!opts.segment;
    this.disableDanma = opts.disableDanma ?? false;
    this.streamManager = new StreamManager(opts.getSavePath, hasSegment, this.disableDanma);
    this.timeoutChecker = utils.createTimeoutChecker(() => this.onEnd("ffmpeg timeout"), 3 * 10e3);
    this.hasSegment = hasSegment;
    this.getSavePath = opts.getSavePath;
    this.ffmpegOutputOptions = opts.outputOptions;
    this.inputOptions = opts.inputOptions ?? [];
    this.url = opts.url;
    this.segment = opts.segment;
    this.isHls = opts.isHls ?? false;

    this.command = this.createCommand();

    this.streamManager.on("videoFileCreated", ({ filename }) => {
      this.emit("videoFileCreated", { filename });
    });
    this.streamManager.on("videoFileCompleted", ({ filename }) => {
      this.emit("videoFileCompleted", { filename });
    });
    this.streamManager.on("DebugLog", (data) => {
      this.emit("DebugLog", data);
    });
  }

  private createCommand() {
    const invalidCount = this.isHls ? 35 : 15;
    const isInvalidStream = createInvalidStreamChecker(invalidCount);

    const command = createFFMPEGBuilder()
      .input(this.url)
      .inputOptions([
        ...this.inputOptions,
        "-user_agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36",
      ])
      .outputOptions(this.ffmpegOutputOptions)
      .output(this.streamManager.videoFilePath)
      .on("error", this.onEnd)
      .on("end", () => this.onEnd("finished"))
      .on("stderr", async (stderrLine) => {
        assert(typeof stderrLine === "string");
        await this.streamManager.handleVideoStarted(stderrLine);
        // TODO:解析时间
        this.emit("DebugLog", { type: "ffmpeg", text: stderrLine });

        if (isInvalidStream(stderrLine)) {
          this.onEnd("invalid stream");
        }
      })
      .on("stderr", this.timeoutChecker.update);
    if (this.hasSegment) {
      command.outputOptions(
        "-f",
        "segment",
        "-segment_time",
        String(this.segment * 60),
        "-reset_timestamps",
        "1",
      );
    }
    return command;
  }

  public run() {
    this.command.run();
  }

  public getArguments() {
    return this.command._getArguments();
  }

  public async stop() {
    this.timeoutChecker.stop();
    try {
      // @ts-ignore
      this.command.ffmpegProc?.stdin?.write("q");
      await this.streamManager.handleVideoCompleted();
    } catch (err) {
      this.emit("DebugLog", { type: "common", text: String(err) });
    }
  }

  public getExtraDataController() {
    return this.streamManager?.getExtraDataController();
  }
}
