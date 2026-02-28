import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseVideoSub = z.object({
  name: z.string(),
  platform: z.enum(["douyu", "huya"]),
  subId: z.string(),
  options: z.string(),
  enable: z.union([z.literal(0), z.literal(1)]).default(1),
  lastRunTime: z.number().default(0),
  roomId: z.string(),
});

const VideoSub = BaseVideoSub.extend({
  id: z.number(),
  created_at: z.number().optional(),
});

export type BaseVideoSub = z.infer<typeof BaseVideoSub>;
export type VideoSub = z.infer<typeof VideoSub>;

interface Options {
  danma: boolean;
  sendWebhook: boolean;
  quality: string;
}

export interface VideoSubItem extends Omit<VideoSub, "options" | "enable"> {
  options: Options;
  enable: boolean;
}

export interface AddVideoSub extends Omit<BaseVideoSub, "options" | "lastRunTime" | "enable"> {
  enable: boolean;
  options: Options;
}

export interface UpdateVideoSub extends Omit<BaseVideoSub, "options" | "enable"> {
  id: number;
  enable: boolean;
  options: Options;
}

const bool2num = (bool: boolean) => (bool ? 1 : 0);

export default class VideoSubModel extends BaseModel<VideoSub> {
  constructor({ db }: { db: Database }) {
    super(db, "video_sub");
    this.createTable();
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 自增主键
        name TEXT NOT NULL,                             -- 名称
        subId TEXT NOT NULL,                            -- 主要id，用于查询订阅
        platform TEXT NOT NULL,                         -- 平台，douyu，huya
        enable INTEGER DEFAULT 1,                       -- 是否启用
        lastRunTime INTEGER DEFAULT 0,                  -- 上次运行时间
        roomId TEXT NOT NULL,                           -- 房间id
        options TEXT DEFAULT '{}',                      -- 其他配置
        created_at INTEGER DEFAULT (strftime('%s', 'now'))  -- 创建时间，时间戳，自动生成
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }

  add(data: AddVideoSub) {
    return this.insert({
      name: data.name,
      enable: bool2num(data.enable),
      platform: data.platform,
      subId: data.subId,
      roomId: data.roomId,
      lastRunTime: 0,
      options: JSON.stringify(data.options),
    });
  }

  updateVideoSub(data: UpdateVideoSub) {
    return this.update({
      id: data.id,
      name: data.name,
      enable: bool2num(data.enable),
      options: JSON.stringify(data.options),
    });
  }

  updateLastRunTime(data: { id: number; lastRunTime: number }) {
    return this.update(data);
  }

  deleteById(id: number) {
    return this.deleteBy("id", id);
  }
}
