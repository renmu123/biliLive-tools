export {
  AliyunASR,
  type AliyunASROptions,
  type SubmitTaskParams,
  type TaskStatus,
  type TranscriptionResult,
  type TaskQueryResult,
  type TranscriptionDetail,
} from "./aliyun.js";

export {
  OpenAIWhisperASR,
  type OpenAIWhisperASROptions,
  type OpenAITranscriptionResponse,
  type OpenAISegment,
} from "./openai.js";

export {
  type ASRProvider,
  AliyunASRAdapter,
  OpenAIASRAdapter,
  createASRProvider,
  recognize,
} from "./adapter.js";

export { type StandardASRResult, type StandardASRSegment, type StandardASRWord } from "./types.js";
