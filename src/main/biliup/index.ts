import { spawn } from "child_process";
import type { ChildProcessWithoutNullStreams } from "child_process";
import { EventEmitter } from "events";

export default class Biliup {
  params: string[];
  biliup: ChildProcessWithoutNullStreams | undefined;
  execPath: string | undefined;
  cookieFile: string | undefined;
  emits: EventEmitter;
  constructor() {
    this.params = [];
    this.biliup;
    this.execPath = undefined;
    this.cookieFile = undefined;

    this.emits = new EventEmitter();
  }
  setBiliUpPath(path: string) {
    this.execPath = path;
    return this;
  }
  setCookiePath(path: string) {
    this.cookieFile = path;
    return this;
  }
  uploadVideo(videoPaths: string[], args: string[]) {
    if (!this.execPath) {
      throw new Error("未设置biliup路径");
    }
    if (!this.cookieFile) {
      throw new Error("未设置cookie文件");
    }

    const params = [
      `--user-cookie ${this.cookieFile}`,
      "upload",
      ...args,
      videoPaths.map((path) => `"${path}"`).join(" "),
    ];
    console.log(`biliup ${params.join(" ")}`);

    this.biliup = spawn(this.execPath!, params, {
      shell: true,
      detached: true,
    });
    this.biliup.stdout.on("data", (data) => {
      console.log(data);
    });

    this.biliup.stderr.on("data", (data) => {
      // this.emits.emit("error", data);
      console.log(`stderr: ${data}`);
    });

    this.biliup.on("close", (code) => {
      this.emits.emit("close", code);
      console.log(`child process exited with code ${code}`);
    });
    this.biliup.on("error", (error) => {
      // this.emits.emit("error", error);
      console.log(`error ${error}`);
    });
    this.biliup.on("exit", (code, signal) => {
      // this.emits.emit("error", code);
      console.log(`exit ${code} ${signal}}`);
    });
  }
  on(event: string, listener: (...args: any[]) => void) {
    this.emits.on(event, listener);
    return this;
  }
  addParam(param: string) {
    this.params.push(param);
    return this;
  }
  login() {
    const loginProc = spawn(this.execPath!, ["login"], {
      shell: true,
      detached: true,
    });
    loginProc.on("close", (code) => {
      this.emits.emit("login-close", code);
      console.log(`child process exited with code ${code}`);
    });

    loginProc.stdout.on("data", (data) => {
      console.log("data", data);
    });

    loginProc.stderr.on("data", (data) => {
      // this.emits.emit("error", data);
      console.error(`stderr: ${data}`);
    });
  }
}
