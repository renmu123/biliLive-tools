import path from "node:path";
import fs from "fs-extra";
import EventEmitter from "node:events";
import { TypedEmitter } from "tiny-typed-emitter";
// @ts-ignore
import * as ntsuspend from "ntsuspend";
import kill from "tree-kill";

import { isWin32, calculateFileQuickHash, retryWithAxiosError } from "../utils/index.js";
import log from "../utils/log.js";
import { addMediaApi, editMediaApi } from "./bili.js";
import { TaskType } from "../enum.js";
import { SyncClient } from "../sync/index.js";
import { uploadPartService } from "../db/index.js";
import { Pan123 } from "../sync/index.js";
import { statisticsService } from "../db/index.js";
import { SpeedCalculator } from "../utils/speedCalculator.js";
import { appConfig } from "../config.js";
import { AbstractTask } from "./core/index.js";

import type { TaskEvents } from "./core/index.js";
import type ffmpeg from "@renmu/fluent-ffmpeg";
import type { Client, WebVideoUploader } from "@renmu/bili-api";
import type { Progress, BiliupConfig } from "@biliLive-tools/types";
import type M3U8Downloader from "@renmu/m3u8-downloader";
import type { DanmakuFactory } from "../danmu/danmakuFactory.js";
import type { FlvCommand } from "./flvRepair.js";

// 重新导出 AbstractTask 以保持向后兼容
export { AbstractTask } from "./core/index.js";

export class DanmuTask extends AbstractTask {
  danmu: DanmakuFactory;
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
    danmu: DanmakuFactory,
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
      })
      .catch((err) => {
        this.status = "error";
        this.callback.onError && this.callback.onError(err);
        this.error = err;
        this.emitter.emit("task-error", { taskId: this.taskId, error: err });
      })
      .finally(() => {
        this.endTime = Date.now();
      });
  }
  pause() {
    return false;
  }
  resume() {
    return false;
  }
  kill() {
    if (this.status === "completed" || this.status === "error" || this.status === "canceled")
      return;
    log.warn(`danmu task ${this.taskId} killed`);
    this.status = "canceled";
    if (this.danmu?.child?.pid) {
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
      limitTime?: [] | [string, string];
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
    this.limitTime = options.limitTime;
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
      }
      this.endTime = Date.now();
    });
    command.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(String(err));
      this.error = String(err);
      this.emitter.emit("task-error", { taskId: this.taskId, error: String(err) });
      this.endTime = Date.now();
    });
    command.on("progress", (progress) => {
      // @ts-ignore
      progress.percentage = progress.percent;
      // console.log("progress", progress);
      if (callback.onProgress) {
        // @ts-ignore
        progress = callback.onProgress(progress);
      }
      // @ts-ignore
      this.custsomProgressMsg = `比特率: ${progress.currentKbps}kbits/s   速率: ${progress.speed}`;
      // @ts-ignore
      this.progress = progress.percentage || 0;
      this.emitter.emit("task-progress", { taskId: this.taskId });
    });
  }
  exec() {
    if (this.status !== "pending") console.warn("ffmpeg task is not pending when exec");

    this.status = "running";
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
    this.emitter.emit("task-pause", { taskId: this.taskId });
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
    this.emitter.emit("task-resume", { taskId: this.taskId });
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
    if (this.status === "completed" || this.status === "error" || this.status === "canceled")
      return;
    if (isWin32) {
      // @ts-ignore
      ntsuspend.resume(this.command.ffmpegProc.pid);
    }
    this.command.kill("SIGKILL");
    log.warn(`task ${this.taskId} killed`);
    // 不需要额外触发error事件，因为ffmpeg会触发error事件，ffmpeg没有取消事件
    this.status = "error";
    return true;
  }
}

type WithoutPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * B站视频上传任务
 */
