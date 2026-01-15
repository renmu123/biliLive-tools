/**
 * Audiowaveform 数据格式定义
 */
export interface AudiowaveformData {
  version: number;
  channels: number;
  sample_rate: number;
  samples_per_pixel: number;
  bits: number;
  length: number;
  data: number[];
}

/**
 * 音频片段类型
 */
export enum SegmentType {
  SINGING = "singing",
  TALKING = "talking",
  SILENCE = "silence",
}

/**
 * 检测到的音频片段
 */
export interface AudioSegment {
  type: SegmentType;
  startTime: number; // 起始时间（秒）
  endTime: number; // 结束时间（秒）
  startIndex: number; // 数据数组中的起始索引
  endIndex: number; // 数据数组中的结束索引
  confidence: number; // 置信度 (0-1)
  avgEnergy: number; // 平均能量
  peakEnergy: number; // 峰值能量
}

/**
 * 窗口统计特征
 */
export interface WindowFeatures {
  energy: number; // 能量（RMS）
  peak: number; // 峰值
  variance: number; // 方差
  zeroCrossings: number; // 过零率
  continuity: number; // 能量连续性 (0-1)，值越大越连续
}

/**
 * 分析器配置
 */
export interface AnalyzerConfig {
  // 窗口大小（秒）
  windowSize: number;

  // 窗口重叠比例 (0-1)
  windowOverlap: number;

  // 唱歌检测的能量阈值倍数（相对于平均能量）
  singingEnergyThreshold: number;

  // 说话检测的能量阈值倍数
  talkingEnergyThreshold: number;

  // 最小片段持续时间（秒）
  minSegmentDuration: number;

  // 合并间隔（秒）- 合并相邻的同类片段
  mergeGap: number;

  // 静音阈值（绝对值）
  silenceThreshold: number;
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: AnalyzerConfig = {
  windowSize: 1.0, // 1秒窗口
  windowOverlap: 0.5, // 50%重叠
  singingEnergyThreshold: 2.0, // 唱歌能量是平均的2倍
  talkingEnergyThreshold: 0.8, // 说话能量是平均的0.8倍
  minSegmentDuration: 2.0, // 最小片段2秒
  mergeGap: 1.0, // 合并1秒内的间隔
  silenceThreshold: 30, // 静音绝对阈值
};

/**
 * AcoustID 查询参数
 */
export interface AcoustIDLookupParams {
  /** AcoustID API Key */
  client: string;
  /** 音频指纹数据 */
  fingerprint: string;
  /** 音频时长（秒） */
  duration: number;
  /** 需要返回的元数据类型（如 recordings、recordingids、releases、releaseids、tracks 等） */
  meta?: string[];
}

/**
 * AcoustID 录音信息
 */
export interface AcoustIDRecording {
  /** 录音 ID */
  id: string;
  /** 标题 */
  title?: string;
  /** 艺术家列表 */
  artists?: Array<{
    id: string;
    name: string;
  }>;
  /** 发行列表 */
  releases?: Array<{
    id: string;
    title: string;
    country?: string;
    date?: {
      year?: number;
      month?: number;
      day?: number;
    };
    track_count?: number;
    medium_count?: number;
  }>;
  /** 时长（秒） */
  duration?: number;
}

/**
 * AcoustID 查询结果
 */
export interface AcoustIDResult {
  /** 匹配得分 (0-1) */
  score: number;
  /** 指纹 ID */
  id: string;
  /** 录音信息列表 */
  recordings?: AcoustIDRecording[];
}

/**
 * AcoustID API 响应
 */
export interface AcoustIDResponse {
  /** 响应状态（ok 或 error） */
  status: string;
  /** 错误信息（如果有） */
  error?: {
    message: string;
    code: number;
  };
  /** 查询结果列表 */
  results?: AcoustIDResult[];
}

/**
 * AcoustID 客户端配置
 */
export interface AcoustIDConfig {
  /** AcoustID API Key */
  apiKey: string;
  /** 请求超时时间（毫秒），默认 10000 */
  timeout?: number;
  /** 重试次数，默认 3 */
  retries?: number;
  /** 重试延迟（毫秒），默认 1000 */
  retryDelay?: number;
  /** 需要返回的元数据类型 */
  meta?: string[];
}
