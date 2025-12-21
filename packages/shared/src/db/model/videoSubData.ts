import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseVideoSubData = z.object({
  subId: z.string(),
  platform: z.enum(["douyu", "huya"]),
  videoId: z.string(),
  // 是否完成，占位
  completed: z.union([z.literal(0), z.literal(1)]).default(1),
  // 重试次数，占位
  retry: z.number().default(0),
});

const VideoSubData = BaseVideoSubData.extend({
  id: z.number(),
  created_at: z.number(),
});

export type BaseVideoSubData = z.infer<typeof BaseVideoSubData>;
export type VideoSubData = z.infer<typeof VideoSubData>;

export default class VideoSubDataModel extends BaseModel<BaseVideoSubData> {
  constructor({ db }: { db: Database }) {
    super(db, "video_sub_data");
    this.createTable();
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 自增主键
        subId TEXT NOT NULL,                            -- 主要id，用于查询订阅
        platform TEXT NOT NULL,                         -- 平台，douyu，huya
        videoId TEXT NOT NULL,                          -- 视频id
        completed INTEGER DEFAULT 1,                  -- 是否完成
        retry INTEGER DEFAULT 0,                        -- 重试次数
        created_at INTEGER DEFAULT (strftime('%s', 'now'))  -- 创建时间，时间戳，自动生成
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }

  add(options: BaseVideoSubData) {
    const data = BaseVideoSubData.parse(options);
    return this.insert(data);
  }

  deleteById(id: number) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    return this.db.prepare(sql).run(id);
  }
}
