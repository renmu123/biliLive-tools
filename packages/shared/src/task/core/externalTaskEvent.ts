import { TaskType } from "../../enum.js";
import { sendExternalEventRequest } from "../../utils/index.js";

import type { TaskQueue } from "./TaskQueue.js";
import type { TaskEvents } from "./types.js";

type TaskEventName = keyof Pick<
  TaskEvents,
  "task-start" | "task-end" | "task-error" | "task-pause" | "task-resume" | "task-cancel"
>;

type TaskEventPayloadMap = {
  [K in TaskEventName]: Parameters<TaskEvents[K]>[0];
};

type ExternalTaskStatus = "pending" | "running" | "paused" | "completed" | "error" | "cancelled";

const getExternalTaskStatus = (
  eventName: TaskEventName,
  status?: string,
): ExternalTaskStatus | undefined => {
  if (status === "pending") return "pending";
  if (status === "running") return "running";
  if (status === "paused") return "paused";
  if (status === "completed") return "completed";
  if (status === "error") return "error";
  if (status === "canceled") return "cancelled";

  if (eventName === "task-start" || eventName === "task-resume") {
    return "running";
  }
  if (eventName === "task-pause") return "paused";
  if (eventName === "task-end") return "completed";
  if (eventName === "task-error") return "error";
  if (eventName === "task-cancel") return "cancelled";
  return undefined;
};

const getExternalTaskType = (taskType?: string) => {
  if (taskType === TaskType.bili) {
    return TaskType.biliUpload;
  }
  return taskType;
};

const toISOString = (time?: number) => {
  if (!time) return undefined;
  return new Date(time).toISOString();
};

const isTerminalTaskEvent = (eventName: TaskEventName) => {
  return ["task-end", "task-error", "task-cancel"].includes(eventName);
};

export const sendExternalTaskEvent = async <T extends TaskEventName>(
  taskQueue: TaskQueue,
  eventName: T,
  payload: TaskEventPayloadMap[T],
) => {
  const task = taskQueue.queryTask(payload.taskId);
  const taskInfo = task ? taskQueue.stringify([task])[0] : undefined;
  const eventTime = Date.now();
  const startedTime = taskInfo?.startTime || (eventName === "task-start" ? eventTime : undefined);
  const endedTime = taskInfo?.endTime || (isTerminalTaskEvent(eventName) ? eventTime : undefined);
  const durationMs =
    taskInfo?.duration ??
    (startedTime && endedTime ? Math.max(endedTime - startedTime, 0) : undefined);

  await sendExternalEventRequest("task", {
    event: eventName,
    taskId: payload.taskId,
    taskType: getExternalTaskType(taskInfo?.type),
    status: getExternalTaskStatus(eventName, taskInfo?.status),
    message: taskInfo?.custsomProgressMsg || undefined,
    error: "error" in payload ? payload.error : taskInfo?.error || undefined,
    startedAt: toISOString(startedTime),
    endedAt: toISOString(endedTime),
    durationMs,
    extra: taskInfo?.extra,
  });
};
