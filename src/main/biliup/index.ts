import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import { EventEmitter } from "events";

export default class Biliup {
  params: string[];
  biliup: ChildProcess | undefined;
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
  uploadVideo(videoPath: string) {
    if (!this.execPath) {
      throw new Error("未设置biliup路径");
    }
    if (!this.cookieFile) {
      throw new Error("未设置cookie文件");
    }
    // this.biliup = spawn("chdir", {
    //   shell: true,
    // });
    this.biliup = spawn(this.execPath!, [`--user-cookie ${this.cookieFile}`, "upload", videoPath], {
      shell: true,
      stdio: "inherit",
    });
    // this.biliup.stdout!.on("data", (data) => {
    //   console.log(`stdout: ${data}`);
    // });

    this.biliup.stderr!.on("data", (data) => {
      this.emits.emit("error", data);
      console.error(`stderr: ${data}`);
    });

    this.biliup.on("close", (code) => {
      this.emits.emit("close", code);
      console.log(`child process exited with code ${code}`);
    });
    this.biliup.on("message", (data) => {
      console.log(`message: ${data}`);
    });
    // this.biliup.on("error", (error) => {
    //   this.emits.emit("error", error);
    //   console.log(`error ${error}`);
    // });
    // this.biliup.on("exit", (code, signal) => {
    //   // this.emits.emit("error", code);
    //   console.log(`exit ${code} ${signal}}`);
    // });
  }
  on(event: string, listener: (...args: any[]) => void) {
    this.emits.on(event, listener);
    return this;
  }
  addParam(param: string) {
    this.params.push(param);
    return this;
  }
}
