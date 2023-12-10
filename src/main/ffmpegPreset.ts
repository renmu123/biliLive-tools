import CommonPreset from "./utils/preset";
import { FFMPEG_PRESET_PATH } from "./appConstant";

import type { FfmpegPreset as FfmpegPresetType, FfmpegOptions } from "../types";
import { type IpcMainInvokeEvent } from "electron";

const DefaultFfmpegOptions: FfmpegOptions = {
  encoder: "libx264",
  bitrateControl: "CRF",
  crf: 23,
  preset: "fast",
};

const ffmpegPreset = new CommonPreset(FFMPEG_PRESET_PATH, DefaultFfmpegOptions);

export const saveFfmpegPreset = async (_event: IpcMainInvokeEvent, presets: FfmpegPresetType) => {
  return ffmpegPreset.save(presets);
};
export const deleteFfmpegPreset = async (_event: IpcMainInvokeEvent, id: string) => {
  return await ffmpegPreset.delete(id);
};
export const getFfmpegPreset = async (_event: IpcMainInvokeEvent, id: string) => {
  const preset = await ffmpegPreset.get(id);
  return preset;
};
export const getFfmpegPresets = async () => {
  const presets = await ffmpegPreset.list();
  return presets;
};

export const handlers = {
  "ffmpeg:presets:save": saveFfmpegPreset,
  "ffmpeg:presets:delete": deleteFfmpegPreset,
  "ffmpeg:presets:get": getFfmpegPreset,
  "ffmpeg:presets:list": getFfmpegPresets,
};