export class BiliPartVideoTask extends AbstractTask {
  command: WebVideoUploader;
  type = TaskType.biliUpload;
  callback: {
    onStart?: () => void;
    onEnd?: (output: { cid: number; filename: string; title: string }) => void;
    onError?: (err: string) => void;
    onProgress?: (progress: number) => number;
  };
  useUploadPartPersistence: boolean;
  completedPart: { cid: number; filename: string; title: string } | null = null;
  private speedCalculator: SpeedCalculator;
  uid: number;
  constructor(
    command: WebVideoUploader,
    options: {
      name: string;
      pid: string;
      limitTime: [] | [string, string];
      uid: number;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: { cid: number; filename: string; title: string }) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: number) => number;
    },
  ) {
    super();
    this.command = command;
    this.progress = 0;
    this.action = ["kill", "pause"];
    this.limitTime = options.limitTime;
    this.callback = callback;
    this.speedCalculator = new SpeedCalculator(3000); // 3秒时间窗口
    this.uid = options.uid;
    if (options.name) {
      this.name = options.name;
    }
    this.pid = options.pid;
    this.extra = {
      title: this?.command?.title,
    };
    this.useUploadPartPersistence = appConfig.get("biliUpload")?.useUploadPartPersistence;

    command.emitter.on(
      "completed",
      async (data: { cid: number; filename: string; title: string }) => {
        log.info(`task ${this.taskId} end`, data);
        this.status = "completed";
        this.progress = 100;

        if (this.useUploadPartPersistence) {
          try {
            const fileHash = await calculateFileQuickHash(this.command.filePath);
            const fileSize = await fs.stat(this.command.filePath).then((stat) => stat.size);
            uploadPartService.addOrUpdate({
              file_hash: fileHash,
              file_size: fileSize,
              cid: data.cid,
              filename: data.filename,
              uid: String(this.uid),
            });
          } catch (error) {
            log.error(`task ${this.taskId} error: ${error}`);
          }
        }

        this.completedPart = data;
        this.endTime = Date.now();
        // 重置进度追踪
        this.speedCalculator.reset();
        callback.onEnd && callback.onEnd(data);
        this.emitter.emit("task-end", { taskId: this.taskId });
      },
    );
    command.emitter.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";
      this.error = String(err);

      // 重置进度追踪
      this.speedCalculator.reset();
      callback.onError && callback.onError(this.error);
      this.emitter.emit("task-error", { taskId: this.taskId, error: this.error });
      this.endTime = Date.now();
    });

    command.emitter.on("progress", (event) => {
      let progress = event.progress * 100;
      this.progress = progress;

      // 计算上传速度
      if (event.data && event.data.loaded !== undefined) {
        const currentTime = Date.now();
        const speed = this.speedCalculator.calculateSpeed(event.data.loaded, currentTime);
        this.custsomProgressMsg = `速度: ${speed}`;
      }

      callback.onProgress && callback.onProgress(progress);
      this.emitter.emit("task-progress", { taskId: this.taskId });
    });
  }

  async exec() {
    if (this.status !== "pending") return;
    this.status = "running";
    this.startTime = Date.now();
    this.emitter.emit("task-start", { taskId: this.taskId });

    // 初始化上传计时
    this.speedCalculator.init(this.startTime);

    // 处理上传分p持久化
    if (this.useUploadPartPersistence) {
      try {
        const fileHash = await calculateFileQuickHash(this.command.filePath);
        const fileSize = await fs.stat(this.command.filePath).then((stat) => stat.size);
        const part = uploadPartService.findValidPartByHash(fileHash, fileSize, String(this.uid));
        if (part) {
          this.status = "completed";
          this.progress = 100;
          this.completedPart = {
            cid: part.cid,
            filename: part.filename,
            title: this.command.title,
          };
          this.endTime = Date.now();
          // 重置进度追踪
          this.speedCalculator.reset();
          this.callback.onEnd && this.callback.onEnd(this.completedPart);
          this.emitter.emit("task-end", { taskId: this.taskId });
          return;
        }
      } catch (error) {
        log.error(`task ${this.taskId} error: ${error}`);
      }
    }

    this.status = "running";
    this.startTime = Date.now();
    this.emitter.emit("task-start", { taskId: this.taskId });
    this.command.upload();
  }
  pause() {
    if (this.status !== "running") return;

    this.command.pause();
    log.warn(`task ${this.taskId} paused`);
    this.status = "paused";
    this.emitter.emit("task-pause", { taskId: this.taskId });
    return true;
  }
  resume() {
    if (this.status !== "paused") return;
    this.command.start();
    log.warn(`task ${this.taskId} resumed`);
    this.status = "running";
    this.emitter.emit("task-resume", { taskId: this.taskId });
    return true;
  }
  kill(triggerAutoStart = true) {
    if (this.status === "completed" || this.status === "error" || this.status === "canceled")
      return;
    log.warn(`task ${this.taskId} killed`);
    this.status = "canceled";
    this.command.cancel();
    // 重置进度追踪
    this.speedCalculator.reset();
    this.emit("task-cancel", { taskId: this.taskId, autoStart: triggerAutoStart });
    this.endTime = Date.now();
    return true;
  }
}

