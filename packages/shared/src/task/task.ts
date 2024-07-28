import EventEmitter from "node:events";
import { createRequire } from "node:module";

import { uuid, isWin32 } from "../utils/index.js";
import log from "../utils/log.js";
import { Danmu } from "../danmu/index.js";
import { sendNotify } from "../notify.js";
import { appConfig } from "../index.js";
import { TypedEmitter } from "tiny-typed-emitter";
import kill from "tree-kill";

import type ffmpeg from "fluent-ffmpeg";
import type { Client } from "@renmu/bili-api";
import type { Progress, NotificationTaskStatus } from "@biliLive-tools/types";
import type { Status } from "@biliLive-tools/types/task.d.ts";
import { TaskType } from "../enum.js";
import type { M3U8Downloader } from "douyu-cli";

interface TaskEvents {
  "task-start": ({ taskId }: { taskId: string }) => void;
  "task-end": ({ taskId }: { taskId: string }) => void;
  "task-error": ({ taskId, error }: { taskId: string; error: string }) => void;
  "task-progress": ({ taskId }: { taskId: string }) => void;
}

abstract class AbstractTask {
  taskId: string;
  status: Status;
  name: string;
  relTaskId?: string;
  output?: string;
  progress: number;
  custsomProgressMsg: string;
  action: ("pause" | "kill" | "interrupt")[];
  startTime?: number;
  endTime?: number;
  error?: string;
  emitter = new EventEmitter() as TypedEmitter<TaskEvents>;

  abstract type: string;
  abstract exec(): void;
  abstract kill(): void;
  abstract pause(): void;
  abstract resume(): void;
  constructor() {
    this.taskId = uuid();
    this.status = "pending";
    this.name = this.taskId;
    this.progress = 0;
    this.action = ["pause", "kill"];
    this.custsomProgressMsg = "";
  }
  on(event: keyof TaskEvents, callback: (event: { taskId: string }) => void) {
    this.emitter.on(event, callback);
  }
}

export class DanmuTask extends AbstractTask {
  danmu: Danmu;
  input: string;
  options: any;
  type = TaskType.danmu;
  controller: AbortController;
  callback: {
    onStart?: () => void;
    onEnd?: (output: string) => void;
    onError?: (err: string) => void;
    onProgress?: (progress: Progress) => any;
  };
  constructor(
    danmu: Danmu,
    options: {
      input: string;
      output: string;
      options: any;
      name: string;
    },
    callback?: {
      onStart?: () => void;
      onEnd?: (output: string) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: Progress) => any;
    },
  ) {
    super();
    this.danmu = danmu;
    this.input = options.input;
    this.options = options.options;
    this.output = options.output;
    this.progress = 0;
    if (options.name) {
      this.name = options.name;
    }
    this.action = ["kill"];
    this.callback = callback || {};
    this.controller = new AbortController();
  }
  exec() {
    this.callback.onStart && this.callback.onStart();
    this.status = "running";
    this.progress = 0;
    this.emitter.emit("task-start", { taskId: this.taskId });
    this.startTime = Date.now();
    this.danmu
      .convertXml2Ass(this.input, this.output as string, this.options)
      .then(() => {
        this.status = "completed";
        this.callback.onEnd && this.callback.onEnd(this.output as string);
        this.progress = 100;
        this.emitter.emit("task-end", { taskId: this.taskId });
        this.endTime = Date.now();
      })
      .catch((err) => {
        this.status = "error";
        this.callback.onError && this.callback.onError(err);
        this.error = err;
        this.emitter.emit("task-error", { taskId: this.taskId, error: err });
      });
  }
  pause() {
    return false;
  }
  resume() {
    return false;
  }
  kill() {
    if (this.status === "completed" || this.status === "error") return;
    log.warn(`danmu task ${this.taskId} killed`);
    this.status = "error";
    if (this.danmu.child.pid) {
      kill(this.danmu.child.pid);
    }
    return true;
  }
}

export class FFmpegTask extends AbstractTask {
  command: ffmpeg.FfmpegCommand;
  type = TaskType.ffmpeg;
  isInterrupted: boolean = false;

