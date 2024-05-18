import {
  taskQueue,
  handleStartTask,
  handlePauseTask,
  handleResumeTask,
  handleKillTask,
  hanldeInterruptTask,
  handleListTask,
  handleRemoveTask,
  handleQueryTask,
} from "@biliLive-tools/shared/lib/task/task.js";
import type { IpcMainInvokeEvent } from "electron";
import { mainWin } from "./index";

taskQueue.on("task-start", ({ taskId }) => {
  mainWin.webContents.send("task-start", { taskId: taskId });
});
taskQueue.on("task-end", ({ taskId }) => {
  mainWin.webContents.send("task-end", {
    taskId: taskId,
    output: taskQueue.queryTask(taskId)?.output,
  });
});
taskQueue.on("task-error", ({ taskId }) => {
  mainWin.webContents.send("task-error", { taskId: taskId });
});
taskQueue.on("task-progress", ({ taskId }) => {
  mainWin.webContents.send("task-progress", { taskId: taskId });
});

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
