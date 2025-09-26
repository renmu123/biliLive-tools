import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseVideoSub = z.object({
  subId: z.string(),
  platform: z.enum(["douyu", "huya"]),
  videoId: z.string(),
  // 是否完成，占位
  completed: z.union([z.literal(0), z.literal(1)]).default(1),
  // 重试次数，占位
  retry: z.number().default(0),
});

export type BaseVideoSub = z.infer<typeof BaseVideoSub>;
type AddOptions = Omit<BaseVideoSub, "id" | "created_at">;

class VideoSubDataModel extends BaseModel<BaseVideoSub> {
  table = "video_sub_data";

  constructor(db: Database) {
    super(db, "video_sub_data");
  }

  createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
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
}

export default class VideoSubDataController {
  private model!: VideoSubDataModel;
  init(db: Database) {
    this.model = new VideoSubDataModel(db);
    this.model.createTable();
  }

  add(options: AddOptions) {
    const data = BaseVideoSub.parse(options);
    return this.model.insert(data);
  }
  list(options: { platform: "douyu" | "huya"; subId: string }) {
    return this.model.list(options);
  }
}
