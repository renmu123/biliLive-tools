import { ChildProcess, spawn } from "node:child_process";
import path from "node:path";
import EventEmitter from "node:events";

import { getBinPath } from "./video.js";
import { FlvRepairTask, taskQueue } from "./task.js";
import { parseSavePath } from "../utils/index.js";

export async function flvRepair(
  input: string,
  output: string,
  opts: {
    type: "bililive" | "mesio";
    saveRadio?: 1 | 2;
    savePath?: string;
  },
) {
  // 如果不是flv，直接报错
  if (path.extname(input).toLowerCase() !== ".flv") {
    throw new Error("Only FLV files are supported for repair.");
  }
  const options = Object.assign(
    {
      type: "bililive",
    },
    opts,
  );
  let outputFile = output;
  if (!path.isAbsolute(output)) {
    let savePath = await parseSavePath(input, {
      saveType: options.saveRadio,
      savePath: options.savePath,
    });
    outputFile = path.join(savePath, output);
  }

  let command: FlvCommand;
  if (options.type === "bililive") {
    const { bililiveRecorderPath } = getBinPath();
    command = new BililiveRecorderCommand({ binPath: bililiveRecorderPath });
  } else if (options.type === "mesio") {
    const { mesioPath } = getBinPath();
    command = new MesioCommand({ binPath: mesioPath });
  } else {
    throw new Error(`Unsupported repair type: ${options.type}`);
  }
  const task = new FlvRepairTask(command, {
    input,
    output: outputFile,
    name: `FLV修复任务: ${path.parse(input).base}`,
  });
  taskQueue.addTask(task, true);
  return task;
}

export type FlvCommand = BililiveRecorderCommand | MesioCommand;

export class MesioCommand extends EventEmitter {
  private _input: string = "";
  private _output: string = "";
  private _inputOptions: string[] = [];
  private process: ChildProcess | null = null;
  private binPath: string;

  constructor(opts: { binPath: string }) {
    super();
    this.binPath = opts.binPath;
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
    const args: string[] = ["--fix"];

    // Add input options first
    args.push(...this._inputOptions);

    // Add output target
    if (this._output) {
      const { dir } = path.parse(this._output);
      args.push("-o", dir);
      // args.push("-n", name);
    }
    // args.push("-v");

    // Add input source
    if (this._input) {
      args.push(this._input);
    }

    return args;
  }

  run(input: string, output: string): void {
    this.input(input).output(output);
    const args = this._getArguments();
    const mesioExecutable = this.binPath;

    this.process = spawn(mesioExecutable, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (this.process.stdout) {
      this.process.stdout.on("data", (data) => {
        const output = data.toString();
        this.emit("stderr", output);
      });
    }

    if (this.process.stderr) {
      this.process.stderr.on("data", (data) => {
        const output = data.toString();
        this.emit("stderr", output);
      });
    }

    this.process.on("error", (error) => {
      this.emit("error", error);
    });
    [];
    this.process.on("close", (code) => {
      if (code === 0) {
        this.emit("completed");
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

export class BililiveRecorderCommand extends EventEmitter {
  private _input: string = "";
  private _output: string = "";
  private _inputOptions: string[] = [];
  private process: ChildProcess | null = null;
  private binPath: string;

  constructor(opts: { binPath: string }) {
    super();
    this.binPath = opts.binPath;
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
    const args: string[] = ["tool", "fix"];

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

  run(input: string, output: string): void {
    this.input(input).output(output);
    const args = this._getArguments();
    const bililiveExecutable = this.binPath;

    this.process = spawn(bililiveExecutable, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (this.process.stdout) {
      this.process.stdout.on("data", (data) => {
        const output = data.toString();
        // Fix: 25%
        const match = output.match(/Fix: (\d+)%/);
        if (match) {
          const percentage = parseInt(match[1], 10);
          this.emit("progress", { percentage });
        }
        this.emit("stderr", output);
      });
    }

    if (this.process.stderr) {
      this.process.stderr.on("data", (data) => {
        const output = data.toString();
        this.emit("stderr", output);
      });
    }

    this.process.on("error", (error) => {
      this.emit("error", error);
    });
    [];
    this.process.on("close", (code) => {
      if (code === 0) {
        this.emit("completed");
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
