export type Platform = "bili-recorder" | "blrec" | "ddtv" | "custom";
export type PickPartial<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Partial<Pick<T, K>>;
export type UploadStatus = "pending" | "uploading" | "uploaded" | "error";
export type OpenEvent = "FileOpening";
export type CloseEvent = "FileClosed";
export type ErrorEvent = "FileError";

export interface Part {
  partId: string;
  title: string;
  startTime?: number;
  endTime?: number;
  // 录制状态, recording: 正在录制, recorded: 已录制, prehandled: 已处理完转码, handled: 已全部处理完成
  recordStatus: "recording" | "recorded" | "prehandled" | "handled";
  // 处理后的文件路径，可能是弹幕版的
  filePath: string;
  // 处理后的文件路径上传状态
  uploadStatus: UploadStatus;
  cover?: string; // 封面
  // 原始文件路径
  rawFilePath: string;
  // 原始文件路径上传状态
  rawUploadStatus: UploadStatus;
}

export interface Options {
  event: OpenEvent | CloseEvent | ErrorEvent;
  filePath: string;
  roomId: number;
  time: string;
  username: string;
  title: string;
  coverPath?: string;
  danmuPath?: string;
  platform: Platform;
}

export interface CustomEvent {
  /** 如果你想使用断播续传功能，请在上一个`FileClosed`事件后在时间间隔内发送`FileOpening`事件 */
  event: OpenEvent | CloseEvent;
  /** 视频文件的绝对路径 */
  filePath: string;
  /** 房间号，用于断播续传需要 */
  roomId: number;
  /** 用于标题格式化的时间，示例："2021-05-14T17:52:54.946" */
  time: string;
  /** 标题，用于格式化视频标题 */
  title: string;
  /** 主播名称，用于格式化视频标题 */
  username: string;
  /** 封面路径 */
  coverPath?: string;
  /** 弹幕路径 */
  danmuPath?: string;
}
