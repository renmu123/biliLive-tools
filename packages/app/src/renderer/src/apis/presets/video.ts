import request from "../request";
import type { BiliupPreset } from "@biliLive-tools/types";

const list = async (): Promise<BiliupPreset[]> => {
  const res = await request.get(`/preset/video`);
  return res.data;
};

const get = async (id: string): Promise<BiliupPreset> => {
  const res = await request.get(`/preset/video/${id}`);
  return res.data;
};

const add = async (preset: BiliupPreset) => {
  return request.post(`/preset/video`, preset);
};

const remove = async (id: string) => {
  return request.delete(`/preset/video/${id}`);
};

const update = async (id: string, preset: BiliupPreset) => {
  return request.put(`/preset/video/${id}`, preset);
};

const save = async (preset: BiliupPreset) => {
  if (preset.id) {
    return update(preset.id, preset);
  } else {
    return add(preset);
  }
};

const videoPreset = {
  list,
  get,
  add,
  remove,
  update,
  save,
};

export default videoPreset;
