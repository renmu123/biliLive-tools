/**
 * 标准 ASR 识别结果格式
 * 用于统一不同 ASR 提供商的输出格式
 */
export interface StandardASRResult {
  /**
   * 完整转写文本
   */
  text: string;

  /**
   * 音频时长（秒）
   */
  duration?: number;

  /**
   * 识别的语言代码（如 "zh", "en"）
   */
  language?: string;

  /**
   * 句子级别的转写结果（必需）
   */
  segments: StandardASRSegment[];

  /**
   * 词级别的转写结果（可选，部分提供商不支持）
   */
  words?: StandardASRWord[];
}

/**
 * 标准句子片段
 */
export interface StandardASRSegment {
  /**
   * 片段索引
   */
  id: number;

  /**
   * 开始时间（秒）
   */
  start: number;

  /**
   * 结束时间（秒）
   */
  end: number;

  /**
   * 转写文本
   */
  text: string;

  /**
   * 说话人ID（可选，启用说话人分离时）
   */
  speaker?: string;
}

/**
 * 标准词级别结果
 */
export interface StandardASRWord {
  /**
   * 开始时间（秒）
   */
  start: number;

  /**
   * 结束时间（秒）
   */
  end: number;

  /**
   * 词文本
   */
  word: string;

  /**
   * 说话人ID（可选）
   */
  speaker?: string;
  /**
   * 标点符号
   */
  punctuation?: string;
}
