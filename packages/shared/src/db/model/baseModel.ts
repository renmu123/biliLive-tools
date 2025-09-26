import type { Database } from "better-sqlite3";

interface QueryOptions<T> {
  where?: Partial<T & { id: number }>;
  orderBy?: string;
  limit?: number;
  offset?: number;
  select?: string[];
}

interface UpdateOptions<T> {
  where: Partial<T & { id: number }>;
  data: Partial<T>;
}

// interface DeleteOptions<T> {
//   where: Partial<T & { id: number }>;
// }

interface ComplexDeleteOptions {
  where?: WhereCondition[];
  orWhere?: WhereCondition[];
  limit?: number;
}

type ComparisonOperator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "NOT IN";

interface WhereCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
}

interface ComplexQueryOptions {
  where?: WhereCondition[];
  orWhere?: WhereCondition[];
  orderBy?: { field: string; direction: "ASC" | "DESC" }[];
  limit?: number;
  offset?: number;
  select?: string[];
  groupBy?: string[];
  having?: WhereCondition[];
}

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

  insert(options: Omit<T, "id">) {
    const keys = Object.keys(options);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`;

    const stmt = this.db.prepare(sql);
    const info = stmt.run(...Object.values(options));
    return info.lastInsertRowid;
  }

  upsert(options: {
    where: Partial<T & { id?: number }>;
    create: Omit<T, "id">;
  }): (T & { id: number }) | null {
    const data = this.query(options.where);
    if (data) {
      return data;
    } else {
      const id = this.insert(options.create);
      return this.query({ id } as Partial<T & { id: number }>);
    }
  }

  insertMany(records: Array<Omit<T, "id">>) {
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

  query(options: Partial<T & { id?: number }>): (T & { id: number }) | null {
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

  // 新增：更灵活的查询方法
  findOne(options: QueryOptions<T> = {}): (T & { id: number }) | null {
    const sql = this.buildSelectQuery(options);
    const values = this.extractWhereValues(options.where || {});
    return this.db.prepare(sql).get(...values) as any;
  }

  findMany(options: QueryOptions<T> = {}): (T & { id: number })[] {
    const sql = this.buildSelectQuery(options);
    const values = this.extractWhereValues(options.where || {});
    return this.db.prepare(sql).all(...values) as any;
  }

  // 新增：复杂查询方法
  complexQuery(options: ComplexQueryOptions): (T & { id: number })[] {
    const sql = this.buildComplexQuery(options);
    const values = this.extractComplexValues(options);
    return this.db.prepare(sql).all(...values) as any;
  }

  // 新增：分页查询
  paginate(
    page: number,
    pageSize: number,
    options: QueryOptions<T> = {},
  ): {
    data: (T & { id: number })[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    // 计算总数
    const countSql = this.buildCountQuery(options.where || {});
    const countValues = this.extractWhereValues(options.where || {});
    const total = (this.db.prepare(countSql).get(...countValues) as any).count;

    // 获取分页数据
    const offset = (page - 1) * pageSize;
    const dataSql = this.buildSelectQuery({ ...options, limit: pageSize, offset });
    const dataValues = this.extractWhereValues(options.where || {});
    const data = this.db.prepare(dataSql).all(...dataValues) as any;

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 新增：按字段查询
  findBy(field: keyof T, value: any): (T & { id: number })[] {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${String(field)} = ?`;
    return this.db.prepare(sql).all(value) as any;
  }

  // 新增：查询第一个记录
  first(): (T & { id: number }) | null {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY id ASC LIMIT 1`;
    return this.db.prepare(sql).get() as any;
  }

  // 新增：查询最后一个记录
  last(): (T & { id: number }) | null {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY id DESC LIMIT 1`;
    return this.db.prepare(sql).get() as any;
  }

  // 新增：检查记录是否存在
  exists(options: Partial<T & { id: number }>): boolean {
    const conditions: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    }

    const sql = `SELECT 1 FROM ${this.tableName}${conditions.length ? " WHERE " + conditions.join(" AND ") : ""} LIMIT 1`;
    return this.db.prepare(sql).get(...values) !== undefined;
  }

  // 新增：计数方法
  count(options: Partial<T> = {}): number {
    const conditions: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    }

    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}${conditions.length ? " WHERE " + conditions.join(" AND ") : ""}`;
    return (this.db.prepare(sql).get(...values) as any).count;
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

  // 新增：批量更新方法
  updateMany(options: UpdateOptions<T>): number {
    const conditions: string[] = [];
    const whereValues: any[] = [];

    for (const [key, value] of Object.entries(options.where)) {
      if (value !== undefined) {
        conditions.push(`${key} = ?`);
        whereValues.push(value);
      }
    }

    const setKeys = Object.keys(options.data);
    const setValues = Object.values(options.data);
    const setPlaceholders = setKeys.map((key) => `${key} = ?`).join(", ");

    const sql = `UPDATE ${this.tableName} SET ${setPlaceholders}${conditions.length ? " WHERE " + conditions.join(" AND ") : ""}`;

    const info = this.db.prepare(sql).run(...setValues, ...whereValues);
    return info.changes || 0;
  }

  list(options: Partial<T>): (T & { id: number })[] {
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

  // delete(id: number) {
  //   this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
  // }

  // 新增：复杂删除方法 - 支持更高级的查询条件
  delete(options: ComplexDeleteOptions): number {
    const sql = this.buildComplexDeleteQuery(options);
    const values = this.extractComplexDeleteValues(options);
    const info = this.db.prepare(sql).run(...values);
    return info.changes || 0;
  }

  // 新增：按字段删除
  deleteBy(field: keyof T, value: T[keyof T]): number {
    const sql = `DELETE FROM ${this.tableName} WHERE ${String(field)} = ?`;
    const info = this.db.prepare(sql).run(value);
    return info.changes || 0;
  }

  // 新增：软删除方法（如果表有 deleted_at 字段）
  softDelete(id: number): void {
    const sql = `UPDATE ${this.tableName} SET deleted_at = ? WHERE id = ?`;
    this.db.prepare(sql).run(Date.now(), id);
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

  // 私有辅助方法
  private buildSelectQuery(options: QueryOptions<T>): string {
    const selectFields = options.select ? options.select.join(", ") : "*";
    let sql = `SELECT ${selectFields} FROM ${this.tableName}`;

    if (options.where && Object.keys(options.where).length > 0) {
      const conditions = this.buildWhereClause(options.where);
      sql += ` WHERE ${conditions}`;
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    return sql;
  }

  private buildComplexQuery(options: ComplexQueryOptions): string {
    const selectFields = options.select ? options.select.join(", ") : "*";
    let sql = `SELECT ${selectFields} FROM ${this.tableName}`;

    const whereConditions: string[] = [];

    if (options.where && options.where.length > 0) {
      const conditions = options.where.map((cond) => `${cond.field} ${cond.operator} ?`);
      whereConditions.push(`(${conditions.join(" AND ")})`);
    }

    if (options.orWhere && options.orWhere.length > 0) {
      const conditions = options.orWhere.map((cond) => `${cond.field} ${cond.operator} ?`);
      whereConditions.push(`(${conditions.join(" OR ")})`);
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    if (options.groupBy && options.groupBy.length > 0) {
      sql += ` GROUP BY ${options.groupBy.join(", ")}`;
    }

    if (options.having && options.having.length > 0) {
      const havingConditions = options.having.map((cond) => `${cond.field} ${cond.operator} ?`);
      sql += ` HAVING ${havingConditions.join(" AND ")}`;
    }

    if (options.orderBy && options.orderBy.length > 0) {
      const orderClauses = options.orderBy.map((order) => `${order.field} ${order.direction}`);
      sql += ` ORDER BY ${orderClauses.join(", ")}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    return sql;
  }

  private buildCountQuery(where: Partial<T & { id: number }>): string {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;

    if (Object.keys(where).length > 0) {
      const conditions = this.buildWhereClause(where);
      sql += ` WHERE ${conditions}`;
    }

    return sql;
  }

  private buildWhereClause(where: Partial<T & { id: number }>): string {
    const conditions: string[] = [];

    for (const key of Object.keys(where)) {
      if (where[key] !== undefined) {
        conditions.push(`${key} = ?`);
      }
    }

    return conditions.join(" AND ");
  }

  private extractWhereValues(where: Partial<T & { id: number }>): any[] {
    const values: any[] = [];

    for (const [_key, value] of Object.entries(where)) {
      if (value !== undefined) {
        values.push(value);
      }
    }

    return values;
  }

  private extractComplexValues(options: ComplexQueryOptions): any[] {
    const values: any[] = [];

    if (options.where) {
      values.push(...options.where.map((cond) => cond.value));
    }

    if (options.orWhere) {
      values.push(...options.orWhere.map((cond) => cond.value));
    }

    if (options.having) {
      values.push(...options.having.map((cond) => cond.value));
    }

    return values;
  }

  // 私有方法：构建复杂删除查询
  private buildComplexDeleteQuery(options: ComplexDeleteOptions): string {
    let sql = `DELETE FROM ${this.tableName}`;

    const whereConditions: string[] = [];

    if (options.where && options.where.length > 0) {
      const conditions = options.where.map((cond) => `${cond.field} ${cond.operator} ?`);
      whereConditions.push(`(${conditions.join(" AND ")})`);
    }

    if (options.orWhere && options.orWhere.length > 0) {
      const conditions = options.orWhere.map((cond) => `${cond.field} ${cond.operator} ?`);
      whereConditions.push(`(${conditions.join(" OR ")})`);
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    return sql;
  }

  // 私有方法：提取复杂删除查询的值
  private extractComplexDeleteValues(options: ComplexDeleteOptions): any[] {
    const values: any[] = [];

    if (options.where) {
      values.push(...options.where.map((cond) => cond.value));
    }

    if (options.orWhere) {
      values.push(...options.orWhere.map((cond) => cond.value));
    }

    return values;
  }
}

export default BaseModel;
