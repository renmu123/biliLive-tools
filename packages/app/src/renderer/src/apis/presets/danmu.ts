import request from "../request";
import type { DanmuPreset } from "@biliLive-tools/types";

const list = async (): Promise<DanmuPreset[]> => {
  const res = await request.get(`/preset/danmu`);
  return res.data;
};

const get = async (id: string): Promise<DanmuPreset> => {
  const res = await request.get(`/preset/danmu/${id}`);
  return res.data;
};

const add = async (preset: DanmuPreset) => {
  return request.post(`/preset/danmu`, preset);
};

const remove = async (id: string) => {
  return request.delete(`/preset/danmu/${id}`);
};

const update = async (id: string, preset: DanmuPreset) => {
  return request.put(`/preset/danmu/${id}`, preset);
};

const save = async (preset: DanmuPreset) => {
  if (preset.id) {
    return update(preset.id, preset);
  } else {
    return add(preset);
  }
};

const danmuPreset = {
  list,
  get,
  add,
  remove,
  update,
  save,
};

export default danmuPreset;
