import CommonPreset from "./preset.js";

import type {
  FfmpegPreset as FfmpegPresetType,
  FfmpegOptions,
  audioCodec,
  CommonPreset as CommonPresetType,
} from "@biliLive-tools/types";
import { videoEncoders } from "../enum.js";

import type { GlobalConfig } from "@biliLive-tools/types";

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
  swsFlags: string;
  scaleMethod: "auto" | "before" | "after";
  hardwareScaleFilter: boolean;
  encoderThreads: number;
  addTimestamp: boolean;
  timestampX: number;
  timestampY: number;
  timestampFontSize: number;
  timestampFontColor: string;
  extraOptions: string;
  timestampFollowDanmu: boolean;
  timestampExtra: string;
  timestampFormat: string;
  vf: string;
} = {
  resetResolution: false,
  resolutionWidth: 2880,
  resolutionHeight: 1620,
  audioCodec: "copy",
  swsFlags: "auto",
  scaleMethod: "auto",
  hardwareScaleFilter: false,
  addTimestamp: false,
  encoderThreads: -1,
  timestampX: 10,
  timestampY: 10,
  timestampFontSize: 24,
  timestampFontColor: "#ffffff",
  extraOptions: "",
  vf: "",
  timestampFollowDanmu: true,
  timestampExtra: "",
  timestampFormat: "%Y-%m-%d %T",
};

const baseFfmpegPresets: CommonPresetType<FfmpegOptions>[] = [
  {
    id: "b_copy",
    name: "copy",
    config: {
      ...commonPresetParams,
      encoder: "copy",
      bitrateControl: "CRF",
      crf: 23,
      preset: "fast",
      bitrate: 8000,
      bit10: false,
    },
  },
  {
    id: "b_libx264",
    name: "H.264(x264)",
    config: {
      ...commonPresetParams,
      encoder: "libx264",
      bitrateControl: "CRF",
      crf: 23,
      preset: "fast",
      bitrate: 8000,
      bit10: false,
    },
  },
  {
    id: "b_qsv_h264",
    name: "H.264(Intel QSV)",
    config: {
      ...commonPresetParams,
      encoder: "h264_qsv",
      bitrateControl: "VBR",
      bitrate: 8000,
      bit10: false,
      crf: 30,
      preset: "fast",
    },
  },
  {
    id: "b_nvenc_h264",
    name: "H.264(NVIDIA NVEnc)",
    config: {
      ...commonPresetParams,
      encoder: "h264_nvenc",
      bitrateControl: "VBR",
      bitrate: 8000,
      preset: "p3",
      crf: 28,
      decode: false,
      bit10: false,
    },
  },
  {
    id: "b_amf_h264",
    name: "H.264(AMD AMF)",
    config: {
      ...commonPresetParams,
      encoder: "h264_amf",
      bitrateControl: "VBR",
      bitrate: 8000,
      bit10: false,
      preset: "0",
    },
  },
  {
    id: "b_libx265",
    name: "H.265(x265)",
    config: {
      ...commonPresetParams,
      encoder: "libx265",
      bitrateControl: "CRF",
      crf: 27,
      preset: "fast",
      bitrate: 8000,
      bit10: false,
    },
  },
  {
    id: "b_qsv_h265",
    name: "H.265(Intel QSV)",
    config: {
      ...commonPresetParams,
      encoder: "hevc_qsv",
      bitrateControl: "VBR",
      bitrate: 8000,
      bit10: false,
      crf: 30,
      preset: "fast",
    },
  },
  {
    id: "b_nvenc_h265",
    name: "H.265(NVIDIA NVEnc)",
    config: {
      ...commonPresetParams,
      encoder: "hevc_nvenc",
      bitrateControl: "VBR",
      bitrate: 8000,
      preset: "p3",
      crf: 28,
      decode: false,
      bit10: false,
    },
  },
  {
    id: "b_amf_h265",
    name: "H.265(AMD AMF)",
    config: {
      ...commonPresetParams,
      encoder: "hevc_amf",
      bitrateControl: "VBR",
      bitrate: 8000,
      bit10: false,
      preset: "0",
    },
  },

  {
    id: "b_svt_av1",
    name: "AV1 (libsvtav1)",
    config: {
      ...commonPresetParams,
      encoder: "libsvtav1",
      bitrateControl: "CRF",
      crf: 31,
      preset: "10",
      bitrate: 8000,
      extraOptions: "-svtav1-params tune=0",
      bit10: false,
    },
  },
  {
    id: "b_qsv_av1",
    name: "AV1 (Intel QSV)",
    config: {
      ...commonPresetParams,
      encoder: "av1_qsv",
      bitrateControl: "VBR",
      bitrate: 8000,
      bit10: false,
      crf: 30,
      preset: "fast",
    },
  },
  {
    id: "b_nvenc_av1",
    name: "AV1 (NVIDIA NVEnc)",
    config: {
      ...commonPresetParams,
      encoder: "av1_nvenc",
      bitrateControl: "VBR",
      bitrate: 8000,
      preset: "p3",
      crf: 28,
      decode: false,
      bit10: false,
    },
  },
  {
    id: "b_amf_av1",
    name: "AV1 (AMD AMF)",
    config: {
      ...commonPresetParams,
      encoder: "av1_amf",
      bitrateControl: "VBR",
      bitrate: 8000,
      bit10: false,
      preset: "0",
    },
  },
];

export class FFmpegPreset extends CommonPreset<FfmpegOptions> {
  constructor({ globalConfig }: { globalConfig: Pick<GlobalConfig, "ffmpegPresetPath"> }) {
    super(globalConfig.ffmpegPresetPath, DefaultFfmpegOptions);
  }
  init(presetPath: string) {
    super.init(presetPath);
  }
  validate(config: FfmpegPresetType["config"]) {
    const encoder = videoEncoders.find((item) => item.value === config.encoder);
    if (!encoder) {
      throw new Error("无效的编码器");
    }
    if ((encoder.presets ?? []).findIndex((item) => item.value === config.preset) === -1) {
      throw new Error("无效的preset参数，可能使用了其他编码器的preset，请尝试修改");
    }
    if (config.resetResolution) {
      if (Number(config?.resolutionWidth) === 0 || Number(config?.resolutionHeight) === 0) {
        throw new Error("分辨率参数不得为0");
      }
      if (Number(config?.resolutionWidth) < 0 && Number(config?.resolutionHeight) < 0) {
        throw new Error("分辨率参数不得都为负数");
      }
    }
  }
  // 保存预设
  save(preset: FfmpegPresetType) {
    this.validate(preset.config);
    return super.save(preset);
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
    return presets.map((item) => {
      item.config = {
        ...commonPresetParams,
        ...item.config,
      };
      return item;
    });
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