  constructor(
    command: ffmpeg.FfmpegCommand,
    options: {
      output: string;
      name: string;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: string) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: Progress) => any;
    },
  ) {
    super();
    this.command = command;
    this.output = options.output;
    this.progress = 0;
    this.action = ["kill", "pause", "interrupt"];
    if (options.name) {
      this.name = options.name;
    }

    log.info(
      `ffmpeg task ${this.taskId} has been added, command: ${command._getArguments().join(" ")}`,
    );

    command.on("start", (commandLine: string) => {
      this.progress = 0;
      log.info(`task ${this.taskId} start, command: ${commandLine}`);
      this.status = "running";

      callback.onStart && callback.onStart();
      this.emitter.emit("task-start", { taskId: this.taskId });

      this.startTime = Date.now();
    });
    command.on("end", async () => {
      // 如果任务是被中断的，走这个逻辑
      if (this.isInterrupted) {
        const msg = `task ${this.taskId} error: isInterrupted`;
        log.error(msg);
        this.status = "error";

        callback.onError && callback.onError(msg);
        this.error = msg;
        this.emitter.emit("task-error", { taskId: this.taskId, error: msg });
      } else {
        log.info(`task ${this.taskId} end`);
        this.status = "completed";
        this.progress = 100;

        callback.onEnd && callback.onEnd(options.output);
        this.emitter.emit("task-end", { taskId: this.taskId });
        this.endTime = Date.now();
      }
    });
    command.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(err);
      this.error = err;
      this.emitter.emit("task-error", { taskId: this.taskId, error: err });
    });
    command.on("progress", (progress) => {
      progress.percentage = progress.percent;
      // console.log("progress", progress);
      if (callback.onProgress) {
        progress = callback.onProgress(progress);
      }
      this.custsomProgressMsg = `比特率: ${progress.currentKbps}kbits/s   速率: ${progress.speed}`;
      this.progress = progress.percentage || 0;
      this.emitter.emit("task-progress", { taskId: this.taskId });
    });
  }
  exec() {
    this.status = "running";
    this.command.run();
  }
  pause() {
    if (this.status !== "running") return;
    if (isWin32) {
      const ntsuspend = createRequire(import.meta.url)("ntsuspend");
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
      const ntsuspend = createRequire(import.meta.url)("ntsuspend");
      // @ts-ignore
      ntsuspend.resume(this.command.ffmpegProc.pid);
    } else {
      this.command.kill("SIGCONT");
    }
    log.warn(`task ${this.taskId} resumed`);
    this.status = "running";
    return true;
  }
  interrupt() {
    if (this.status === "completed" || this.status === "error") return;
    if (isWin32) {
      const ntsuspend = createRequire(import.meta.url)("ntsuspend");
      // @ts-ignore
      ntsuspend.resume(this.command.ffmpegProc.pid);
    }
    // @ts-ignore
    this.command.ffmpegProc.stdin.write("q");
    log.warn(`task ${this.taskId} interrupted`);
    this.isInterrupted = true;
    this.status = "error";
    return true;
  }
  kill() {
    if (this.status === "completed" || this.status === "error") return;
    if (isWin32) {
      const ntsuspend = createRequire(import.meta.url)("ntsuspend");
      // @ts-ignore
      ntsuspend.resume(this.command.ffmpegProc.pid);
    }
    this.command.kill("SIGKILL");
    log.warn(`task ${this.taskId} killed`);
    this.status = "error";
    return true;
  }
}

type WithoutPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * 上传任务
 */
