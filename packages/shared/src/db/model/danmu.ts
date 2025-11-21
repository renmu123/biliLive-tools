import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseDanmu = z.object({
  record_id: z.number(),
  ts: z.number().optional(),
  type: z.enum(["text", "gift"]),
  text: z.string().optional(),
  user: z.string().optional(),
  gift_price: z.number().optional(),
  gift_name: z.string().optional(),
});

const Danmu = BaseDanmu.extend({
  id: z.number(),
});

export type BaseDanmu = z.infer<typeof BaseDanmu>;
export type Danmu = z.infer<typeof Danmu>;

/**
 * 弹幕数据模型
 * 每个直播间会创建独立的弹幕表
 */
export default class DanmuModel extends BaseModel<BaseDanmu> {
  platform: string;
  roomId: string;

  constructor({ db, platform, roomId }: { db: Database; platform: string; roomId: string }) {
    const tableName = `danmu_${platform}_${roomId}`;
    super(db, tableName);
    this.platform = platform;
    this.roomId = roomId;
    this.createTable();
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 自增主键
        record_id INTEGER,                              -- 直播场次id
        ts INTEGER DEFAULT 0,                           -- 时间戳
        type TEXT DEFAULT "unknown",                    -- 弹幕类型，text：普通弹幕，gift：礼物弹幕
        text TEXT DEFAULT "",                          -- 普通弹幕的基础数据
        user TEXT DEFAULT "",                          -- 发送用户名
        gift_name TEXT DEFAULT "",                     -- 礼物名称
        gift_price INTEGER DEFAULT 0                   -- 礼物价格，默认为0，单位分
      ) STRICT;
    `;

    super.createTable(createTableSQL);

    // 创建索引以优化查询性能
    this.createIndexes();
  }

  private createIndexes() {
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_record_id ON ${this.tableName}(record_id)`,
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_ts ON ${this.tableName}(ts)`,
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_type ON ${this.tableName}(type)`,
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_record_ts ON ${this.tableName}(record_id, ts)`,
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_record_gift ON ${this.tableName}(record_id, gift_price DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_user ON ${this.tableName}(user)`,
      `CREATE INDEX IF NOT EXISTS idx_${this.tableName}_record_user ON ${this.tableName}(record_id, user)`,
    ];

    for (const indexSQL of indexes) {
      this.db.prepare(indexSQL).run();
    }
  }

  /**
   * 添加单条弹幕记录
   */
  add(data: BaseDanmu) {
    const validated = BaseDanmu.parse(data);
    return this.insert(validated);
  }

  /**
   * 批量添加弹幕记录
   */
  addMany(list: BaseDanmu[]) {
    if (list.length === 0) return [];

    const validated = list.map((item) => BaseDanmu.parse(item));
    return this.insertMany(validated);
  }

  /**
   * 根据录制场次ID查询弹幕列表
   */
  getByRecordId(recordId: number): (Danmu & { id: number })[] {
    return this.list({ record_id: recordId });
  }

  /**
   * 根据录制场次ID和时间范围查询弹幕
   */
  getByRecordIdAndTimeRange(
    recordId: number,
    startTs: number,
    endTs: number,
  ): (Danmu & { id: number })[] {
    return this.complexQuery({
      where: [
        { field: "record_id", operator: "=", value: recordId },
        { field: "ts", operator: ">=", value: startTs },
        { field: "ts", operator: "<=", value: endTs },
      ],
      orderBy: [{ field: "ts", direction: "ASC" }],
    });
  }

  /**
   * 查询礼物弹幕统计
   */
  getGiftStatistics(recordId: number) {
    const sql = `
      SELECT 
        gift_name,
        COUNT(*) as count,
        SUM(gift_price) as total_price
      FROM ${this.tableName}
      WHERE record_id = ? AND type = 'gift'
      GROUP BY gift_name
      ORDER BY total_price DESC
    `;
    return this.db.prepare(sql).all(recordId) as Array<{
      gift_name: string;
      count: number;
      total_price: number;
    }>;
  }

  /**
   * 根据录制场次ID删除弹幕
   */
  deleteByRecordId(recordId: number) {
    return this.delete({
      where: [{ field: "record_id", operator: "=", value: recordId }],
    });
  }
}
