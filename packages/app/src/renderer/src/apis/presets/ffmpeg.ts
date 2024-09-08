import request from "../request";
import type { FfmpegPreset, FfmpegOptions } from "@biliLive-tools/types";

const list = async (): Promise<FfmpegPreset[]> => {
  const res = await request.get(`/preset/ffmpeg`);
  return res.data;
};

const options = async (): Promise<
  {
    value: string;
    label: string;
    children: {
      value: string;
      label: string;
      config: FfmpegOptions;
    }[];
  }[][]
> => {
  const res = await request.get(`/preset/ffmpeg/options`);
  return res.data;
};

const get = async (id: string): Promise<FfmpegPreset> => {
  const res = await request.get(`/preset/ffmpeg/${id}`);
  return res.data;
};

const add = async (preset: FfmpegPreset) => {
  return request.post(`/preset/ffmpeg`, preset);
};

const remove = async (id: string) => {
  return request.delete(`/preset/ffmpeg/${id}`);
};

const update = async (id: string, preset: FfmpegPreset) => {
  return request.put(`/preset/ffmpeg/${id}`, preset);
};

const save = async (preset: FfmpegPreset) => {
  if (preset.id) {
    return update(preset.id, preset);
  } else {
    return add(preset);
  }
};

const ffmpegPreset = {
  list,
  get,
  add,
  remove,
  update,
  save,
  options,
};

export default ffmpegPreset;
