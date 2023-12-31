import EventEmitter from "events";

import { uuid, isWin32 } from "./utils/index";
import log from "./utils/log";
import ntsuspend from "ntsuspend";
import { Danmu } from "../core/index";

import type { WebContents, IpcMainInvokeEvent } from "electron";
import type { Progress } from "../types";
import type ffmpeg from "fluent-ffmpeg";
import type { Client } from "@renmu/bili-api";

const emitter = new EventEmitter();

abstract class AbstractTask {
  taskId: string;
  status: "pending" | "running" | "paused" | "completed" | "error";
  name: string;
  relTaskId?: string;
  output?: string;
  progress: number;
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
  }
}

export class DanmuTask extends AbstractTask {
  webContents: WebContents;
  danmu: Danmu;
  input: string;
  options: any;
  type = "danmu";
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
      onProgress?: (progress: Progress) => any;
    },
  ) {
    super();
    this.command = command;
    this.webContents = webContents;
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
      emitter.emit("task-start", { taskId: this.taskId, webContents: this.webContents });
      this.startTime = Date.now();
    });
    command.on("end", async () => {
      log.info(`task ${this.taskId} end`);
      this.status = "completed";
      this.progress = 100;

      callback.onEnd && callback.onEnd(options.output);
      emitter.emit("task-end", { taskId: this.taskId, webContents: this.webContents });
      this.endTime = Date.now();
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
  interrupt() {
    if (this.status === "completed" || this.status === "error") return;
    // @ts-ignore
    this.command.ffmpegProc.stdin.write("q");
    log.warn(`task ${this.taskId} interrupt`);
    this.status = "error";
    return true;
  }
  kill() {
    if (this.status === "completed" || this.status === "error") return;
    // @ts-ignore
    this.command.ffmpegProc.stdin.write("q");
    log.warn(`task ${this.taskId} killed`);
    this.status = "error";
    this.command.kill("SIGKILL");
    return true;
  }
}

type WithoutPromise<T> = T extends Promise<infer U> ? U : T;

export class BiliVideoTask extends AbstractTask {
  command: WithoutPromise<ReturnType<Client["platform"]["addMedia"]>>;
  webContents: WebContents;
  type = "bili";
  constructor(
    command: WithoutPromise<ReturnType<Client["platform"]["addMedia"]>>,
    webContents: WebContents,
    options: {
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
      console.log("ppppppppppppppppp", data);
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
    command.emitter.on("progress", (progress) => {
      progress.percentage = progress.progress * 100;

      if (callback.onProgress) {
        progress = callback.onProgress(progress);
      }
      this.progress = progress.percentage || 0;
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
  interrupt() {
    if (this.status === "completed" || this.status === "error") return;
    log.warn(`task ${this.taskId} interrupt`);
    this.status = "error";
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
export const interruptTask = (taskQueue: TaskQueue, taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (!task) return;

  return (task as FFmpegTask).interrupt();
};

export const taskQueue = new TaskQueue();
taskQueue.on("task-start", ({ taskId, webContents }) => {
  webContents.send("task-start", { taskId: taskId });
});
taskQueue.on("task-end", ({ taskId, webContents }) => {
  webContents.send("task-end", { taskId: taskId, output: taskQueue.queryTask(taskId)?.output });
});
taskQueue.on("task-error", ({ taskId, webContents }) => {
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
export const hanldeInterruptTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return interruptTask(taskQueue, taskId);
};

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
  "task:interrupt": hanldeInterruptTask,
  "task:kill": handleKillTask,
  "task:list": handleListTask,
  "task:query": handleQueryTask,
  "task:remove": handleRemoveTask,
};
