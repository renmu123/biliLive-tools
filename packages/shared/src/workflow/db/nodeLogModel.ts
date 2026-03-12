import { nanoid } from "nanoid";
import BaseModel from "../../db/model/baseModel.js";
import { BaseNodeExecutionLog, NodeExecutionLog } from "../types.js";
import logger from "../../utils/log.js";

import type { Database } from "better-sqlite3";

export default class NodeLogModel extends BaseModel<BaseNodeExecutionLog> {
  constructor({ db }: { db: Database }) {
    super(db, "workflow_node_logs");
    this.createTable();
    this.createIndexes();
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time INTEGER,
        end_time INTEGER,
        input_data TEXT DEFAULT '{}',
        output_data TEXT DEFAULT '{}',
        error TEXT,
        FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }

  createIndexes() {
    try {
      this.db
        .prepare(
          `CREATE INDEX IF NOT EXISTS idx_node_logs_execution_id ON ${this.tableName}(execution_id)`,
        )
        .run();
      this.db
        .prepare(`CREATE INDEX IF NOT EXISTS idx_node_logs_node_id ON ${this.tableName}(node_id)`)
        .run();
    } catch (error) {
      logger.error("创建索引失败:", error);
    }
  }

  add(options: BaseNodeExecutionLog): string {
    try {
      const data = BaseNodeExecutionLog.parse(options);
      const id = nanoid();

      const sql = `
        INSERT INTO ${this.tableName} (id, execution_id, node_id, status, start_time, end_time, input_data, output_data, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db
        .prepare(sql)
        .run(
          id,
          data.execution_id,
          data.node_id,
          data.status,
          data.start_time || null,
          data.end_time || null,
          JSON.stringify(data.input_data || {}),
          JSON.stringify(data.output_data || {}),
          data.error || null,
        );

      return id;
    } catch (error) {
      logger.error("添加节点日志失败:", error);
      throw error;
    }
  }

  findByExecutionId(executionId: string): NodeExecutionLog[] {
    try {
      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE execution_id = ?
        ORDER BY start_time ASC
      `;
      const rows = this.db.prepare(sql).all(executionId) as any[];

      return rows.map((row) => ({
        id: row.id,
        execution_id: row.execution_id,
        node_id: row.node_id,
        status: row.status,
        start_time: row.start_time,
        end_time: row.end_time,
        input_data: JSON.parse(row.input_data || "{}"),
        output_data: JSON.parse(row.output_data || "{}"),
        error: row.error,
      }));
    } catch (error) {
      logger.error("查询节点日志失败:", error);
      return [];
    }
  }

  update(
    id: string,
    updates: Partial<Pick<BaseNodeExecutionLog, "status" | "end_time" | "output_data" | "error">>,
  ): boolean {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.status !== undefined) {
        fields.push("status = ?");
        values.push(updates.status);
      }

      if (updates.end_time !== undefined) {
        fields.push("end_time = ?");
        values.push(updates.end_time);
      }

      if (updates.output_data !== undefined) {
        fields.push("output_data = ?");
        values.push(JSON.stringify(updates.output_data));
      }

      if (updates.error !== undefined) {
        fields.push("error = ?");
        values.push(updates.error);
      }

      if (fields.length === 0) return false;

      values.push(id);

      const sql = `UPDATE ${this.tableName} SET ${fields.join(", ")} WHERE id = ?`;
      const result = this.db.prepare(sql).run(...values);

      return result.changes > 0;
    } catch (error) {
      logger.error("更新节点日志失败:", error);
      return false;
    }
  }
}
