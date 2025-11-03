import { uuid } from "@biliLive-tools/shared/utils/index.js";

import type {
  Platform,
  Part as PartInterface,
  PickPartial,
  UploadStatus,
} from "../../types/webhook.js";

/**
 * Part 类 - 表示直播的一个分段
 */
export class Part implements PartInterface {
  partId: string;
  title: string;
  startTime?: number;
  endTime?: number;
  recordStatus: "recording" | "recorded" | "prehandled" | "handled";
  filePath: string;
  uploadStatus: UploadStatus;
  cover?: string;
  rawFilePath: string;
  rawUploadStatus: UploadStatus;

  constructor(
    options: PickPartial<
      PartInterface,
      "uploadStatus" | "rawUploadStatus" | "rawFilePath" | "partId"
    >,
  ) {
    this.partId = options.partId || uuid();
    this.title = options.title;
    this.startTime = options.startTime;
    this.endTime = options.endTime;
    this.recordStatus = options.recordStatus;
    this.filePath = options.filePath;
    this.uploadStatus = options.uploadStatus ?? "pending";
    this.cover = options.cover;
    this.rawFilePath = options.rawFilePath ?? options.filePath;
    this.rawUploadStatus = options.rawUploadStatus ?? "pending";
  }

  /**
   * 更新分段的某个字段值
   * @param key 要更新的字段名
   * @param value 新的字段值
   */
  updateValue<K extends keyof PartInterface>(key: K, value: PartInterface[K]): void {
    this[key] = value as any;
  }

  /**
   * 检查分段是否正在录制
   */
  isRecording(): boolean {
    return this.recordStatus === "recording";
  }

  /**
   * 检查分段是否已录制完成
   */
  isRecorded(): boolean {
    return (
      this.recordStatus === "recorded" ||
      this.recordStatus === "prehandled" ||
      this.recordStatus === "handled"
    );
  }

  /**
   * 检查分段是否已完全处理完成
   */
  isFullyHandled(): boolean {
    return this.recordStatus === "handled";
  }

  /**
   * 检查处理后的文件是否已上传
   */
  isUploaded(): boolean {
    return this.uploadStatus === "uploaded";
  }

  /**
   * 检查原始文件是否已上传
   */
  isRawUploaded(): boolean {
    return this.rawUploadStatus === "uploaded";
  }

  /**
   * 设置为录制完成状态
   */
  markAsRecorded(endTime?: number): void {
    this.recordStatus = "recorded";
    if (endTime !== undefined) {
      this.endTime = endTime;
    }
  }

  /**
   * 设置为预处理完成状态
   */
  markAsPrehandled(): void {
    this.recordStatus = "prehandled";
  }

  /**
   * 设置为完全处理完成状态
   */
  markAsHandled(): void {
    this.recordStatus = "handled";
  }

  /**
   * 更新上传状态
   */
  updateUploadStatus(status: UploadStatus, isRaw: boolean = false): void {
    if (isRaw) {
      this.rawUploadStatus = status;
    } else {
      this.uploadStatus = status;
    }
  }

  /**
   * 检查是否可以删除（已上传且已处理）
   */
  canBeDeleted(): boolean {
    return this.isFullyHandled() && this.isUploaded();
  }

  /**
   * 转换为普通对象（用于序列化）
   */
  toJSON(): PartInterface {
    return {
      partId: this.partId,
      title: this.title,
      startTime: this.startTime,
      endTime: this.endTime,
      recordStatus: this.recordStatus,
      filePath: this.filePath,
      uploadStatus: this.uploadStatus,
      cover: this.cover,
      rawFilePath: this.rawFilePath,
      rawUploadStatus: this.rawUploadStatus,
    };
  }
}

/**
 * Live 类 - 表示一场直播的数据
 */
export class Live {
  eventId: string;
  platform: Platform;
  startTime: number;
  roomId: string;
  // 直播标题
  title: string;
  // 主播名
  username: string;
  aid?: number;
  // 非弹幕版aid
  rawAid?: number;
  parts: Part[];

  constructor(options: {
    eventId?: string;
    platform: Platform;
    roomId: string;
    title: string;
    username: string;
    startTime: number;
    aid?: number;
    rawAid?: number;
  }) {
    this.eventId = options.eventId ?? uuid();
    this.platform = options.platform;
    this.roomId = options.roomId;
    this.startTime = options.startTime;
    this.title = options.title;
    this.username = options.username;
    this.aid = options.aid;
    this.rawAid = options.rawAid;
    this.parts = [];
  }

