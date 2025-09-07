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

class VideoSubModel extends BaseModel<z.infer<typeof VideoSub>> {
  table = "video_sub";

  constructor(db: Database) {
    super(db, "video_sub");
  }

  createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
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

  // migrate() {
  //   try {
  //     // 检查表中是否存在enable列
  //     const columns = this.db.prepare(`PRAGMA table_info(${this.table})`).all();
  //     // @ts-ignore
  //     const hasEnableColumn = columns.some((col) => col.name === "enable");

  //     if (!hasEnableColumn) {
  //       // 添加enable列
  //       this.db.prepare(`ALTER TABLE ${this.table} ADD COLUMN enable INTEGER DEFAULT 1`).run();
  //       console.log(`已为${this.table}表添加enable列`);
  //     }
  //     return true;
  //   } catch (error) {
  //     console.error(`迁移${this.table}表失败:`, error);
  //     return false;
  //   }
  // }
}

interface Options {
  danma: boolean;
  sendWebhook: boolean;
  quality: string;
}

export type VideoSub = z.infer<typeof VideoSub>;

export interface VideoSubItem extends Omit<VideoSub, "options" | "enable"> {
  options: Options;
  enable: boolean;
}
interface AddVideoSub extends Omit<BaseVideoSub, "options" | "lastRunTime" | "enable"> {
  enable: boolean;
  options: Options;
}
interface UpdateVideoSub extends Omit<BaseVideoSub, "options" | "enable"> {
  id: number;
  enable: boolean;
  options: Options;
}

export default class VideoSubController {
  private model!: VideoSubModel;
  init(db: Database) {
    this.model = new VideoSubModel(db);
    this.model.createTable();
    // this.model.migrate();
  }

  add(data: AddVideoSub) {
    // const data = BaseVideoSub.parse(options);
    // return this.model.insert(data);
    return this.model.insert({
      name: data.name,
      enable: bool2num(data.enable),
      platform: data.platform,
      subId: data.subId,
      roomId: data.roomId,
      lastRunTime: 0,
      options: JSON.stringify(data.options),
    });
  }
  list(options: Partial<VideoSub> = {}): VideoSubItem[] {
    const data = VideoSub.partial().parse(options);
    return this.model.list(data).map((item) => {
      return {
        ...item,
        enable: !!item.enable,
        options: JSON.parse(item.options),
      };
    });
  }

  query(options: Partial<VideoSub>) {
    const data = VideoSub.partial().parse(options);
    const item = this.model.query(data);
    if (!item) return null;
    return {
      ...item,
      enable: !!item.enable,
      options: JSON.parse(item.options),
    };
  }
  // upsert(options: { where: Partial<VideoSub & { id: number }>; create: BaseVideoSub }) {
  //   return this.model.upsert(options);
  // }
  update(data: UpdateVideoSub) {
    // const data = UpdateVideoSub.parse(options);
    return this.model.update({
      id: data.id,
      name: data.name,
      enable: bool2num(data.enable),
      options: JSON.stringify(data.options),
    });
  }
  updateLastRunTime(data: { id: number; lastRunTime: number }) {
    return this.model.update(data);
  }

  delete(id: number) {
    return this.model.deleteBy("id", id);
  }
}

const bool2num = (bool: boolean) => (bool ? 1 : 0);
