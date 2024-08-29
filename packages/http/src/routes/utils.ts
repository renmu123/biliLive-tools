import { Recorder } from "@autorecord/manager";
import { omit } from "lodash-es";
import { ClientRecorder } from "./api_types.js";

type PagedResultGetter<T = unknown> = (
  page: number,
  pageSize: number,
) => Promise<{
  page: number;
  pageSize: number;
  total: number;
  totalPage: number;
  items: T[];
}>;

export function createPagedResultGetter<T>(
  getItems: (startIdx: number, count: number) => Promise<{ items: T[]; total: number }>,
): PagedResultGetter<T> {
  return async (page, pageSize) => {
    const start = (page - 1) * pageSize;
    const { items, total } = await getItems(start, pageSize);
    return {
      page,
      pageSize,
      total,
      totalPage: Math.ceil(total / pageSize),
      items,
    };
  };
}

export function recorderToClient(recorder: Recorder): ClientRecorder {
  return {
    // TODO: 用 pick 更加稳健一些，这里省事先 omit 了
    ...omit(recorder, "all", "getChannelURL", "checkLiveStatusAndRecord", "recordHandle", "toJSON"),
    channelURL: recorder.getChannelURL(),
    recordHandle: recorder.recordHandle && omit(recorder.recordHandle, "stop"),
    liveInfo: recorder.liveInfo,
  };
}
