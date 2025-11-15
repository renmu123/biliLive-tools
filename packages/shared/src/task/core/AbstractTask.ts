import { TypedEmitter } from "tiny-typed-emitter";
import type { Status } from "@biliLive-tools/types";

import { uuid } from "../../utils/index.js";
import type { TaskEvents } from "./types.js";

/**
 * 任务抽象基类
 * 所有任务类型都应继承此类
 */
export abstract class AbstractTask {
  taskId: string;
  pid?: string;
  status: Status;
  name: string;
  relTaskId?: string;
  output?: string;
  progress: number;
  custsomProgressMsg: string;
  action: ("pause" | "kill" | "interrupt" | "restart")[];
  startTime: number = 0;
  endTime?: number;
  error?: string;
  pauseStartTime: number | null = 0;
  totalPausedDuration: number = 0;
  emitter = new TypedEmitter<TaskEvents>();
  limitTime?: [] | [string, string];
  extra?: Record<string, any>;
  on: TypedEmitter<TaskEvents>["on"];
  emit: TypedEmitter<TaskEvents>["emit"];

  abstract type: string;
  abstract exec(): void;
  abstract kill(): void;
  abstract pause(): void;
  abstract resume(): void;

  constructor() {
    this.taskId = uuid();
    this.status = "pending";
    this.name = this.taskId;
    this.progress = 0;
    this.action = ["pause", "kill"];
    this.custsomProgressMsg = "";
    this.on = this.emitter.on.bind(this.emitter);
    this.emit = this.emitter.emit.bind(this.emitter);
  }

  /**
   * 获取任务持续时间
   * @returns 持续时间（毫秒）
   */
  getDuration(): number {
    if (this.status === "pending") return 0;
    const now = Date.now();
    const currentTime = this.endTime || now;
    return Math.max(currentTime - this.startTime, 0);
  }
}