export class BiliVideoTask extends AbstractTask {
  command: WithoutPromise<ReturnType<Client["platform"]["addMedia"]>>;
  type = TaskType.bili;
  constructor(
    command: WithoutPromise<ReturnType<Client["platform"]["addMedia"]>>,
    options: {
      name: string;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: { aid: number; bvid: string }) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: Progress) => any;
    },
  ) {
    super();
    this.command = command;
    this.progress = 0;
    this.action = ["kill", "pause"];
    if (options.name) {
      this.name = options.name;
    }

    // command.emitter.on("start", (commandLine: string) => {
    //   this.progress = 0;
    //   log.info(`task ${this.taskId} start, command: ${commandLine}`);
    //   this.status = "running";

    //   callback.onStart && callback.onStart();
    //   emitter.emit("task-start", { taskId: this.taskId });
    //   this.startTime = Date.now();
    // });
    this.status = "running";
    this.startTime = Date.now();
    this.emitter.emit("task-start", { taskId: this.taskId });

    command.emitter.on("completed", async (data: { aid: number; bvid: string }) => {
      log.info(`task ${this.taskId} end`, data);
      this.status = "completed";
      this.progress = 100;
      this.output = String(data.aid);
      callback.onEnd && callback.onEnd(data);
      this.emitter.emit("task-end", { taskId: this.taskId });
      this.endTime = Date.now();
    });
    command.emitter.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(err);
      this.error = err;
      this.emitter.emit("task-error", { taskId: this.taskId, error: err });
    });

    // let size = 0;
    // let time = Date.now();
    // let lastProgressMsg = `速度: 0MB/s`;
    command.emitter.on("progress", (progress) => {
      progress.percentage = progress.progress * 100;

      if (callback.onProgress) {
        progress = callback.onProgress(progress);
      }
      this.progress = progress.percentage || 0;
      // const nowSize = progress.totalUploadedSize;
      // const nowTime = Date.now();
      // const timeDistance = (nowTime - time) / 1000;
      // const sizeDistance = nowSize - size;

      // time = nowTime;
      // size = nowSize;
      // if (timeDistance < 0.1) {
      // this.custsomProgressMsg = `速度: 0MB/s`;
      // this.custsomProgressMsg = lastProgressMsg;
      // } else {
      // this.custsomProgressMsg = `速度: ${(sizeDistance / 1024 / 1024 / timeDistance).toFixed(2)}MB/s`;
      // lastProgressMsg = this.custsomProgressMsg;
      // }
      // console.log("progress", progress, sizeDistance, timeDistance);

      this.emitter.emit("task-progress", { taskId: this.taskId });
    });
  }
  exec() {
    // this.command.run();
  }
  pause() {
    if (this.status !== "running") return;
    this.command.pause();
    log.warn(`task ${this.taskId} paused`);
    this.status = "paused";
    return true;
  }
  resume() {
    if (this.status !== "paused") return;
    this.command.start();
    log.warn(`task ${this.taskId} resumed`);
    this.status = "running";
    return true;
  }
  // interrupt() {
  //   if (this.status === "completed" || this.status === "error") return;
  //   log.warn(`task ${this.taskId} interrupt`);
  //   this.status = "error";
  //   return true;
  // }
  kill() {
    if (this.status === "completed" || this.status === "error") return;
    log.warn(`task ${this.taskId} killed`);
    this.status = "error";
    this.command.cancel();
    return true;
  }
}

/**
 * B站下载任务
 */
