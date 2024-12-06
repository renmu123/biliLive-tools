/* eslint-disable @typescript-eslint/no-namespace */
import type {
  Recorder,
  // RecorderCreateOpts,
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
  // TODO: 可以改成排除所有方法 & EmitterProps
  "all" | "getChannelURL" | "checkLiveStatusAndRecord" | "recordHandle" | "toJSON" | "getLiveInfo"
> & {
  channelURL: string;
  recordHandle?: Omit<RecordHandle, "stop">;
};

export type ClientRecord = { isFileExists?: boolean };

export namespace API {
  export namespace getLiveInfo {
    export interface Args {
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

    export type Resp = LiveInfo[];
  }
  export namespace getRecorders {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Args {
      platform?: string;
      recordStatus?: "recording" | "unrecorded";
      name?: string;
    }

    export type Resp = ClientRecorder[];
  }

  export namespace getRecorder {
    export interface Args {
      id: Recorder["id"];
    }

    export type Resp = ClientRecorder;
  }

  export namespace addRecorder {
    export type Args = Omit<LocalRecordr, "id">;

    export type Resp = ClientRecorder;
  }

  export namespace updateRecorder {
    export type Args = Pick<
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

    export type Resp = ClientRecorder;
  }

  export namespace removeRecorder {
    export interface Args {
      id: Recorder["id"];
    }

    export type Resp = null;
  }

  export namespace startRecord {
    export interface Args {
      id: Recorder["id"];
    }

    export type Resp = ClientRecorder;
  }

  export namespace stopRecord {
    export interface Args {
      id: Recorder["id"];
    }

    export type Resp = ClientRecorder;
  }

  export namespace getManager {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Args {}

    export type Resp = Omit<RecorderManagerCreateOpts, "providers">;
  }

  export namespace updateManager {
    export type Args = Omit<RecorderManagerCreateOpts, "providers">;

    export type Resp = Omit<RecorderManagerCreateOpts, "providers">;
  }

  export namespace resolveChannel {
    export interface Args {
      channelURL: string;
    }

    export type Resp = {
      providerId: string;
      channelId: string;
      owner: string;
    } | null;
  }

  export namespace getManagerDefault {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Args {}

    export type Resp = Omit<RecorderManagerCreateOpts, "providers">;
  }

  export namespace clearInvalidRecords {
    export interface Args {
      recorderId?: Recorder["id"];
    }

    export type Resp = number;
  }

  export namespace getRecords {
    export interface Args extends PagedArgs {
      recorderId?: Recorder["id"];
    }

    export interface Resp extends PagedResp {
      items: ClientRecord[];
    }
  }

  export namespace getRecord {
    export interface Args {
      id: string;
    }

    export type Resp = ClientRecord;
  }

  export namespace getRecordExtraData {
    export interface Args {
      id: string;
    }

    export type Resp = RecordExtraData;
  }

  export namespace createRecordSRT {
    export interface Args {
      id: string;
    }

    export type Resp = string;
  }

  export namespace logMethod {
    export type Args = {
      text: string;
    };

    export type Resp = null;
  }
}

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
