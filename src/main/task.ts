import EventEmitter from "events";

import { uuid, isWin32 } from "./utils/index";
import log from "./utils/log";
import ntsuspend from "ntsuspend";

import type { WebContents, IpcMainInvokeEvent } from "electron";
import type { Progress } from "../types";
import type ffmpeg from "fluent-ffmpeg";

const emitter = new EventEmitter();

export const pauseTask = (taskQueue: TaskQueue, taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (!task) return;
  return task.pause();
};

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

abstract class AbstractTask {
  taskId: string;
  status: "pending" | "running" | "paused" | "completed" | "error";
  name: string;
  abstract type: string;
  abstract exec(): void;
  abstract kill(): void;
  abstract pause(): void;
  abstract resume(): void;
  constructor() {
    this.taskId = uuid();
    this.status = "pending";
    this.name = this.taskId;
  }
}

export class FFmpegTask extends AbstractTask {
  command: ffmpeg.FfmpegCommand;
  webContents: WebContents;
  type = "ffmpeg";
  constructor(
    command: ffmpeg.FfmpegCommand,
    webContents: WebContents,
    options: {
      output: string;
      name: string;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: string) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: Progress) => boolean;
    },
  ) {
    super();
    this.command = command;
    this.webContents = webContents;

    command.on("start", (commandLine: string) => {
      log.info(`task ${this.taskId} start, command: ${commandLine}`);
      this.status = "running";

      callback.onStart && callback.onStart();
      this.webContents.send("task-start", { taskId: this.taskId, command: commandLine });
      emitter.emit("task-start", { taskId: this.taskId });
    });
    command.on("end", async () => {
      log.info(`task ${this.taskId} end`);
      this.status = "completed";

      callback.onEnd && callback.onEnd(options.output);
      this.webContents.send("task-end", { taskId: this.taskId, output: options.output });
      emitter.emit("task-end", { taskId: this.taskId });
    });
    command.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(err);
      this.webContents.send("task-error", { taskId: this.taskId, err: err });
      emitter.emit("task-error", { taskId: this.taskId });
    });
    command.on("progress", (progress) => {
      progress.percentage = progress.percent;

      if (callback.onProgress) {
        if (!callback.onProgress(progress)) {
          // 如果返回false，表示要停止默认行为
          return;
        }
      }
      // callback.onProgress && callback.onProgress(progress);
      this.webContents.send("task-progress-update", { taskId: this.taskId, progress: progress });
      emitter.emit("task-progress-update", { taskId: this.taskId });
    });
  }
  exec() {
    this.command.run();
  }
  pause() {
    if (this.status !== "running") return;
    if (isWin32) {
      // @ts-ignore
      ntsuspend.suspend(this.command.ffmpegProc.pid);
    } else {
      this.command.kill("SIGSTOP");
    }
    log.warn(`task ${this.taskId} paused`);
    this.status = "paused";
    return true;
  }
  resume() {
    if (this.status !== "paused") return;
    if (isWin32) {
      // @ts-ignore
      ntsuspend.resume(this.command.ffmpegProc.pid);
    } else {
      this.command.kill("SIGCONT");
    }
    log.warn(`task ${this.taskId} resumed`);
    this.status = "running";
    return true;
  }
  kill() {
    if (this.status === "completed" || this.status === "error") return;
    // @ts-ignore
    this.command.ffmpegProc.stdin.write("q");
    log.warn(`task ${this.taskId} killed`);
    this.status = "error";
    return true;
  }
}
export class TaskQueue {
  queue: AbstractTask[];
  constructor() {
    this.queue = [];
  }
  addTask(task: AbstractTask, autoRun = true) {
    this.queue.push(task);
    if (autoRun) {
      task.exec();
    }
  }
  queryTask(taskId: string) {
    return this.queue.find((task) => task.taskId === taskId);
  }
  list() {
    return this.queue;
  }
  start(taskId: string) {
    const task = this.queryTask(taskId);
    if (!task) return;
    if (task.status !== "pending") return;
    task.exec();
  }
  on(
    event: "task-start" | "task-end" | "task-error" | "task-progress-update",
    callback: (event: { taskId: string }) => void,
  ) {
    emitter.on(event, callback);
  }
}

export const taskQueue = new TaskQueue();

export const handlePauseTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return pauseTask(taskQueue, taskId);
};
export const handleResumeTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return resumeTask(taskQueue, taskId);
};
export const handleKillTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return killTask(taskQueue, taskId);
};
export const handleListTask = () => {
  return taskQueue.list();
};
export const handleStartTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return taskQueue.start(taskId);
};

export const handlers = {
  "task:start": handleStartTask,
  "task:pause": handlePauseTask,
  "task:resume": handleResumeTask,
  "task:kill": handleKillTask,
  "task:list": handleListTask,
};
