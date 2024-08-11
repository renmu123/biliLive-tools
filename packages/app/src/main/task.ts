import {
  handleStartTask,
  handlePauseTask,
  handleResumeTask,
  handleKillTask,
  hanldeInterruptTask,
  handleListTask,
  handleRemoveTask,
  handleQueryTask,
} from "@biliLive-tools/shared/task/task.js";
import type { IpcMainInvokeEvent } from "electron";

export const handlers = {
  "task:start": (_event: IpcMainInvokeEvent, taskId: string) => {
    return handleStartTask(taskId);
  },
  "task:pause": (_event: IpcMainInvokeEvent, taskId: string) => {
    return handlePauseTask(taskId);
  },
  "task:resume": (_event: IpcMainInvokeEvent, taskId: string) => {
    return handleResumeTask(taskId);
  },
  "task:interrupt": (_event: IpcMainInvokeEvent, taskId: string) => {
    return hanldeInterruptTask(taskId);
  },
  "task:kill": (_event: IpcMainInvokeEvent, taskId: string) => {
    return handleKillTask(taskId);
  },
  "task:list": () => {
    return handleListTask();
  },
  "task:query": (_event: IpcMainInvokeEvent, taskId: string) => {
    return handleQueryTask(taskId);
  },
  "task:remove": (_event: IpcMainInvokeEvent, taskId: string) => {
    return handleRemoveTask(taskId);
  },
};
