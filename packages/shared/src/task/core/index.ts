/**
 * Task Core Module
 * 提供任务系统的核心抽象类、任务队列和辅助函数
 */

// 导出类型定义
export type { TaskEvents } from "./types.js";

// 导出抽象基类
export { AbstractTask } from "./AbstractTask.js";

// 导出任务队列
export { TaskQueue } from "./TaskQueue.js";

// 导出任务队列实例和辅助函数
export {
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
} from "./taskHelpers.js";
