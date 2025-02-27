export const qualityOptions = [
  { value: "highest", label: "最高" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
  { value: "lowest", label: "最低" },
];

// B站画质选项
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

// 斗鱼画质选项
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

// 虎牙画质选项
export const huyaQualityOptions = [
  {
    value: 0,
    label: "原画",
  },
  {
    value: 14100,
    label: "2K HDR",
  },
  {
    value: 14000,
    label: "2K",
  },
  {
    value: 4200,
    label: "HDR(10M)",
  },
  {
    value: 8000,
    label: "蓝光8M",
  },
  {
    value: 4000,
    label: "蓝光4M",
  },
  {
    value: 2000,
    label: "超清",
  },
  {
    value: 500,
    label: "流畅",
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
      text: "录制账号",
      tip: "B站只有登录才能录制清晰画质",
    },
    useM3U8Proxy: {
      text: "避免hls自动分段",
      tip: "由于B站hls流存在过期时间，ffmpeg命令行无法处理导致会被一小时强制分段，通过本地代理可以避免分段，但是会增加网络请求以及可能的不稳定性",
    },
    quality: {
      text: "画质",
      tip: "如果无法找到对应画质，会结合其他选项后选择更清晰的画质",
    },
    qualityRetry: {
      text: "画质匹配重试次数",
      tip: "根据次数强制查询匹配画质，在未选择原画的情况下，可能会导致开头漏录",
    },
    formatName: {
      text: "流格式",
      tip: "默认优先flv模式，其次fmp4，最后为ts",
    },
    codecName: {
      text: "流编码",
      tip: "默认优先avc模式",
    },
  },
} as const;
