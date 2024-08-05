import BaseModel from "./baseModel.js";
import { validateAndFilter } from "./utils.js";

import type { Database } from "sqlite";

interface BaseLive {
  streamer_id: number;
  start_time: number;
  title: string;
}

interface Live extends BaseLive {
  id: number;
  created_at: number;
}

class LiveModel extends BaseModel<BaseLive> {
  table = "live";

  constructor(db: Database) {
    super(db, "live");
  }

  async createTable() {
    const createTableSQL = `  
      CREATE TABLE IF NOT EXISTS live (
        id INTEGER PRIMARY KEY AUTOINCREMENT,                -- 自增主键
        created_at INTEGER DEFAULT (strftime('%s', 'now')),  -- 创建时间，时间戳，自动生成
        streamer_id INTEGER NOT NULL,                        -- 主播id
        start_time INTEGER NOT NULL UNIQUE,                  -- 直播开始时间，秒时间戳
        title TEXT,                                          -- 直播标题
        FOREIGN KEY (streamer_id) REFERENCES streamer(id)    -- 外键约束
      )
    `;
    return super.createTable(createTableSQL);
  }
}

export default class LiveController {
  private model: LiveModel;
  private requireFields: (keyof BaseLive)[] = ["streamer_id", "start_time", "title"];
  async init(db: Database) {
    console.log("init live");
    this.model = new LiveModel(db);
    await this.model.createTable();
  }

  async add(options: BaseLive) {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    console.log(filterOptions, options);
    return this.model.insert(options);
  }
  async addMany(list: BaseLive[]) {
    return this.model.insertMany(list);
  }

  async list(options: Partial<Live>): Promise<Live[]> {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    return this.model.list(filterOptions);
  }

  async query(options: Partial<Live>) {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    console.log(filterOptions, options);
    return this.model.query(filterOptions);
  }
  async upsert(options: { where: Partial<Live & { id: number }>; create: BaseLive }) {
    return this.model.upsert(options);
  }

  async close() {
    return this.model.close();
  }
}
