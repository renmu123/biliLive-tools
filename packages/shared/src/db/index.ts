import Database1 from "better-sqlite3";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

import DanmaController from "./danmu.js";
import StreamerController from "./streamer.js";
import LiveController from "./live.js";

import type { Database } from "sqlite";

class DB {
  filename: string;
  db: Database;
  constructor() {
    // init
  }

  async init(filename: string) {
    this.filename = filename;

    const db = await open({
      filename: filename,
      driver: sqlite3.Database,
    });
    // 启用外键支持
    await db.exec("PRAGMA foreign_keys = ON");
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
  const db1 = new Database1("foobar.db");
  db1.pragma("journal_mode = WAL");
  console.log(db1.pragma("journal_mode"));
  await db.init(filename);

  await danmuService.init(db.db);
  await streamerService.init(db.db);
  await liveService.init(db.db);
  return db;
};

export default db;
