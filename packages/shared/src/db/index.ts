import path from "node:path";
import Database from "better-sqlite3";

import { setupContainer } from "./container.js";

import type { Database as DatabaseType } from "better-sqlite3";
import type { Container } from "./container.js";

class DB {
  filename!: string;
  db!: DatabaseType;
  constructor() {
    // init
  }

  init(filename: string) {
    this.filename = filename;

    this.open();
  }
  open() {
    const db = Database(this.filename);
    // 启用外键支持
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");
    this.db = db;
  }
  close() {
    this.db.close();
  }
  backup(filename: string) {
    return this.db.backup(filename);
  }
}

const db = new DB();
const danmuDB = new DB();

export let dbContainer: ReturnType<typeof setupContainer>;
export let statisticsService: Container["statisticsService"];
export let virtualRecordService: Container["virtualRecordService"];
export let videoSubDataService: Container["videoSubDataService"];
export let streamerService: Container["streamerService"];
export let videoSubService: Container["videoSubService"];
export let recordHistoryService: Container["recordHistoryService"];
export let uploadPartService: Container["uploadPartService"];
export let danmuService: Container["danmuService"];

export const initDB = (dbPath: string) => {
  const mainDBPath = path.join(dbPath, "app.db");
  const danmuDBPath = path.join(dbPath, "dm0.db");

  db.init(mainDBPath);
  danmuDB.init(danmuDBPath);

  // 依赖注入容器 - 主数据库
  dbContainer = setupContainer(db.db, danmuDB.db);
  statisticsService = dbContainer.resolve("statisticsService");
  virtualRecordService = dbContainer.resolve("virtualRecordService");
  videoSubDataService = dbContainer.resolve("videoSubDataService");
  streamerService = dbContainer.resolve("streamerService");
  videoSubService = dbContainer.resolve("videoSubService");
  recordHistoryService = dbContainer.resolve("recordHistoryService");
  uploadPartService = dbContainer.resolve("uploadPartService");

  // 弹幕服务 - 使用独立的弹幕数据库
  danmuService = dbContainer.resolve("danmuService");

  return db;
};

export const reconnectDB = () => {
  return db;
};

export default db;
