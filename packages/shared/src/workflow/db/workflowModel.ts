import { nanoid } from "nanoid";
import BaseModel from "../../db/model/baseModel.js";
import { BaseWorkflow, Workflow } from "../types.js";
import logger from "../../utils/log.js";

import type { Database } from "better-sqlite3";

export default class WorkflowModel extends BaseModel<BaseWorkflow> {
  constructor({ db }: { db: Database }) {
    super(db, "workflows");
    this.createTable();
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        definition TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }

  add(options: Omit<BaseWorkflow, "is_active"> & { is_active?: boolean }) {
    try {
      const data = BaseWorkflow.parse(options);
      const id = nanoid();
      const now = Date.now();

      const sql = `
        INSERT INTO ${this.tableName} (id, name, description, definition, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db
        .prepare(sql)
        .run(
          id,
          data.name,
          data.description || null,
          JSON.stringify(data.definition),
          data.is_active ? 1 : 0,
          now,
          now,
        );

      return id;
    } catch (error) {
      logger.error("添加工作流失败:", error);
      throw error;
    }
  }

  findById(id: string): Workflow | null {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const row = this.db.prepare(sql).get(id) as any;

      if (!row) return null;

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        definition: JSON.parse(row.definition),
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch (error) {
      logger.error("查询工作流失败:", error);
      return null;
    }
  }

  list(options?: { is_active?: boolean }): Workflow[] {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];

      if (options?.is_active !== undefined) {
        sql += ` WHERE is_active = ?`;
        params.push(options.is_active ? 1 : 0);
      }

      sql += ` ORDER BY updated_at DESC`;

      const rows = this.db.prepare(sql).all(...params) as any[];

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        definition: JSON.parse(row.definition),
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      logger.error("查询工作流列表失败:", error);
      return [];
    }
  }

  update(id: string, updates: Partial<BaseWorkflow>): boolean {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        fields.push("name = ?");
        values.push(updates.name);
      }

      if (updates.description !== undefined) {
        fields.push("description = ?");
        values.push(updates.description);
      }

      if (updates.definition !== undefined) {
        fields.push("definition = ?");
        values.push(JSON.stringify(updates.definition));
      }

      if (updates.is_active !== undefined) {
        fields.push("is_active = ?");
        values.push(updates.is_active ? 1 : 0);
      }

      if (fields.length === 0) return false;

      fields.push("updated_at = ?");
      values.push(Date.now());
      values.push(id);

      const sql = `UPDATE ${this.tableName} SET ${fields.join(", ")} WHERE id = ?`;
      const result = this.db.prepare(sql).run(...values);

      return result.changes > 0;
    } catch (error) {
      logger.error("更新工作流失败:", error);
      return false;
    }
  }

  deleteById(id: string): boolean {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const result = this.db.prepare(sql).run(id);
      return result.changes > 0;
    } catch (error) {
      logger.error("删除工作流失败:", error);
      return false;
    }
  }
}