/**
 * B站视频提交任务
 */
export class BiliVideoTask extends AbstractTask {
  taskList: BiliPartVideoTask[] = [];
  type = TaskType.bili;
  completedTask: number = 0;
  uid: number;
  rawName: string = "";
  lastUpdateTimeKey: string = "";
  callback: {
    onStart?: () => void;
    onEnd?: (output: { aid: number; bvid: string }) => void;
    onError?: (err: string) => void;
    onProgress?: (progress: number) => any;
  };
  constructor(
    options: {
      name: string;
      uid: number;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: { aid: number; bvid: string }) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: number) => any;
    },
  ) {
    super();
    this.progress = 0;
    this.action = ["kill"];
    if (options.name) {
      this.name = options.name;
      this.rawName = options.name;
    }
    this.callback = callback;

    this.status = "running";
    this.startTime = Date.now();
    this.uid = options.uid;
    this.lastUpdateTimeKey = `bili_last_upload_time_${this.uid}`;
    this.emitter.emit("task-start", { taskId: this.taskId });
  }
  addTask(task: BiliPartVideoTask) {
    this.taskList.push(task);

    task.on("task-end", async () => {
      // console.log("completed", this.completedTask);
      this.completedTask++;

      if (this.completedTask === this.taskList.length) {
        this.emit("completed");
        // this.submit();
      }
    });
    task.on("task-cancel", ({ taskId }) => {
      this.removeTask(taskId);
    });
    task.on("task-error", ({ taskId }) => {
      console.log("task-error", taskId);
      const submitWhenError = false;
      if (submitWhenError) {
        // 在有上传失败的情况下，仍继续提交
      } else {
        this.cancelAllTask();
        this.status = "error";
        this.emit("task-error", { taskId: this.taskId, error: "上传失败" });
      }
      // this.removeTask(taskId);
    });
    task.on("task-removed-queue", ({ taskId }) => {
      this.removeTask(taskId);
    });
  }
  removeTask(taskId: string) {
    const task = this.taskList.find((task) => task.taskId === taskId);
    if (!task) return;
    const index = this.taskList.indexOf(task);
    if (index !== -1) {
      this.taskList.splice(index, 1);
    }
    if (this.taskList.length === 0) {
      this.status = "error";
      this.emit("task-error", { taskId: this.taskId, error: "上传失败" });
    }
    // if (this.taskList.length >= this.completedTask) {
    //   this.emit("completed");
    // }
  }

  exec() {
    // this.command.run();
  }
  pause() {
    if (this.status !== "running") return;
    return true;
  }
  resume() {
    if (this.status !== "paused") return;
    return true;
  }
  cancelAllTask() {
    const taskIds = this.taskList.map((task) => task.taskId);
    for (const taskId of taskIds) {
      const task = this.taskList.find((task) => task.taskId === taskId);
      if (task) {
        task.kill(false);
      }
    }
  }
  kill() {
    if (this.status === "completed" || this.status === "error" || this.status === "canceled")
      return;
    this.cancelAllTask();

    log.warn(`task ${this.taskId} canceled`);
    this.status = "canceled";
    this.emit("task-cancel", { taskId: this.taskId, autoStart: true });
    return true;
  }
}

