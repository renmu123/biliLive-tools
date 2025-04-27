import request from "./request";

import type { RecorderAPI } from "@biliLive-tools/http/types/recorder.js";
import type { Recorder } from "@biliLive-tools/types";

/**
 * 获取录制器列表，非配置信息
 */
const infoList = async (
  params: RecorderAPI["getRecorders"]["Args"],
): Promise<RecorderAPI["getRecorders"]["Resp"]> => {
  const res = await request.get(`/recorder/list`, { params });
  return res.data.payload;
};

/**
 * 获取录制器配置信息
 */
const get = async (id: string): Promise<Recorder> => {
  const res = await request.get(`/recorder/${id}`);
  return res.data.payload;
};

const add = async (
  data: RecorderAPI["addRecorder"]["Args"],
): Promise<RecorderAPI["addRecorder"]["Resp"]> => {
  const res = await request.post(`/recorder/add`, data);
  return res.data.payload;
};

const remove = async (
  id: string,
  removeHistory: boolean = false,
): Promise<RecorderAPI["removeRecorder"]["Resp"]> => {
  const res = await request.delete(`/recorder/${id}`, {
    params: { removeHistory },
  });
  return res.data.payload;
};

const update = async (
  id: string,
  preset: RecorderAPI["updateRecorder"]["Args"],
): Promise<RecorderAPI["updateRecorder"]["Resp"]> => {
  const res = await request.put(`/recorder/${id}`, preset);
  return res.data.payload;
};

const startRecord = async (id: string) => {
  const res = await request.post(`/recorder/${id}/start_record`, {
    id,
  });
  return res.data.payload;
};

const stopRecord = async (id: string) => {
  const res = await request.post(`/recorder/${id}/stop_record`, {
    id,
  });
  return res.data.payload;
};

const resolveChannel = async (url: string): Promise<RecorderAPI["resolveChannel"]["Resp"]> => {
  const res = await request.get(`/recorder/manager/resolveChannel`, {
    params: { url },
  });
  return res.data.payload;
};

const getLiveInfo = async (id?: string): Promise<RecorderAPI["getLiveInfo"]["Resp"]> => {
  const res = await request.get(`/recorder/manager/liveInfo`, {
    params: { id },
  });
  return res.data.payload;
};

const recoder = {
  infoList,
  get,
  add,
  remove,
  update,
  stopRecord,
  startRecord,
  resolveChannel,
  getLiveInfo,
};

export default recoder;
