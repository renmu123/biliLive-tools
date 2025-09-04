import path from "node:path";
import EventEmitter from "node:events";
import { spawn, ChildProcess } from "node:child_process";

import { StreamManager, getMesioPath } from "../index.js";

// Mesio command builder class similar to ffmpeg
class MesioCommand extends EventEmitter {
  private _input: string = "";
  private _output: string = "";
  private _inputOptions: string[] = [];
  private process: ChildProcess | null = null;

  constructor() {
    super();
  }

  input(source: string): MesioCommand {
    this._input = source;
    return this;
  }

  output(target: string): MesioCommand {
    this._output = target;
    return this;
  }

  inputOptions(options: string[]): MesioCommand;
  inputOptions(...options: string[]): MesioCommand;
  inputOptions(...options: any[]): MesioCommand {
    const opts = Array.isArray(options[0]) ? options[0] : options;
    this._inputOptions.push(...opts);
    return this;
  }

  _getArguments(): string[] {
    const args: string[] = [];

    // Add input options first
    args.push(...this._inputOptions);

    // Add output target
    if (this._output) {
      const { dir, name } = path.parse(this._output);
      args.push("-o", dir);
      args.push("-n", name);
    }

    // Add input source
    if (this._input) {
      args.push(this._input);
    }

    return args;
  }

  run(): void {
    const args = this._getArguments();
    const mesioExecutable = getMesioPath();

    this.process = spawn(mesioExecutable, args, {
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

    this.process.on("close", (code) => {
      if (code === 0) {
        this.emit("end");
      } else {
        this.emit("error", new Error(`mesio process exited with code ${code}`));
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
export const createMesioBuilder = (): MesioCommand => {
  return new MesioCommand();
};

export class mesioRecorder extends EventEmitter {
  private command: MesioCommand;
  private streamManager: StreamManager;
  hasSegment: boolean;
  getSavePath: (data: { startTime: number; title?: string }) => string;
  segment: number;
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
      outputOptions?: string[];
      inputOptions?: string[];
      isHls?: boolean;
      disableDanma?: boolean;
      formatName?: "flv" | "ts" | "fmp4";
      headers?: {
        [key: string]: string | undefined;
      };
    },
    private onEnd: (...args: unknown[]) => void,
    private onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>,
  ) {
    super();
    const hasSegment = true;
    this.disableDanma = opts.disableDanma ?? false;

    let videoFormat: "flv" | "ts" | "m4s" = "flv";
    if (opts.url.includes(".m3u8")) {
      videoFormat = "ts";
    }
    if (opts.formatName) {
      if (opts.formatName === "fmp4") {
        videoFormat = "m4s";
      } else if (opts.formatName === "ts") {
        videoFormat = "ts";
      } else if (opts.formatName === "flv") {
        videoFormat = "flv";
      }
    }

    this.streamManager = new StreamManager(
      opts.getSavePath,
      hasSegment,
      this.disableDanma,
      "mesio",
      videoFormat,
      {
        onUpdateLiveInfo: this.onUpdateLiveInfo,
      },
    );
    this.hasSegment = hasSegment;
    this.getSavePath = opts.getSavePath;
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
    const inputOptions = [
      ...this.inputOptions,
      "--fix",
      "-H",
      "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36",
    ];

    if (this.headers) {
      Object.entries(this.headers).forEach(([key, value]) => {
        if (!value) return;
        inputOptions.push("-H", `${key}: ${value}`);
      });
    }
    if (this.hasSegment) {
      inputOptions.push("-d", `${this.segment * 60}s`);
    }

    const command = createMesioBuilder()
      .input(this.url)
      .inputOptions(inputOptions)
      .output(this.streamManager.videoFilePath)
      .on("error", this.onEnd)
      .on("end", () => this.onEnd("finished"))
      .on("stderr", async (stderrLine) => {
        await this.streamManager.handleVideoStarted(stderrLine);
        this.emit("DebugLog", { type: "ffmpeg", text: stderrLine });
      });

    return command;
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
}
