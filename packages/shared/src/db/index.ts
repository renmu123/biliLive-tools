import path from "node:path";
import Database from "better-sqlite3";

import DanmaModel from "./model/danmu.js";
import RecordHistoryModel from "./model/recordHistory.js";
import VideoSubModel from "./model/videoSub.js";
import UploadPartController from "./model/uploadPart.js";
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
const danmaDb = new DB();
export const danmuModel = new DanmaModel();
export const recordHistoryModel = new RecordHistoryModel();
export const videoSubModel = new VideoSubModel();
export const uploadPartModel = new UploadPartController();

export let dbContainer: ReturnType<typeof setupContainer>;
export let statisticsService: Container["statisticsService"];
export let virtualRecordService: Container["virtualRecordService"];
export let videoSubDataService: Container["videoSubDataService"];
export let streamerService: Container["streamerService"];

export const initDB = (dbPath: string) => {
  const mainDBPath = path.join(dbPath, "app.db");
  const danmaDBPath = path.join(dbPath, "dm0.db");

  db.init(mainDBPath);
  danmaDb.init(danmaDBPath);

  recordHistoryModel.init(db.db);
  videoSubModel.init(db.db);
  uploadPartModel.init(db.db);

  // 弹幕数据库
  danmuModel.init(danmaDb.db);

  // 依赖注入容器
  dbContainer = setupContainer(db.db);
  statisticsService = dbContainer.resolve("statisticsService");
  virtualRecordService = dbContainer.resolve("virtualRecordService");
  videoSubDataService = dbContainer.resolve("videoSubDataService");
  streamerService = dbContainer.resolve("streamerService");

  return db;
};

export const reconnectDB = () => {
  // danmuModel.init(db.db);
  recordHistoryModel.init(db.db);
  // statisticsModel.init(db.db);
  videoSubModel.init(db.db);
  uploadPartModel.init(db.db);
  return db;
};

export default db;
