import EventEmitter from "events";

import { uuid, isWin32 } from "./utils/index";
import log from "./utils/log";
import * as ntsuspend from "ntsuspend";
import { Danmu } from "../core/index";
import { TaskType } from "../types/enum";
import { sendNotify } from "./notify";
import { appConfig } from "@biliLive-tools/shared";

import type ffmpeg from "fluent-ffmpeg";
import type { Client } from "@renmu/bili-api";
import type { WebContents, IpcMainInvokeEvent } from "electron";
import type { Progress, NotificationTaskStatus } from "../types";

const emitter = new EventEmitter();

abstract class AbstractTask {
  taskId: string;
  status: "pending" | "running" | "paused" | "completed" | "error";
  name: string;
  relTaskId?: string;
  output?: string;
  progress: number;
  custsomProgressMsg: string;
  action: ("pause" | "kill" | "interrupt")[];
  startTime?: number;
  endTime?: number;

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
}

export class DanmuTask extends AbstractTask {
  webContents: WebContents;
  danmu: Danmu;
  input: string;
  options: any;
  type = TaskType.danmu;
  callback: {
    onStart?: () => void;
    onEnd?: (output: string) => void;
    onError?: (err: string) => void;
    onProgress?: (progress: Progress) => any;
  };
  constructor(
    danmu: Danmu,
    webContents: WebContents,
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
    this.webContents = webContents;
    this.output = options.output;
    this.progress = 0;
    if (options.name) {
      this.name = options.name;
    }
    this.action = [];
    this.callback = callback || {};
  }
  exec() {
    this.callback.onStart && this.callback.onStart();
    this.status = "running";
    this.progress = 0;
    console.log("danmuTask,task-start", this.input, this.output);
    emitter.emit("task-start", { taskId: this.taskId, webContents: this.webContents });
    this.startTime = Date.now();
    this.danmu
      .convertXml2Ass(this.input, this.output as string, this.options)
      .then(({ stdout, stderr }) => {
        log.debug("stdout", stdout);
        log.debug("stderr", stderr);

        if (stderr) {
          this.status = "error";
          this.callback.onError && this.callback.onError(stderr);
          emitter.emit("task-error", { taskId: this.taskId, webContents: this.webContents });
          return;
        }
        this.status = "completed";
        this.callback.onEnd && this.callback.onEnd(this.output as string);
        this.progress = 100;
        emitter.emit("task-end", { taskId: this.taskId, webContents: this.webContents });
        this.endTime = Date.now();
      })
      .catch((err) => {
        this.status = "error";
        this.callback.onError && this.callback.onError(err);
        emitter.emit("task-error", { taskId: this.taskId, webContents: this.webContents });
      });
  }
  pause() {
    return false;
  }
  resume() {
    return false;
  }
  kill() {
    return false;
  }
}

