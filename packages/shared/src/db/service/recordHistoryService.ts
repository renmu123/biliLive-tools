import type RecordHistoryModel from "../model/recordHistory.js";
import type { BaseLiveHistory, LiveHistory } from "../model/recordHistory.js";
import type { Streamer } from "../model/streamer.js";
import type { StreamerService } from "./index.js";

export default class RecordHistoryService {
  private recordHistoryModel: RecordHistoryModel;
  private streamerService: StreamerService;

  constructor({
    recordHistoryModel,
    streamerService,
  }: {
    recordHistoryModel: RecordHistoryModel;
    streamerService: StreamerService;
  }) {
    this.recordHistoryModel = recordHistoryModel;
    this.streamerService = streamerService;
  }

  add(options: BaseLiveHistory) {
    return this.recordHistoryModel.add(options);
  }

  addMany(list: BaseLiveHistory[]) {
    return this.recordHistoryModel.addMany(list);
  }

  list(options: Partial<LiveHistory>): LiveHistory[] {
    return this.recordHistoryModel.list(options);
  }

  /**
   * 分页查询记录历史，支持时间范围过滤和排序
   * @param options 查询参数
   * @returns 分页结果
   */
  paginate(options: {
    where: Partial<LiveHistory>;
    page?: number;
    pageSize?: number;
    startTime?: number;
    endTime?: number;
    orderBy?: string;
    orderDirection?: "ASC" | "DESC";
  }): { data: LiveHistory[]; total: number } {
    return this.recordHistoryModel.paginateWithTimeRange(options);
  }

  query(
    options: Partial<LiveHistory & { include: { streamer: boolean } }>,
  ): (LiveHistory & { streamer?: Streamer | null }) | null {
    const item = this.recordHistoryModel.query(options);
    if (item && options.include?.streamer) {
      (item as LiveHistory & { streamer?: Streamer | null }).streamer =
        this.streamerService.query({ id: item.streamer_id }) || null;
    }
    return item;
  }

  update(options: Partial<LiveHistory & { id: number }>) {
    return this.recordHistoryModel.update(options);
  }

  /**
   * 删除单个录制历史记录
   * @param id 记录ID
   * @returns 删除的记录数量
   */
  removeRecord(id: number): number {
    return this.recordHistoryModel.deleteBy("id", id);
  }

  /**
   * 批量删除录制历史记录
   * @param streamerId 主播ID
   * @returns 删除的记录数量
   */
  removeRecordsByStreamerId(streamerId: number): number {
    return this.recordHistoryModel.deleteBy("streamer_id", streamerId);
  }

  /**
   * 批量获取多个频道的最后录制时间
   * @param streamerIds 主播ID列表
   * @returns 最后录制时间映射表
   */
  getLastRecordTimes(streamerIds: number[]): Map<number, number | null> {
    return this.recordHistoryModel.getLastRecordTimes(streamerIds);
  }

  /**
   * 查询总视频时长，默认查询最近一个月
   * @param options 查询参数
   * @returns 总时长（秒）
   */
  getTotalDuration(options?: {
    streamerId?: number;
    startTime?: number;
    endTime?: number;
  }): number {
    const now = Math.floor(Date.now() / 1000);
    const oneMonthAgo = now - 30 * 24 * 60 * 60; // 30天前的时间戳

    const queryOptions = {
      streamerId: options?.streamerId,
      startTime: options?.startTime ?? oneMonthAgo,
      endTime: options?.endTime ?? now,
    };

    return this.recordHistoryModel.getTotalDuration(queryOptions);
  }
}
