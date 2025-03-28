import Database from "better-sqlite3";

import DanmaModel from "./model/danmu.js";
import StreamModel from "./model/streamer.js";
import LiveModel from "./model/live.js";
import VideoSubModel from "./model/videoSub.js";
import VideoSubDataModel from "./model/videoSubData.js";
import StatisticsModel from "./model/statistics.js";

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
export const statisticsModel = new StatisticsModel();
export const videoSubModel = new VideoSubModel();
export const videoSubDataModel = new VideoSubDataModel();

export const initDB = (filename: string) => {
  db.init(filename);

  // danmuModel.init(db.db);
  // streamerModel.init(db.db);
  // liveModel.init(db.db);
  statisticsModel.init(db.db);
  videoSubModel.init(db.db);
  videoSubDataModel.init(db.db);
  return db;
};

export default db;
