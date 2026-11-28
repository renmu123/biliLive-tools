/** YAMNet 演唱检测配置。时间单位为秒，分数为 0–1。 */
export interface MusicDetectionConfig {
  startThreshold: number;
  sustainThreshold: number;
  maximumSeedSpeech: number;
  contextFrames: number;
  boundarySmoothingFrames: number;
  decisionHopSeconds: number;
  minimumSeedSeconds: number;
  minSegmentDuration: number;
  maxGapDuration: number;
  bridgeMusicGaps: boolean;
  bridgeMaxGapSeconds: number;
  extendMusicEdges: boolean;
  maximumLeadSeconds: number;
  maximumTailSeconds: number;
  disableCache: boolean;
}

export const DEFAULT_MUSIC_DETECTION_CONFIG: Readonly<MusicDetectionConfig> = Object.freeze({
  startThreshold: 0.015,
  sustainThreshold: 0.01,
  maximumSeedSpeech: 0.15,
  contextFrames: 21,
  boundarySmoothingFrames: 5,
  decisionHopSeconds: 0.96,
  minimumSeedSeconds: 4.8,
  minSegmentDuration: 20,
  maxGapDuration: 12,
  bridgeMusicGaps: true,
  bridgeMaxGapSeconds: 30,
  extendMusicEdges: true,
  maximumLeadSeconds: 30,
  maximumTailSeconds: 30,
  disableCache: true,
});
