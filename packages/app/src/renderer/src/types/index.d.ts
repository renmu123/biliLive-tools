import type { Status } from "@biliLive-tools/types";
import { TaskType } from "@biliLive-tools/shared/enum.js";

export interface Task {
  pid?: string;
  taskId: string;
  name: string;
  status: Status;
  type: TaskType;
  output?: any;
  progress: number;
  action: ("pause" | "kill" | "interrupt")[];
  startTime?: number;
  endTime?: number;
  custsomProgressMsg?: string;
  error?: string;
  children?: Task[];
  duration: number;
}
