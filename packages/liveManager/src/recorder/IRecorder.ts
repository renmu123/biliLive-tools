import { EventEmitter } from "node:events";

import type { FormatName } from "./index.js";

/**
 * 录制器构造函数选项的基础接口
 */
export interface BaseRecorderOptions {
  url: string;
  getSavePath: (data: { startTime: number; title?: string }) => string;
  segment: number;
  inputOptions?: string[];
  disableDanma?: boolean;
  formatName: FormatName;
  debugLevel?: "none" | "basic" | "verbose";
  headers?: {
    [key: string]: string | undefined;
  };
  videoFormat?: "auto" | "ts" | "mkv" | "mp4";
}

/**
 * 录制器接口定义
 */
export interface IRecorder extends EventEmitter {
  // 基础属性
  readonly hasSegment: boolean;
  readonly segment: number;
  readonly inputOptions: string[];
  readonly disableDanma: boolean;
  readonly url: string;
  readonly headers: { [key: string]: string | undefined } | undefined;
  readonly getSavePath: (data: { startTime: number; title?: string }) => string;

  // 核心方法
  run(): void;
  stop(): Promise<void>;
  getArguments(): string[];
  getExtraDataController(): any;
  createCommand(): any;

  // 事件类型定义
  on(
    event: "videoFileCreated",
    listener: (data: { filename: string; cover?: string; rawFilename?: string }) => void,
  ): this;
  on(event: "videoFileCompleted", listener: (data: { filename: string }) => void): this;
  on(event: "DebugLog", listener: (data: { type: string; text: string }) => void): this;
  on(event: "progress", listener: (info: any) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;

  emit(
    event: "videoFileCreated",
    data: { filename: string; cover?: string; rawFilename?: string },
  ): boolean;
  emit(event: "videoFileCompleted", data: { filename: string }): boolean;
  emit(event: "DebugLog", data: { type: string; text: string }): boolean;
  emit(event: "progress", info: any): boolean;
  emit(event: string, ...args: any[]): boolean;
}

/**
 * FFMPEG录制器特定选项
 */
export interface FFMPEGRecorderOptions extends BaseRecorderOptions {
  outputOptions: string[];
}

/**
 * Mesio录制器特定选项
 */
export interface MesioRecorderOptions extends BaseRecorderOptions {
  outputOptions?: string[];
}

/**
 * Bililive录制器特定选项
 */
export interface BililiveRecorderOptions extends BaseRecorderOptions {
  outputOptions?: string[];
}
