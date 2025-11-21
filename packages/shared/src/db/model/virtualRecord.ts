import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseVirtualRecord = z.object({
  path: z.string(),
});

const VirtualRecord = BaseVirtualRecord.extend({
  id: z.number(),
  created_at: z.number(),
});

export type BaseVirtualRecord = z.infer<typeof BaseVirtualRecord>;
export type VirtualRecord = z.infer<typeof VirtualRecord>;

export default class VirtualRecordModel extends BaseModel<BaseVirtualRecord> {
  constructor({ db }: { db: Database }) {
    super(db, "virtual_record");
    this.createTable();
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 自增主键
        path TEXT NOT NULL,                             -- 文件路径
        created_at INTEGER DEFAULT (strftime('%s', 'now'))  -- 创建时间,时间戳,自动生成
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }

  add(options: BaseVirtualRecord) {
    const data = BaseVirtualRecord.parse(options);
    return this.insert(data);
  }

  deleteById(id: number) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    return this.db.prepare(sql).run(id);
  }
}
