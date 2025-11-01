import type { Platform, Part, PickPartial } from "../../types/webhook.js";

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
    eventId: string;
    platform: Platform;
    roomId: string;
    title: string;
    username: string;
    startTime: number;
    aid?: number;
    rawAid?: number;
  }) {
    this.eventId = options.eventId;
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
  addPart(part: PickPartial<Part, "uploadStatus" | "rawUploadStatus" | "rawFilePath">) {
    const defaultPart: Pick<Part, "uploadStatus" | "rawUploadStatus" | "rawFilePath"> = {
      uploadStatus: "pending",
      rawUploadStatus: "pending",
      rawFilePath: part.filePath,
    };
    this.parts.push({
      ...defaultPart,
      ...part,
    });
  }

  /**
   * 更新分段的某个字段值
   * @param partId 分段ID
   * @param key 要更新的字段名
   * @param value 新的字段值
   */
  updatePartValue<K extends keyof Part>(partId: string, key: K, value: Part[K]) {
    const part = this.parts.find((p) => p.partId === partId);
    if (part) {
      part[key] = value;
    }
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
  removePart(partId: string) {
    const partIndex = this.parts.findIndex((part) => part.partId === partId);
    if (partIndex !== -1) {
      this.parts.splice(partIndex, 1);
    }
  }
}
