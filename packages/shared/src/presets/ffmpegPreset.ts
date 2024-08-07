import CommonPreset from "./preset.js";

import type {
  FfmpegPreset as FfmpegPresetType,
  FfmpegOptions,
  audioCodec,
  CommonPreset as CommonPresetType,
} from "@biliLive-tools/types";

const DefaultFfmpegOptions: FfmpegOptions = {
  encoder: "libx264",
  bitrateControl: "CRF",
  crf: 23,
  preset: "fast",
  audioCodec: "copy",
};

const commonPresetParams: {
  resetResolution: boolean;
  resolutionWidth: number;
  resolutionHeight: number;
  audioCodec: audioCodec;
} = {
  resetResolution: false,
  resolutionWidth: 3840,
  resolutionHeight: 2160,
  audioCodec: "copy",
};

const baseFfmpegPresets: CommonPresetType<FfmpegOptions>[] = [
  {
    id: "b_copy",
    name: "copy",
    config: {
      encoder: "copy",
      bitrateControl: "CRF",
      crf: 23,
      preset: "fast",
      bitrate: 8000,
      extraOptions: "",
      bit10: false,
      ...commonPresetParams,
    },
  },
  {
    id: "b_libx264",
    name: "H.264(x264)",
    config: {
      encoder: "libx264",
      bitrateControl: "CRF",
      crf: 23,
      preset: "fast",
      bitrate: 8000,
      extraOptions: "",
      bit10: false,
      ...commonPresetParams,
    },
  },
  {
    id: "b_qsv_h264",
    name: "H.264(Intel QSV)",
    config: {
      encoder: "h264_qsv",
      bitrateControl: "VBR",
      bitrate: 8000,
      extraOptions: "",
      bit10: false,
      crf: 30,
      preset: "fast",
      ...commonPresetParams,
    },
  },
  {
    id: "b_nvenc_h264",
    name: "H.264(NVIDIA NVEnc)",
    config: {
      encoder: "h264_nvenc",
      bitrateControl: "VBR",
      bitrate: 8000,
      preset: "p4",
      crf: 28,
      decode: false,
      extraOptions: "",
      bit10: false,
      ...commonPresetParams,
    },
  },
  {
    id: "b_amf_h264",
    name: "H.264(AMD AMF)",
    config: {
      encoder: "h264_amf",
      bitrateControl: "VBR",
      bitrate: 8000,
      extraOptions: "",
      bit10: false,
      ...commonPresetParams,
    },
  },
  {
    id: "b_libx265",
    name: "H.265(x265)",
    config: {
      encoder: "libx265",
      bitrateControl: "CRF",
      crf: 27,
      preset: "fast",
      bitrate: 8000,
      extraOptions: "",
      bit10: false,
      ...commonPresetParams,
    },
  },
  {
    id: "b_qsv_h265",
    name: "H.265(Intel QSV)",
    config: {
      encoder: "hevc_qsv",
      bitrateControl: "VBR",
      bitrate: 8000,
      extraOptions: "",
      bit10: false,
      crf: 30,
      preset: "fast",
      ...commonPresetParams,
    },
  },
  {
    id: "b_nvenc_h265",
    name: "H.265(NVIDIA NVEnc)",
    config: {
      encoder: "hevc_nvenc",
      bitrateControl: "VBR",
      bitrate: 8000,
      preset: "p4",
      crf: 28,
      decode: false,
      extraOptions: "",
      bit10: false,
      ...commonPresetParams,
    },
  },
  {
    id: "b_amf_h265",
    name: "H.265(AMD AMF)",
    config: {
      encoder: "hevc_amf",
      bitrateControl: "VBR",
      bitrate: 8000,
      extraOptions: "",
      bit10: false,
      ...commonPresetParams,
    },
  },

  {
    id: "b_svt_av1",
    name: "AV1 (libsvtav1)",
    config: {
      encoder: "libsvtav1",
      bitrateControl: "CRF",
      crf: 31,
      preset: "6",
      bitrate: 8000,
      extraOptions: "-svtav1-params tune=0",
      bit10: false,
      ...commonPresetParams,
    },
  },
  {
    id: "b_qsv_av1",
    name: "AV1 (Intel QSV)",
    config: {
      encoder: "av1_qsv",
      bitrateControl: "VBR",
      bitrate: 8000,
      extraOptions: "",
      bit10: false,
      crf: 30,
      preset: "fast",
      ...commonPresetParams,
    },
  },
  {
    id: "b_nvenc_av1",
    name: "AV1 (NVIDIA NVEnc)",
    config: {
      encoder: "av1_nvenc",
      bitrateControl: "VBR",
      bitrate: 8000,
      preset: "p4",
      crf: 28,
      decode: false,
      extraOptions: "",
      bit10: false,
      ...commonPresetParams,
    },
  },
  {
    id: "b_amf_av1",
    name: "AV1 (AMD AMF)",
    config: {
      encoder: "av1_amf",
      bitrateControl: "VBR",
      bitrate: 8000,
      extraOptions: "",
      bit10: false,
      ...commonPresetParams,
    },
  },
];

export class FFmpegPreset extends CommonPreset<FfmpegOptions> {
  constructor(
    presetPath: string,
    defaultConfig: typeof DefaultFfmpegOptions = DefaultFfmpegOptions,
  ) {
    super(presetPath, defaultConfig);
  }
  init(presetPath: string) {
    super.init(presetPath);
  }
  // 保存预设
  save(presets: FfmpegPresetType) {
    return super.save(presets);
  }
  async get(id: string) {
    const ffmpegPresets = await this.list();
    if (id.startsWith("b_")) {
      return baseFfmpegPresets.find((item) => item.id === id);
    } else {
      return ffmpegPresets.find((item) => item.id === id);
    }
  }
  async list() {
    const presets = await super.list();
    return presets;
  }
  async delete(id: string) {
    return super.delete(id);
  }
  async getFfmpegPresetOptions() {
    const base = baseFfmpegPresets.map((item) => {
      return {
        value: item.id,
        label: item.name,
        config: item.config,
      };
    });
    const ffmpegPresets = await this.list();
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
  }
}
