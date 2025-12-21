import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseStreamer = z.object({
  name: z.string(),
  platform: z.string(), // "Bilibili" | "DouYu" | "HuYa" | "unknown"
  room_id: z.string(),
});

const Streamer = BaseStreamer.extend({
  id: z.number(),
  created_at: z.number().optional(),
});

export type BaseStreamer = z.infer<typeof BaseStreamer>;
export type Streamer = z.infer<typeof Streamer>;

export default class StreamerModel extends BaseModel<BaseStreamer> {
  constructor({ db }: { db: Database }) {
    super(db, "streamer");
    this.createTable();
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 自增主键
        name TEXT NOT NULL,                             -- 主播名
        room_id TEXT NOT NULL,                          -- 房间id
        platform TEXT DEFAULT unknown,                -- 平台，bilibili，douyu，unknown
        created_at INTEGER DEFAULT (strftime('%s', 'now')),  -- 创建时间，时间戳，自动生成
        UNIQUE(platform, room_id)                           -- 唯一联合约束
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }

  add(options: BaseStreamer) {
    const data = BaseStreamer.parse(options);
    return this.insert(data);
  }

  addMany(list: BaseStreamer[]) {
    const filterList = list.map((item) => BaseStreamer.parse(item));
    return this.insertMany(filterList);
  }
}
