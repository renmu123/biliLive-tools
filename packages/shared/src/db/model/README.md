# BaseModel ORM 查询类

这是一个基于 SQLite 和 better-sqlite3 的轻量级 ORM 基类，提供了丰富的数据库操作功能。

## 功能特性

### 基础功能

- ✅ 创建表结构
- ✅ 插入单条/批量数据
- ✅ 查询数据（单条/多条）
- ✅ 更新数据（单条/批量）
- ✅ 删除数据（单条/批量）
- ✅ 软删除支持
- ✅ 事务处理

### 高级查询功能

- ✅ 灵活的查询条件
- ✅ 复杂查询（多条件、OR查询）
- ✅ 复杂删除（支持多条件、OR条件、限制删除数量）
- ✅ 排序和分页
- ✅ 分组查询和HAVING子句
- ✅ 字段选择
- ✅ 聚合查询（计数、存在性检查）
- ✅ Upsert操作（插入或更新）

## 接口定义

### QueryOptions

```typescript
interface QueryOptions<T> {
  where?: Partial<T & { id: number }>;
  orderBy?: string;
  limit?: number;
  offset?: number;
  select?: string[];
}
```

### ComplexQueryOptions

```typescript
interface ComplexQueryOptions<T> {
  where?: WhereCondition[];
  orWhere?: WhereCondition[];
  orderBy?: { field: string; direction: "ASC" | "DESC" }[];
  limit?: number;
  offset?: number;
  select?: string[];
  groupBy?: string[];
  having?: WhereCondition[];
}
```

### WhereCondition

```typescript
interface WhereCondition {
  field: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "NOT IN";
  value: any;
}
```

### DeleteOptions

```typescript
interface DeleteOptions<T> {
  where: Partial<T & { id: number }>;
}
```

### ComplexDeleteOptions

```typescript
interface ComplexDeleteOptions<T> {
  where?: WhereCondition[];
  orWhere?: WhereCondition[];
  limit?: number;
}
```

## API 方法

### 基础 CRUD 操作

#### `insert(options: T): number | bigint`

插入单条记录

```typescript
const id = userModel.insert({
  name: "John Doe",
  email: "john@example.com",
  age: 30,
});
```

#### `insertMany(records: Array<T>): Array<number | bigint>`

批量插入记录

```typescript
const ids = userModel.insertMany([
  { name: "John", email: "john@example.com", age: 30 },
  { name: "Jane", email: "jane@example.com", age: 25 },
]);
```

#### `query(options: Partial<T & { id: number }>): T | null`

简单查询（单条记录）

```typescript
const user = userModel.query({ email: "john@example.com" });
```

#### `update(options: Partial<T & { id: number }>): void`

更新单条记录

```typescript
userModel.update({ id: 1, age: 31 });
```

#### `delete(id: number): number`

#### `delete(options: DeleteOptions<T>): number`

删除记录（支持方法重载）

```typescript
// 通过ID删除单条记录
const count1 = userModel.delete(1);

// 通过条件删除多条记录
const count2 = userModel.delete({
  where: { status: "inactive" },
});
```

#### `complexDelete(options: ComplexDeleteOptions<T>): number`

复杂删除操作

```typescript
const deletedCount = userModel.complexDelete({
  where: [
    { field: "age", operator: ">", value: 50 },
    { field: "status", operator: "=", value: "inactive" },
  ],
  orWhere: [{ field: "department", operator: "=", value: "Deprecated" }],
  limit: 10, // 最多删除10条记录
});
```

#### `deleteBy(field: keyof T, value: any): number`

按字段删除

```typescript
const deletedCount = userModel.deleteBy("department", "OldDept");
```

#### `deleteWhere(conditions: Partial<T & { id: number }>): number`

多条件删除

```typescript
const deletedCount = userModel.deleteWhere({
  status: "inactive",
  age: 65,
});
```

### 高级查询操作

#### `findOne(options: QueryOptions<T>): T | null`

灵活的单条查询

```typescript
const user = userModel.findOne({
  where: { status: "active" },
  orderBy: "created_at DESC",
});
```

#### `findMany(options: QueryOptions<T>): T[]`

灵活的多条查询

```typescript
const users = userModel.findMany({
  where: { status: "active" },
  orderBy: "name ASC",
  limit: 10,
  offset: 0,
  select: ["name", "email"],
});
```

#### `complexQuery(options: ComplexQueryOptions<T>): T[]`

