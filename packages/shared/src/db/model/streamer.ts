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

class StreamerModel extends BaseModel<BaseStreamer> {
  table = "streamer";

  constructor(db: Database) {
    super(db, "streamer");
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 自增主键
        name TEXT NOT NULL,                             -- 主播名
        room_id TEXT NOT NULL,                          -- 房间id
        platform TEXT DEFAULT unknown,                -- 平台，bilibili，douyu，unknown
        created_at INTEGER DEFAULT (strftime('%s', 'now')),  -- 创建时间，时间戳，自动生成
        UNIQUE(name, room_id)                           -- 唯一联合约束
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }
}

export default class StreamerController {
  private model!: StreamerModel;
  init(db: Database) {
    this.model = new StreamerModel(db);
    this.model.createTable();
  }

  add(options: BaseStreamer) {
    const data = BaseStreamer.parse(options);
    return this.model.insert(data);
  }
  addMany(list: BaseStreamer[]) {
    const filterList = list.map((item) => BaseStreamer.parse(item));

    return this.model.insertMany(filterList);
  }
  list(options: Partial<Streamer>): Streamer[] {
    const data = Streamer.partial().parse(options);
    return this.model.list(data);
  }
  query(options: Partial<Streamer>) {
    const data = Streamer.partial().parse(options);
    return this.model.query(data);
  }
  upsert(options: { where: Partial<Streamer & { id: number }>; create: BaseStreamer }) {
    return this.model.upsert(options);
  }
}
