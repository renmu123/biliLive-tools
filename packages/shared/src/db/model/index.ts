import Database from "better-sqlite3";

import DanmaModel from "./danmu.js";
import StreamModel from "./streamer.js";
import LiveModel from "./live.js";

import type { Database as DatabaseType } from "better-sqlite3";

class DB {
  filename!: string;
  db!: DatabaseType;
  constructor() {
    // init
  }

  init(filename: string) {
    this.filename = filename;

    const db = Database(filename);
    // 启用外键支持
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");
    this.db = db;
  }
  close() {
    this.db.close();
  }
}

const db = new DB();
export const danmuModel = new DanmaModel();
export const streamerModel = new StreamModel();
export const liveModel = new LiveModel();

export const initDB = (filename: string) => {
  db.init(filename);

  danmuModel.init(db.db);
  streamerModel.init(db.db);
  liveModel.init(db.db);
  return db;
};

export default db;