复杂查询

```typescript
const results = userModel.complexQuery({
  where: [
    { field: "age", operator: ">", value: 18 },
    { field: "status", operator: "=", value: "active" },
  ],
  orWhere: [{ field: "department", operator: "=", value: "Admin" }],
  orderBy: [
    { field: "age", direction: "DESC" },
    { field: "name", direction: "ASC" },
  ],
  limit: 20,
});
```

#### `paginate(page: number, pageSize: number, options?: QueryOptions<T>)`

分页查询

```typescript
const result = userModel.paginate(1, 10, {
  where: { status: "active" },
  orderBy: "created_at DESC",
});
// 返回: { data, total, page, pageSize, totalPages }
```

### 批量操作

#### `updateMany(options: UpdateOptions<T>): number`

批量更新

```typescript
const updatedCount = userModel.updateMany({
  where: { department: "Engineering" },
  data: { status: "active" },
});
```

### 实用方法

#### `findBy(field: keyof T, value: any): T[]`

按字段查询

```typescript
const users = userModel.findBy("department", "Engineering");
```

#### `first(): T | null`

获取第一条记录

```typescript
const firstUser = userModel.first();
```

#### `last(): T | null`

获取最后一条记录

```typescript
const lastUser = userModel.last();
```

#### `exists(options: Partial<T & { id: number }>): boolean`

检查记录是否存在

```typescript
const exists = userModel.exists({ email: "john@example.com" });
```

#### `count(options?: Partial<T>): number`

统计记录数量

```typescript
const total = userModel.count();
const activeCount = userModel.count({ status: "active" });
```

#### `upsert(options: { where: Partial<T & { id: number }>; create: T }): T | null`

插入或更新

```typescript
const user = userModel.upsert({
  where: { email: "john@example.com" },
  create: { name: "John", email: "john@example.com", age: 30 },
});
```

#### `softDelete(id: number): void`

软删除（需要表中有 deleted_at 字段）

```typescript
userModel.softDelete(1);
```

### 事务处理

#### `transaction(fn: () => Promise<void>): void`

事务操作

```typescript
userModel.transaction(async () => {
  userModel.insert({ name: "User 1", email: "user1@example.com" });
  userModel.insert({ name: "User 2", email: "user2@example.com" });
});
```

## 使用示例

### 1. 创建模型

```typescript
import Database from "better-sqlite3";
import BaseModel from "./baseModel.js";

interface User {
  name: string;
  email: string;
  age: number;
  status: "active" | "inactive";
}

class UserModel extends BaseModel<User> {
  constructor(db: InstanceType<typeof Database>) {
    super(db, "users");
    this.createTable(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }
}
```

### 2. 基本使用

```typescript
const db = new Database(":memory:");
const userModel = new UserModel(db);

// 插入数据
const userId = userModel.insert({
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  status: "active",
});

// 查询数据
const user = userModel.query({ id: userId as number });
const activeUsers = userModel.findMany({
  where: { status: "active" },
  orderBy: "name ASC",
});

// 更新数据
userModel.update({ id: userId as number, age: 31 });

// 删除数据
userModel.delete(userId as number);
```

### 3. 高级查询

```typescript
// 复杂查询
const results = userModel.complexQuery({
  where: [
    { field: "age", operator: ">=", value: 18 },
    { field: "age", operator: "<=", value: 65 },
  ],
  orderBy: [{ field: "age", direction: "ASC" }],
  limit: 10,
});

// 分页查询
const pagination = userModel.paginate(1, 5, {
  where: { status: "active" },
});
```

## 注意事项

1. 所有查询方法都是同步的，基于 better-sqlite3 的同步 API
2. 事务操作是异步的，需要使用 async/await
3. 表结构需要包含 `id`（主键）和 `created_at`（创建时间）字段
4. 软删除功能需要表中有 `deleted_at` 字段
5. 复杂查询中的操作符支持：`=`, `!=`, `>`, `<`, `>=`, `<=`, `LIKE`, `IN`, `NOT IN`

## 扩展建议

你可以通过继承 BaseModel 来创建特定的模型类，并添加业务相关的方法：

```typescript
class UserModel extends BaseModel<User> {
  findByEmail(email: string) {
    return this.findOne({ where: { email } });
  }

  findActiveUsers() {
    return this.findMany({ where: { status: "active" } });
  }

  // 其他业务相关方法...
}
```
