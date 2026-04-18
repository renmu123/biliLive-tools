import request from "./request";

export type WebhookLiveStatus =
  | "recording"
  | "processing"
  | "pendingUpload"
  | "uploading"
  | "completed"
  | "error";

export type WebhookRecordStatus = "recording" | "recorded" | "prehandled" | "handled" | "error";
export type WebhookUploadStatus = "pending" | "uploading" | "uploaded" | "error";

export interface RawWebhookPart {
  partId: string;
  title: string;
  startTime?: number;
  endTime?: number;
  recordStatus: WebhookRecordStatus;
  filePath: string;
  uploadStatus: WebhookUploadStatus;
  cover?: string;
  rawFilePath: string;
  rawUploadStatus: WebhookUploadStatus;
}

export interface WebhookMonitorPart {
  partId: string;
  title: string;
  startTime: number | null;
  endTime: number | null;
  durationMs: number | null;
  recordStatus: WebhookRecordStatus;
  uploadStatus: WebhookUploadStatus;
  rawUploadStatus: WebhookUploadStatus;
  cover: string | null;
  filePath: string;
  rawFilePath: string;
  isAbnormal: boolean;
  pendingUpload: boolean;
  pendingRawUpload: boolean;
  raw: RawWebhookPart;
}

export interface WebhookMonitorLive {
  eventId: string;
  roomId: string;
  platform: string;
  software: string;
  title: string;
  username: string;
  startTime: number;
  endTime: number | null;
  durationMs: number | null;
  status: WebhookLiveStatus;
  isActive: boolean;
  isAbnormal: boolean;
  abnormalPartIds: string[];
  aid?: number;
  rawAid?: number;
  stats: {
    totalParts: number;
    recordingParts: number;
    recordedParts: number;
    prehandledParts: number;
    handledParts: number;
    errorParts: number;
    pendingUploadParts: number;
    uploadingParts: number;
    uploadedParts: number;
    pendingRawUploadParts: number;
    rawUploadingParts: number;
    rawUploadedParts: number;
  };
  parts: WebhookMonitorPart[];
}

export interface WebhookMonitorResponse {
  summary: {
    totalLives: number;
    activeLives: number;
    abnormalLives: number;
    recordingParts: number;
    processingParts: number;
    pendingUploadParts: number;
    uploadingParts: number;
    errorParts: number;
  };
  lives: WebhookMonitorLive[];
}

export interface WebhookMonitorQuery {
  roomId?: string;
  platform?: string;
  status?: WebhookLiveStatus | "all";
  activeOnly?: boolean;
  abnormalOnly?: boolean;
  keyword?: string;
}

export const getWebhookMonitorData = async (
  params: WebhookMonitorQuery = {},
): Promise<WebhookMonitorResponse> => {
  const res = await request.get("/common/webhook/monitor", {
    params,
  });
  return res.data;
};

const webhookApi = {
  getMonitorData: getWebhookMonitorData,
};

export default webhookApi;
