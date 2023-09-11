import { uuid } from "./utils/index";
import log from "./utils/log";

import type { WebContents } from "electron";
import type { Progress } from "../types";

export class Task {
  taskId: string;
  status: "pending" | "running" | "paused" | "completed" | "error";
  command: any;
  webContents: WebContents;
  constructor(
    command: any,
    webContents: WebContents,
    options: {
      output: string;
      size?: number;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: string) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: Progress) => void;
    },
  ) {
    this.taskId = uuid();
    this.command = command;
    this.status = "pending";
    this.webContents = webContents;

    command.on("start", (commandLine: string) => {
      log.info(`task ${this.taskId} start, command: ${commandLine}`);

      callback.onStart && callback.onStart();
      this.webContents.send("task-start", { taskId: this.taskId, command: commandLine });
      this.status = "running";
    });
    command.on("end", async () => {
      log.info(`task ${this.taskId} end`);

      callback.onEnd && callback.onEnd(options.output);
      this.webContents.send("task-end", { taskId: this.taskId, output: options.output });
      this.status = "completed";
    });
    command.on("error", (err) => {
      log.error(`task ${this.taskId} error`);
      callback.onError && callback.onError(err);
      this.webContents.send("task-error", { taskId: this.taskId, err: err });
      this.status = "error";
    });
    command.on("progress", (progress) => {
      log.debug(`task ${this.taskId} progress: ${JSON.stringify(progress)}`);
      if (options.size) {
        progress.percentage = Math.round((progress.targetSize / options.size) * 100);
      } else {
        progress.percentage = progress.percent;
      }
      callback.onProgress && callback.onProgress(progress);
      this.webContents.send("task-progress-update", { taskId: this.taskId, progress: progress });
    });
  }
  exec() {
    this.command.run();
  }
  stop() {
    if (this.status !== "running") return;
    this.command.kill("SIGSTOP");
    log.warn(`task ${this.taskId} stopped`);
    this.status = "paused";
    // TODO:需要补充preload的事件
    this.webContents.send("task-stoped", { taskId: this.taskId, text: "ffmpeg has been stoped" });
  }
  continue() {
    if (this.status !== "paused") return;
    this.command.kill("SIGCONT");
    log.warn(`task ${this.taskId} continue`);
    this.status = "running";
    // TODO:需要补充preload的事件
    this.webContents.send("task-continue", { taskId: this.taskId, text: "ffmpeg is running" });
  }
  kill() {
    this.command.kill();
    log.warn(`task ${this.taskId} killed`);
    this.status = "error";
    this.webContents.send("task-error", "ffmpeg has been killed");
  }
}
export class TaskQueue {
  queue: Task[];
  constructor() {
    this.queue = [];
  }
  addTask(task: Task, autoRun = true) {
    this.queue.push(task);
    if (autoRun) {
      task.exec();
    }
  }
  queryTask(taskId: string) {
    return this.queue.find((task) => task.taskId === taskId);
  }
}
