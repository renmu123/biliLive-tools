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

export interface StreamerDetailResponse {
  streamer: {
    id: number;
    name: string;
    platform: string;
    room_id: string;
  } | null;
  summary: StreamerDetailSummary;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
  data: StreamerDetailSessionCard[];
}

export type StreamerDetailAPI = {
  query: {
    Args: StreamerDetailQueryArgs;
    Resp: StreamerDetailResponse;
  };
};
