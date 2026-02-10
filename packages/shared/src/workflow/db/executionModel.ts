import { nanoid } from "nanoid";
import BaseModel from "../../db/model/baseModel.js";
import { BaseWorkflowExecution, WorkflowExecution } from "../types.js";
import logger from "../../utils/log.js";

import type { Database } from "better-sqlite3";

export default class ExecutionModel extends BaseModel<BaseWorkflowExecution> {
  constructor({ db }: { db: Database }) {
    super(db, "workflow_executions");
    this.createTable();
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        error TEXT,
        node_results TEXT DEFAULT '{}',
        FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }

  add(options: Omit<BaseWorkflowExecution, "start_time"> & { start_time?: number }): string {
    try {
      const data = BaseWorkflowExecution.parse({
        ...options,
        start_time: options.start_time || Date.now(),
      });
      const id = nanoid();

      const sql = `
        INSERT INTO ${this.tableName} (id, workflow_id, status, start_time, end_time, error, node_results)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db
        .prepare(sql)
        .run(
          id,
          data.workflow_id,
          data.status,
          data.start_time,
          data.end_time || null,
          data.error || null,
          JSON.stringify(data.node_results || {}),
        );

      return id;
    } catch (error) {
      logger.error("添加执行记录失败:", error);
      throw error;
    }
  }

  findById(id: string): WorkflowExecution | null {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const row = this.db.prepare(sql).get(id) as any;

      if (!row) return null;

      return {
        id: row.id,
        workflow_id: row.workflow_id,
        status: row.status,
        start_time: row.start_time,
        end_time: row.end_time,
        error: row.error,
        node_results: JSON.parse(row.node_results || "{}"),
      };
    } catch (error) {
      logger.error("查询执行记录失败:", error);
      return null;
    }
  }

  findByWorkflowId(workflowId: string, limit = 50): WorkflowExecution[] {
    try {
      const sql = `
        SELECT * FROM ${this.tableName}
        WHERE workflow_id = ?
        ORDER BY start_time DESC
        LIMIT ?
      `;
      const rows = this.db.prepare(sql).all(workflowId, limit) as any[];

      return rows.map((row) => ({
        id: row.id,
        workflow_id: row.workflow_id,
        status: row.status,
        start_time: row.start_time,
        end_time: row.end_time,
        error: row.error,
        node_results: JSON.parse(row.node_results || "{}"),
      }));
    } catch (error) {
      logger.error("查询工作流执行记录失败:", error);
      return [];
    }
  }

  update(
    id: string,
    updates: Partial<Pick<BaseWorkflowExecution, "status" | "end_time" | "error" | "node_results">>,
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

      if (updates.error !== undefined) {
        fields.push("error = ?");
        values.push(updates.error);
      }

      if (updates.node_results !== undefined) {
        fields.push("node_results = ?");
        values.push(JSON.stringify(updates.node_results));
      }

      if (fields.length === 0) return false;

      values.push(id);

      const sql = `UPDATE ${this.tableName} SET ${fields.join(", ")} WHERE id = ?`;
      const result = this.db.prepare(sql).run(...values);

      return result.changes > 0;
    } catch (error) {
      logger.error("更新执行记录失败:", error);
      return false;
    }
  }

  // 清理旧的执行记录
  cleanOldRecords(daysToKeep = 30): number {
    try {
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
      const sql = `DELETE FROM ${this.tableName} WHERE start_time < ?`;
      const result = this.db.prepare(sql).run(cutoffTime);
      return result.changes;
    } catch (error) {
      logger.error("清理旧执行记录失败:", error);
      return 0;
    }
  }
}
