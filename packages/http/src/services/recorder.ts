import axios from "axios";
import { v4 as uuid } from "uuid";
import { container } from "../index.js";
import { createRecorderManager } from "@biliLive-tools/shared";
import { omit, pick, isEmpty } from "lodash-es";
import recordHistory from "@biliLive-tools/shared/recorder/recordHistory.js";
import logger from "@biliLive-tools/shared/utils/log.js";

import type { RecorderAPI, ClientRecorder } from "../types/recorder.js";
import type { Recorder } from "@bililive-tools/manager";

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

  // 添加分页逻辑
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedList = list.slice(start, end);

  return {
    data: paginatedList.map((item) => {
      const data = pick(
        item,
        "id",
        "providerId",
        "channelId",
        "remarks",
        "disableAutoCheck",
        "channelURL",
        "recordHandle",
        "liveInfo",
        "state",
        "usedSource",
        "usedStream",
        "tempStopIntervalCheck",
        "onlyAudio",
      );
      data.recordHandle = isEmpty(data.recordHandle)
        ? data.recordHandle
        : omit(data.recordHandle, "ffmpegArgs");
      return data;
    }),
    pagination: {
      total: list.length,
      page,
      pageSize,
    },
  };
}

function getRecorder(
  args: RecorderAPI["getRecorder"]["Args"],
): RecorderAPI["getRecorder"]["Resp"] | undefined {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = recorderManager.manager.recorders.find((item) => item.id === args.id);
  if (recorder == null) throw new Error("404");
  const data = recorderManager.config.getRaw(args.id);

  return data;
}

async function addRecorder(
  args: RecorderAPI["addRecorder"]["Args"],
): Promise<RecorderAPI["addRecorder"]["Resp"]> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");

  const config = {
    id: uuid(),
    ...args,
  };
  // TODO: recorder配置重写
  // @ts-ignore
  const recorder = await recorderManager.addRecorder(config);
  if (recorder == null) throw new Error("添加失败：不可重复添加");
  return recorderToClient(recorder);
}

async function updateRecorder(
  args: RecorderAPI["updateRecorder"]["Args"],
): Promise<RecorderAPI["updateRecorder"]["Resp"]> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  // TODO: recorder配置重写
  // @ts-ignore
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

  // 如果需要删除录制历史记录
  if (args.removeHistory) {
    try {
      recordHistory.removeRecords(recorder.channelId, recorder.providerId);
    } catch (error) {
      logger.error("删除录制历史失败:", error, recorder);
    }
  }

  recorderManager.config.remove(args.id);
  recorderManager.manager.removeRecorder(recorder);

  return null;
}

async function startRecord(args: RecorderAPI["startRecord"]["Args"]): Promise<null> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  await recorderManager.manager.startRecord(args.id);
  return null;
}

async function stopRecord(args: RecorderAPI["stopRecord"]["Args"]): Promise<null> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  await recorderManager.manager.stopRecord(args.id);
  return null;
}

async function cutRecord(args: RecorderAPI["cutRecord"]["Args"]): Promise<null> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  await recorderManager.manager.cutRecord(args.id);
  return null;
}

async function getBiliStream(id: string) {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = recorderManager.manager.recorders.find((item) => item.id === id);
  if (!recorder) throw new Error("未找到录制器");
  if (recorder.providerId !== "Bilibili") throw new Error("只支持bilibili录制");

  const url = recorder?.recordHandle?.url;
  if (url == null) throw new Error("未找到录制地址");

  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:107.0) Gecko/20100101 Firefox/107.0",
      Referer: "https://live.bilibili.com/",
    },
  });
  if (res.status !== 200) throw new Error("请求失败");

  const m3u8 = res.data;
  // console.log(m3u8 + "\n");
  const lines = m3u8.split("\n");
  const items: string[] = [];
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("#")) {
      // 还要处理EXT-X-MAP:URI
      if (line.startsWith("#EXT-X-MAP:URI=")) {
        const absoluteUrl = line.replace("#EXT-X-MAP:URI=", "").replaceAll('"', "");
        items.push(`#EXT-X-MAP:URI="${new URL(absoluteUrl, url).toString()}"`);
      } else {
        items.push(line);
      }
    } else {
      items.push(new URL(line, url).toString());
    }
  }

  return items.join("\n");
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

export async function getLiveInfo(ids: string[]) {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorders = recorderManager.manager.recorders;

  const requests = recorders
    .filter((recorder) => ids.includes(recorder.id))
    .map((recorder) => recorder.getLiveInfo());
  const list: {
    owner: string;
    title: string;
    avatar: string;
    cover: string;
  }[] = (await Promise.allSettled(requests))
    .filter((item) => item.status === "fulfilled")
    .map((item) => item.value);
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
  cutRecord,
  getLiveInfo,
  resolveChannel,
  getBiliStream,
};
