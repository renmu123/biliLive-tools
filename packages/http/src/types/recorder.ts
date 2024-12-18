import type {
  Recorder,
  RecorderManagerCreateOpts,
  RecordExtraData,
  RecordHandle,
} from "@autorecord/manager";

import type { LocalRecordr } from "@biliLive-tools/types";

export interface RecorderExtra {
  createTimestamp: number;
}

export interface PagedArgs {
  page: number;
  pageSize: number;
}
export interface PagedResp extends PagedArgs {
  total: number;
  totalPage: number;
}

export type ClientRecorder = Omit<
  Recorder<RecorderExtra>,
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

export interface GetRecordersArgs {
  platform?: string;
  recordStatus?: "recording" | "unrecorded";
  name?: string;
  autoCheck?: "1" | "2";
}
export type GetRecordersResp = ClientRecorder[];

export interface GetRecorderArgs {
  id: Recorder["id"];
}
export type GetRecorderResp = ClientRecorder;

export type AddRecorderArgs = Omit<LocalRecordr, "id">;
export type AddRecorderResp = ClientRecorder;

export type UpdateRecorderArgs = Pick<
  LocalRecordr,
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
>;
export type UpdateRecorderResp = ClientRecorder;

export interface RemoveRecorderArgs {
  id: Recorder["id"];
}
export type RemoveRecorderResp = null;

export interface StartRecordArgs {
  id: Recorder["id"];
}
export type StartRecordResp = ClientRecorder;

export interface StopRecordArgs {
  id: Recorder["id"];
}
export type StopRecordResp = ClientRecorder;

export interface GetManagerArgs {}
export type GetManagerResp = Omit<RecorderManagerCreateOpts, "providers">;

export type UpdateManagerArgs = Omit<RecorderManagerCreateOpts, "providers">;
export type UpdateManagerResp = Omit<RecorderManagerCreateOpts, "providers">;

export interface ResolveChannelArgs {
  channelURL: string;
}
export type ResolveChannelResp = {
  providerId: string;
  channelId: string;
  owner: string;
} | null;

export interface GetManagerDefaultArgs {}
export type GetManagerDefaultResp = Omit<RecorderManagerCreateOpts, "providers">;

export interface ClearInvalidRecordsArgs {
  recorderId?: Recorder["id"];
}
export type ClearInvalidRecordsResp = number;

export interface GetRecordsArgs extends PagedArgs {
  recorderId?: Recorder["id"];
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
export type GetRecordExtraDataResp = RecordExtraData;

export type RecorderAPI = {
  getLiveInfo: {
    Args: GetLiveInfoArgs;
    Resp: GetLiveInfoResp;
  };
  getRecorders: {
    Args: GetRecordersArgs;
    Resp: Pick<
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
    >[];
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
  getManager: {
    Args: GetManagerArgs;
    Resp: GetManagerResp;
  };
  updateManager: {
    Args: UpdateManagerArgs;
    Resp: UpdateManagerResp;
  };
  resolveChannel: {
    Args: ResolveChannelArgs;
    Resp: ResolveChannelResp;
  };
  getManagerDefault: {
    Args: GetManagerDefaultArgs;
    Resp: GetManagerDefaultResp;
  };
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
  getRecordExtraData: {
    Args: GetRecordExtraDataArgs;
    Resp: GetRecordExtraDataResp;
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
