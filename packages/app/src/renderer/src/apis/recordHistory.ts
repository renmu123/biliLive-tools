import request from "./request";

/**
 * 查询直播记录列表
 * @param params 查询参数
 * @returns 查询结果
 */
export interface QueryRecordsParams {
  room_id: string;
  platform: string;
  page?: number;
  pageSize?: number;
  startTime?: number;
  endTime?: number;
}

export interface RecordHistoryItem {
  id: number;
  streamer_id: number;
  live_start_time: number;
  record_start_time: number;
  record_end_time?: number;
  title: string;
  video_file?: string;
  created_at: number;
  video_duration?: number;
  danma_num?: number;
  interact_num?: number;
  danma_density?: number | null; // 弹幕密度，弹幕数量/视频时长
}

export interface QueryRecordsResponse {
  code: number;
  data: RecordHistoryItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

/**
 * 查询直播记录
 */
export async function queryRecords(params: QueryRecordsParams) {
  const res = await request.get("/record-history/list", {
    params,
  });
  return res.data;
}

/**
 * 删除单个直播记录
 * @param id 记录ID
 * @returns 删除结果
 */
export async function removeRecord(id: number) {
  const res = await request.delete(`/record-history/${id}`);
  return res.data;
}

/**
 * 获取视频文件
 * @param id 记录ID
 * @returns 视频文件路径
 */
export async function getVideoFile(id: number) {
  const res = await request.get(`/record-history/video/${id}`);
  return res.data;
}

export async function getTempVideoId(id: number): Promise<{ fileId: string; type: string }> {
  const res = await request.get(`/record-history/download/${id}`);
  return res.data;
}

/**
 * 下载视频文件
 */
export async function downloadFile(id: number): Promise<string> {
  const { fileId } = await getTempVideoId(id);
  const fileUrl = `${request.defaults.baseURL}/assets/download/${fileId}`;
  return fileUrl;
}

export default {
  queryRecords,
  removeRecord,
  getVideoFile,
  downloadFile,
  getTempVideoId,
};
