import { TypedEmitter } from "tiny-typed-emitter";
import { isBetweenTimeRange } from "../../utils/index.js";
import { TaskType } from "../../enum.js";

import type { Status } from "@biliLive-tools/types";
import type { AppConfig } from "../../config.js";
import type { AbstractTask } from "./AbstractTask.js";
import type { TaskEvents } from "./types.js";

/**
 * 任务队列管理类
 */
export class TaskQueue {
  appConfig: AppConfig;
  queue: AbstractTask[];
  emitter = new TypedEmitter<TaskEvents>();
  on: TypedEmitter<TaskEvents>["on"];
  off: TypedEmitter<TaskEvents>["off"];

  constructor(appConfig: AppConfig) {
    this.queue = [];
    this.appConfig = appConfig;
    this.on = this.emitter.on.bind(this.emitter);
    this.off = this.emitter.off.bind(this.emitter);
    this.on("task-end", () => {
      this.addTaskForLimit();
    });
    this.on("task-error", () => {
      this.addTaskForLimit();
    });
    this.on("task-pause", () => {
      this.addTaskForLimit();
    });
    this.on("task-cancel", ({ autoStart }) => {
      if (autoStart) this.addTaskForLimit();
    });

    setInterval(() => {
      // @ts-ignore
      const isVitest = process.env.NODE_ENV === "test";
      if (isVitest) return;
      this.addTaskForLimit();
    }, 1000 * 60);
  }

  /**
   * 运行任务，考虑任务限制和时间范围
   */
  runTask(task: AbstractTask): void {
    const typeMap: Record<string, string> = {
      [TaskType.ffmpeg]: "ffmpegMaxNum",
      [TaskType.douyuDownload]: "douyuDownloadMaxNum",
      [TaskType.biliUpload]: "biliUploadMaxNum",
      [TaskType.biliDownload]: "biliDownloadMaxNum",
      [TaskType.sync]: "syncMaxNum",
    };
    const config = this.appConfig.getAll();
    const maxNum = config?.task?.[typeMap[task.type]] ?? 0;
    if (maxNum >= 0) {
      this.filter({ type: task.type, status: "running" }).length < maxNum &&
        isBetweenTimeRange(task.limitTime) &&
        task.exec();
    } else {
      isBetweenTimeRange(task.limitTime) && task.exec();
    }
  }

  /**
   * 添加任务到队列
   * @param task 任务实例
   * @param autoRun 是否自动运行（true: 立即执行, false: 根据任务限制决定）
   */
  addTask(task: AbstractTask, autoRun = true): void {
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
    task.emitter.on("task-pause", ({ taskId }) => {
      this.emitter.emit("task-pause", { taskId });
    });
    task.emitter.on("task-resume", ({ taskId }) => {
      this.emitter.emit("task-resume", { taskId });
    });
    task.emitter.on("task-cancel", ({ taskId, autoStart }) => {
      this.emitter.emit("task-cancel", { taskId, autoStart });
    });

    this.queue.push(task);

    if (autoRun) {
      task.exec();
    } else {
      this.runTask(task);
    }
  }

  /**
   * 查询任务
   */
  queryTask(taskId: string): AbstractTask | undefined {
    const task = this.queue.find((task) => task.taskId === taskId);
    return task;
  }

  /**
   * 将任务序列化为可传输对象
   */
  stringify(item: AbstractTask[]) {
    return item.map((task) => {
      return {
        pid: task.pid,
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
        error: task.error ? String(task.error) : "",
        duration: task.getDuration(),
        extra: task.extra,
      };
    });
  }

  /**
   * 过滤任务
   */
  filter(options: { type?: string; status?: Status }): AbstractTask[] {
    return this.queue.filter((task) => {
      if (options.type && task.type !== options.type) return false;
      if (options.status && task.status !== options.status) return false;
      return true;
    });
  }

  /**
   * 获取所有任务
   */
  list(): AbstractTask[] {
    return this.queue;
  }

  /**
   * 启动任务
   */
  start(taskId: string): void {
    const task = this.queryTask(taskId);
    if (!task) return;
    if (task.status !== "pending") return;
    task.exec();
  }

  /**
   * 移除任务
   */
  remove(taskId: string): void {
    const task = this.queryTask(taskId);
    if (!task) return;
    const index = this.queue.indexOf(task);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
    task.emit("task-removed-queue", { taskId: task.taskId });
  }

  /**
   * 暂停任务
   */
  pasue(taskId: string): void {
    const task = this.queryTask(taskId);
    if (!task) return;
    task.pause();
    task.pauseStartTime = Date.now();
  }

  /**
   * 恢复任务
   */
  resume(taskId: string): void {
    const task = this.queryTask(taskId);
    if (!task) return;
    task.resume();
    // if (task.pauseStartTime !== null) {
    //   task.totalPausedDuration += Date.now() - task.pauseStartTime;
    //   task.pauseStartTime = null;
    // }
  }

  /**
   * 取消任务
   */
  cancel(taskId: string): void {
    const task = this.queryTask(taskId);
    if (!task) return;
    task.kill();
  }

  /**
   * 重启任务
   */
  restart(taskId: string): void {
    const task = this.queryTask(taskId);
    if (!task) return;
    if (task.action.includes("restart")) {
      // @ts-ignore
      task.restart();
    }
  }

  /**
   * 中断任务
   */
  interrupt(taskId: string): void {
    const task = this.queryTask(taskId);
    if (!task) return;
    if (task.action.includes("interrupt")) {
      // @ts-ignore
      return task.interrupt();
    }
    return;
  }

  /**
   * 根据任务类型限制并发数
   */
  private taskLimit(maxNum: number, type: string): void {
    const pendingFFmpegTask = this.filter({ type: type, status: "pending" }).filter((task) => {
      return isBetweenTimeRange(task.limitTime);
    });
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
    } else {
      // TODO: 补充单元测试
      pendingFFmpegTask.forEach((task) => {
        task.exec();
      });
    }
  }

  /**
   * 根据配置限制各类型任务的并发数
   */
  private addTaskForLimit = (): void => {
    const config = this.appConfig.getAll();

    // ffmpeg任务
    this.taskLimit(config?.task?.ffmpegMaxNum ?? -1, TaskType.ffmpeg);
    // 斗鱼录播下载任务
    this.taskLimit(config?.task?.douyuDownloadMaxNum ?? -1, TaskType.douyuDownload);
    // B站上传任务
    this.taskLimit(config?.task?.biliUploadMaxNum ?? -1, TaskType.biliUpload);
    // B站下载任务
    this.taskLimit(config?.task?.biliDownloadMaxNum ?? -1, TaskType.biliDownload);
    // 同步任务
    this.taskLimit(config?.task?.syncMaxNum ?? 3, TaskType.sync);
  };
}