/**
 * B站视频上传提交任务
 */
export class BiliAddVideoTask extends BiliVideoTask {
  mediaOptions: BiliupConfig;

  constructor(
    options: {
      name: string;
      uid: number;
      mediaOptions: BiliupConfig;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: { aid: number; bvid: string }) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: number) => any;
    },
  ) {
    super(options, callback);
    this.mediaOptions = options.mediaOptions;

    this.on("completed", () => {
      this.submit();
    });
  }
  async submit() {
    // 检查投稿最短间隔
    const config = appConfig.getAll();
    const minUploadInterval = config?.biliUpload?.minUploadInterval || 0;

    if (minUploadInterval > 0) {
      const lastUploadTime = statisticsService.query(this.lastUpdateTimeKey);
      if (lastUploadTime) {
        const lastTime = parseInt(lastUploadTime.value);
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTime;
        const requiredInterval = minUploadInterval * 60 * 1000; // 转换为毫秒

        if (timeDiff < requiredInterval) {
          const remainingTime = requiredInterval - timeDiff;
          const waitMinutes = Math.ceil(remainingTime / (60 * 1000));
          log.info(
            `${this.rawName} 投稿间隔不足，还需等待 ${waitMinutes} 分钟，将在1分钟后重试提交`,
          );

          // 更新任务状态显示
          this.name = `${this.rawName}（等待投稿间隔，还需 ${waitMinutes} 分钟）`;

          // 1分钟后重试
          setTimeout(() => {
            if (this.status === "running") {
              this.submit();
            }
          }, 60 * 1000);
          return;
        }
      }
    }

    // 清除等待消息
    this.name = this.rawName;

    const parts = this.taskList
      .filter((task) => task.status === "completed")
      .map((task) => {
        return task.completedPart;
      })
      .filter((part) => part !== null);
    if (parts.length === 0) return;
    try {
      const data = await retryWithAxiosError(
        () => addMediaApi(this.uid, parts, this.mediaOptions),
        5,
      );
      this.status = "completed";
      this.progress = 100;
      this.callback.onEnd && this.callback.onEnd(data);
      this.output = String(data.aid);
      this.emitter.emit("task-end", { taskId: this.taskId });
      uploadPartService.removeByCids(parts.map((part) => part.cid));
      statisticsService.addOrUpdate({
        where: { stat_key: this.lastUpdateTimeKey },
        create: {
          stat_key: this.lastUpdateTimeKey,
          value: Date.now().toString(),
        },
      });
    } catch (err) {
      log.error("上传失败", String(err), err);
      this.status = "error";
      this.error = String(err);
      this.callback.onError && this.callback.onError(this.error);
      this.emitter.emit("task-error", { taskId: this.taskId, error: this.error });
    }
    this.endTime = Date.now();
  }
}

/**
 * B站视频编辑提交任务
 */
