import type { NotificationTaskStatus } from "@biliLive-tools/types";

import { sendNotify } from "../../notify.js";
import { appConfig } from "../../config.js";
import { TaskType } from "../../enum.js";
import { TaskQueue } from "./TaskQueue.js";

/**
 * 全局任务队列实例
 */
export const taskQueue = new TaskQueue(appConfig);

/**
 * 发送任务通知
 */
export const sendTaskNotify = (event: NotificationTaskStatus, taskId: string): void => {
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
    case TaskType.sync:
      if (taskConfig.sync.includes(event)) {
        sendNotify(title, desp);
      }
      break;
  }
};

// 注册全局任务事件监听器
taskQueue.on("task-end", ({ taskId }) => {
  sendTaskNotify("success", taskId);
});
taskQueue.on("task-error", ({ taskId }) => {
  sendTaskNotify("failure", taskId);
});

/**
 * 暂停任务
 */
export const handlePauseTask = (taskId: string): void => {
  taskQueue.pasue(taskId);
};

/**
 * 恢复任务
 */
export const handleResumeTask = (taskId: string): void => {
  taskQueue.resume(taskId);
};

/**
 * 终止任务
 */
export const handleKillTask = (taskId: string): void => {
  taskQueue.cancel(taskId);
};

/**
 * 中断任务
 */
export const hanldeInterruptTask = (taskId: string): void => {
  taskQueue.interrupt(taskId);
};

/**
 * 获取所有任务列表
 */
export const handleListTask = () => {
  return taskQueue.stringify(taskQueue.list());
};

/**
 * 查询单个任务
 */
export const handleQueryTask = (taskId: string) => {
  const task = taskQueue.queryTask(taskId);
  if (task) {
    return taskQueue.stringify([task])[0];
  } else {
    return null;
  }
};

/**
 * 启动任务
 */
export const handleStartTask = (taskId: string): void => {
  taskQueue.start(taskId);
};

/**
 * 移除任务
 */
export const handleRemoveTask = (taskId: string): void => {
  taskQueue.remove(taskId);
};

/**
 * 重启任务
 */
export const handleRestartTask = (taskId: string): void => {
  taskQueue.restart(taskId);
};
