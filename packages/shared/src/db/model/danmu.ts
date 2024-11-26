import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseDanmu = z.object({
  live_id: z.number(),
  ts: z.number(),
  type: z.enum(["text", "gift", "guard", "sc"]),
  text: z.string().optional(),
  user: z.string().optional(),
  gift_price: z.number().optional(),
  p: z.string().optional(),
});
const Danmu = BaseDanmu.extend({
  id: z.number(),
  created_at: z.number(),
});

export type BaseDanmu = z.infer<typeof BaseDanmu>;
export type Danmu = z.infer<typeof Danmu>;

class DanmaModel extends BaseModel<BaseDanmu> {
  table = "danma";

  constructor(db: Database) {
    super(db, "danma");
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 自增主键
        text TEXT,                                      -- 弹幕内容
        ts REAL,                                        -- 相对时间戳
        type TEXT DEFAULT unknown,                      -- 弹幕类型，text：普通弹幕，gift：礼物弹幕，guard：上舰弹幕，sc：SC弹幕，unknown：未知
        user TEXT,                                      -- 发送用户名
        gift_price INTEGER DEFAULT 0,                   -- 礼物价格，默认为0
        live_id INTEGER,                                -- 直播场次id
        p TEXT,                                         -- 普通弹幕的基础数据
        created_at INTEGER DEFAULT (strftime('%s', 'now')),  -- 创建时间，时间戳，自动生成
        FOREIGN KEY (live_id) REFERENCES live(id)            -- 外键约束
        ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }
}

export default class DanmaController {
  private model!: DanmaModel;
  init(db: Database) {
    this.model = new DanmaModel(db);
    this.model.createTable();
  }

  addDanma(options: BaseDanmu) {
    const data = BaseDanmu.parse(options);
    return this.model.insert(data);
  }
  addMany(list: BaseDanmu[]) {
    const filterList = list.map((item) => BaseDanmu.parse(item));
    return this.model.insertMany(filterList);
  }

  list(options: Partial<Danmu>): Danmu[] {
    const data = Danmu.parse(options);
    return this.model.list(data);
  }

  query(options: Partial<Danmu>) {
    const data = Danmu.parse(options);
    return this.model.query(data);
  }
}
