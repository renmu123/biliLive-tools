import { uuid } from "./utils/index";
import log from "./utils/log";

import type { WebContents } from "electron";
import type { Progress } from "../types";

// Win不支持
export const pauseTask = (taskQueue: TaskQueue, taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (!task) return;
  return task.pause();
};

// Win不支持
export const resumeTask = (taskQueue: TaskQueue, taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (!task) return;
  return task.resume();
};

export const killTask = (taskQueue: TaskQueue, taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (!task) return;
  return task.kill();
};

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
      log.error(`task ${this.taskId} error: ${err}`);
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
  pause() {
    if (this.status !== "running") return;
    this.command.kill("SIGSTOP");
    log.warn(`task ${this.taskId} paused`);
    this.status = "paused";
    return true;
  }
  resume() {
    if (this.status !== "paused") return;
    this.command.kill("SIGCONT");
    log.warn(`task ${this.taskId} resumed`);
    this.status = "running";
    return true;
  }
  kill() {
    if (this.status === "completed" || this.status === "error") return;
    this.command.kill();
    log.warn(`task ${this.taskId} killed`);
    this.status = "error";
    return true;
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
