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

const baseFfmpegPresets: FfmpegPresetType[] = [
  {
    id: "b_libx264",
    name: "H.264(x264)",
    config: {
      encoder: "libx264",
      bitrateControl: "CRF",
      crf: 23,
      preset: "fast",
      bitrate: 5000,
    },
  },
  {
    id: "b_qsv_h264",
    name: "H.264(Intel QSV)",
    config: {
      encoder: "h264_qsv",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },
  {
    id: "b_nvenc_h264",
    name: "H.264(NVIDIA NVEnc)",
    config: { encoder: "h264_nvenc", bitrateControl: "VBR", bitrate: 5000 },
  },
  {
    id: "b_amf_h264",
    name: "H.264(AMD AMF)",
    config: { encoder: "h264_amf", bitrateControl: "VBR", bitrate: 5000 },
  },
  {
    id: "b_libx265",
    name: "H.265(x265)",
    config: {
      encoder: "libx265",
      bitrateControl: "CRF",
      crf: 27,
      preset: "fast",
      bitrate: 5000,
    },
  },
  {
    id: "b_qsv_h265",
    name: "H.265(Intel QSV)",
    config: {
      encoder: "hevc_qsv",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },
  { id: "b_nvenc_h265", name: "H.265(NVIDIA NVEnc)", config: { encoder: "hevc_nvenc" } },
  {
    id: "b_amf_h265",
    name: "H.265(AMD AMF)",
    config: {
      encoder: "hevc_amf",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },

  {
    id: "b_svt_av1",
    name: "AV1 (libsvtav1)",
    config: {
      encoder: "libsvtav1",
      bitrateControl: "CRF",
      crf: 23,
      preset: "fast",
      bitrate: 5000,
    },
  },
  {
    id: "b_qsv_av1",
    name: "AV1 (Intel QSV)",
    config: {
      encoder: "av1_qsv",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },
  {
    id: "b_nvenc_av1",
    name: "AV1 (NVIDIA NVEnc)",
    config: {
      encoder: "av1_nvenc",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },
  {
    id: "b_amf_av1",
    name: "AV1 (AMD AMF)",
    config: {
      encoder: "av1_amf",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },
];

const ffmpegPreset = new CommonPreset(FFMPEG_PRESET_PATH, DefaultFfmpegOptions);

export const saveFfmpegPreset = async (
  _event: IpcMainInvokeEvent | undefined,
  presets: FfmpegPresetType,
) => {
  return ffmpegPreset.save(presets);
};
export const deleteFfmpegPreset = async (_event: IpcMainInvokeEvent | undefined, id: string) => {
  return ffmpegPreset.delete(id);
};
export const getFfmpegPreset = async (id: string): Promise<FfmpegPresetType | undefined> => {
  const ffmpegPresets = await getFfmpegPresets();
  if (id.startsWith("b_")) {
    return baseFfmpegPresets.find((item) => item.id === id);
  } else {
    return ffmpegPresets.find((item) => item.id === id);
  }
};
export const getFfmpegPresets = async () => {
  const presets = await ffmpegPreset.list();
  return presets;
};

export const getFfmpegPresetOptions = async () => {
  const base = baseFfmpegPresets.map((item) => {
    return {
      value: item.id,
      label: item.name,
      config: item.config,
    };
  });
  const ffmpegPresets = await getFfmpegPresets();
  const custom = ffmpegPresets.map((item) => {
    return {
      value: item.id,
      label: item.name,
      config: item.config,
    };
  });
  return [
    {
      value: "base",
      label: "基础",
      children: base,
    },
    {
      value: "custom",
      label: "自定义",
      children: custom,
    },
  ];
};

export const handlers = {
  "ffmpeg:presets:save": saveFfmpegPreset,
  "ffmpeg:presets:delete": deleteFfmpegPreset,
  "ffmpeg:presets:get": (_event: IpcMainInvokeEvent, id: string) => {
    return getFfmpegPreset(id);
  },
  "ffmpeg:presets:list": getFfmpegPresets,
  "ffmpeg:presets:getOptions": getFfmpegPresetOptions,
};
