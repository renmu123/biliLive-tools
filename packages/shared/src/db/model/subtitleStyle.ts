import { z } from "zod";
import BaseModel from "./baseModel.js";

import type { Database } from "better-sqlite3";
import type { SubtitleOptions } from "@biliLive-tools/types";

const BaseSubtitleStyle = z.object({
  id: z.string(),
  config: z.string(), // JSON string
});

const SubtitleStyle = BaseSubtitleStyle.extend({});

export type BaseSubtitleStyle = z.infer<typeof BaseSubtitleStyle>;
export type SubtitleStyleRecord = z.infer<typeof SubtitleStyle>;

export interface SubtitleStyleConfig extends SubtitleOptions {
  name: string;
}

export default class SubtitleStyleModel extends BaseModel<BaseSubtitleStyle> {
  constructor({ db }: { db: Database }) {
    super(db, "subtitle_style");
    this.createTable();
  }

  async createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,                            -- 预设ID
        config TEXT NOT NULL                            -- JSON配置(包含name和SubtitleOptions)
      ) STRICT;
    `;
    return super.createTable(createTableSQL);
  }

  add(options: { id: string; config: SubtitleStyleConfig }) {
    const data = {
      id: options.id,
      config: JSON.stringify(options.config),
    };
    const parsed = BaseSubtitleStyle.parse(data);
    return this.insert(parsed);
  }

  // update(options: { id: string; config: SubtitleStyleConfig }) {
  //   const data = {
  //     config: JSON.stringify(options.config),
  //   };
  //   return this.update({
  //     id: options.id,
  //     config: data.config,
  //   });
  // }

  get(id: string): { id: string; config: SubtitleStyleConfig } | null {
    const result = this.query({ id } as any);
    if (!result) return null;
    return {
      id: result.id,
      config: JSON.parse(result.config),
    };
  }

  remove(id: string) {
    return this.deleteBy("id", id);
  }
}
