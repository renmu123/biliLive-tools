import request from "./request";

import type { ClientRecorder, API } from "@biliLive-tools/http";
import type { LocalRecordr } from "@biliLive-tools/types";

/**
 * 获取录制器列表，非配置信息
 */
const infoList = async (): Promise<ClientRecorder[]> => {
  const res = await request.get(`/recorder/list`);
  return res.data.payload;
};

/**
 * 获取录制器配置信息
 */
const get = async (id: string): Promise<LocalRecordr> => {
  const res = await request.get(`/recorder/${id}`);
  return res.data.payload;
};

const add = async (data: API.addRecorder.Args): Promise<API.addRecorder.Resp> => {
  const res = await request.post(`/recorder/add`, data);
  return res.data.payload;
};

const remove = async (id: string): Promise<API.removeRecorder.Resp> => {
  const res = await request.delete(`/recorder/${id}`);
  return res.data.payload;
};

const update = async (
  id: string,
  preset: API.updateRecorder.Args,
): Promise<API.updateRecorder.Resp> => {
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

const resolveChannel = async (url: string): Promise<API.resolveChannel.Resp> => {
  const res = await request.get(`/recorder/manager/resolveChannel`, {
    params: { url },
  });
  return res.data.payload;
};

const getLiveInfo = async (): Promise<API.getLiveInfo.Resp> => {
  const res = await request.get(`/recorder/manager/liveInfo`);
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
