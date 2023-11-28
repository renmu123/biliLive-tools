import { uuid, isWin32 } from "./utils/index";
import log from "./utils/log";
import type ffmpeg from "fluent-ffmpeg";
import ntsuspend from "ntsuspend";

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

abstract class AbstractTask {
  abstract taskId: string;
  abstract status: "pending" | "running" | "paused" | "completed" | "error";
  abstract exec(): void;
  abstract kill(): void;
  abstract pause(): void;
  abstract resume(): void;
}

class BaseTask extends AbstractTask {
  taskId: string;
  status: "pending" | "running" | "paused" | "completed" | "error";
  constructor() {
    super();
    this.taskId = uuid();
    this.status = "pending";
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  exec() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  kill() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  pause() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  resume() {}
}

export class FFmpegTask extends BaseTask {
  command: ffmpeg.FfmpegCommand;
  webContents: WebContents;
  constructor(
    command: ffmpeg.FfmpegCommand,
    webContents: WebContents,
    options: {
      output: string;
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
    });
    command.on("end", async () => {
      log.info(`task ${this.taskId} end`);
      this.status = "completed";

      callback.onEnd && callback.onEnd(options.output);
      this.webContents.send("task-end", { taskId: this.taskId, output: options.output });
    });
    command.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(err);
      this.webContents.send("task-error", { taskId: this.taskId, err: err });
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
  queue: BaseTask[];
  constructor() {
    this.queue = [];
  }
  addTask(task: BaseTask, autoRun = true) {
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
}

export const taskQueue = new TaskQueue();
