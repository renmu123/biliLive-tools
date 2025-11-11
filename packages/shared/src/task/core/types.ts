/**
 * 任务事件类型定义
 */
export interface TaskEvents {
  "task-start": ({ taskId }: { taskId: string }) => void;
  "task-end": ({ taskId }: { taskId: string }) => void;
  "task-error": ({ taskId, error }: { taskId: string; error: string }) => void;
  "task-progress": ({ taskId }: { taskId: string }) => void;
  "task-pause": ({ taskId }: { taskId: string }) => void;
  "task-resume": ({ taskId }: { taskId: string }) => void;
  "task-cancel": ({ taskId }: { taskId: string; autoStart: boolean }) => void;
  "task-removed-queue": ({ taskId }: { taskId: string }) => void;
  [key: string]: (...args: any[]) => void;
}
