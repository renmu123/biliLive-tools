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

// 斗鱼线路选项
export const douyuSourceOptions = [
  {
    value: "auto",
    label: "自动",
  },
  {
    value: "scdnctshh",
    label: "线路1(scdnctshh)",
  },
  {
    value: "tctc-h5",
    label: "线路4(tctc-h5)",
  },
  {
    value: "tct-h5",
    label: "线路5(tct-h5)",
  },
  {
    value: "ali-h5",
    label: "线路6(ali-h5)",
  },
  {
    value: "hw-h5",
    label: "线路7(hw-h5)",
  },
  {
    value: "hs-h5",
    label: "线路13(hs-h5)",
  },
];

// 虎牙线路选项
export const huyaSourceOptions = [
  {
    value: "auto",
    label: "自动",
  },
  {
    value: "AL",
    label: "阿里(AL)",
  },
  {
    value: "TX",
    label: "腾讯(TX)",
  },
  {
    value: "HW",
    label: "华为(HW)",
  },
  {
    value: "HS",
    label: "火山(HS)",
  },
  {
    value: "WS",
    label: "网宿(WS)",
  },
  {
    value: "AL13",
    label: "阿里13(AL13)",
  },
  {
    value: "TX15",
    label: "腾讯15(TX15)",
  },
  {
    value: "HW16",
    label: "华为16(HW16)",
  },
  {
    value: "HYZJ",
    label: "虎牙自建(HYZJ)",
  },
];

// 虎牙画质选项
export const huyaQualityOptions = [
  {
    value: 0,
    label: "原画",
  },
  {
    value: -1,
    label: "真原画",
  },
  {
    value: 20000,
    label: "蓝光20M",
  },
  {
    value: 10000,
    label: "蓝光10M",
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
];

// 抖音画质选项
export const douyinQualityOptions = [
  {
    value: "origin",
    label: "原画",
  },
  {
    value: "uhd",
    label: "蓝光",
  },
  {
    value: "hd",
    label: "超清",
  },
  {
    value: "sd",
    label: "高清",
  },
  {
    value: "ld",
    label: "标清",
  },
  {
    value: "ao",
    label: "音频流",
  },
  {
    value: "real_origin",
    label: "真原画",
  },
];

// b站流格式
export const biliStreamFormatOptions = [
  {
    value: "auto",
    label: "自动",
  },
  {
    label: "优先flv",
    value: "flv",
  },
  {
    label: "优先hls(ts)",
    value: "hls",
  },
  {
    label: "优先hls(fmp4)",
    value: "fmp4",
  },
  {
    label: "强制flv",
    value: "flv_only",
  },
  {
    label: "强制hls(ts)",
    value: "hls_only",
  },
  {
    label: "强制hls(fmp4)",
    value: "fmp4_only",
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

// 视频格式选择
export const videoFormatOptions = [
  {
    value: "auto",
    label: "自动",
  },
  {
    value: "ts",
    label: "TS",
  },
  {
    value: "mkv",
    label: "MKV",
  },
];

// 录制器
export const recorderTypeOptions = [
  {
    value: "ffmpeg",
    label: "ffmpeg",
  },
  {
    value: "mesio",
    label: "mesio",
  },
];

// 抖音流格式
export const douyinStreamFormatOptions = [
  {
    value: "auto",
    label: "自动",
  },
  {
    label: "优先flv",
    value: "flv",
  },
  {
    label: "优先hls",
    value: "hls",
  },
  {
    label: "强制flv",
    value: "flv_only",
  },
  {
    label: "强制hls",
    value: "hls_only",
  },
];

const qualityRetry = {
  text: "画质匹配重试次数",
  tip: "根据次数强制查询匹配画质，在未选择原画的情况下，可能会导致开头漏录。匹配次数结束后如果无法匹配对应画质时会自动选择其他画质，-1为强制匹配画质",
};
const quality = {
  text: "画质",
  tip: "如果无法找到对应画质，会结合其他选项后选择更清晰的画质",
};

export const textInfo = {
  common: {
    format: {
      text: "视频格式",
      tip: "ffmpeg录制器：选择自动时，分段为ts，不分段为mp4<br/>mesio录制器：不支持指定",
    },
    recorderType: {
      text: "测试：录制器",
      tip: "影响最底层的录制，使用mesio前请先去基本配置中配置二进制文件，遇到mesio不支持的情况，会降级到使用ffmpeg",
    },
  },
  bili: {
    uid: {
      text: "录制账号",
      tip: "B站只有登录才能录制清晰画质，推荐使用小号避免可能的风控",
    },
    useM3U8Proxy: {
      text: "避免hls自动分段",
      tip: "由于B站hls流存在过期时间，ffmpeg命令行无法处理导致会被一小时强制分段，通过本地代理可以避免分段，但是会增加网络请求以及可能的不稳定性",
    },
    quality: quality,
    qualityRetry: qualityRetry,
    formatName: {
      text: "流格式",
      tip: "默认优先flv模式，其次ts，最后为fmp4，fmp4模式挺容易碎成一堆，我也不知道为什么",
    },
    codecName: {
      text: "流编码",
      tip: "默认优先avc模式",
    },
  },
  douyu: {
    qualityRetry: qualityRetry,
    quality: quality,
  },
  huya: {
    qualityRetry: qualityRetry,
    quality: quality,
  },
  douyin: {
    qualityRetry: qualityRetry,
    quality: quality,
    formatName: {
      text: "流格式",
      tip: "默认优先flv模式，其次hls",
    },
  },
} as const;
