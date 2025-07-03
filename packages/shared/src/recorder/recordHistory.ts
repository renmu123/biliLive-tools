import { streamerModel, recordHistoryModel } from "../db/index.js";

import type { BaseLive, Live } from "../db/model/recordHistory.js";
import type { BaseStreamer } from "../db/model/streamer.js";

export function addWithStreamer(data: Omit<BaseLive, "streamer_id"> & BaseStreamer) {
  const streamer = streamerModel.upsert({
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

  const live = recordHistoryModel.add({
    title: data.title,
    streamer_id: streamer.id,
    live_start_time: data.live_start_time,
    record_start_time: data.record_start_time,
    video_file: data.video_file,
  });
  return live;
}

export function upadteLive(
  video_file: string,
  params: {
    record_end_time?: number;
    video_duration?: number;
    danma_num?: number;
    interact_num?: number;
  },
) {
  const live = recordHistoryModel.query({ video_file });
  if (live) {
    recordHistoryModel.update({
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

export interface QueryRecordsOptions {
  room_id: string;
  platform: string;
  page?: number;
  pageSize?: number;
  startTime?: number;
  endTime?: number;
}

export interface QueryRecordsResult {
  data: Array<Live>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export function queryRecordsByRoomAndPlatform(options: QueryRecordsOptions): QueryRecordsResult {
  const { room_id, platform, page = 1, pageSize = 100, startTime, endTime } = options;

  // 先查询streamer
  const streamer = streamerModel.query({ room_id, platform });
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

  // 使用封装的API而不是直接访问db
  let query: Partial<Live> = { streamer_id: streamer.id };

  // 获取总记录数
  const allRecords = recordHistoryModel.list(query);
  // const total = allRecords.length;

  // 过滤时间范围
  let filteredRecords = allRecords;
  if (startTime) {
    filteredRecords = filteredRecords.filter((record) => record.record_start_time >= startTime);
  }
  if (endTime) {
    filteredRecords = filteredRecords.filter((record) => record.record_start_time <= endTime);
  }

  // 按时间降序排序
  filteredRecords.sort((a, b) => b.record_start_time - a.record_start_time);

  // 分页
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const records = filteredRecords.slice(start, end);

  return {
    data: records,
    pagination: {
      total: filteredRecords.length,
      page,
      pageSize,
    },
  };
}

export async function removeRecords(channelId: string, providerId: string) {
  // 查找主播ID
  const streamer = streamerModel.query({
    room_id: channelId,
    platform: providerId,
  });
  if (!streamer) throw new Error("没有找到stream");

  recordHistoryModel.removeRecordsByStreamerId(streamer.id);

  return true;
}

export default {
  addWithStreamer,
  upadteLive,
  queryRecordsByRoomAndPlatform,
  removeRecords,
};
