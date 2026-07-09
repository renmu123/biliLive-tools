import { recordHistoryService, streamerService } from "../index.js";

import type { LiveHistory } from "../model/recordHistory.js";
import type { Streamer } from "../model/streamer.js";

const UNKNOWN_LIVE_ID = "__unknown_live_id__";

export interface StreamerDetailQueryArgs {
  room_id: string;
  platform: string;
  page?: number;
  pageSize?: number;
  startTime?: number;
  endTime?: number;
}

export interface StreamerDetailClip {
  id: number;
  title: string;
  live_start_time?: number;
  record_start_time: number;
  record_end_time?: number;
  video_file?: string;
  video_filename?: string;
  video_duration?: number;
  danma_num?: number;
  interact_num?: number;
  quick_hash?: string;
}

export interface StreamerDetailSessionCard {
  sessionKey: string;
  liveId: string | null;
  displayLiveId: string;
  title: string;
  liveStartTime: number | null;
  lastRecordTime: number | null;
  recordStartTime: number | null;
  clipCount: number;
  totalDuration: number;
  totalDanmaNum: number;
  totalInteractNum: number;
  clips: StreamerDetailClip[];
}

export interface StreamerDetailSummary {
  sessionCount: number;
  clipCount: number;
  totalDuration: number;
  totalDanmaNum: number;
  totalInteractNum: number;
  lastRecordTime: number | null;
}

export interface StreamerDetailResult {
  streamer: Streamer | null;
  summary: StreamerDetailSummary;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
  data: StreamerDetailSessionCard[];
}

const getRecordDuration = (record: LiveHistory) => {
  if (record.video_duration && record.video_duration > 0) {
    return record.video_duration;
  }

  if (record.record_end_time && record.record_end_time > record.record_start_time) {
    return (record.record_end_time - record.record_start_time) / 1000;
  }

  return 0;
};

const toSessionKey = (record: LiveHistory) => record.live_id || UNKNOWN_LIVE_ID;

const toSessionCard = (records: LiveHistory[]): StreamerDetailSessionCard => {
  const sortedRecords = [...records].sort(
    (left, right) => right.record_start_time - left.record_start_time,
  );
  const latestRecord = sortedRecords[0] || null;

  const earliestLiveStart = records
    .map((item) => item.live_start_time)
    .filter((item): item is number => typeof item === "number" && item > 0)
    .sort((left, right) => left - right)[0];

  const earliestRecordSTart = records
    .map((item) => item.record_start_time)
    .filter((item): item is number => typeof item === "number" && item > 0)
    .sort((left, right) => left - right)[0];

  return {
    sessionKey: toSessionKey(records[0]),
    liveId: records[0].live_id || null,
    displayLiveId: records[0].live_id || "未识别场次",
    title: latestRecord?.title || records[0].title || "未命名场次",
    liveStartTime: earliestLiveStart || null,
    recordStartTime: earliestRecordSTart || null,
    lastRecordTime: latestRecord?.record_start_time || null,
    clipCount: records.length,
    totalDuration: records.reduce((total, item) => total + getRecordDuration(item), 0),
    totalDanmaNum: records.reduce((total, item) => total + (item.danma_num || 0), 0),
    totalInteractNum: records.reduce((total, item) => total + (item.interact_num || 0), 0),
    clips: sortedRecords.map((item) => ({
      id: item.id,
      title: item.title,
      live_start_time: item.live_start_time,
      record_start_time: item.record_start_time,
      record_end_time: item.record_end_time,
      video_file: item.video_file,
      video_filename: item.video_filename,
      video_duration: item.video_duration,
      danma_num: item.danma_num,
      interact_num: item.interact_num,
      quick_hash: item.quick_hash,
    })),
  };
};

const emptySummary = (): StreamerDetailSummary => ({
  sessionCount: 0,
  clipCount: 0,
  totalDuration: 0,
  totalDanmaNum: 0,
  totalInteractNum: 0,
  lastRecordTime: null,
});

export function queryStreamerDetail(args: StreamerDetailQueryArgs): StreamerDetailResult {
  const page = Number(args.page) > 0 ? Number(args.page) : 1;
  const pageSize = Number(args.pageSize) > 0 ? Number(args.pageSize) : 10;
  const streamer =
    streamerService.query({ room_id: args.room_id, platform: args.platform }) || null;

  if (!streamer) {
    return {
      streamer: null,
      summary: emptySummary(),
      pagination: {
        total: 0,
        page,
        pageSize,
      },
      data: [],
    };
  }

  const records = recordHistoryService.list({ streamer_id: streamer.id }).filter((item) => {
    if (args.startTime && item.record_start_time < args.startTime) {
      return false;
    }
    if (args.endTime && item.record_start_time > args.endTime) {
      return false;
    }
    return true;
  });

  const groupedRecords = records.reduce<Map<string, LiveHistory[]>>((result, item) => {
    const sessionKey = toSessionKey(item);
    const currentValue = result.get(sessionKey) || [];
    currentValue.push(item);
    result.set(sessionKey, currentValue);
    return result;
  }, new Map());

  const sessionCards = Array.from(groupedRecords.values())
    .map((items) => toSessionCard(items))
    .sort((left, right) => (right.lastRecordTime || 0) - (left.lastRecordTime || 0));

  const startIndex = (page - 1) * pageSize;
  const pagedCards = sessionCards.slice(startIndex, startIndex + pageSize);

  return {
    streamer,
    summary: {
      sessionCount: sessionCards.length,
      clipCount: records.length,
      totalDuration: sessionCards.reduce((total, item) => total + item.totalDuration, 0),
      totalDanmaNum: sessionCards.reduce((total, item) => total + item.totalDanmaNum, 0),
      totalInteractNum: sessionCards.reduce((total, item) => total + item.totalInteractNum, 0),
      lastRecordTime: sessionCards[0]?.lastRecordTime || null,
    },
    pagination: {
      total: sessionCards.length,
      page,
      pageSize,
    },
    data: pagedCards,
  };
}

export default {
  queryStreamerDetail,
};