export class BiliDownloadVideoTask extends AbstractTask {
  command: WithoutPromise<ReturnType<Client["video"]["download"]>>;
  type = TaskType.biliDownload;
  emitter = new EventEmitter() as TypedEmitter<TaskEvents>;
  constructor(
    command: WithoutPromise<ReturnType<Client["video"]["download"]>>,
    options: {
      name: string;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: string) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: number) => any;
    },
  ) {
    super();
    this.command = command;
    this.progress = 0;
    this.action = ["kill", "pause"];

    if (options.name) {
      this.name = options.name;
    }

    // command.emitter.on("start", (commandLine: string) => {
    //   this.progress = 0;
    //   log.info(`task ${this.taskId} start, command: ${commandLine}`);
    //   this.status = "running";

    //   callback.onStart && callback.onStart();
    //   emitter.emit("task-start", { taskId: this.taskId });
    //   this.startTime = Date.now();
    // });
    this.status = "running";
    this.startTime = Date.now();
    this.emitter.emit("task-start", { taskId: this.taskId });

    command.emitter.on("completed", async (data) => {
      log.info(`task ${this.taskId} end`);
      this.status = "completed";
      this.progress = 100;
      this.output = data;
      callback.onEnd && callback.onEnd(data);
      this.emitter.emit("task-end", { taskId: this.taskId });
      this.endTime = Date.now();
    });
    command.emitter.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(err);
      this.error = err;
      this.emitter.emit("task-error", { taskId: this.taskId, error: err });
    });
    let size = 0;
    let time = Date.now();
    let lastProgressMsg = `速度: 0MB/s`;
    command.emitter.on("progress", (event: any) => {
      if (event.event === "download") {
        const progress = event.progress.progress * 100;
        this.progress = progress;
        const nowSize = event.progress.loaded;
        const nowTime = Date.now();
        const timeDistance = (nowTime - time) / 1000;
        const sizeDistance = nowSize - size;

        time = nowTime;
        size = nowSize;

        if (timeDistance < 0.1) {
          this.custsomProgressMsg = `速度: 0MB/s`;
          this.custsomProgressMsg = lastProgressMsg;
        } else {
          this.custsomProgressMsg = `速度: ${(sizeDistance / 1024 / 1024 / timeDistance).toFixed(2)}MB/s`;
          lastProgressMsg = this.custsomProgressMsg;
        }
        // progress.percentage = progress.progress * 100;
        // progress.progress = progress.percentage;

        callback.onProgress && callback.onProgress(progress);
        this.emitter.emit("task-progress", { taskId: this.taskId });
      }
    });
  }
  exec() {
    // this.command.run();
  }
  pause() {
    if (this.status !== "running") return;
    this.command.pause();
    log.warn(`task ${this.taskId} paused`);
    this.status = "paused";
    return true;
  }
  resume() {
    if (this.status !== "paused") return;
    this.command.start();
    log.warn(`task ${this.taskId} resumed`);
    this.status = "running";
    return true;
  }
  kill() {
    if (this.status === "completed" || this.status === "error") return;
    log.warn(`task ${this.taskId} killed`);
    this.status = "error";
    this.command.cancel();
    return true;
  }
}

/**
 * 斗鱼录播下载任务
 */
export class DouyuDownloadVideoTask extends AbstractTask {
  command: M3U8Downloader;
  type = TaskType.douyuDownload;
  emitter = new EventEmitter() as TypedEmitter<TaskEvents>;
  constructor(
    command: M3U8Downloader,
    options: {
      name: string;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: string) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: number) => any;
    },
  ) {
    super();
    this.command = command;
    this.progress = 0;
    this.action = ["kill", "pause"];

    if (options.name) {
      this.name = options.name;
    }

    // command.emitter.on("start", (commandLine: string) => {
    //   this.progress = 0;
    //   log.info(`task ${this.taskId} start, command: ${commandLine}`);
    //   this.status = "running";

    //   callback.onStart && callback.onStart();
    //   emitter.emit("task-start", { taskId: this.taskId });
    //   this.startTime = Date.now();
    // });

    command.on("completed", async () => {
      const output = this.command.output;
      log.info(`task ${this.taskId} end`);
      this.status = "completed";
      this.progress = 100;
      this.output = output;
      callback.onEnd && callback.onEnd(output);
      this.emitter.emit("task-end", { taskId: this.taskId });
      this.endTime = Date.now();
    });
    command.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(err);
      this.error = err;
      this.emitter.emit("task-error", { taskId: this.taskId, error: err });
    });
    command.on("progress", (progress: { downloaded: number; total: number }) => {
      const percent = Math.floor((progress.downloaded / progress.total) * 100);
      callback.onProgress && callback.onProgress(percent);
      this.progress = percent;
      this.emitter.emit("task-progress", { taskId: this.taskId });
    });
  }
  exec() {
    if (this.status !== "pending") return;
    this.status = "running";
    this.command.download();
    this.startTime = Date.now();
    this.emitter.emit("task-start", { taskId: this.taskId });
  }
  pause() {
    if (this.status !== "running") return;
    this.command.pause();
    log.warn(`task ${this.taskId} paused`);
    this.status = "paused";
    return true;
  }
  resume() {
    if (this.status !== "paused") return;
    this.command.resume();
    log.warn(`task ${this.taskId} resumed`);
    this.status = "running";
    return true;
  }
  kill() {
    if (this.status === "completed" || this.status === "error") return;
    log.warn(`task ${this.taskId} killed`);
    this.status = "error";
    this.command.cancel();
    return true;
  }
}

