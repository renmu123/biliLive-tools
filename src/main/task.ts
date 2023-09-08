import { uuid } from "./utils";

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
      console.log(this.taskId, "Conversion start", commandLine);

      callback.onStart && callback.onStart();
      this.webContents.send("task-start", { taskId: this.taskId, command: commandLine });
      this.status = "running";
    });
    command.on("end", async () => {
      callback.onEnd && callback.onEnd(options.output);
      this.webContents.send("task-end", { taskId: this.taskId, output: options.output });
      this.status = "completed";
    });
    command.on("error", (err) => {
      callback.onError && callback.onError(err);
      this.webContents.send("task-error", { taskId: this.taskId, err: err });
      this.status = "error";
    });
    command.on("progress", (progress) => {
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
    this.command.kill("SIGSTOP");
    this.status = "paused";
    this.webContents.send("task-stoped", "ffmpeg has been stoped");
  }
  continue() {
    this.command.kill("SIGCONT");
    this.status = "running";
    // TODO:需要补充preload的事件
    this.webContents.send("task-continue", "ffmpeg has is running");
  }
  kill() {
    this.command.kill();
    this.status = "error";
    // TODO:需要补充preload的事件
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
