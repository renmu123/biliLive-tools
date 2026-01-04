import { z } from "zod";
import BaseModel from "./baseModel.js";
import logger from "../../utils/log.js";

import type { Database } from "better-sqlite3";

const BaseLiveHistory = z.object({
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
  // 直播id
  live_id: z.string().optional(),
});

const LiveHistory = BaseLiveHistory.extend({
  id: z.number(),
  created_at: z.number().optional(),
});

export type BaseLiveHistory = z.infer<typeof BaseLiveHistory>;
export type LiveHistory = z.infer<typeof LiveHistory>;

export default class RecordHistoryModel extends BaseModel<LiveHistory> {
  table = "record_history";

  constructor({ db }: { db: Database }) {
    super(db, "record_history");
    this.createTable();
    this.migrate();
    this.createIndexes();
  }

  async createTable() {
    const createTableSQL = `  
      CREATE TABLE IF NOT EXISTS record_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,                -- 自增主键
        created_at INTEGER DEFAULT (strftime('%s', 'now')),  -- 创建时间，时间戳，自动生成
        streamer_id INTEGER NOT NULL,                        -- 主播id
        live_id TEXT,                                       -- 直播id
        live_start_time INTEGER NOT NULL,                    -- 直播开始时间，秒时间戳
        record_start_time INTEGER NOT NULL,                  -- 视频录制开始时间，秒时间戳
        record_end_time INTEGER,                             -- 视频录制结束时间，秒时间戳
        title TEXT,                                          -- 直播标题
        video_file TEXT,                                     -- 视频文件路径
        video_duration REAL,                                 -- 视频持续时长，浮点数，秒
        danma_num INTEGER,                                   -- 弹幕数量
        interact_num INTEGER,                                 -- 互动人数
        FOREIGN KEY (streamer_id) REFERENCES streamer(id)    -- 外键约束
      ) STRICT;
    `;

    // 创建表
    const result = super.createTable(createTableSQL);

    return result;
  }

  /**
   * 检查索引是否存在
   * @param indexName 索引名称
   * @returns 是否存在
   */
  private checkIndexExists(indexName: string): boolean {
    const result = this.db
      .prepare(
        `SELECT name FROM sqlite_master 
         WHERE type='index' AND tbl_name='record_history' AND name=?`,
      )
      .get(indexName);
    return !!result;
  }

  /**
   * 创建数据库索引
   */
  public createIndexes() {
    try {
      const indexes = [
        {
          name: "idx_record_history_streamer_id",
          sql: `CREATE INDEX IF NOT EXISTS idx_record_history_streamer_id ON record_history(streamer_id)`,
        },
        {
          name: "idx_record_history_streamer_time",
          sql: `CREATE INDEX IF NOT EXISTS idx_record_history_streamer_time ON record_history(streamer_id, record_start_time)`,
        },
        {
          name: "idx_record_history_live_video",
          sql: `CREATE INDEX IF NOT EXISTS idx_record_history_live_video ON record_history(live_id, video_file)`,
        },
      ];

      for (const index of indexes) {
        if (!this.checkIndexExists(index.name)) {
          this.db.prepare(index.sql).run();
          logger.info(`已创建索引: ${index.name}`);
        }
      }
    } catch (error) {
      logger.error(`创建 record_history 表索引失败:`, error);
    }
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
      // @ts-ignore
      const hasLiveIdColumn = columns.some((col) => col.name === "live_id");

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

      if (!hasLiveIdColumn) {
        // 添加live_id列
        this.db.prepare(`ALTER TABLE ${this.tableName} ADD COLUMN live_id TEXT`).run();
        logger.info(`已为${this.tableName}表添加live_id列`);
      }

      return true;
    } catch (error) {
      logger.error(`迁移${this.tableName}表失败:`, error);
      return false;
    }
  }

  add(options: BaseLiveHistory) {
    const data = BaseLiveHistory.parse(options);
    return this.insert(data);
  }

  addMany(list: BaseLiveHistory[]) {
    const filterList = list.map((item) => BaseLiveHistory.parse(item));
    return this.insertMany(filterList);
  }

  /**
   * 批量获取多个频道的最后录制时间
   * @param streamers 主播ID列表
   * @returns 最后录制时间映射表
   */
  getLastRecordTimes(streamerIds: number[]): Map<number, number | null> {
    if (streamerIds.length === 0) {
      return new Map();
    }

    const placeholders = streamerIds.map(() => "?").join(",");
    const sql = `
      SELECT streamer_id, MAX(record_start_time) as last_record_time
      FROM ${this.tableName}
      WHERE streamer_id IN (${placeholders})
        AND record_start_time IS NOT NULL
      GROUP BY streamer_id
    `;

    const stmt = this.db.prepare(sql);
    const results = stmt.all(...streamerIds) as Array<{
      streamer_id: number;
      last_record_time: number | null;
    }>;

    const resultMap = new Map<number, number | null>();
    // 初始化所有ID为null
    streamerIds.forEach((id) => resultMap.set(id, null));
    // 填充查询结果
    results.forEach((row) => {
      if (row.last_record_time) {
        resultMap.set(row.streamer_id, row.last_record_time);
      }
    });

    return resultMap;
  }

  /**
   * 分页查询记录历史,支持时间范围过滤和排序
   * @param options 查询参数
   * @returns 分页结果
   */
  paginateWithTimeRange(options: {
    where: Partial<LiveHistory>;
    page?: number;
    pageSize?: number;
    startTime?: number;
    endTime?: number;
    orderBy?: string;
    orderDirection?: "ASC" | "DESC";
  }): { data: LiveHistory[]; total: number } {
    const {
      where,
      page = 1,
      pageSize = 100,
      startTime,
      endTime,
      orderBy = "id",
      orderDirection = "DESC",
    } = options;

    // 构建WHERE条件
    const whereConditions: string[] = [];
    const params: any[] = [];

    // 处理基本条件
    if (where.streamer_id) {
      whereConditions.push("streamer_id = ?");
      params.push(where.streamer_id);
    }
    if (where.video_file) {
      whereConditions.push("video_file = ?");
      params.push(where.video_file);
    }

    // 处理时间范围过滤
    if (startTime) {
      whereConditions.push("record_start_time >= ?");
      params.push(startTime);
    }
    if (endTime) {
      whereConditions.push("record_start_time <= ?");
      params.push(endTime);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // 获取总记录数
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const countStmt = this.db.prepare(countSql);
    const countResult = countStmt.get(...params) as { total: number };
    const total = countResult.total;

    // 获取分页数据
    const offset = (page - 1) * pageSize;
    const dataSql = `
      SELECT * FROM ${this.tableName} 
      ${whereClause} 
      ORDER BY ${orderBy} ${orderDirection} 
      LIMIT ? OFFSET ?
    `;
    const dataStmt = this.db.prepare(dataSql);
    const data = dataStmt.all(...params, pageSize, offset) as LiveHistory[];

    return { data, total };
  }
}
