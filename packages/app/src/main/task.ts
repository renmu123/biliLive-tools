import {
  taskQueue,
  pauseTask,
  resumeTask,
  killTask,
  sendTaskNotify,
} from "@biliLive-tools/shared/lib/task/task.js";
import type { IpcMainInvokeEvent } from "electron";
import { mainWin } from "./index";

taskQueue.on("task-start", ({ taskId }) => {
  // sendTaskNotify("task-start", taskId);
  mainWin.webContents.send("task-start", { taskId: taskId });
});
taskQueue.on("task-end", ({ taskId }) => {
  console.log("task-end", taskId);
  sendTaskNotify("success", taskId);
  mainWin.webContents.send("task-end", {
    taskId: taskId,
    output: taskQueue.queryTask(taskId)?.output,
  });
});
taskQueue.on("task-error", ({ taskId }) => {
  console.log("task-error", taskId);
  sendTaskNotify("failure", taskId);
  mainWin.webContents.send("task-error", { taskId: taskId });
});
taskQueue.on("task-progress", ({ taskId }) => {
  mainWin.webContents.send("task-progress", { taskId: taskId });
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
