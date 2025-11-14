import { z } from "zod";
import BaseModel from "./baseModel.js";
import logger from "../../utils/log.js";

import type { Database } from "better-sqlite3";

const BaseUploadPart = z.object({
  file_hash: z.string(),
  file_size: z.number(),
  cid: z.number(),
  filename: z.string(),
  expire_time: z.number(),
});

const UploadPart = BaseUploadPart.extend({
  id: z.number(),
  created_at: z.number().optional(),
});

export type BaseUploadPart = z.infer<typeof BaseUploadPart>;
export type UploadPart = z.infer<typeof UploadPart>;

export default class UploadPartModel extends BaseModel<BaseUploadPart> {
  table = "upload_parts";

  constructor({ db }: { db: Database }) {
    super(db, "upload_parts");
    this.createTable();
    this.createIndexes();
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS upload_parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        file_hash TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        cid INTEGER NOT NULL,
        filename TEXT NOT NULL,
        expire_time INTEGER NOT NULL
      ) STRICT;
    `;

    return super.createTable(createTableSQL);
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
         WHERE type='index' AND tbl_name='upload_parts' AND name=?`,
      )
      .get(indexName);
    return !!result;
  }

  createIndexes() {
    try {
      const indexes = [
        {
          name: "idx_upload_parts_hash_size",
          sql: `CREATE INDEX IF NOT EXISTS idx_upload_parts_hash_size ON upload_parts(file_hash, file_size)`,
        },
        {
          name: "idx_upload_parts_cid",
          sql: `CREATE INDEX IF NOT EXISTS idx_upload_parts_cid ON upload_parts(cid)`,
        },
      ];

      for (const index of indexes) {
        if (!this.checkIndexExists(index.name)) {
          this.db.prepare(index.sql).run();
          logger.info(`已创建索引: ${index.name}`);
        }
      }
    } catch (error) {
      logger.error(`创建 upload_parts 表索引失败:`, error);
    }
  }

  add(options: BaseUploadPart) {
    const data = BaseUploadPart.parse(options);
    return this.insert(data);
  }

  addOrUpdate(options: Omit<BaseUploadPart, "expire_time">) {
    const part = this.findValidPartByHash(options.file_hash, options.file_size);
    // 过期时间为当前时间加上3天
    const expire_time = Date.now() + 1000 * 60 * 60 * 24 * 3;
    if (part) {
      return this.update({
        id: part.id,
        expire_time,
        cid: options.cid,
      });
    } else {
      return this.insert({
        ...options,
        expire_time,
      });
    }
  }

  findByHash(file_hash: string, file_size: number) {
    return this.query({ file_hash, file_size });
  }

  findValidPartByHash(file_hash: string, file_size: number): UploadPart | null {
    const sql = `
      SELECT * FROM ${this.table} 
      WHERE file_hash = ? AND file_size = ? AND expire_time > ?
    `;
    return this.db.prepare(sql).get(file_hash, file_size, Date.now()) as UploadPart | null;
  }

  removeExpired() {
    const sql = `DELETE FROM ${this.table} WHERE expire_time <= ?`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(Date.now());
    return result.changes;
  }

  removeByCids(cids: number[]) {
    if (!cids.length) return 0;
    const sql = `DELETE FROM ${this.table} WHERE cid IN (${cids.map(() => `?`).join(",")})`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(cids);
    return result.changes;
  }
}