export class TaskQueue {
  queue: AbstractTask[];
  emitter = new EventEmitter() as TypedEmitter<TaskEvents>;

  constructor() {
    this.queue = [];
    this.on("task-end", () => {
      this.addTaskForLimit();
    });
    this.on("task-error", () => {
      this.addTaskForLimit();
    });
  }
  addTask(task: AbstractTask, autoRun = true) {
    this.queue.push(task);
    if (autoRun) {
      task.exec();
    } else {
      if (task.type === TaskType.ffmpeg || task.type === TaskType.douyuDownload) {
        const config = appConfig.getAll();
        const ffmpegMaxNum = config?.task?.ffmpegMaxNum ?? -1;
        const douyuDownloadMaxNum = config?.task?.douyuDownloadMaxNum ?? -1;

        if (ffmpegMaxNum > 0) {
          this.filter({ type: TaskType.ffmpeg, status: "running" }).length < ffmpegMaxNum &&
            task.type === TaskType.ffmpeg &&
            task.exec();
        }
        if (douyuDownloadMaxNum > 0) {
          this.filter({ type: TaskType.douyuDownload, status: "running" }).length <
            douyuDownloadMaxNum &&
            task.type === TaskType.douyuDownload &&
            task.exec();
        }
      }
    }

    task.emitter.on("task-end", ({ taskId }) => {
      this.emitter.emit("task-end", { taskId });
    });
    task.emitter.on("task-error", ({ taskId, error }) => {
      this.emitter.emit("task-error", { taskId, error });
    });
    task.emitter.on("task-progress", ({ taskId }) => {
      this.emitter.emit("task-progress", { taskId });
    });
    task.emitter.on("task-start", ({ taskId }) => {
      this.emitter.emit("task-start", { taskId });
    });
  }
  queryTask(taskId: string) {
    const task = this.queue.find((task) => task.taskId === taskId);
    return task;
  }
  stringify(item: AbstractTask[]) {
    return item.map((task) => {
      return {
        taskId: task.taskId,
        status: task.status,
        name: task.name,
        type: task.type,
        relTaskId: task.relTaskId,
        output: task.output,
        progress: task.progress,
        action: task.action,
        startTime: task.startTime,
        endTime: task.endTime,
        custsomProgressMsg: task.custsomProgressMsg,
        error: task.error,
      };
    });
  }
  filter(options: { type?: string; status?: Status }) {
    return this.queue.filter((task) => {
      if (options.type && task.type !== options.type) return false;
      if (options.status && task.status !== options.status) return false;
      return true;
    });
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
  remove(taskId: string) {
    const task = this.queryTask(taskId);
    if (!task) return;
    const index = this.queue.indexOf(task);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }
  on(event: keyof TaskEvents, callback: (event: { taskId: string }) => void) {
    this.emitter.on(event, callback);
  }

  taskLimit(maxNum: number, type: string) {
    const pendingFFmpegTask = this.filter({ type: type, status: "pending" });
    if (maxNum !== -1) {
      const runningTaskCount = this.filter({
        type: type,
        status: "running",
      }).length;

      if (runningTaskCount < maxNum) {
        pendingFFmpegTask.slice(0, maxNum - runningTaskCount).forEach((task) => {
          task.exec();
        });
      }
    }
  }
  addTaskForLimit = () => {
    console.log("addTaskForLimit");
    const config = appConfig.getAll();

    // ffmpeg任务
    this.taskLimit(config?.task?.ffmpegMaxNum ?? -1, TaskType.ffmpeg);
    // 斗鱼录播下载任务
    this.taskLimit(config?.task?.douyuDownloadMaxNum ?? -1, TaskType.douyuDownload);

    // const ffmpegMaxNum = config?.task?.ffmpegMaxNum ?? -1;
    // const pendingFFmpegTask = this.filter({ type: TaskType.ffmpeg, status: "pending" });
    // if (ffmpegMaxNum !== -1) {
    //   const runningTaskCount = this.filter({
    //     type: TaskType.ffmpeg,
    //     status: "running",
    //   }).length;

    //   if (runningTaskCount < ffmpegMaxNum) {
    //     pendingFFmpegTask.slice(0, ffmpegMaxNum - runningTaskCount).forEach((task) => {
    //       console.log("task.exec()");
    //       task.exec();
    //     });
    //   }
    // }

    // 斗鱼录播下载任务
    // const douyuDownloadMaxNum = config?.task?.douyuDownloadMaxNum ?? -1;
    // const pendingDouyuDownloadTask = this.filter({
    //   type: TaskType.douyuDownload,
    //   status: "pending",
    // });
    // if (douyuDownloadMaxNum !== -1) {
    //   const runningTaskCount = this.filter({
    //     type: TaskType.douyuDownload,
    //     status: "running",
    //   }).length;

    //   if (runningTaskCount < douyuDownloadMaxNum) {
    //     pendingDouyuDownloadTask
    //       .slice(0, douyuDownloadMaxNum - runningTaskCount)
    //       .forEach((task) => {
    //         task.exec();
    //       });
    //   }
    // }
  };
}

export const sendTaskNotify = (event: NotificationTaskStatus, taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (!task) return;
  const taskType = task.type;
  let title = "";
  let desp = "";
  switch (event) {
    case "success":
      title = `成功：${task.name}`;
      desp = `${task.name}结束\n\n开始时间：${new Date(task.startTime!).toLocaleString()}\n\n输出：${task.output}`;
      break;
    case "failure":
      title = `错误：${task.name}`;
      desp = `${task.name}出错\n\n开始时间：${new Date(task.startTime!).toLocaleString()}\n\n错误信息：${task.error}`;
      break;
  }
  const config = appConfig.getAll();
  const taskConfig = config?.notification?.task;
  switch (taskType) {
    case TaskType.ffmpeg:
      if (taskConfig.ffmpeg.includes(event)) {
        sendNotify(title, desp);
      }
      break;
    case TaskType.danmu:
      if (taskConfig.danmu.includes(event)) {
        sendNotify(title, desp);
      }
      break;
    case TaskType.bili:
      if (taskConfig.upload.includes(event)) {
        sendNotify(title, desp);
      }
      break;
    case TaskType.biliDownload:
      if (taskConfig.download.includes(event)) {
        sendNotify(title, desp);
      }
      break;
    case TaskType.douyuDownload:
      if (taskConfig.download.includes(event)) {
        sendNotify(title, desp);
      }
      break;
  }
};

export const taskQueue = new TaskQueue();

taskQueue.on("task-end", ({ taskId }) => {
  sendTaskNotify("success", taskId);
});
taskQueue.on("task-error", ({ taskId }) => {
  sendTaskNotify("failure", taskId);
});

export const handlePauseTask = (taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (!task) return;
  return task.pause();
};
export const handleResumeTask = (taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (!task) return;
  return task.resume();
};
export const handleKillTask = (taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (!task) return;
  return task.kill();
};
export const hanldeInterruptTask = (taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (!task) return null;
  if (task.action.includes("interrupt")) {
    // @ts-ignore
    return task.interrupt();
  }
  return false;
};

export const handleListTask = () => {
  return taskQueue.stringify(taskQueue.list());
};
export const handleQueryTask = (taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (task) {
    return taskQueue.stringify([task])[0];
  } else {
    return null;
  }
};
export const handleStartTask = (taskId: string) => {
  return taskQueue.start(taskId);
};
export const handleRemoveTask = (taskId: string) => {
  return taskQueue.remove(taskId);
};
