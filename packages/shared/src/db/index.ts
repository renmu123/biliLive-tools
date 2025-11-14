import path from "node:path";
import Database from "better-sqlite3";

import DanmaModel from "./model/danmu.js";
import StreamModel from "./model/streamer.js";
import RecordHistoryModel from "./model/recordHistory.js";
import VideoSubModel from "./model/videoSub.js";
import VideoSubDataModel from "./model/videoSubData.js";
import VirtualRecordController from "./model/virtualRecord.js";
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
export const streamerModel = new StreamModel();
export const recordHistoryModel = new RecordHistoryModel();
export const videoSubModel = new VideoSubModel();
export const videoSubDataModel = new VideoSubDataModel();
export const uploadPartModel = new UploadPartController();
export const virtualRecordModel = new VirtualRecordController();

export let dbContainer: ReturnType<typeof setupContainer>;
export let statisticsService: Container["statisticsService"];

export const initDB = (dbPath: string) => {
  const mainDBPath = path.join(dbPath, "app.db");
  const danmaDBPath = path.join(dbPath, "dm0.db");

  db.init(mainDBPath);
  danmaDb.init(danmaDBPath);

  streamerModel.init(db.db);
  recordHistoryModel.init(db.db);
  videoSubModel.init(db.db);
  videoSubDataModel.init(db.db);
  uploadPartModel.init(db.db);
  virtualRecordModel.init(db.db);

  // 弹幕数据库
  danmuModel.init(danmaDb.db);

  // 依赖注入容器
  dbContainer = setupContainer(db.db);
  statisticsService = dbContainer.resolve("statisticsService");

  return db;
};

export const reconnectDB = () => {
  // danmuModel.init(db.db);
  streamerModel.init(db.db);
  recordHistoryModel.init(db.db);
  // statisticsModel.init(db.db);
  videoSubModel.init(db.db);
  videoSubDataModel.init(db.db);
  uploadPartModel.init(db.db);
  virtualRecordModel.init(db.db);
  return db;
};

export default db;
