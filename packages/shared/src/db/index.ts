import Database from "better-sqlite3";
// import sqlite3 from "sqlite3";
// import { open } from "sqlite";

import DanmaController from "./danmu.js";
import StreamerController from "./streamer.js";
import LiveController from "./live.js";

import type { Database as DatabaseType } from "better-sqlite3";

class DB {
  filename!: string;
  db!: DatabaseType;
  constructor() {
    // init
  }

  async init(filename: string) {
    this.filename = filename;

    const db = Database(filename);
    // 启用外键支持
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");
    this.db = db;
  }
  async close() {
    this.db.close();
  }
}

const db = new DB();
export const danmuService = new DanmaController();
export const streamerService = new StreamerController();
export const liveService = new LiveController();

export const initDB = async (filename: string) => {
  db.init(filename);

  danmuService.init(db.db);
  streamerService.init(db.db);
  liveService.init(db.db);
  return db;
};

export default db;