export class BiliEditVideoTask extends BiliVideoTask {
  aid: number;
  mediaOptions: BiliupConfig;
  constructor(
    options: {
      name: string;
      uid: number;
      mediaOptions: BiliupConfig;
      aid: number;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: { aid: number; bvid: string }) => void;
      onError?: (err: string) => void;
      onProgress?: (progress: number) => any;
    },
  ) {
    super(options, callback);
    this.aid = options.aid;
    this.mediaOptions = options.mediaOptions;

    this.on("completed", () => {
      this.submit();
    });
  }
  async submit() {
    // 检查投稿最短间隔
    const config = appConfig.getAll();
    const minUploadInterval = config?.biliUpload?.minUploadInterval || 0;

    if (minUploadInterval > 0) {
      const lastUploadTime = statisticsService.query(this.lastUpdateTimeKey);
      if (lastUploadTime) {
        const lastTime = parseInt(lastUploadTime.value);
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTime;
        const requiredInterval = minUploadInterval * 60 * 1000; // 转换为毫秒

        if (timeDiff < requiredInterval) {
          const remainingTime = requiredInterval - timeDiff;
          const waitMinutes = Math.ceil(remainingTime / (60 * 1000));
          log.info(
            `${this.rawName} 编辑间隔不足，还需等待 ${waitMinutes} 分钟，将在1分钟后重试提交`,
          );

          // 更新任务状态显示
          this.name = `${this.rawName}（等待投稿间隔，还需 ${waitMinutes} 分钟）`;

          // 1分钟后重试
          setTimeout(() => {
            if (this.status === "running") {
              this.submit();
            }
          }, 60 * 1000);
          return;
        }
      }
    }

    // 清除等待消息
    this.name = this.rawName;

    const parts = this.taskList
      .filter((task) => task.status === "completed")
      .map((task) => {
        return task.completedPart;
      })
      .filter((part) => part !== null);
    if (parts.length === 0) {
      log.error("没有上传成功的视频");
      return;
    }
    try {
      const data = await retryWithAxiosError(
        () => editMediaApi(this.uid, this.aid, parts, this.mediaOptions),
        5,
      );
      this.status = "completed";
      this.progress = 100;
      this.callback.onEnd && this.callback.onEnd(data);
      this.output = String(data.aid);
      this.emitter.emit("task-end", { taskId: this.taskId });
      uploadPartService.removeByCids(parts.map((part) => part.cid));
      statisticsService.addOrUpdate({
        where: { stat_key: this.lastUpdateTimeKey },
        create: {
          stat_key: this.lastUpdateTimeKey,
          value: Date.now().toString(),
        },
      });
    } catch (err) {
      log.error("编辑失败", String(err), err);
      this.status = "error";
      this.error = String(err);
      this.callback.onError && this.callback.onError(this.error);
      this.emitter.emit("task-error", { taskId: this.taskId, error: this.error });
    }
    this.endTime = Date.now();
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
      this.endTime = Date.now();
    });
    let progressHistory: { size: number; time: number }[] = [];
    command.emitter.on("progress", (event: any) => {
      if (event.event === "download") {
        const progress = event.progress.progress * 100;
        this.progress = progress;
        const nowSize = event.progress.loaded;
        const nowTime = Date.now();

        progressHistory.push({ size: nowSize, time: nowTime });
        if (progressHistory.length > 4) {
          progressHistory.shift();
        }

        if (progressHistory.length > 1) {
          const first = progressHistory[0];
          const last = progressHistory[progressHistory.length - 1];
          const sizeDistance = last.size - first.size;
          const timeDistance = (last.time - first.time) / 1000;

          if (timeDistance > 0) {
            this.custsomProgressMsg = `速度: ${(sizeDistance / 1024 / 1024 / timeDistance).toFixed(2)}MB/s`;
          }
        }

        callback.onProgress && callback.onProgress(progress);
        this.emitter.emit("task-progress", { taskId: this.taskId });
      }
    });
  }
  exec() {
    if (this.status !== "pending") return;
    this.status = "running";
    this.command.start();
    this.startTime = Date.now();
    this.emitter.emit("task-start", { taskId: this.taskId });
  }
  pause() {
    if (this.status !== "running") return;
    this.command.pause();
    log.warn(`task ${this.taskId} paused`);
    this.status = "paused";
    this.emitter.emit("task-pause", { taskId: this.taskId });
    return true;
  }
  resume() {
    if (this.status !== "paused") return;
    this.command.start();
    log.warn(`task ${this.taskId} resumed`);
    this.status = "running";
    this.emitter.emit("task-resume", { taskId: this.taskId });
    return true;
  }
  kill() {
    if (this.status === "completed" || this.status === "error" || this.status === "canceled")
      return;
    log.warn(`task ${this.taskId} killed`);
    this.endTime = Date.now();
    this.status = "canceled";
    this.command.cancel();
    this.emit("task-cancel", { taskId: this.taskId, autoStart: true });
    return true;
  }
}

/**
 * m3u8下载任务
 */
