import BaseModel from "./baseModel.js";
import { validateAndFilter } from "./utils.js";
import { streamerService } from "./index.js";

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
        ts INTEGER,                                     -- 时间戳
        type TEXT DEFAULT unknown,                      -- 弹幕类型，text：普通弹幕，gift：礼物弹幕，guard：上舰弹幕，sc：SC弹幕，unknown：未知
        created_at INTEGER DEFAULT (strftime('%s', 'now')),  -- 创建时间，时间戳，自动生成
        user TEXT,                                      -- 发送用户名
        gift_price INTEGER DEFAULT 0,                   -- 礼物价格，默认为0
        source TEXT,                                    -- 来源
        streamer_id INTEGER,                            -- 主播id
        p TEXT,                                         -- 普通弹幕的基础数据
        FOREIGN KEY (streamer_id) REFERENCES streamer(id)  -- 外键约束
      )
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
  ];
  async init(db: Database) {
    this.model = new DanmaModel(db);
    await this.model.createTable();
  }
  async addWithStreamer(list: DanmuItem[]) {
    if (!Array.isArray(list)) return;

    const hasStreamerList: (DanmuItem & { streamer_id?: number })[] = [];
    const noStreamerList = [];
    for (const item of list) {
      if (item.streamer && item.room_id) {
        hasStreamerList.push(item);
      } else {
        noStreamerList.push(item);
      }
    }

    // 不需要查询主播
    if (noStreamerList.length > 0) {
      this.addMany(noStreamerList);
    }
    // 需要查询主播
    if (hasStreamerList.length > 0) {
      const streamMap = new Map();
      for (const item of hasStreamerList) {
        const key = `${item.room_id}-${item.streamer}`;

        if (!streamMap.has(key)) {
          const streamer = await streamerService.query({
            name: item.streamer,
            room_id: item.room_id,
          });
          if (streamer) {
            streamMap.set(key, streamer.id);
          } else {
            const streamerId = await streamerService.add({
              name: item.streamer,
              room_id: item.room_id,
              platform: item.platform,
            });
            console.log("streamerId", streamerId);
            streamMap.set(key, streamerId);
          }
        }
        item.streamer_id = streamMap.get(key);
      }

      this.addMany(hasStreamerList);
    }
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
