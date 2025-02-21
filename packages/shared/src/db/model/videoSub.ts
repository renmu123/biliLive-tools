import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseVideoSub = z.object({
  name: z.string(),
  platform: z.enum(["douyu", "huya"]), // "DouYu" | "HuYa"
  subId: z.string(),
  options: z.string(),
});

const VideoSub = BaseVideoSub.extend({
  id: z.number(),
  created_at: z.number().optional(),
});

export type BaseVideoSub = z.infer<typeof BaseVideoSub>;
export type VideoSub = z.infer<typeof VideoSub>;

class VideoSubModel extends BaseModel<BaseVideoSub> {
  table = "video_sub";

  constructor(db: Database) {
    super(db, "video-sub");
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 自增主键
        name TEXT NOT NULL,                             -- 名称
        sub_id TEXT NOT NULL,                          -- 主要id，用于查询订阅
        platform TEXT NOT NULL,                -- 平台，DouYu，HuYa
        options TEXT DEFAULT '{}',                     -- 其他配置
        created_at INTEGER DEFAULT (strftime('%s', 'now'))  -- 创建时间，时间戳，自动生成
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }
}

export default class VideoSubController {
  private model!: VideoSubModel;
  init(db: Database) {
    this.model = new VideoSubModel(db);
    this.model.createTable();
  }

  add(options: BaseVideoSub) {
    const data = BaseVideoSub.parse(options);
    return this.model.insert(data);
  }
  addMany(list: BaseVideoSub[]) {
    const filterList = list.map((item) => BaseVideoSub.parse(item));

    return this.model.insertMany(filterList);
  }
  list(options: Partial<VideoSub> = {}): VideoSub[] {
    const data = VideoSub.partial().parse(options);
    return this.model.list(data);
  }
  query(options: Partial<VideoSub>) {
    const data = VideoSub.partial().parse(options);
    return this.model.query(data);
  }
  upsert(options: { where: Partial<VideoSub & { id: number }>; create: BaseVideoSub }) {
    return this.model.upsert(options);
  }
  update(options: VideoSub) {
    const data = VideoSub.parse(options);
    return this.model.update(data);
  }

  delete(id: number) {
    return this.model.delete(id);
  }
}