export class FFmpegTask extends AbstractTask {
  command: ffmpeg.FfmpegCommand;
  webContents: WebContents;
  type = TaskType.ffmpeg;
  isInterrupted: boolean = false;
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
      onProgress?: (progress: Progress) => any;
    },
  ) {
    super();
    this.command = command;
    this.webContents = webContents;
    this.output = options.output;
    this.progress = 0;
    this.action = ["kill", "pause"];
    if (options.name) {
      this.name = options.name;
    }

    command.on("start", (commandLine: string) => {
      this.progress = 0;
      log.info(`task ${this.taskId} start, command: ${commandLine}`);
      this.status = "running";

      callback.onStart && callback.onStart();
      emitter.emit("task-start", { taskId: this.taskId, webContents: this.webContents });
      this.startTime = Date.now();
    });
    command.on("end", async () => {
      // 如果任务是被中断的，走这个逻辑
      if (this.isInterrupted) {
        const msg = `task ${this.taskId} error: isInterrupted`;
        log.error(msg);
        this.status = "error";

        callback.onError && callback.onError(msg);
        emitter.emit("task-error", { taskId: this.taskId, webContents: this.webContents });
      } else {
        log.info(`task ${this.taskId} end`);
        this.status = "completed";
        this.progress = 100;

        callback.onEnd && callback.onEnd(options.output);
        emitter.emit("task-end", { taskId: this.taskId, webContents: this.webContents });
        this.endTime = Date.now();
      }
    });
    command.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(err);
      emitter.emit("task-error", { taskId: this.taskId, webContents: this.webContents });
    });
    command.on("progress", (progress) => {
      progress.percentage = progress.percent;
      if (callback.onProgress) {
        progress = callback.onProgress(progress);
      }
      this.custsomProgressMsg = `比特率: ${progress.currentKbps}kbits/s   速率: ${progress.speed}`;
      this.progress = progress.percentage || 0;
      emitter.emit("task-progress", { taskId: this.taskId, webContents: this.webContents });
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
  // interrupt() {
  //   if (this.status === "completed" || this.status === "error") return;
  //   // @ts-ignore
  //   this.command.ffmpegProc.stdin.write("q");
  //   log.warn(`task ${this.taskId} interrupt`);
  //   this.isInterrupted = true;
  //   this.status = "error";
  //   return true;
  // }
  kill() {
    if (this.status === "completed" || this.status === "error") return;
    if (isWin32) {
      // @ts-ignore
      ntsuspend.resume(this.command.ffmpegProc.pid);
    }
    // @ts-ignore
    this.command.ffmpegProc.stdin.write("q");
    log.warn(`task ${this.taskId} interrupt`);
    this.isInterrupted = true;
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
  webContents: WebContents;
  type = TaskType.bili;
  constructor(
    command: WithoutPromise<ReturnType<Client["platform"]["addMedia"]>>,
    webContents: WebContents,
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
    this.webContents = webContents;
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
    //   emitter.emit("task-start", { taskId: this.taskId, webContents: this.webContents });
    //   this.startTime = Date.now();
    // });
    this.status = "running";
    this.startTime = Date.now();
    emitter.emit("task-start", { taskId: this.taskId, webContents: this.webContents });

    command.emitter.on("completed", async (data) => {
      log.info(`task ${this.taskId} end`);
      this.status = "completed";
      this.progress = 100;
      this.output = data;
      callback.onEnd && callback.onEnd(data);
      emitter.emit("task-end", { taskId: this.taskId, webContents: this.webContents });
      this.endTime = Date.now();
    });
    command.emitter.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(err);
      emitter.emit("task-error", { taskId: this.taskId, webContents: this.webContents });
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

      emitter.emit("task-progress", { taskId: this.taskId, webContents: this.webContents });
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
  webContents: WebContents;
  type = TaskType.biliDownload;
  constructor(
    command: WithoutPromise<ReturnType<Client["video"]["download"]>>,
    webContents: WebContents,
    options: {
      name: string;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: { aid: number; bvid: string }) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: number) => any;
    },
  ) {
    super();
    this.command = command;
    this.webContents = webContents;
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
    //   emitter.emit("task-start", { taskId: this.taskId, webContents: this.webContents });
    //   this.startTime = Date.now();
    // });
    this.status = "running";
    this.startTime = Date.now();
    emitter.emit("task-start", { taskId: this.taskId, webContents: this.webContents });

    command.emitter.on("completed", async (data) => {
      log.info(`task ${this.taskId} end`);
      this.status = "completed";
      this.progress = 100;
      this.output = data;
      callback.onEnd && callback.onEnd(data);
      emitter.emit("task-end", { taskId: this.taskId, webContents: this.webContents });
      this.endTime = Date.now();
    });
    command.emitter.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(err);
      emitter.emit("task-error", { taskId: this.taskId, webContents: this.webContents });
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
        emitter.emit("task-progress", { taskId: this.taskId, webContents: this.webContents });
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
  on(
    event: "task-start" | "task-end" | "task-error" | "task-progress",
    callback: (event: { taskId: string; webContents: WebContents }) => void,
  ) {
    emitter.on(event, callback);
  }
}

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
// export const interruptTask = (taskQueue: TaskQueue, taskId: string) => {
//   const task = taskQueue.queryTask(taskId);
//   if (!task) return;

//   return (task as FFmpegTask).interrupt();
// };

const sendTaskNotify = (event: NotificationTaskStatus, taskId: string) => {
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
  const taskConfig = config?.notification?.task || {};

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
taskQueue.on("task-start", ({ taskId, webContents }) => {
  // sendTaskNotify("task-start", taskId);
  webContents.send("task-start", { taskId: taskId });
});
taskQueue.on("task-end", ({ taskId, webContents }) => {
  console.log("task-end", taskId);
  sendTaskNotify("success", taskId);
  webContents.send("task-end", { taskId: taskId, output: taskQueue.queryTask(taskId)?.output });
});
taskQueue.on("task-error", ({ taskId, webContents }) => {
  console.log("task-error", taskId);
  sendTaskNotify("failure", taskId);
  webContents.send("task-error", { taskId: taskId });
});
taskQueue.on("task-progress", ({ taskId, webContents }) => {
  webContents.send("task-progress", { taskId: taskId });
});

export const handlePauseTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return pauseTask(taskQueue, taskId);
};
export const handleResumeTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return resumeTask(taskQueue, taskId);
};
export const handleKillTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return killTask(taskQueue, taskId);
};
// export const hanldeInterruptTask = (_event: IpcMainInvokeEvent, taskId: string) => {
//   return interruptTask(taskQueue, taskId);
// };

export const handleListTask = () => {
  return taskQueue.stringify(taskQueue.list());
};
export const handleQueryTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (task) {
    return taskQueue.stringify([task])[0];
  } else {
    return null;
  }
};
export const handleStartTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return taskQueue.start(taskId);
};
export const handleRemoveTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return taskQueue.remove(taskId);
};

export const handlers = {
  "task:start": handleStartTask,
  "task:pause": handlePauseTask,
  "task:resume": handleResumeTask,
  // "task:interrupt": hanldeInterruptTask,
  "task:kill": handleKillTask,
  "task:list": handleListTask,
  "task:query": handleQueryTask,
  "task:remove": handleRemoveTask,
};
