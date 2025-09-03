import EventEmitter from "node:events";

import { createFFMPEGBuilder, StreamManager, utils } from "../index.js";
import { createInvalidStreamChecker, assert } from "../utils.js";

export class FFMPEGRecorder extends EventEmitter {
  private command: ReturnType<typeof createFFMPEGBuilder>;
  private streamManager: StreamManager;
  private timeoutChecker: ReturnType<typeof utils.createTimeoutChecker>;
  hasSegment: boolean;
  getSavePath: (data: { startTime: number; title?: string }) => string;
  segment: number;
  ffmpegOutputOptions: string[] = [];
  inputOptions: string[] = [];
  isHls: boolean;
  disableDanma: boolean = false;
  url: string;
  headers:
    | {
        [key: string]: string | undefined;
      }
    | undefined;

  constructor(
    opts: {
      url: string;
      getSavePath: (data: { startTime: number; title?: string }) => string;
      segment: number;
      outputOptions: string[];
      inputOptions?: string[];
      isHls?: boolean;
      disableDanma?: boolean;
      videoFormat?: "auto" | "ts" | "mkv";
      headers?: {
        [key: string]: string | undefined;
      };
    },
    private onEnd: (...args: unknown[]) => void,
    private onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>,
  ) {
    super();
    const hasSegment = !!opts.segment;
    this.disableDanma = opts.disableDanma ?? false;
    this.streamManager = new StreamManager(
      opts.getSavePath,
      hasSegment,
      this.disableDanma,
      "ffmpeg",
      opts.videoFormat ?? "auto",
      {
        onUpdateLiveInfo: this.onUpdateLiveInfo,
      },
    );
    this.timeoutChecker = utils.createTimeoutChecker(
      () => this.onEnd("ffmpeg timeout"),
      3 * 10e3,
      false,
    );
    this.hasSegment = hasSegment;
    this.getSavePath = opts.getSavePath;
    this.ffmpegOutputOptions = opts.outputOptions;
    this.inputOptions = opts.inputOptions ?? [];
    this.url = opts.url;
    this.segment = opts.segment;
    this.headers = opts.headers;
    if (opts.isHls === undefined) {
      this.isHls = this.url.includes("m3u8");
    } else {
      this.isHls = opts.isHls;
    }

    this.command = this.createCommand();

    this.streamManager.on("videoFileCreated", ({ filename, cover }) => {
      this.emit("videoFileCreated", { filename, cover });
    });
    this.streamManager.on("videoFileCompleted", ({ filename }) => {
      this.emit("videoFileCompleted", { filename });
    });
    this.streamManager.on("DebugLog", (data) => {
      this.emit("DebugLog", data);
    });
  }

  createCommand() {
    this.timeoutChecker?.start();
    const invalidCount = this.isHls ? 35 : 18;
    const isInvalidStream = createInvalidStreamChecker(invalidCount);
    const inputOptions = [
      ...this.inputOptions,
      "-user_agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36",
    ];
    if (this.headers) {
      const headers: string[] = [];
      Object.entries(this.headers).forEach(([key, value]) => {
        if (!value) return;
        headers.push(`${key}:${value}`);
      });
      if (headers.length) {
        inputOptions.push("-headers", headers.join("\\r\\n"));
      }
    }

    const command = createFFMPEGBuilder()
      .input(this.url)
      .inputOptions(inputOptions)
      .outputOptions(this.ffmpegOutputOptions)
      .output(this.streamManager.videoFilePath)
      .on("error", this.onEnd)
      .on("end", () => this.onEnd("finished"))
      .on("stderr", async (stderrLine) => {
        assert(typeof stderrLine === "string");
        await this.streamManager.handleVideoStarted(stderrLine);
        this.emit("DebugLog", { type: "ffmpeg", text: stderrLine });

        const info = this.formatLine(stderrLine);
        if (info) {
          this.emit("progress", info);
        }

        if (isInvalidStream(stderrLine)) {
          this.onEnd("invalid stream");
        }
      })
      .on("stderr", this.timeoutChecker?.update);
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

  formatLine(line: string) {
    if (!line.includes("time=")) {
      return null;
    }
    let time: string | null = null;

    const timeMatch = line.match(/time=([0-9:.]+)/);
    if (timeMatch) {
      time = timeMatch[1];
    }

    return {
      time,
    };
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
      // ts文件使用write("q")需要十来秒进行处理，直接中断，其他格式使用sigint会导致缺少数据
      if (this.streamManager.videoFilePath.endsWith(".ts")) {
        this.command.kill("SIGINT");
      } else {
        // @ts-ignore
        this.command.ffmpegProc?.stdin?.write("q");
      }

      await this.streamManager.handleVideoCompleted();
    } catch (err) {
      this.emit("DebugLog", { type: "error", text: String(err) });
    }
  }

  public getExtraDataController() {
    return this.streamManager?.getExtraDataController();
  }
}
