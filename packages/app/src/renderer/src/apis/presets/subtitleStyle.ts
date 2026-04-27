import request from "../request";
import type { SubtitleOptions } from "@biliLive-tools/types";

export interface SubtitleStylePreset {
  id: string;
  name: string;
  config: SubtitleOptions;
}

const list = async (): Promise<SubtitleStylePreset[]> => {
  const res = await request.get(`/preset/subtitle-style`);
  return res.data;
};

const get = async (id: string): Promise<SubtitleStylePreset> => {
  const res = await request.get(`/preset/subtitle-style/${id}`);
  return res.data;
};

const add = async (preset: SubtitleStylePreset) => {
  return request.post(`/preset/subtitle-style`, preset);
};

const remove = async (id: string) => {
  return request.delete(`/preset/subtitle-style/${id}`);
};

const update = async (id: string, preset: SubtitleStylePreset) => {
  return request.put(`/preset/subtitle-style/${id}`, preset);
};

const save = async (preset: SubtitleStylePreset) => {
  if (preset.id) {
    return update(preset.id, preset);
  } else {
    return add(preset);
  }
};

const subtitleStylePreset = {
  list,
  get,
  add,
  remove,
  update,
  save,
};

export default subtitleStylePreset;
