import { v4 as uuid } from "uuid";
import { container } from "../index.js";
import { createRecorderManager } from "@biliLive-tools/shared";
import { Recorder } from "@autorecord/manager";
import { omit } from "lodash-es";

import type { RecorderAPI, ClientRecorder } from "../types/recorder.js";

type createRecorderManagerType = Awaited<ReturnType<typeof createRecorderManager>>;

// RecorderAPI 的实际实现，这里负责实现对外暴露的接口，并假设 Args 都已经由上一层解析好了
async function getRecorders(
  params: RecorderAPI["getRecorders"]["Args"],
): Promise<RecorderAPI["getRecorders"]["Resp"]> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  let list = recorderManager.manager.recorders.map((item) => recorderToClient(item));

  if (params.platform) {
    list = list.filter((item) => item.providerId === params.platform);
  }
  if (params.recordStatus) {
    list = list.filter(
      (item) => (item.recordHandle != null) === (params.recordStatus === "recording"),
    );
  }
  if (params.name) {
    list = list.filter(
      (item) =>
        item.remarks?.includes(params.name as string) ||
        item.channelId.includes(params.name as string),
    );
  }
  if (params.autoCheck) {
    list = list.filter((item) => (item.disableAutoCheck ? "2" : "1") === params.autoCheck);
  }
  return list;
}

function getRecorder(args: RecorderAPI["getRecorder"]["Args"]): RecorderAPI["getRecorder"]["Resp"] {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = recorderManager.manager.recorders.find((item) => item.id === args.id);
  if (recorder == null) throw new Error("404");

  return recorderToClient(recorder);
}

async function addRecorder(
  args: RecorderAPI["addRecorder"]["Args"],
): Promise<RecorderAPI["addRecorder"]["Resp"]> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");

  const config = {
    id: uuid(),
    ...args,
    extra: {
      createTimestamp: Date.now(),
    },
  };
  const recorder = await recorderManager.addRecorder(config);
  if (recorder == null) throw new Error("添加失败：不可重复添加");
  return recorderToClient(recorder);
}

async function updateRecorder(
  args: RecorderAPI["updateRecorder"]["Args"],
): Promise<RecorderAPI["updateRecorder"]["Resp"]> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = await recorderManager.updateRecorder(args);
  if (recorder == null) throw new Error("配置不存在");

  return recorderToClient(recorder);
}

function removeRecorder(
  args: RecorderAPI["removeRecorder"]["Args"],
): RecorderAPI["removeRecorder"]["Resp"] {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = recorderManager.manager.recorders.find((item) => item.id === args.id);
  if (recorder == null) return null;

  recorderManager.config.remove(args.id);
  recorderManager.manager.removeRecorder(recorder);
  return null;
}

async function startRecord(
  args: RecorderAPI["startRecord"]["Args"],
): Promise<RecorderAPI["startRecord"]["Resp"]> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = await recorderManager.startRecord(args.id);
  if (recorder == null) throw new Error("开始录制失败");

  return recorderToClient(recorder);
}

async function stopRecord(
  args: RecorderAPI["stopRecord"]["Args"],
): Promise<RecorderAPI["stopRecord"]["Resp"]> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = recorderManager.manager.recorders.find((item) => item.id === args.id);
  if (recorder == null) throw new Error("配置不存在");

  if (recorder.recordHandle != null) {
    await recorder.recordHandle.stop("manual stop", true);
  }
  return recorderToClient(recorder);
}

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
    ...omit(
      recorder,
      "all",
      "getChannelURL",
      "checkLiveStatusAndRecord",
      "recordHandle",
      "toJSON",
      "getLiveInfo",
      "auth",
    ),
    channelURL: recorder.getChannelURL(),
    recordHandle: recorder.recordHandle && omit(recorder.recordHandle, "stop"),
    liveInfo: recorder.liveInfo,
  };
}

export function resolveChannel(url: string) {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  return recorderManager.resolveChannel(url);
}

export async function getLiveInfo() {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorders = recorderManager.manager.recorders;

  const requests = recorders.map((recorder) => recorder.getLiveInfo());
  const list: {
    owner: string;
    title: string;
    avatar: string;
    cover: string;
  }[] = await Promise.all(requests);
  return list;
}

export default {
  getRecorders,
  getRecorder,
  addRecorder,
  updateRecorder,
  removeRecorder,
  startRecord,
  stopRecord,
  getLiveInfo,
  resolveChannel,
};
