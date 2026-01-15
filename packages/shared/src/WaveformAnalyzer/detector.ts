import { AudiowaveformData, AudioSegment, SegmentType, AnalyzerConfig } from "./types.js";
import { WaveformAnalyzer } from "./analyzer.js";

/**
 * 边界检测器 - 识别唱歌和交流的时间边界
 */
export class BoundaryDetector {
  private analyzer: WaveformAnalyzer;
  private config: AnalyzerConfig;

  constructor(data: AudiowaveformData, config: AnalyzerConfig) {
    this.analyzer = new WaveformAnalyzer(data, config);
    this.config = config;
  }

  /**
   * 检测所有片段
   */
  detectSegments(): AudioSegment[] {
    // 1. 提取所有窗口特征
    const windowFeatures = this.analyzer.extractAllFeatures();

    if (windowFeatures.length === 0) {
      return [];
    }

    // 2. 计算全局统计信息
    const globalStats = this.analyzer.computeGlobalStats();
    // console.log("全局统计:", globalStats);

    // 3. 计算阈值
    const singingThreshold = globalStats.avgEnergy * this.config.singingEnergyThreshold;
    const talkingThreshold = globalStats.avgEnergy * this.config.talkingEnergyThreshold;
    const silenceThreshold = this.config.silenceThreshold;

    // console.log(
    //   `阈值设定: 唱歌=${singingThreshold.toFixed(
    //     2
    //   )}, 说话=${talkingThreshold.toFixed(2)}, 静音=${silenceThreshold}`
    // );

    // 4. 对每个窗口分类（考虑能量连续性）
    const classifications: Array<{
      type: SegmentType;
      startIdx: number;
      endIdx: number;
      startTime: number;
      endTime: number;
      energy: number;
      continuity: number;
    }> = [];

    for (const window of windowFeatures) {
      const energy = window.features.energy;
      const continuity = window.features.continuity;
      let type: SegmentType;

      if (energy < silenceThreshold) {
        type = SegmentType.SILENCE;
      } else if (energy >= singingThreshold) {
        // 高能量 + 高连续性 = 唱歌
        type = SegmentType.SINGING;
      } else if (energy >= talkingThreshold) {
        // 中等能量：根据连续性判断
        // 连续性高 (>0.6) 可能是低音量唱歌，连续性低是说话
        if (continuity > 0.6 && energy > talkingThreshold * 1.2) {
          type = SegmentType.SINGING;
        } else {
          type = SegmentType.TALKING;
        }
      } else {
        type = SegmentType.SILENCE;
      }

      classifications.push({
        type,
        startIdx: window.startIdx,
        endIdx: window.endIdx,
        startTime: window.startTime,
        endTime: window.endTime,
        energy,
        continuity,
      });
    }

    // 5. 合并相邻的同类片段
    const mergedSegments = this.mergeAdjacentSegments(classifications);

    // 5.5 根据连续性重新分类模糊片段
    const reclassified = this.reclassifyByContinuity(
      mergedSegments,
      classifications,
      singingThreshold,
      talkingThreshold,
    );

    // 6. 过滤掉太短的片段
    const filteredSegments = reclassified.filter(
      (seg) => seg.endTime - seg.startTime >= this.config.minSegmentDuration,
    );

    // 7. 再次合并间隔较小的同类片段
    const finalSegments = this.mergeCloseSegments(filteredSegments);

    // 8. 计算置信度
    return finalSegments.map((seg) => ({
      ...seg,
      confidence: this.calculateConfidence(seg, globalStats),
    }));
  }

  /**
   * 合并相邻的同类片段
   */
  private mergeAdjacentSegments(
    classifications: Array<{
      type: SegmentType;
      startIdx: number;
      endIdx: number;
      startTime: number;
      endTime: number;
      energy: number;
    }>,
  ): AudioSegment[] {
    if (classifications.length === 0) return [];

    const segments: AudioSegment[] = [];
    let current = classifications[0];
    let energySum = current.energy;
    let energyCount = 1;
    let maxEnergy = current.energy;

    for (let i = 1; i < classifications.length; i++) {
      const next = classifications[i];

      if (next.type === current.type) {
        // 同类型，扩展当前片段
        current = {
          ...current,
          endIdx: next.endIdx,
          endTime: next.endTime,
        };
        energySum += next.energy;
        energyCount++;
        maxEnergy = Math.max(maxEnergy, next.energy);
      } else {
        // 不同类型，保存当前片段并开始新片段
        segments.push({
          type: current.type,
          startTime: current.startTime,
          endTime: current.endTime,
          startIndex: current.startIdx,
          endIndex: current.endIdx,
          confidence: 0, // 稍后计算
          avgEnergy: energySum / energyCount,
          peakEnergy: maxEnergy,
        });

        current = next;
        energySum = next.energy;
        energyCount = 1;
        maxEnergy = next.energy;
      }
    }

    // 保存最后一个片段
    segments.push({
      type: current.type,
      startTime: current.startTime,
      endTime: current.endTime,
      startIndex: current.startIdx,
      endIndex: current.endIdx,
      confidence: 0,
      avgEnergy: energySum / energyCount,
      peakEnergy: maxEnergy,
    });

    return segments;
  }

