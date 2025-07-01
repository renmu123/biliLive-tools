import { z } from "zod";
import BaseModel from "./baseModel.js";
import logger from "../../utils/log.js";

import type { Database } from "better-sqlite3";

const BaseLive = z.object({
  streamer_id: z.number(),
  live_start_time: z.number().optional(),
  record_start_time: z.number(),
  title: z.string(),
  record_end_time: z.number().optional(),
  video_file: z.string().optional(),
  // 视频持续时长，支持为空，浮点数
  video_duration: z.number().optional(),
  // 弹幕数量
  danma_num: z.number().optional(),
  // 互动人数
  interact_num: z.number().optional(),
});

const Live = BaseLive.extend({
  id: z.number(),
  created_at: z.number().optional(),
});

export type BaseLive = z.infer<typeof BaseLive>;

export type Live = z.infer<typeof Live>;

class LiveModel extends BaseModel<BaseLive> {
  table = "record_history";

  constructor(db: Database) {
    super(db, "record_history");
  }

  async createTable() {
    const createTableSQL = `  
      CREATE TABLE IF NOT EXISTS record_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,                -- 自增主键
        created_at INTEGER DEFAULT (strftime('%s', 'now')),  -- 创建时间，时间戳，自动生成
        streamer_id INTEGER NOT NULL,                        -- 主播id
        live_start_time INTEGER NOT NULL,                    -- 直播开始时间，秒时间戳
        record_start_time INTEGER NOT NULL,                  -- 录制开始时间，秒时间戳
        record_end_time INTEGER,                             -- 录制结束时间，秒时间戳
        title TEXT,                                          -- 直播标题
        video_file TEXT,                                     -- 视频文件路径
        video_duration REAL,                                 -- 视频持续时长，浮点数，秒
        danma_num INTEGER,                                   -- 弹幕数量
        interact_num INTEGER,                                 -- 互动人数
        FOREIGN KEY (streamer_id) REFERENCES streamer(id)    -- 外键约束
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }

  migrate() {
    try {
      // 检查表中是否存在各个字段
      const columns = this.db.prepare(`PRAGMA table_info(${this.tableName})`).all();
      // @ts-ignore
      const hasVideoDurationColumn = columns.some((col) => col.name === "video_duration");
      // @ts-ignore
      const hasDanmaNumColumn = columns.some((col) => col.name === "danma_num");
      // @ts-ignore
      const hasInteractNumColumn = columns.some((col) => col.name === "interact_num");

      if (!hasVideoDurationColumn) {
        // 添加video_duration列
        this.db.prepare(`ALTER TABLE ${this.tableName} ADD COLUMN video_duration REAL`).run();
        logger.info(`已为${this.tableName}表添加video_duration列`);
      }

      if (!hasDanmaNumColumn) {
        // 添加danma_num列
        this.db.prepare(`ALTER TABLE ${this.tableName} ADD COLUMN danma_num INTEGER`).run();
        logger.info(`已为${this.tableName}表添加danma_num列`);
      }

      if (!hasInteractNumColumn) {
        // 添加interactNum列
        this.db.prepare(`ALTER TABLE ${this.tableName} ADD COLUMN interact_num INTEGER`).run();
        logger.info(`已为${this.tableName}表添加interactNum列`);
      }

      return true;
    } catch (error) {
      logger.error(`迁移${this.tableName}表失败:`, error);
      return false;
    }
  }
}

export default class LiveController {
  private model!: LiveModel;
  init(db: Database) {
    console.log("init live");
    this.model = new LiveModel(db);
    this.model.createTable();
    this.model.migrate();
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
  /**
   * 批量删除录制历史记录
   * @param streamerId 主播ID
   * @returns 删除的记录数量
   */
  removeRecordsByStreamerId(streamerId: number): number {
    const sql = `DELETE FROM ${this.model.tableName} WHERE streamer_id = ?`;
    const stmt = this.model.db.prepare(sql);
    const result = stmt.run(streamerId);

    return result.changes;
  }
}
