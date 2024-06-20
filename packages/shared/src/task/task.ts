import EventEmitter from "events";

import { uuid, isWin32 } from "../utils/index.js";
import log from "../utils/log.js";
import * as ntsuspend from "ntsuspend";
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

interface TaskEvents {
  "task-start": ({ taskId }: { taskId: string }) => void;
  "task-end": ({ taskId }: { taskId: string }) => void;
  "task-error": ({ taskId }: { taskId: string }) => void;
  "task-progress": ({ taskId }: { taskId: string }) => void;
}

// type Status = "pending" | "running" | "paused" | "completed" | "error";
abstract class AbstractTask {
  taskId: string;
  status: Status;
  name: string;
  relTaskId?: string;
  output?: string | number;
  progress: number;
  custsomProgressMsg: string;
  action: ("pause" | "kill" | "interrupt")[];
  startTime?: number;
  endTime?: number;
  emitter = new EventEmitter() as TypedEmitter<TaskEvents>;

  abstract type: string;
  abstract exec(): void;
  abstract kill(): void;
  abstract pause(): void;
  abstract resume(): void;
  on(event: keyof TaskEvents, callback: (event: { taskId: string }) => void) {
    this.emitter.on(event, callback);
  }
  constructor() {
    this.taskId = uuid();
    this.status = "pending";
    this.name = this.taskId;
    this.progress = 0;
    this.action = ["pause", "kill"];
    this.custsomProgressMsg = "";
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
        this.emitter.emit("task-error", { taskId: this.taskId });
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
        this.emitter.emit("task-error", { taskId: this.taskId });
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
      this.emitter.emit("task-error", { taskId: this.taskId });
    });
    command.on("progress", (progress) => {
      progress.percentage = progress.percent;
      console.log("progress", progress);
      if (callback.onProgress) {
        progress = callback.onProgress(progress);
      }
      this.custsomProgressMsg = `比特率: ${progress.currentKbps}kbits/s   速率: ${progress.speed}`;
      this.progress = progress.percentage || 0;
      this.emitter.emit("task-progress", { taskId: this.taskId });
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
  interrupt() {
    if (this.status === "completed" || this.status === "error") return;
    if (isWin32) {
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
      log.info(`task ${this.taskId} end`);
      this.status = "completed";
      this.progress = 100;
      this.output = data.aid;
      callback.onEnd && callback.onEnd(data);
      this.emitter.emit("task-end", { taskId: this.taskId });
      this.endTime = Date.now();
    });
    command.emitter.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(err);
      this.emitter.emit("task-error", { taskId: this.taskId });
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
 * 下载任务
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
      this.emitter.emit("task-error", { taskId: this.taskId });
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
 * 翻译任务
 */
export class TranslateTask extends AbstractTask {
  danmu: Danmu;
  input: string;
  options: any;
  type = TaskType.subtitleTranslate;
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
    this.action = [];
    this.callback = callback || {};
    this.controller = new AbortController();
  }
  exec() {
    this.callback.onStart && this.callback.onStart();
    this.status = "running";
    this.progress = 0;
    this.emitter.emit("task-start", { taskId: this.taskId });
    this.startTime = Date.now();
    // this.danmu
    //   .convertXml2Ass(this.input, this.output as string, this.options, this.controller.signal)
    //   .then(({ stdout, stderr }) => {
    //     log.debug("stdout", stdout);
    //     log.debug("stderr", stderr);

    //     if (stderr) {
    //       this.status = "error";
    //       this.callback.onError && this.callback.onError(stderr);
    //       this.emitter.emit("task-error", { taskId: this.taskId });
    //       return;
    //     }
    //     this.status = "completed";
    //     this.callback.onEnd && this.callback.onEnd(this.output as string);
    //     this.progress = 100;
    //     this.emitter.emit("task-end", { taskId: this.taskId });
    //     this.endTime = Date.now();
    //   })
    //   .catch((err) => {
    //     this.status = "error";
    //     this.callback.onError && this.callback.onError(err);
    //     this.emitter.emit("task-error", { taskId: this.taskId });
    //   });
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
    this.controller.abort();
    return true;
  }
}

export class TaskQueue {
  queue: AbstractTask[];
  emitter = new EventEmitter() as TypedEmitter<TaskEvents>;

  constructor() {
    this.queue = [];
  }
  addTask(task: AbstractTask, autoRun = true) {
    // task.type
    this.queue.push(task);
    if (autoRun) {
      task.exec();
    }

    if (task.type === TaskType.ffmpeg) {
      const config = appConfig.getAll();
      const maxNum = config?.task?.ffmpegMaxNum ?? -1;
      if (maxNum > 0) {
        this.filter({ type: TaskType.ffmpeg, status: "running" }).length < maxNum && task.exec();
      } else if (maxNum === -1) {
        task.exec();
      }
    }

    task.on("task-end", ({ taskId }) => {
      this.emitter.emit("task-end", { taskId });
    });
    task.on("task-error", ({ taskId }) => {
      this.emitter.emit("task-error", { taskId });
    });
    task.on("task-progress", ({ taskId }) => {
      this.emitter.emit("task-progress", { taskId });
    });
    task.on("task-start", ({ taskId }) => {
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
}

export const sendTaskNotify = (event: NotificationTaskStatus, taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (!task) return;
  const taskType = task.type;
  let title = "";
  let desp = "";
  switch (event) {
    case "success":
      title = `结束：${task.name}`;
      desp = `${task.name}结束\n\n开始时间：${new Date(task.startTime!).toLocaleString()}\n\n输出：${task.output}`;
      break;
    case "failure":
      title = `错误：${task.name}`;
      desp = `${task.name}出错\n\n开始时间：${new Date(task.startTime!).toLocaleString()}`;
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
  }
};

export const taskQueue = new TaskQueue();

const addTaskForLimit = () => {
  const config = appConfig.getAll();
  const maxNum = config?.task?.ffmpegMaxNum ?? -1;
  const pendingFFmpegTask = taskQueue.filter({ type: TaskType.ffmpeg, status: "pending" });

  if (maxNum !== -1) {
    const runningFFmpegTaskCount = taskQueue.filter({
      type: TaskType.ffmpeg,
      status: "running",
    }).length;

    if (runningFFmpegTaskCount < maxNum) {
      pendingFFmpegTask.slice(0, maxNum - runningFFmpegTaskCount).forEach((task) => {
        task.exec();
      });
    }
  } else {
    pendingFFmpegTask.forEach((task) => {
      task.exec();
    });
  }
};

taskQueue.on("task-start", ({ taskId }) => {
  sendTaskNotify("success", taskId);
});
taskQueue.on("task-end", () => {
  addTaskForLimit();
});
taskQueue.on("task-error", ({ taskId }) => {
  addTaskForLimit();
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