  /**
   * 合并间隔较小的同类片段
   */
  private mergeCloseSegments(segments: AudioSegment[]): AudioSegment[] {
    if (segments.length <= 1) return segments;

    const merged: AudioSegment[] = [segments[0]];

    for (let i = 1; i < segments.length; i++) {
      const prev = merged[merged.length - 1];
      const curr = segments[i];

      const gap = curr.startTime - prev.endTime;

      // 如果是同类型且间隔小于阈值，合并
      if (prev.type === curr.type && gap <= this.config.mergeGap) {
        prev.endTime = curr.endTime;
        prev.endIndex = curr.endIndex;
        prev.avgEnergy = (prev.avgEnergy + curr.avgEnergy) / 2;
        prev.peakEnergy = Math.max(prev.peakEnergy, curr.peakEnergy);
      } else {
        merged.push(curr);
      }
    }

    return merged;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    segment: AudioSegment,
    globalStats: { avgEnergy: number; maxEnergy: number; stdEnergy: number },
  ): number {
    const duration = segment.endTime - segment.startTime;
    const energyRatio = segment.avgEnergy / globalStats.avgEnergy;

    let confidence = 0;

    if (segment.type === SegmentType.SINGING) {
      // 唱歌：高能量 + 长持续时间 = 高置信度
      const energyScore = Math.min(energyRatio / this.config.singingEnergyThreshold, 1.0);
      const durationScore = Math.min(duration / 10.0, 1.0); // 10秒为满分
      confidence = energyScore * 0.7 + durationScore * 0.3;
    } else if (segment.type === SegmentType.TALKING) {
      // 说话：中等能量 + 适中持续时间
      const energyScore = energyRatio >= this.config.talkingEnergyThreshold ? 0.8 : 0.5;
      const durationScore = duration >= 2.0 ? 0.8 : 0.5;
      confidence = (energyScore + durationScore) / 2;
    } else {
      // 静音：低能量
      confidence = segment.avgEnergy < this.config.silenceThreshold ? 0.9 : 0.6;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 根据连续性重新分类模糊片段
   * 说话时能量会有停顿，连续性低；唱歌时能量连续，连续性高
   */
  private reclassifyByContinuity(
    segments: AudioSegment[],
    classifications: Array<{
      type: SegmentType;
      startIdx: number;
      endIdx: number;
      startTime: number;
      endTime: number;
      energy: number;
      continuity: number;
    }>,
    singingThreshold: number,
    talkingThreshold: number,
  ): AudioSegment[] {
    return segments.map((segment) => {
      // 只重新分类 talking 片段，看是否应该归为 singing
      if (segment.type !== SegmentType.TALKING) {
        return segment;
      }

      // 计算该片段的平均连续性
      const segmentClassifications = classifications.filter(
        (c) => c.startTime >= segment.startTime && c.endTime <= segment.endTime,
      );

      if (segmentClassifications.length === 0) {
        return segment;
      }

      const avgContinuity =
        segmentClassifications.reduce((sum, c) => sum + c.continuity, 0) /
        segmentClassifications.length;

      // 如果连续性高 (>0.65) 且能量接近唱歌阈值，重新分类为唱歌
      if (avgContinuity > 0.65 && segment.avgEnergy > talkingThreshold * 1.3) {
        return {
          ...segment,
          type: SegmentType.SINGING,
        };
      }

      // 如果连续性很低 (<0.4)，确认为说话
      return segment;
    });
  }

  /**
   * 获取摘要统计
   */
  getSummary(segments: AudioSegment[]): {
    totalDuration: number;
    singingDuration: number;
    talkingDuration: number;
    silenceDuration: number;
  } {
    const totalDuration = this.analyzer.getTotalDuration();

    let singingDuration = 0;
    let talkingDuration = 0;
    let silenceDuration = 0;

    for (const seg of segments) {
      const duration = seg.endTime - seg.startTime;
      switch (seg.type) {
        case SegmentType.SINGING:
          singingDuration += duration;
          break;
        case SegmentType.TALKING:
          talkingDuration += duration;
          break;
        case SegmentType.SILENCE:
          silenceDuration += duration;
          break;
      }
    }

    return {
      totalDuration,
      singingDuration,
      talkingDuration,
      silenceDuration,
    };
  }
}
