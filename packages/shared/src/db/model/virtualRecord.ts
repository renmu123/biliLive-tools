import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseItem = z.object({
  path: z.string(),
});

export type BaseItem = z.infer<typeof BaseItem>;

class model extends BaseModel<BaseItem> {
  table = "virtual_record";

  constructor(db: Database) {
    super(db, "virtual_record");
  }

  createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 自增主键
        path TEXT NOT NULL,                             -- 文件路径
        created_at INTEGER DEFAULT (strftime('%s', 'now'))  -- 创建时间，时间戳，自动生成
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }
}

type AddOptions = z.infer<typeof BaseItem>;

export default class VirtualRecordController {
  private model!: model;
  init(db: Database) {
    this.model = new model(db);
    this.model.createTable();
  }

  add(options: AddOptions) {
    const data = BaseItem.parse(options);
    return this.model.insert(data);
  }

  list() {
    return this.model.list({});
  }
}