  /**
   * 添加一个分段
   * @param part 分段数据
   */
  addPart(
    part: PickPartial<PartInterface, "uploadStatus" | "rawUploadStatus" | "rawFilePath" | "partId">,
  ) {
    const newPart = new Part(part);
    this.parts.push(newPart);
  }

  /**
   * 更新分段的某个字段值
   * @param partId 分段ID
   * @param key 要更新的字段名
   * @param value 新的字段值
   */
  updatePartValue<K extends keyof PartInterface>(partId: string, key: K, value: PartInterface[K]) {
    const part = this.findPartById(partId);
    if (part) {
      part.updateValue(key, value);
    }
  }

  /**
   * 根据分段ID查找分段
   * @param partId 分段ID
   * @returns 找到的分段，如果没找到则返回 undefined
   */
  findPartById(partId: string): Part | undefined {
    return this.parts.find((p) => p.partId === partId);
  }

  /**
   * 根据文件路径查找分段
   * @param filePath 文件路径
   * @param type 查找类型：'handled' 查找处理后的文件，'raw' 查找原始文件
   * @returns 找到的分段，如果没找到则返回 undefined
   */
  findPartByFilePath(filePath: string, type: "raw" | "handled" = "handled"): Part | undefined {
    if (type === "handled") {
      return this.parts.find((part) => part.filePath === filePath);
    } else if (type === "raw") {
      return this.parts.find((part) => part.rawFilePath === filePath);
    } else {
      throw new Error("type error");
    }
  }

