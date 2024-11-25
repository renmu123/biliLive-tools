import BaseModel from "./baseModel.js";
import { validateAndFilter } from "./utils.js";

import type { Database } from "better-sqlite3";
import type { DanmaType } from "@biliLive-tools/types";

export interface BaseDanmu {
  text?: string;
  ts?: number;
  type: DanmaType;
  user?: string;
  gift_price?: number;
  p?: string;
  live_id: number;
}

type Danma = BaseDanmu & {
  id: number;
  created_at: number;
};

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
  private requireFields: (keyof BaseDanmu)[] = [
    "text",
    "ts",
    "type",
    "user",
    "gift_price",
    "p",
    "live_id",
  ];
  init(db: Database) {
    this.model = new DanmaModel(db);
    this.model.createTable();
  }

  addDanma(options: BaseDanmu) {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    console.log(filterOptions, options);
    return this.model.insert(options);
  }
  addMany(list: BaseDanmu[]) {
    const filterList = list.map((item) =>
      validateAndFilter(item, this.requireFields, []),
    ) as BaseDanmu[];
    return this.model.insertMany(filterList);
  }

  list(options: Partial<Danma>): Danma[] {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    return this.model.list(filterOptions);
  }

  query(options: Partial<Danma>) {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    console.log(filterOptions, options);
    return this.model.query(filterOptions);
  }
}
