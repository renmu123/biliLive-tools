export interface AudioFrame {
  startSeconds: number;
  endSeconds: number;
  singingScore: number;
  speechScore: number;
  musicScore: number;
}

export interface SingingSegment {
  startSeconds: number;
  endSeconds: number;
  longestSeedRunSeconds?: number;
  seedDecisionSeconds?: number;
}

export interface AudioAnalysis {
  audioSeconds: number;
  frames: AudioFrame[];
}

export interface ProgressCallback {
  (data: { stage: string; percentage: number; message: string }): void;
}
