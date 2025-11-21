import type { Database } from "better-sqlite3";
import DanmuModel from "../model/danmu.js";
import type { BaseDanmu, Danmu } from "../model/danmu.js";

/**
 * 弹幕服务
 * 管理多个直播间的弹幕数据模型
 */
export default class DanmuService {
  private db: Database;
  private models: Map<string, DanmuModel>;

  constructor({ danmuDb }: { danmuDb: Database }) {
    this.db = danmuDb;
    this.models = new Map();
  }

  /**
   * 获取或创建指定直播间的弹幕模型
   */
  private getModel(platform: string, roomId: string): DanmuModel {
    const key = `${platform}_${roomId}`;

    if (!this.models.has(key)) {
      const model = new DanmuModel({ db: this.db, platform, roomId });
      this.models.set(key, model);
    }

    return this.models.get(key)!;
  }

  /**
   * 检查表是否存在
   */
  private tableExists(platform: string, roomId: string): boolean {
    const tableName = `danmu_${platform}_${roomId}`;
    const result = this.db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(tableName);
    return !!result;
  }

  /**
   * 添加单条弹幕
   */
  add(
    data: BaseDanmu,
    options: {
      platform: string;
      roomId: string;
    },
  ) {
    const model = this.getModel(options.platform, options.roomId);
    return model.add(data);
  }

  /**
   * 批量添加弹幕
   */
  addMany(
    list: BaseDanmu[],
    options: {
      platform: string;
      roomId: string;
    },
  ) {
    if (list.length === 0) return [];

    const model = this.getModel(options.platform, options.roomId);
    return model.addMany(list);
  }

  /**
   * 查询单条弹幕
   */
  query(platform: string, roomId: string, options: Partial<Omit<Danmu, "platform" | "room_id">>) {
    const model = this.getModel(platform, roomId);
    return model.query(options);
  }

  /**
   * 查询弹幕列表
   */
  list(
    platform: string,
    roomId: string,
    options: Partial<Omit<Danmu, "platform" | "room_id">>,
  ): (Danmu & { id: number })[] {
    const model = this.getModel(platform, roomId);
    return model.list(options);
  }

  /**
   * 根据录制场次ID查询弹幕
   */
  getByRecordId(platform: string, roomId: string, recordId: number) {
    const model = this.getModel(platform, roomId);
    return model.getByRecordId(recordId);
  }

  /**
   * 根据录制场次ID和时间范围查询弹幕
   */
  getByRecordIdAndTimeRange(
    platform: string,
    roomId: string,
    recordId: number,
    startTs: number,
    endTs: number,
  ) {
    const model = this.getModel(platform, roomId);
    return model.getByRecordIdAndTimeRange(recordId, startTs, endTs);
  }

  /**
   * 查询礼物弹幕统计
   */
  getGiftStatistics(platform: string, roomId: string, recordId: number) {
    const model = this.getModel(platform, roomId);
    return model.getGiftStatistics(recordId);
  }

  /**
   * 根据录制场次ID删除弹幕
   */
  deleteByRecordId(platform: string, roomId: string, recordId: number) {
    const model = this.getModel(platform, roomId);
    return model.deleteByRecordId(recordId);
  }

  /**
   * 分页查询弹幕
   */
  paginate(
    platform: string,
    roomId: string,
    page: number,
    pageSize: number,
    options: Partial<Omit<Danmu, "platform" | "room_id">> = {},
  ) {
    const model = this.getModel(platform, roomId);
    return model.paginate(page, pageSize, { where: options });
  }

  /**
   * 统计弹幕数量
   */
  count(platform: string, roomId: string, options: Partial<BaseDanmu> = {}) {
    const model = this.getModel(platform, roomId);
    return model.count(options);
  }

  /**
   * 清理指定直播间的模型缓存
   */
  clearModelCache(platform: string, roomId: string) {
    const key = `${platform}_${roomId}`;
    this.models.delete(key);
  }

  /**
   * 清理所有模型缓存
   */
  clearAllCache() {
    this.models.clear();
  }
}
