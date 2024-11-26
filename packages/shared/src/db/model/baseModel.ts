import type { Database } from "better-sqlite3";

class BaseModel<T extends object> {
  db: Database;
  tableName: string;

  constructor(db: Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  createTable(createTableSQL: string) {
    this.db.exec(createTableSQL);
  }

  insert(options: T) {
    const keys = Object.keys(options);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`;

    const stmt = this.db.prepare(sql);
    const info = stmt.run(...Object.values(options));
    return info.lastInsertRowid;
  }

  upsert(options: { where: Partial<T & { id: number }>; create: T }): (T & { id: number }) | null {
    const data = this.query(options.where);
    if (data) {
      return data;
    } else {
      const id = this.insert(options.create);
      return this.query({ id } as Partial<T & { id: number }>);
    }
  }

  insertMany(records: Array<T>) {
    if (records.length === 0) return [];
    const keys = Object.keys(records[0]);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`;

    const stmt = this.db.prepare(sql);
    const insertedIds: Array<number | bigint> = [];

    try {
      this.db.exec("BEGIN TRANSACTION");

      for (const record of records) {
        const values = keys.map((key) => record[key]);
        const info = stmt.run(...values);
        insertedIds.push(info.lastInsertRowid); // 收集每次插入的主键ID
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    return insertedIds;
  }

  query(options: Partial<T & { id: number }>): (T & { id: number; created_at: number }) | null {
    const conditions: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    }

    const sql = `SELECT * FROM ${this.tableName}${conditions.length ? " WHERE " + conditions.join(" AND ") : ""}`;
    return this.db.prepare(sql).get(...values) as any;
  }
  update(options: Partial<T & { id: number }>): void {
    const id = options.id;
    delete options.id;

    const keys = Object.keys(options);
    const values = Object.values(options);
    const placeholders = keys.map((key) => `${key} = ?`).join(", ");
    const sql = `UPDATE ${this.tableName} SET ${placeholders} WHERE id = ?`;

    this.db.prepare(sql).run(...values, id);
  }

  list(options: Partial<T>): (T & { id: number; created_at: number })[] {
    const conditions: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    }

    const sql = `SELECT * FROM ${this.tableName}${conditions.length ? " WHERE " + conditions.join(" AND ") : ""}`;
    return this.db.prepare(sql).all(...values) as any;
  }

  transaction(fn: () => Promise<void>) {
    this.db.exec("BEGIN TRANSACTION");
    try {
      fn()
        .then(() => {
          this.db.exec("COMMIT");
        })
        .catch((error) => {
          this.db.exec("ROLLBACK");
          throw error;
        });
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}

export default BaseModel;
