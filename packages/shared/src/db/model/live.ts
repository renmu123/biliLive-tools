import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseLive = z.object({
  streamer_id: z.number(),
  start_time: z.number(),
  title: z.string(),
  end_time: z.number().optional(),
  danmu_file: z.string().optional(),
  video_file: z.string().optional(),
});

const Live = BaseLive.extend({
  id: z.number(),
  created_at: z.number().optional(),
});

export type BaseLive = z.infer<typeof BaseLive>;

export type Live = z.infer<typeof Live>;

class LiveModel extends BaseModel<BaseLive> {
  table = "live";

  constructor(db: Database) {
    super(db, "live");
  }

  async createTable() {
    const createTableSQL = `  
      CREATE TABLE IF NOT EXISTS live (
        id INTEGER PRIMARY KEY AUTOINCREMENT,                -- 自增主键
        created_at INTEGER DEFAULT (strftime('%s', 'now')),  -- 创建时间，时间戳，自动生成
        streamer_id INTEGER NOT NULL,                        -- 主播id
        start_time INTEGER NOT NULL,                         -- 直播开始时间，秒时间戳
        end_time INTEGER,                                    -- 直播结束时间，秒时间戳
        title TEXT,                                          -- 直播标题
        danmu_file TEXT,                                     -- 弹幕文件路径
        video_file TEXT,                                     -- 视频文件路径
        FOREIGN KEY (streamer_id) REFERENCES streamer(id)    -- 外键约束
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }
}

export default class LiveController {
  private model!: LiveModel;
  init(db: Database) {
    console.log("init live");
    this.model = new LiveModel(db);
    this.model.createTable();
  }

  add(options: BaseLive) {
    const data = BaseLive.parse(options);
    return this.model.insert(data);
  }
  addMany(list: BaseLive[]) {
    const filterList = list.map((item) => BaseLive.parse(item));

    return this.model.insertMany(filterList);
  }
  list(options: Partial<Live>): Live[] {
    const data = Live.partial().parse(options);
    return this.model.list(data);
  }
  query(options: Partial<Live>) {
    const data = Live.partial().parse(options);
    return this.model.query(data);
  }
  upsert(options: { where: Partial<Live & { id: number }>; create: BaseLive }) {
    return this.model.upsert(options);
  }
  update(options: Partial<Live & { id: number }>) {
    const data = Live.partial()
      .required({
        id: true,
      })
      .parse(options);
    return this.model.update(data);
  }
}
