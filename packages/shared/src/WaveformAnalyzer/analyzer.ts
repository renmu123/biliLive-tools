import { AudiowaveformData, WindowFeatures, AnalyzerConfig } from "./types.js";

/**
 * 波形特征提取器
 */
export class WaveformAnalyzer {
  private data: AudiowaveformData;
  // private config: AnalyzerConfig;
  private samplesPerSecond: number;
  private windowSamples: number;
  private hopSamples: number;

  constructor(data: AudiowaveformData, config: AnalyzerConfig) {
    this.data = data;
    // this.config = config;

    // 计算每秒的数据点数
    this.samplesPerSecond = data.sample_rate / data.samples_per_pixel;

    // 计算窗口大小（数据点数）
    this.windowSamples = Math.floor(config.windowSize * this.samplesPerSecond);

    // 计算跳跃步长（考虑重叠）
    this.hopSamples = Math.floor(this.windowSamples * (1 - config.windowOverlap));
  }

  /**
   * 获取音频总时长（秒）
   * 注意：data 数组是成对的 [max, min]，所以要除以 2
   */
  getTotalDuration(): number {
    // data 数组是 [最大值, 最小值] 成对出现
    const actualDataPoints = this.data.data.length / 2;
    // 实际时长 = 数据点数 × 每点的样本数 / 采样率
    return (actualDataPoints * this.data.samples_per_pixel) / this.data.sample_rate;
  }

  /**
   * 将数据索引转换为时间（秒）
   * 注意：index 是 data 数组索引，需要除以 2 得到实际数据点
   */
  indexToTime(index: number): number {
    const actualPointIndex = index / 2;
    return (actualPointIndex * this.data.samples_per_pixel) / this.data.sample_rate;
  }

  /**
   * 将时间（秒）转换为数据索引
   * 注意：返回的是 data 数组索引（需要乘以 2，因为数据是成对的）
   */
  timeToIndex(time: number): number {
    const actualPointIndex = Math.floor(
      (time * this.data.sample_rate) / this.data.samples_per_pixel,
    );
    return actualPointIndex * 2; // 乘以 2 因为数据是 [max, min] 成对的
  }

  /**
   * 计算窗口特征
   * 注意：data 是 [max, min] 成对的，计算振幅差值
   */
  computeWindowFeatures(startIdx: number, endIdx: number): WindowFeatures {
    const windowData = this.data.data.slice(startIdx, endIdx);

    if (windowData.length === 0 || windowData.length < 2) {
      return {
        energy: 0,
        peak: 0,
        variance: 0,
        zeroCrossings: 0,
        continuity: 0,
      };
    }

    // 提取振幅值：每对数据的差值 abs(max - min)
    const amplitudes: number[] = [];
    for (let i = 0; i < windowData.length - 1; i += 2) {
      const max = windowData[i];
      const min = windowData[i + 1];
      const amplitude = Math.abs(max - min);
      amplitudes.push(amplitude);
    }

    if (amplitudes.length === 0) {
      return {
        energy: 0,
        peak: 0,
        variance: 0,
        zeroCrossings: 0,
        continuity: 0,
      };
    }

    // 1. 计算能量（RMS）
    const sumSquares = amplitudes.reduce((sum, val) => sum + val * val, 0);
    const energy = Math.sqrt(sumSquares / amplitudes.length);

    // 2. 计算峰值
    const peak = Math.max(...amplitudes);

    // 3. 计算方差
    const mean = amplitudes.reduce((sum, val) => sum + val, 0) / amplitudes.length;
    const variance =
      amplitudes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amplitudes.length;

    // 4. 计算过零率（使用原始数据的符号变化）
    let zeroCrossings = 0;
    for (let i = 2; i < windowData.length; i += 2) {
      const prevMid = (windowData[i - 2] + windowData[i - 1]) / 2;
      const currMid = (windowData[i] + windowData[i + 1]) / 2;
      if ((prevMid >= 0 && currMid < 0) || (prevMid < 0 && currMid >= 0)) {
        zeroCrossings++;
      }
    }

    // 5. 计算能量连续性（能量变化的平滑度）
    // 连续性 = 1 - (相邻振幅差的平均 / 平均振幅)
    let continuity = 0;
    if (amplitudes.length > 1) {
      let sumDiff = 0;
      for (let i = 1; i < amplitudes.length; i++) {
        sumDiff += Math.abs(amplitudes[i] - amplitudes[i - 1]);
      }
      const avgDiff = sumDiff / (amplitudes.length - 1);
      continuity = Math.max(0, 1 - avgDiff / (mean + 1)); // 避免除零
    }

    return { energy, peak, variance, zeroCrossings, continuity };
  }

  /**
   * 提取所有窗口的特征
   */
  extractAllFeatures(): Array<{
    startIdx: number;
    endIdx: number;
    features: WindowFeatures;
    startTime: number;
    endTime: number;
  }> {
    const features: Array<{
      startIdx: number;
      endIdx: number;
      features: WindowFeatures;
      startTime: number;
      endTime: number;
    }> = [];
    const dataLength = this.data.data.length;

    for (let i = 0; i < dataLength; i += this.hopSamples) {
      const startIdx = i;
      const endIdx = Math.min(i + this.windowSamples, dataLength);

      if (endIdx - startIdx < this.windowSamples * 0.5) {
        // 跳过太短的窗口
        break;
      }

      const windowFeatures = this.computeWindowFeatures(startIdx, endIdx);
      const startTime = this.indexToTime(startIdx);
      const endTime = this.indexToTime(endIdx);

      features.push({
        startIdx,
        endIdx,
        features: windowFeatures,
        startTime,
        endTime,
      });
    }

    return features;
  }

  /**
   * 计算全局统计信息
   */
  computeGlobalStats(): {
    avgEnergy: number;
    maxEnergy: number;
    stdEnergy: number;
  } {
    const allFeatures = this.extractAllFeatures();
    const energies = allFeatures.map((f) => f.features.energy);

    const avgEnergy = energies.reduce((sum, e) => sum + e, 0) / energies.length;
    const maxEnergy = Math.max(...energies);

    const variance =
      energies.reduce((sum, e) => sum + Math.pow(e - avgEnergy, 2), 0) / energies.length;
    const stdEnergy = Math.sqrt(variance);

    return { avgEnergy, maxEnergy, stdEnergy };
  }

  /**
   * 平滑能量曲线（移动平均）
   */
  smoothEnergies(energies: number[], windowSize: number = 3): number[] {
    const smoothed: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < energies.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(energies.length, i + halfWindow + 1);
      const window = energies.slice(start, end);
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
      smoothed.push(avg);
    }

    return smoothed;
  }
}
