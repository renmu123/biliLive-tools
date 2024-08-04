import { Database } from "sqlite";

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

    return this.db.run(sql, Object.values(options));
  }

  async insertMany(records: Array<T>) {
    const keys = Object.keys(records[0]);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`;

    const stmt = await this.db.prepare(sql);

    try {
      await this.db.run("BEGIN TRANSACTION");
      for (const record of records) {
        const values = keys.map((key) => record[key]);
        await stmt.run(values);
      }
      await this.db.run("COMMIT");
    } catch (error) {
      await this.db.run("ROLLBACK");
      throw error;
    } finally {
      await stmt.finalize();
    }
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

  async close() {
    return this.db.close();
  }
}

export default BaseModel;
