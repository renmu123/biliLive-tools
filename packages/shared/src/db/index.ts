import sqlite3 from "sqlite3";
import { open } from "sqlite";

import DanmaController from "./danmu.js";
import StreamerController from "./streamer.js";

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
    this.db = db;
  }
  async close() {
    this.db.close();
  }
}

const db = new DB();
export const danmuService = new DanmaController();
export const streamerService = new StreamerController();

export const initDB = async (filename: string) => {
  await db.init(filename);

  await danmuService.init(db.db);
  await streamerService.init(db.db);
  return db;
};

export default db;
