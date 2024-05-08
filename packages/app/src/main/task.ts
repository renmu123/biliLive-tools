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

export const handlers = {
  "task:start": (_event: IpcMainInvokeEvent, taskId: string) => {
    return taskQueue.start(taskId);
  },
  "task:pause": (_event: IpcMainInvokeEvent, taskId: string) => {
    return pauseTask(taskQueue, taskId);
  },
  "task:resume": (_event: IpcMainInvokeEvent, taskId: string) => {
    return resumeTask(taskQueue, taskId);
  },
  // "task:interrupt": hanldeInterruptTask,
  "task:kill": (_event: IpcMainInvokeEvent, taskId: string) => {
    return killTask(taskQueue, taskId);
  },
  "task:list": () => {
    return taskQueue.stringify(taskQueue.list());
  },
  "task:query": (_event: IpcMainInvokeEvent, taskId: string) => {
    const task = taskQueue.queryTask(taskId);
    if (task) {
      return taskQueue.stringify([task])[0];
    } else {
      return null;
    }
  },
  "task:remove": (_event: IpcMainInvokeEvent, taskId: string) => {
    return taskQueue.remove(taskId);
  },
};