  /**
   * 移除指定的分段
   * @param partId 分段ID
   */
  removePart(partId: string): boolean {
    const partIndex = this.parts.findIndex((part) => part.partId === partId);
    if (partIndex !== -1) {
      this.parts.splice(partIndex, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取所有正在录制的分段
   */
  getRecordingParts(): Part[] {
    return this.parts.filter((part) => part.isRecording());
  }

  /**
   * 获取所有已录制完成的分段
   */
  getRecordedParts(): Part[] {
    return this.parts.filter((part) => part.isRecorded());
  }

  /**
   * 获取所有已完全处理完成的分段
   */
  getHandledParts(): Part[] {
    return this.parts.filter((part) => part.isFullyHandled());
  }

  /**
   * 检查是否有正在录制的分段
   */
  hasRecordingParts(): boolean {
    return this.parts.some((part) => part.isRecording());
  }

  /**
   * 检查是否所有分段都已处理完成
   */
  areAllPartsHandled(): boolean {
    return this.parts.length > 0 && this.parts.every((part) => part.isFullyHandled());
  }

  /**
   * 获取最后一个分段的结束时间
   */
  getLastPartEndTime(): number | undefined {
    if (this.parts.length === 0) return undefined;

    const endTimes = this.parts
      .map((part) => part.endTime)
      .filter((time): time is number => time !== undefined);

    return endTimes.length > 0 ? Math.max(...endTimes) : undefined;
  }

  /**
   * 转换为普通对象（用于序列化）
   */
  toJSON(): {
    eventId: string;
    platform: Platform;
    startTime: number;
    roomId: string;
    title: string;
    username: string;
    aid?: number;
    rawAid?: number;
    parts: PartInterface[];
  } {
    return {
      eventId: this.eventId,
      platform: this.platform,
      startTime: this.startTime,
      roomId: this.roomId,
      title: this.title,
      username: this.username,
      aid: this.aid,
      rawAid: this.rawAid,
      parts: this.parts.map((part) => part.toJSON()),
    };
  }
}

/**
 * LiveManager 类 - 管理多个 Live 实例
 */
export class LiveManager {
  private lives: Live[] = [];

  /**
   * 获取所有 Live 实例（用于向后兼容）
   */
  get liveData(): Live[] {
    return this.lives;
  }

  /**
   * 设置所有 Live 实例（用于向后兼容）
   */
  set liveData(lives: Live[]) {
    this.lives = lives;
  }

  /**
   * 添加一个 Live 实例
   * @param live Live 实例
   */
  addLive(live: Live): void {
    this.lives.push(live);
  }

  /**
   * 根据 eventId 查找 Live
   * @param eventId 事件ID
   * @returns 找到的 Live，如果没找到则返回 undefined
   */
  findLiveByEventId(eventId: string): Live | undefined {
    return this.lives.find((live) => live.eventId === eventId);
  }

  /**
   * 根据 eventId 查找 Live 的索引
   * @param eventId 事件ID
   * @returns Live 的索引，如果没找到则返回 -1
   */
  findLiveIndexByEventId(eventId: string): number {
    return this.lives.findIndex((live) => live.eventId === eventId);
  }

  /**
   * 根据文件路径查找 Live（通过处理后的文件路径）
   * @param filePath 文件路径
   * @returns 找到的 Live，如果没找到则返回 undefined
   */
  findLiveByFilePath(filePath: string): Live | undefined {
    return this.lives.find((live) => live.parts.some((part) => part.filePath === filePath));
  }

  /**
   * 根据条件查找 Live
   * @param predicate 查找条件函数
   * @returns 找到的 Live，如果没找到则返回 undefined
   */
  findLive(predicate: (live: Live) => boolean): Live | undefined {
    return this.lives.find(predicate);
  }

  /**
   * 从后向前查找 Live
   * @param predicate 查找条件函数
   * @returns 找到的 Live，如果没找到则返回 undefined
   */
  findLiveLast(predicate: (live: Live) => boolean): Live | undefined {
    return this.lives.findLast(predicate);
  }

  /**
   * 根据条件查找 Live 的索引
   * @param predicate 查找条件函数
   * @returns Live 的索引，如果没找到则返回 -1
   */
  findLiveIndex(predicate: (live: Live) => boolean): number {
    return this.lives.findIndex(predicate);
  }

  /**
   * 根据 eventId 移除 Live
   * @param eventId 事件ID
   * @returns 是否成功移除
   */
  removeLiveByEventId(eventId: string): boolean {
    const index = this.findLiveIndexByEventId(eventId);
    if (index !== -1) {
      this.lives.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 根据索引移除 Live
   * @param index 索引
   * @returns 是否成功移除
   */
  removeLiveByIndex(index: number): boolean {
    if (index >= 0 && index < this.lives.length) {
      this.lives.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 移除 Live 实例
   * @param live Live 实例
   * @returns 是否成功移除
   */
  removeLive(live: Live): boolean {
    const index = this.lives.indexOf(live);
    if (index !== -1) {
      this.lives.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取所有 Live 实例
   * @returns Live 实例数组
   */
  getAllLives(): Live[] {
    return this.lives;
  }

  /**
   * 获取 Live 数量
   * @returns Live 数量
   */
  getCount(): number {
    return this.lives.length;
  }

  /**
   * 清空所有 Live
   */
  clear(): void {
    this.lives = [];
  }

  /**
   * 根据索引获取 Live
   * @param index 索引
   * @returns Live 实例，如果索引无效则返回 undefined
   */
  getLiveByIndex(index: number): Live | undefined {
    if (index >= 0 && index < this.lives.length) {
      return this.lives[index];
    }
    return undefined;
  }

  /**
   * 根据房间ID和平台查找最近的 Live
   * @param roomId 房间ID
   * @param platform 平台
   * @param maxTimeDiffMinutes 最大时间差（分钟）
   * @param currentTime 当前时间戳
   * @returns 找到的 Live，如果没找到则返回 undefined
   */
  findRecentLive(
    roomId: string,
    platform: Platform,
    maxTimeDiffMinutes: number,
    currentTime: number,
  ): Live | undefined {
    return this.lives.find((live) => {
      if (live.roomId !== roomId || live.platform !== platform) {
        return false;
      }
      const endTime = live.getLastPartEndTime();
      if (endTime === undefined) {
        return false;
      }
      const timeDiff = (currentTime - endTime) / (1000 * 60);
      return timeDiff < maxTimeDiffMinutes;
    });
  }

  /**
   * 根据房间ID和平台查找最后一个 Live（不考虑时间）
   * @param roomId 房间ID
   * @param platform 平台
   * @returns 找到的 Live，如果没找到则返回 undefined
   */
  findLastLiveByRoomAndPlatform(roomId: string, platform: Platform): Live | undefined {
    return this.lives.findLast((live) => {
      const hasEndTime = live.parts.some((item) => item.endTime);
      if (hasEndTime) {
        return false;
      }
      return live.roomId === roomId && live.platform === platform;
    });
  }

  /**
   * 转换为普通对象数组（用于序列化）
   */
  toJSON(): ReturnType<Live["toJSON"]>[] {
    return this.lives.map((live) => live.toJSON());
  }
}
