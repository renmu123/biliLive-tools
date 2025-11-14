import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";

const BaseStatistics = z.object({
  stat_key: z.string(),
  value: z.string(),
});

const Statistics = BaseStatistics.extend({
  created_at: z.number(),
});

export type BaseStatistics = z.infer<typeof BaseStatistics>;
export type Statistics = z.infer<typeof Statistics>;

export default class StatisticsModel extends BaseModel<BaseStatistics> {
  table = "statistics";

  constructor({ db }: { db: Database }) {
    super(db, "statistics");
    this.createTable();
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        stat_key TEXT PRIMARY KEY,                          -- 键
        value TEXT NOT NULL,                                -- 值
        created_at INTEGER DEFAULT (strftime('%s', 'now'))  -- 创建时间，时间戳，自动生成
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }

  add(options: BaseStatistics) {
    const data = BaseStatistics.parse(options);
    return this.insert(data);
  }
  update(options: BaseStatistics) {
    const data = BaseStatistics.parse(options);
    const sql = `UPDATE ${this.table} SET value = ? WHERE stat_key = ?`;

    return this.db.prepare(sql).run(data.value, data.stat_key);
  }
  // upsert(options: {
  //   where: {
  //     stat_key: string;
  //   };
  //   create: BaseStatistics;
  // }) {
  //   return this.model.upsert(options);
  // }
  // query(stat_key: string): BaseStatistics | null {
  //   return this.model.findOne({ where: { stat_key } });
  // }
}
