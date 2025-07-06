import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseDanmu = z.object({
  record_id: z.number(),
  ts: z.number(),
  type: z.enum(["text", "gift", "guard", "sc"]),
  text: z.string().optional(),
  user: z.string().optional(),
  gift_price: z.number().optional(),
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
        ts INTEGER,                                     -- 时间戳
        type TEXT DEFAULT unknown,                      -- 弹幕类型，text：普通弹幕，gift：礼物弹幕，guard：上舰弹幕，sc：SC弹幕，unknown：未知
        user TEXT,                                      -- 发送用户名
        gift_price INTEGER DEFAULT 0,                   -- 礼物价格，默认为0，单位人民币
        text TEXT,                                      -- 普通弹幕的基础数据
        ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }
}

export default class DanmaController {
  private models: Map<string, DanmaModel> = new Map();
  private db!: Database;

  init(db: Database) {
    this.db = db;
  }

  private getModel(platform: string, roomId: string): DanmaModel {
    const key = `${platform}_${roomId}`;
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

    // 按照 platform 和 room_id 分组
    const groups = new Map<string, BaseDanmu[]>();
    list.forEach((item) => {
      const data = BaseDanmu.parse(item);
      const key = `${options.platform}_${options.roomId}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(data);
    });

    // 分别插入每个分组
    const results = [];
    for (const [key, items] of groups) {
      const [platform, roomId] = key.split("_");
      const model = this.getModel(platform, roomId);
      results.push(model.insertMany(items));
    }
    return Promise.all(results);
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
