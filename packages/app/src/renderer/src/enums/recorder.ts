export const qualityOptions = [
  { value: "highest", label: "最高" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
  { value: "lowest", label: "最低" },
];

export const biliQualityOptions = [
  {
    value: 10000,
    label: "原画(10000)",
  },
  {
    value: 30000,
    label: "杜比(30000)",
  },
  {
    value: 20000,
    label: "4K(20000)",
  },
  {
    value: 400,
    label: "蓝光(400)",
  },
  {
    value: 250,
    label: "超清(250)",
  },
  {
    value: 150,
    label: "高清(150)",
  },
  {
    value: 80,
    label: "流畅(80)",
  },
];

export const douyuQualityOptions = [
  {
    value: 0,
    label: "原画",
  },
  {
    value: 8,
    label: "蓝光8M",
  },
  {
    value: 4,
    label: "蓝光4M",
  },
  {
    value: 3,
    label: "超清",
  },
  {
    value: 2,
    label: "高清",
  },
];

// b站流格式
export const streamFormatOptions = [
  {
    value: "auto",
    label: "自动",
  },
  {
    label: "优先flv",
    value: "flv",
  },
  {
    label: "优先hls(fmp4)",
    value: "fmp4",
  },
  {
    label: "优先hls(ts)",
    value: "hls",
  },
  {
    label: "强制flv",
    value: "flv_only",
  },
  {
    label: "强制hls(fmp4)",
    value: "fmp4_only",
  },
  {
    label: "强制hls(ts)",
    value: "hls_only",
  },
];

// b站流编码
export const streamCodecOptions = [
  {
    value: "auto",
    label: "自动",
  },
  {
    label: "优先avc",
    value: "avc",
  },
  {
    label: "优先hevc",
    value: "hevc",
  },
  {
    label: "强制avc",
    value: "avc_only",
  },
  {
    label: "强制hevc",
    value: "hevc_only",
  },
];

export const textInfo = {
  bili: {
    uid: {
      text: "B站录制账号",
      tip: "登录才能录制高清画质",
    },
    useM3U8Proxy: {
      text: "避免hls自动分段",
      tip: "由于B站hls流存在过期时间，ffmpeg命令行无法处理导致会被一小时强制分段，通过本地代理可以避免分段，但是会增加网络请求以及可能的不稳定性",
    },
    quality: {
      text: "画质",
      tip: "如果找不到对应画质，会使用较清晰的源",
    },
    qualityRetry: {
      text: "画质匹配重试次数",
      tip: "如果选项为零，那么匹配不到画质时会自动选择其他画质，否则会多次尝试匹配",
    },
    formatName: {
      text: "流格式",
      tip: "默认情况下等于优先flv模式，优先avc编码",
    },
    codecName: {
      text: "流编码",
      tip: "默认情况下等于优先avc模式",
    },
  },
} as const;