export class M3U8DownloadTask extends AbstractTask {
  command: M3U8Downloader;
  type = TaskType.m3u8Download;
  constructor(
    command: M3U8Downloader,
    options: {
      name: string;
    },
    callback: {
      onStart?: () => void;
      onEnd?: (output: string) => void | Promise<void>;
      onError?: (err: string) => void;
      onProgress?: (progress: number) => any;
    } = {},
  ) {
    super();
    this.command = command;
    this.progress = 0;
    this.action = ["kill", "pause"];

    if (options.name) {
      this.name = options.name;
    }

    command.on("completed", async () => {
      const output = this.command.output;
      log.info(`task ${this.taskId} end`);
      this.status = "completed";
      this.progress = 100;
      this.output = output;
      callback.onEnd && (await callback.onEnd(output));
      this.emitter.emit("task-end", { taskId: this.taskId });
      this.endTime = Date.now();
    });
    command.on("error", (err) => {
      log.error(`task ${this.taskId} error: ${err}`);
      this.status = "error";

      callback.onError && callback.onError(err);
      this.error = err;
      this.emitter.emit("task-error", { taskId: this.taskId, error: err });
      this.endTime = Date.now();
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
    this.emitter.emit("task-pause", { taskId: this.taskId });
    return true;
  }
  resume() {
    if (this.status !== "paused") return;
    this.command.resume();
    log.warn(`task ${this.taskId} resumed`);
    this.status = "running";
    this.emitter.emit("task-resume", { taskId: this.taskId });
    return true;
  }
  kill() {
    if (this.status === "completed" || this.status === "error" || this.status === "canceled")
      return;
    log.warn(`task ${this.taskId} killed`);
    this.status = "canceled";
    this.command.cancel();
    this.emit("task-cancel", { taskId: this.taskId, autoStart: true });
    return true;
  }
}

/**
 * 斗鱼录播下载任务
 */
export class DouyuDownloadVideoTask extends M3U8DownloadTask {
  type = TaskType.douyuDownload;
}

/**
 * 虎牙录播下载任务
 */
export class HuyaDownloadVideoTask extends M3U8DownloadTask {
  type = TaskType.huyaDownload;
}

/**
 * B站录播下载任务
 */
export class BilibiliLiveDownloadVideoTask extends M3U8DownloadTask {
  type = TaskType.biliDownload;
}

/**
 * 快手录播下载任务
 */
export class KuaishouDownloadVideoTask extends M3U8DownloadTask {
  type = TaskType.kuaishouDownload;
}

/**
 * 同步任务
 */
export class SyncTask extends AbstractTask {
  instance: SyncClient;
  input: string;
  options: any;
  type = TaskType.sync;
  callback: {
    onStart?: () => void;
    onEnd?: (output: string) => void;
    onError?: (err: string) => void;
    onProgress?: (progress: Progress) => any;
  };
  constructor(
    instance: SyncClient,
    options: {
      input: string;
      output: string;
      options?: {
        retry?: number;
        policy?: "fail" | "newcopy" | "overwrite" | "skip" | "rsync";
      };
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
    this.instance = instance;
    this.input = options.input;
    this.options = options.options;
    this.output = options.output;
    this.progress = 0;
    if (options.name) {
      this.name = options.name;
    }
    this.action = ["kill", "restart"];
    this.callback = callback || {};

    if (this.instance && this.instance instanceof Pan123) {
      // 123网盘不支持重试任务
      this.action = ["kill"];
    }
    // @ts-expect-error
    this.instance.on("progress", (progress: any) => {
      // console.log("sync progress", progress);
      callback?.onProgress && callback.onProgress(progress.percentage);
      this.progress = progress.percentage;
      this.custsomProgressMsg = `速度: ${progress.speed}`;
    });
  }
  exec() {
    this.callback.onStart && this.callback.onStart();
    this.status = "running";
    this.progress = 0;
    this.emitter.emit("task-start", { taskId: this.taskId });
    this.startTime = Date.now();
    this.instance
      .uploadFile(this.input, this.output, {
        retry: this?.options?.retry,
        policy: this?.options?.policy,
      })
      .then(() => {
        this.status = "completed";
        this.callback.onEnd && this.callback.onEnd(this.output as string);
        this.progress = 100;
        this.emitter.emit("task-end", { taskId: this.taskId });
      })
      .catch((err) => {
        console.log("upload error", err);
        this.status = "error";
        this.callback.onError && this.callback.onError(err);
        this.error = err;
        this.emitter.emit("task-error", { taskId: this.taskId, error: err });
      })
      .finally(() => {
        this.endTime = Date.now();
      });
  }
  restart() {
    if (this.status !== "error") return;
    this.error = undefined;
    this.exec();
  }
  pause() {
    return false;
  }
  resume() {
    return false;
  }
  kill() {
    if (this.status === "completed" || this.status === "error" || this.status === "canceled")
      return;
    log.warn(`danmu task ${this.taskId} killed`);
    this.status = "canceled";
    this.instance.cancelUpload();
    return true;
  }
}

/**
 * flv修复任务
 */
export class FlvRepairTask extends AbstractTask {
  instance: FlvCommand;
  input: string;
  output: string;
  trueOutput: string;
  type = TaskType.flvRepair;
  callback: {
    onStart?: () => void;
    onEnd?: (output: string) => void;
    onError?: (err: string) => void;
    onProgress?: (progress: Progress) => any;
  };
  constructor(
    instance: FlvCommand,
    options: {
      input: string;
      output: string;
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
    this.instance = instance;
    this.input = options.input;
    this.progress = 0;
    if (options.name) {
      this.name = options.name;
    }
    this.action = ["kill"];
    this.callback = callback || {};
    const { dir } = path.parse(options.output);
    this.output = dir;
    this.trueOutput = options.output;

    this.instance.on("progress", (progress: any) => {
      callback?.onProgress && callback.onProgress(progress.percentage);
      this.progress = progress.percentage;
      // this.custsomProgressMsg = `速度: ${progress.speed}`;
    });
    this.instance.on("completed", () => {
      this.status = "completed";
      this.progress = 100;
      this.callback.onEnd && this.callback.onEnd(this.trueOutput as string);
      this.emitter.emit("task-end", { taskId: this.taskId });
      this.endTime = Date.now();
    });
    this.instance.on("error", (err: string) => {
      this.status = "error";
      this.callback.onError && this.callback.onError(err);
      this.error = err;
      this.emitter.emit("task-error", { taskId: this.taskId, error: err });
      this.endTime = Date.now();
    });
  }
  exec() {
    this.callback.onStart && this.callback.onStart();
    this.status = "running";
    this.progress = 0;
    this.emitter.emit("task-start", { taskId: this.taskId });
    this.startTime = Date.now();
    this.instance.run(this.input, this.trueOutput);
    log.info(`$${this.instance._getArguments().join(" ")} for flv repair task ${this.taskId}`);
    // .then(() => {
    //   this.status = "completed";
    //   this.callback.onEnd && this.callback.onEnd(this.output as string);
    //   this.progress = 100;
    //   this.emitter.emit("task-end", { taskId: this.taskId });
    // })
    // .catch((err) => {
    //   console.log("upload error", err);
    //   this.status = "error";
    //   this.callback.onError && this.callback.onError(err);
    //   this.error = err;
    //   this.emitter.emit("task-error", { taskId: this.taskId, error: err });
    // })
    // .finally(() => {
    //   this.endTime = Date.now();
    // });
  }
  restart() {
    // do nothing
    return false;
  }
  pause() {
    return false;
  }
  resume() {
    return false;
  }
  kill() {
    if (this.status === "completed" || this.status === "error" || this.status === "canceled")
      return;
    log.warn(`danmu task ${this.taskId} killed`);
    this.status = "canceled";
    this.instance.kill();
    return true;
  }
}

// 重新导出 TaskQueue 和辅助函数以保持向后兼容
export {
  TaskQueue,
  taskQueue,
  sendTaskNotify,
  handlePauseTask,
  handleResumeTask,
  handleKillTask,
  hanldeInterruptTask,
  handleListTask,
  handleQueryTask,
  handleStartTask,
  handleRemoveTask,
  handleRestartTask,
} from "./core/index.js";
