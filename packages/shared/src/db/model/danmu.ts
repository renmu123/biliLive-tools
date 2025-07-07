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

class DanmaModel extends BaseModel<BaseDanmu> {
  table: string;

  constructor(db: Database, platform: string, roomId: string) {
    const tableName = `danma_${platform}_${roomId}`;
    super(db, tableName);
    this.table = tableName;
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
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

    const result = super.createTable(createTableSQL);

    // 创建索引
    const createIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_${this.table}_record_id ON ${this.table}(record_id);
        CREATE INDEX IF NOT EXISTS idx_${this.table}_ts ON ${this.table}(ts);
        CREATE INDEX IF NOT EXISTS idx_${this.table}_type ON ${this.table}(type);
        CREATE INDEX IF NOT EXISTS idx_${this.table}_record_ts ON ${this.table}(record_id, ts);
        CREATE INDEX IF NOT EXISTS idx_${this.table}_record_gift ON ${this.table}(record_id, gift_price DESC);
        CREATE INDEX IF NOT EXISTS idx_${this.table}_user ON ${this.table}(user);
        CREATE INDEX IF NOT EXISTS idx_${this.table}_record_user ON ${this.table}(record_id, user);
      `;

    // 创建索引
    const indexStatements = createIndexSQL.split(";").filter((sql) => sql.trim());
    for (const indexSQL of indexStatements) {
      if (indexSQL.trim()) {
        this.db.prepare(indexSQL).run();
      }
    }

    return result;
  }
}

export default class DanmaController {
  private db!: Database;

  init(db: Database) {
    this.db = db;
  }

  private getModel(platform: string, roomId: string): DanmaModel {
    const tableName = `danma_${platform}_${roomId}`;
    // 检查表是否存在
    const tableExists = this.db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(tableName);

    const model = new DanmaModel(this.db, platform, roomId);
    if (!tableExists) {
      model.createTable();
    }
    return model;
  }

  addDanma(
    raw: BaseDanmu,
    options: {
      platform: string;
      roomId: string;
    },
  ) {
    const data = BaseDanmu.parse(raw);
    const model = this.getModel(options.platform, options.roomId);
    return model.insert(data);
  }

  addMany(
    list: BaseDanmu[],
    options: {
      platform: string;
      roomId: string;
    },
  ) {
    if (list.length === 0) return;

    // 分别插入每个分组
    const model = this.getModel(options.platform, options.roomId);
    model.insertMany(list);
  }

  list(
    platform: string,
    roomId: string,
    options: Partial<Omit<Danmu, "platform" | "room_id">>,
  ): Danmu[] {
    const model = this.getModel(platform, roomId);
    const data = Danmu.partial().parse(options);
    return model.list(data);
  }

  query(platform: string, roomId: string, options: Partial<Omit<Danmu, "platform" | "room_id">>) {
    const model = this.getModel(platform, roomId);
    const data = Danmu.partial().parse(options);
    return model.query(data);
  }
}
