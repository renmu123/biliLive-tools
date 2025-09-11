import type {
  Recorder,
  // RecorderManagerCreateOpts,
  RecordHandle,
} from "@bililive-tools/manager";

import type { Recorder as RecoderConfig } from "@biliLive-tools/types";

export interface PagedArgs {
  page: number;
  pageSize: number;
}
export interface PagedResp extends PagedArgs {
  total: number;
  totalPage: number;
}

export type ClientRecorder = Omit<
  Recorder<RecoderConfig["extra"]>,
  "all" | "getChannelURL" | "checkLiveStatusAndRecord" | "recordHandle" | "toJSON" | "getLiveInfo"
> & {
  channelURL: string;
  recordHandle?: Omit<RecordHandle, "stop">;
};

export type ClientRecord = { isFileExists?: boolean };

export interface GetLiveInfoArgs {
  ids: string;
}
export interface LiveInfo {
  owner: string;
  title: string;
  avatar: string;
  cover: string;
  channelId: string;
  living: boolean;
}
export type GetLiveInfoResp = LiveInfo[];

export type GetRecordersArgs = {
  platform?: string;
  recordStatus?: "recording" | "unrecorded";
  name?: string;
  autoCheck?: string;
  page?: number;
  pageSize?: number;
  sortField?: "living" | "state" | "monitorStatus";
  sortDirection?: "asc" | "desc";
};

export type GetRecordersResp = {
  data: Pick<
    ClientRecorder,
    | "id"
    | "channelId"
    | "remarks"
    | "disableAutoCheck"
    | "providerId"
    | "channelURL"
    | "recordHandle"
    | "liveInfo"
    | "state"
    | "usedSource"
    | "usedStream"
    | "tempStopIntervalCheck"
    | "extra"
  >[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
};

export interface GetRecorderArgs {
  id: RecoderConfig["id"];
}
export type GetRecorderResp = RecoderConfig;

export type AddRecorderArgs = Omit<RecoderConfig, "id">;
export type AddRecorderResp = ClientRecorder;

export type UpdateRecorderArgs = Pick<
  RecoderConfig,
  | "id"
  | "remarks"
  | "disableAutoCheck"
  | "quality"
  | "streamPriorities"
  | "sourcePriorities"
  | "noGlobalFollowFields"
  | "line"
  | "disableProvideCommentsWhenRecording"
  | "saveGiftDanma"
  | "saveSCDanma"
  | "segment"
  | "sendToWebhook"
  | "uid"
  | "saveCover"
  | "qualityRetry"
  | "formatName"
  | "useM3U8Proxy"
  | "codecName"
  | "titleKeywords"
  | "liveStartNotification"
  | "source"
  | "videoFormat"
  | "recorderType"
  | "cookie"
  | "doubleScreen"
  | "onlyAudio"
  | "useServerTimestamp"
  | "handleTime"
>;
export type UpdateRecorderResp = ClientRecorder;

export interface RemoveRecorderArgs {
  id: RecoderConfig["id"];
  removeHistory?: boolean;
}
export type RemoveRecorderResp = null;

export interface StartRecordArgs {
  id: RecoderConfig["id"];
}
export type StartRecordResp = ClientRecorder;

export interface StopRecordArgs {
  id: RecoderConfig["id"];
}
export type StopRecordResp = ClientRecorder;

export interface CutRecordArgs {
  id: RecoderConfig["id"];
}
export type CutRecordResp = ClientRecorder;

export interface GetManagerArgs {}
// export type GetManagerResp = Omit<RecorderManagerCreateOpts, "providers">;

// export type UpdateManagerArgs = Omit<RecorderManagerCreateOpts, "providers">;
// export type UpdateManagerResp = Omit<RecorderManagerCreateOpts, "providers">;

export interface ResolveChannelArgs {
  channelURL: string;
}
export type ResolveChannelResp = {
  providerId: RecoderConfig["providerId"];
  channelId: string;
  owner: string;
  uid?: number;
  avatar?: string;
} | null;

export interface GetManagerDefaultArgs {}
// export type GetManagerDefaultResp = Omit<RecorderManagerCreateOpts, "providers">;

export interface ClearInvalidRecordsArgs {
  recorderId?: RecoderConfig["id"];
}
export type ClearInvalidRecordsResp = number;

export interface GetRecordsArgs extends PagedArgs {
  recorderId?: RecoderConfig["id"];
}
export interface GetRecordsResp extends PagedResp {
  items: ClientRecord[];
}

export interface GetRecordArgs {
  id: string;
}
export type GetRecordResp = ClientRecord;

export interface GetRecordExtraDataArgs {
  id: string;
}

export type RecorderAPI = {
  getLiveInfo: {
    Args: GetLiveInfoArgs;
    Resp: GetLiveInfoResp;
  };
  getRecorders: {
    Args: GetRecordersArgs;
    Resp: GetRecordersResp;
  };
  getRecorder: {
    Args: GetRecorderArgs;
    Resp: GetRecorderResp;
  };
  addRecorder: {
    Args: AddRecorderArgs;
    Resp: AddRecorderResp;
  };
  updateRecorder: {
    Args: UpdateRecorderArgs;
    Resp: UpdateRecorderResp;
  };
  removeRecorder: {
    Args: RemoveRecorderArgs;
    Resp: RemoveRecorderResp;
  };
  startRecord: {
    Args: StartRecordArgs;
    Resp: StartRecordResp;
  };
  stopRecord: {
    Args: StopRecordArgs;
    Resp: StopRecordResp;
  };
  cutRecord: {
    Args: CutRecordArgs;
    Resp: CutRecordResp;
  };
  // getManager: {
  //   Args: GetManagerArgs;
  //   Resp: GetManagerResp;
  // };
  // updateManager: {
  //   Args: UpdateManagerArgs;
  //   Resp: UpdateManagerResp;
  // };
  resolveChannel: {
    Args: ResolveChannelArgs;
    Resp: ResolveChannelResp;
  };
  // getManagerDefault: {
  //   Args: GetManagerDefaultArgs;
  //   Resp: GetManagerDefaultResp;
  // };
  clearInvalidRecords: {
    Args: ClearInvalidRecordsArgs;
    Resp: ClearInvalidRecordsResp;
  };
  getRecords: {
    Args: GetRecordsArgs;
    Resp: GetRecordsResp;
  };
  getRecord: {
    Args: GetRecordArgs;
    Resp: GetRecordResp;
  };
};

export interface UpdateRecorder {
  event: "update_recorder";
  recorder: ClientRecorder;
}

export interface AddRecorder {
  event: "add_recorder";
  recorder: ClientRecorder;
}

export interface RemoveRecorder {
  event: "remove_recorder";
  id: ClientRecorder["id"];
}

export interface RecordStart {
  event: "record_start";
  recorder: ClientRecorder;
}

export type SSEMessage = UpdateRecorder | AddRecorder | RemoveRecorder | RecordStart;
