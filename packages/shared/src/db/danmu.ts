import BaseModel from "./baseModel.js";
import { validateAndFilter } from "./utils.js";

import type { Database } from "sqlite";
import type { DanmuItem } from "@biliLive-tools/types";

type Danma = DanmuItem & {
  id: number;
  created_at: number;
};

// 表名 danma
// 字段名 id, content, time, type, created_at, username, user_id, room_id, platform, gift_price, filename
// 除了id和type和创建时间，其他字段都允许为空
// id: 自增主键
// content: 弹幕内容
// time: 时间戳
// type: 弹幕类型，text：普通弹幕，gift：礼物弹幕，guard：上舰弹幕，sc：SC弹幕，unknown：未知
// created_at: 创建时间，时间戳，自动生成
// username: 用户名
// room_id: 房间id
// platform: 平台，bilibili，douyu，unknown
// gift_price: 礼物价格，默认为0
// filename: 文件名
// p: 普通弹幕的基础数据
class DanmaModel extends BaseModel<DanmuItem> {
  table = "danma";

  constructor(db: Database) {
    super(db, "danma");
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 自增主键
        text TEXT,                                      -- 弹幕内容
        ts INTEGER,                                     -- 时间戳
        type TEXT DEFAULT unknown,                      -- 弹幕类型，text：普通弹幕，gift：礼物弹幕，guard：上舰弹幕，sc：SC弹幕，unknown：未知
        created_at INTEGER DEFAULT (strftime('%s', 'now')),  -- 创建时间，时间戳，自动生成
        user TEXT,                                      -- 用户名
        room_id TEXT,                                   -- 房间id
        platform TEXT DEFAULT unknown,                  -- 平台，bilibili，douyu，unknown
        gift_price INTEGER DEFAULT 0,                   -- 礼物价格，默认为0
        source TEXT                                     -- 来源
        p TEXT                                          -- 普通弹幕的基础数据
      )
    `;
    return super.createTable(createTableSQL);
  }
}

export default class DanmaController {
  private model: DanmaModel;
  private requireFields: (keyof DanmuItem)[] = [
    "text",
    "ts",
    "type",
    "user",
    "room_id",
    "platform",
    "gift_price",
    "source",
    "p",
  ];
  async init(db: Database) {
    this.model = new DanmaModel(db);
    await this.model.createTable();
  }

  async add(options: DanmuItem) {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    console.log(filterOptions, options);
    return this.model.insert(options);
  }
  async addMany(list: DanmuItem[]) {
    return this.model.insertMany(list);
  }

  async list(options: Partial<Danma>): Promise<Danma[]> {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    return this.model.list(filterOptions);
  }

  async query(options: Partial<Danma>) {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    console.log(filterOptions, options);
    return this.model.query(filterOptions);
  }

  async close() {
    return this.model.close();
  }
}
