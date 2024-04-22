import {
  taskQueue,
  pauseTask,
  resumeTask,
  killTask,
  sendTaskNotify,
} from "@biliLive-tools/shared/lib/task/task.js";
import type { IpcMainInvokeEvent } from "electron";

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
