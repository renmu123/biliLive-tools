import { streamerService, recordHistoryService } from "../db/index.js";

import type { BaseLiveHistory, LiveHistory } from "../db/model/recordHistory.js";
import type { BaseStreamer } from "../db/model/streamer.js";

export interface QueryRecordsOptions {
  room_id: string;
  platform: string;
  page?: number;
  pageSize?: number;
  startTime?: number;
  endTime?: number;
}

export interface QueryRecordsResult {
  data: Array<LiveHistory>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export function addWithStreamer(data: Omit<BaseLiveHistory, "streamer_id"> & BaseStreamer) {
  const streamer = streamerService.upsert({
    where: {
      room_id: data.room_id,
      platform: data.platform,
    },
    create: {
      name: data.name,
      room_id: data.room_id,
      platform: data.platform,
    },
  });
  if (!streamer) return null;

  const live = recordHistoryService.add({
    title: data.title,
    streamer_id: streamer.id,
    live_start_time: data.live_start_time,
    record_start_time: data.record_start_time,
    video_file: data.video_file,
    live_id: data.live_id,
  });
  return live;
}

export function upadteLive(
  query: { video_file: string; live_id?: string },
  params: {
    record_end_time?: number;
    video_duration?: number;
    danma_num?: number;
    interact_num?: number;
  },
) {
  const live = recordHistoryService.query({ video_file: query.video_file, live_id: query.live_id });
  if (live) {
    recordHistoryService.update({
      id: live.id,
      ...params,
    });
    return {
      ...live,
      ...params,
    };
  }

  return null;
}

export function queryRecordsByRoomAndPlatform(options: QueryRecordsOptions): QueryRecordsResult {
  const { room_id, platform, page = 1, pageSize = 100, startTime, endTime } = options;

  // 先查询streamer
  const streamer = streamerService.query({ room_id, platform });
  if (!streamer) {
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        pageSize,
      },
    };
  }

  // 使用数据库分页而不是内存分页
  const result = recordHistoryService.paginate({
    where: { streamer_id: streamer.id },
    page,
    pageSize,
    startTime,
    endTime,
    orderBy: "id",
    orderDirection: "DESC",
  });

  return {
    data: result.data,
    pagination: {
      total: result.total,
      page,
      pageSize,
    },
  };
}

export async function removeRecords(channelId: string, providerId: string) {
  // 查找主播ID
  const streamer = streamerService.query({
    room_id: channelId,
    platform: providerId,
  });
  if (!streamer) throw new Error("没有找到stream");

  recordHistoryService.removeRecordsByStreamerId(streamer.id);

  return true;
}

export function getRecord(data: { file: string; live_id?: string }) {
  return recordHistoryService.query({ video_file: data.file, live_id: data.live_id });
}

export function getRecordById(id: number) {
  return recordHistoryService.query({ id });
}

export function removeRecord(id: number): boolean {
  const deletedCount = recordHistoryService.removeRecord(id);
  return deletedCount > 0;
}

/**
 * 批量获取多个频道的最后录制时间
 * @param channels 频道信息数组
 * @returns 包含频道ID和最后录制时间的数组
 */
export function getLastRecordTimesByChannels(
  channels: Array<{ channelId: string; providerId: string }>,
): Array<{
  channelId: string;
  providerId: string;
  lastRecordTime: number | null;
}> {
  if (channels.length === 0) {
    return [];
  }

  // 批量查询所有streamer（一次数据库查询）
  const streamers = streamerService.batchQueryByChannels(
    channels.map(({ channelId, providerId }) => ({
      room_id: channelId,
      platform: providerId,
    })),
  );

  if (streamers.length === 0) {
    return channels.map(({ channelId, providerId }) => ({
      channelId,
      providerId,
      lastRecordTime: null,
    }));
  }

  // 批量查询最后录制时间（一次数据库查询）
  const streamerIds = streamers.map((s) => s.id);
  const lastRecordTimesMap = recordHistoryService.getLastRecordTimes(streamerIds);

  // 构建 streamer 映射表
  const streamerMap = new Map(streamers.map((s) => [`${s.platform}_${s.room_id}`, s.id]));

  return channels.map(({ channelId, providerId }) => {
    const streamerId = streamerMap.get(`${providerId}_${channelId}`);
    const lastRecordTime = streamerId ? (lastRecordTimesMap.get(streamerId) ?? null) : null;

    return {
      channelId,
      providerId,
      lastRecordTime,
    };
  });
}

export default {
  addWithStreamer,
  upadteLive,
  queryRecordsByRoomAndPlatform,
  removeRecords,
  removeRecord,
  getRecord,
  getRecordById,
  getLastRecordTimesByChannels,
};
