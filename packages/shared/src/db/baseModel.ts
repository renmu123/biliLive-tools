import { Database } from "sqlite";
import pLimit from "p-limit";

class BaseModel<T> {
  protected db: Database;
  protected tableName: string;

  constructor(db: Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  async createTable(createTableSQL: string) {
    return this.db.run(createTableSQL);
  }

  async insert(options: T) {
    const keys = Object.keys(options);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`;

    const data = await this.db.run(sql, Object.values(options));
    return data.lastID;
  }

  async upsert(options: { where: Partial<T & { id: number }>; create: T }) {
    const data = await this.query(options.where);
    if (data) {
      return data;
    } else {
      const id = await this.insert(options.create);
      return this.query({ id } as Partial<T & { id: number }>);
    }
  }

  async insertMany(records: Array<T>) {
    const keys = Object.keys(records[0]);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`;

    const stmt = await this.db.prepare(sql);
    const limit = pLimit(10); // 限制并发数为10
    const insertedIds = [];

    try {
      await this.db.run("BEGIN TRANSACTION");

      const insertPromises = records.map((record) =>
        limit(async () => {
          const values = keys.map((key) => record[key]);
          await stmt.run(values);
          const result = await this.db.get("SELECT last_insert_rowid() as id");
          insertedIds.push(result.id); // 收集每次插入的主键ID
        }),
      );

      await Promise.all(insertPromises);
      await this.db.run("COMMIT");
    } catch (error) {
      await this.db.run("ROLLBACK");
      throw error;
    } finally {
      await stmt.finalize();
    }

    return insertedIds;
  }

  async query(options: Partial<T & { id: number }>) {
    const conditions = [];
    const values = [];

    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    }

    const sql = `SELECT * FROM ${this.tableName}${conditions.length ? " WHERE " + conditions.join(" AND ") : ""}`;
    return this.db.get(sql, values);
  }

  async list(options: Partial<T>) {
    const conditions = [];
    const values = [];

    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    }

    const sql = `SELECT * FROM ${this.tableName}${conditions.length ? " WHERE " + conditions.join(" AND ") : ""}`;
    return this.db.all(sql, values);
  }
  async transaction(fn: () => Promise<void>) {
    await this.db.run("BEGIN TRANSACTION");
    try {
      await fn();
      await this.db.run("COMMIT");
    } catch (error) {
      await this.db.run("ROLLBACK");
      throw error;
    }
  }

  async close() {
    return this.db.close();
  }
}

export default BaseModel;
