import EventEmitter from "node:events";
import { spawn, ChildProcess } from "node:child_process";

import { StreamManager, getBililivePath } from "../index.js";
import { IDownloader, BililiveRecorderOptions, Segment } from "./IDownloader.js";

// Bililive command builder class similar to ffmpeg
class BililiveRecorderCommand extends EventEmitter {
  private _input: string = "";
  private _output: string = "";
  private _inputOptions: string[] = [];
  private process: ChildProcess | null = null;

  constructor() {
    super();
  }

  input(source: string): BililiveRecorderCommand {
    this._input = source;
    return this;
  }

  output(target: string): BililiveRecorderCommand {
    this._output = target;
    return this;
  }

  inputOptions(options: string[]): BililiveRecorderCommand;
  inputOptions(...options: string[]): BililiveRecorderCommand;
  inputOptions(...options: any[]): BililiveRecorderCommand {
    const opts = Array.isArray(options[0]) ? options[0] : options;
    this._inputOptions.push(...opts);
    return this;
  }

  _getArguments(): string[] {
    const args: string[] = ["downloader", "-p"];

    // Add input source
    if (this._input) {
      args.push(this._input);
    }

    // Add input options first
    args.push(...this._inputOptions);

    // Add output target
    if (this._output) {
      // const { dir, name } = path.parse(this._output);
      // args.push("-o", dir);
      args.push(this._output);
    }
    // args.push("-v");

    return args;
  }

  run(): void {
    const args = this._getArguments();
    const bililiveExecutable = getBililivePath();

    this.process = spawn(bililiveExecutable, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (this.process.stdout) {
      this.process.stdout.on("data", (data) => {
        const output = data.toString();
        // console.log(output);
        this.emit("stderr", output);
      });
    }

    if (this.process.stderr) {
      this.process.stderr.on("data", (data) => {
        const output = data.toString();
        // console.error(output);
        this.emit("stderr", output);
      });
    }

    this.process.on("error", (error) => {
      this.emit("error", error);
    });
    [];
    this.process.on("close", (code) => {
      if (code === 0) {
        this.emit("end");
      } else {
        this.emit("error", new Error(`bililive process exited with code ${code}`));
      }
    });
  }

  kill(signal: NodeJS.Signals = "SIGTERM"): void {
    if (this.process) {
      this.process.kill(signal);
    }
  }
}

// Factory function similar to createFFMPEGBuilder
export const createBililiveBuilder = (): BililiveRecorderCommand => {
  return new BililiveRecorderCommand();
};

export class BililiveDownloader extends EventEmitter implements IDownloader {
  public type = "bililive" as const;
  private command: BililiveRecorderCommand;
  private streamManager: StreamManager;
  readonly hasSegment: boolean;
  readonly getSavePath: (data: { startTime: number; title?: string }) => string;
  readonly segment: Segment;
  readonly inputOptions: string[] = [];
  readonly disableDanma: boolean = false;
  readonly url: string;
  readonly debugLevel: "none" | "basic" | "verbose" = "none";
  readonly headers:
    | {
        [key: string]: string | undefined;
      }
    | undefined;

  constructor(
    opts: BililiveRecorderOptions,
    private onEnd: (...args: unknown[]) => void,
    private onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>,
  ) {
    super();
    // 存在自动分段，永远为true
    const hasSegment = true;
    this.hasSegment = hasSegment;
    this.disableDanma = opts.disableDanma ?? false;
    this.debugLevel = opts.debugLevel ?? "none";
    let videoFormat: "flv" = "flv";

    this.streamManager = new StreamManager(
      opts.getSavePath,
      hasSegment,
      this.disableDanma,
      "bililive",
      videoFormat,
      {
        onUpdateLiveInfo: this.onUpdateLiveInfo,
      },
    );
    this.getSavePath = opts.getSavePath;
    this.inputOptions = [];
    this.url = opts.url;
    this.segment = opts.segment;
    this.headers = opts.headers;

    this.command = this.createCommand();

    this.streamManager.on("videoFileCreated", ({ filename, cover, rawFilename, title }) => {
      this.emit("videoFileCreated", { filename, cover, rawFilename, title });
    });
    this.streamManager.on("videoFileCompleted", ({ filename }) => {
      this.emit("videoFileCompleted", { filename });
    });
    this.streamManager.on("DebugLog", (data) => {
      this.emit("DebugLog", data);
    });
  }

  createCommand() {
    const inputOptions = [
      ...this.inputOptions,
      "-h",
      "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36",
    ];
    if (this.debugLevel === "verbose") {
      inputOptions.push("-l", "Debug");
    }

    if (this.headers) {
      Object.entries(this.headers).forEach(([key, value]) => {
        if (!value) return;
        inputOptions.push("-h", `${key}: ${value}`);
      });
    }
    if (this.hasSegment) {
      if (typeof this.segment === "number") {
        inputOptions.push("-d", `${this.segment * 60}`);
      } else if (typeof this.segment === "string") {
        inputOptions.push("-m", this.segment);
      }
    }

    const command = createBililiveBuilder()
      .input(this.url)
      .inputOptions(inputOptions)
      .output(this.streamManager.videoFilePath)
      .on("error", this.onEnd)
      .on("end", () => this.onEnd("finished"))
      .on("stderr", async (stderrLine) => {
        this.emit("DebugLog", { type: "ffmpeg", text: stderrLine });
        await this.streamManager.handleVideoStarted(stderrLine);
        const info = this.formatLine(stderrLine);
        if (info) {
          this.emit("progress", info);
        }
      });

    return command;
  }

  formatLine(line: string) {
    if (!line.includes("下载进度:")) {
      return null;
    }
    let time: string | null = null;

    const timeMatch = line.match(/录制时长:\s*([0-9:]+)\s/);
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
    try {
      // 直接发送SIGINT信号，会导致数据丢失
      this.command.kill("SIGINT");

      await this.streamManager.handleVideoCompleted();
    } catch (err) {
      this.emit("DebugLog", { type: "error", text: String(err) });
    }
  }

  public getExtraDataController() {
    return this.streamManager?.getExtraDataController();
  }

  public get videoFilePath() {
    return this.streamManager.videoFilePath;
  }
}
