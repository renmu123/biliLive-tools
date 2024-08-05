import BaseModel from "./baseModel.js";
import { validateAndFilter } from "./utils.js";
import { streamerService, liveService } from "./index.js";

import type { Database } from "sqlite";
import type { DanmaType, DanmuItem } from "@biliLive-tools/types";

interface BaseDanmu {
  text?: string;
  ts?: number;
  type: DanmaType;
  user?: string;
  gift_price?: number;
  source?: string;
  p?: string;
  streamer_id?: number;
  live_id?: number;
}

type Danma = BaseDanmu & {
  id: number;
  created_at: number;
};

class DanmaModel extends BaseModel<BaseDanmu> {
  table = "danma";

  constructor(db: Database) {
    super(db, "danma");
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,           -- 自增主键
        text TEXT,                                      -- 弹幕内容
        ts INTEGER,                                     -- 相对时间戳
        type TEXT DEFAULT unknown,                      -- 弹幕类型，text：普通弹幕，gift：礼物弹幕，guard：上舰弹幕，sc：SC弹幕，unknown：未知
        created_at INTEGER DEFAULT (strftime('%s', 'now')),  -- 创建时间，时间戳，自动生成
        user TEXT,                                      -- 发送用户名
        gift_price INTEGER DEFAULT 0,                   -- 礼物价格，默认为0
        source TEXT,                                    -- 来源
        streamer_id INTEGER,                            -- 主播id
        live_id INTEGER,                                -- 直播场次id
        p TEXT,                                         -- 普通弹幕的基础数据
        FOREIGN KEY (streamer_id) REFERENCES streamer(id),  -- 外键约束
        FOREIGN KEY (live_id) REFERENCES live(id)           -- 外键约束
        ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }
}

export default class DanmaController {
  private model: DanmaModel;
  private requireFields: (keyof BaseDanmu)[] = [
    "text",
    "ts",
    "type",
    "user",
    "gift_price",
    "source",
    "p",
    "streamer_id",
    "live_id",
  ];
  async init(db: Database) {
    this.model = new DanmaModel(db);
    await this.model.createTable();
  }
  async addWithStreamer(list: DanmuItem[]) {
    if (!Array.isArray(list)) return;
    const streamMap = new Map();
    const liveMap = new Map();

    const danmaList: (DanmuItem & BaseDanmu)[] = [];
    for (const item of list) {
      const options: DanmuItem & BaseDanmu = item;

      // 如果有streamer和room_id，就去查找或新建streamer_id
      if (options.streamer && options.room_id) {
        const key = `${options.room_id}-${options.streamer}`;

        if (!streamMap.has(key)) {
          const streamer = await streamerService.upsert({
            where: {
              name: options.streamer,
              room_id: options.room_id,
            },
            create: {
              name: options.streamer,
              room_id: options.room_id,
              platform: options.platform,
            },
          });
          streamMap.set(key, streamer.id);
        }
        options.streamer_id = streamMap.get(key);
      }
      // 如果有streamer_id和live_start_time和live_title，就去查找或新建live
      if (options.streamer_id && options.live_start_time && options.live_title) {
        const key = `${options.streamer_id}-${options.live_start_time}`;
        if (!liveMap.has(key)) {
          const streamer = await liveService.upsert({
            where: {
              streamer_id: options.streamer_id,
              start_time: options.live_start_time,
            },
            create: {
              title: options.live_title,
              streamer_id: options.streamer_id,
              start_time: options.live_start_time,
            },
          });
          liveMap.set(key, streamer.id);
        }
        options.live_id = liveMap.get(key);
      }
      danmaList.push(options);
    }

    await this.addMany(danmaList);
    return true;
  }
  async addDanma(options: BaseDanmu) {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    console.log(filterOptions, options);
    return this.model.insert(options);
  }
  async addMany(list: BaseDanmu[]) {
    const filterList = list.map((item) =>
      validateAndFilter(item, this.requireFields, []),
    ) as BaseDanmu[];
    return this.model.insertMany(filterList);
  }

  async list(options: Partial<Danma>): Promise<Danma[]> {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    return this.model.list(filterOptions);
  }

  async query(options: Partial<Danma>) {
    const filterOptions = validateAndFilter(options, this.requireFields, []);
    console.log(filterOptions, options);
    return this.model.query(filterOptions);
  }

  async close() {
    return this.model.close();
  }
}
