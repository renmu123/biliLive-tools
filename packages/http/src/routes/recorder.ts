import Router from "koa-router";
import { v4 as uuid } from "uuid";

import { createRecorderManager } from "@biliLive-tools/shared";
import { container } from "../index.js";
import { pick } from "lodash-es";
import { API } from "./api_types.js";
import { recorderToClient } from "./utils.js";

type createRecorderManagerType = Awaited<ReturnType<typeof createRecorderManager>>;

const router = new Router({
  prefix: "/recorder",
});

// API 的实际实现，这里负责实现对外暴露的接口，并假设 Args 都已经由上一层解析好了
// TODO: 暂时先一起放这个文件里，后面要拆分放到合适的地方

async function getRecorders(): Promise<API.getRecorders.Resp> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  return recorderManager.manager.recorders.map((item) => recorderToClient(item));
}

function getRecorder(args: API.getRecorder.Args): API.getRecorder.Resp {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = recorderManager.manager.recorders.find((item) => item.id === args.id);
  // TODO: 之后再处理
  if (recorder == null) throw new Error("404");

  return recorderToClient(recorder);
}

async function addRecorder(args: API.addRecorder.Args): Promise<API.addRecorder.Resp> {
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

async function updateRecorder(args: API.updateRecorder.Args): Promise<API.updateRecorder.Resp> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = await recorderManager.updateRecorder(args);
  if (recorder == null) throw new Error("配置不存在");

  return recorderToClient(recorder);
}

function removeRecorder(args: API.removeRecorder.Args): API.removeRecorder.Resp {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = recorderManager.manager.recorders.find((item) => item.id === args.id);
  if (recorder == null) return null;

  recorderManager.config.remove(args.id);
  recorderManager.manager.removeRecorder(recorder);
  return null;
}

async function startRecord(args: API.startRecord.Args): Promise<API.startRecord.Resp> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = await recorderManager.startRecord(args.id);
  if (recorder == null) throw new Error("开始录制失败");

  return recorderToClient(recorder);
}

async function stopRecord(args: API.stopRecord.Args): Promise<API.stopRecord.Resp> {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorder = recorderManager.manager.recorders.find((item) => item.id === args.id);
  if (recorder == null) throw new Error("配置不存在");

  if (recorder.recordHandle != null) {
    await recorder.recordHandle.stop("manual stop", true);
    // TODO: 或许还应该自动将 recorder.disableAutoCheck 设置为 true
  }
  return recorderToClient(recorder);
}

// API 与外部系统的连接，负责将外部系统传递的数据解析为正确的参数后调用合适的 API 并返回结果

router.get("/list", async (ctx) => {
  ctx.body = { payload: await getRecorders() };
});
router.post("/add", async (ctx) => {
  // TODO: 这里的类型限制还是有些问题，Nullable 的 key（如 extra）如果没写在这也不会报错，之后想想怎么改
  const args = pick(
    // TODO: 这里先不做 schema 校验，以后再加
    (ctx.request.body ?? {}) as Omit<API.addRecorder.Args, "id">,
    "providerId",
    "channelId",
    "remarks",
    "disableAutoCheck",
    "quality",
    "streamPriorities",
    "sourcePriorities",
    "extra",
    "noGlobalFollowFields",
    "line",
    "disableProvideCommentsWhenRecording",
    "saveGiftDanma",
    "saveSCDanma",
    "segment",
    "sendToWebhook",
    "uid",
  );

  const data = await addRecorder(args);
  ctx.body = { payload: data };
});

router.get("/:id", (ctx) => {
  const { id } = ctx.params;
  ctx.body = { payload: getRecorder({ id }) };
});
router.put("/:id", (ctx) => {
  const { id } = ctx.params;
  const patch = pick(
    // TODO: 这里先不做 schema 校验，以后再加
    ctx.request.body as Omit<API.updateRecorder.Args, "id">,
    "remarks",
    "disableAutoCheck",
    "quality",
    "streamPriorities",
    "sourcePriorities",
    "noGlobalFollowFields",
    "line",
    "disableProvideCommentsWhenRecording",
    "saveGiftDanma",
    "saveSCDanma",
    "segment",
    "sendToWebhook",
    "uid",
  );

  ctx.body = { payload: updateRecorder({ id, ...patch }) };
});
router.delete("/:id", (ctx) => {
  const { id } = ctx.params;
  ctx.body = { payload: removeRecorder({ id }) };
});

router.post("/:id/start_record", async (ctx) => {
  const { id } = ctx.params;
  ctx.body = { payload: await startRecord({ id }) };
});
router.post("/:id/stop_record", async (ctx) => {
  const { id } = ctx.params;
  ctx.body = { payload: await stopRecord({ id }) };
});

router.post("/:id/stop_record", async (ctx) => {
  const { id } = ctx.params;
  ctx.body = { payload: await stopRecord({ id }) };
});

// router.get(":id/history", async (ctx) => {
// const { id } = ctx.params;
// 分页
// const { page, pageSize,startTime,endTime } = ctx.query
// ctx.body = { payload: await recorder.getHistory() };
// });

router.get("/manager/resolveChannel", async (ctx) => {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");

  const { url } = ctx.query;
  ctx.body = { payload: await recorderManager.resolveChannel(url as string) };
});

router.get("/manager/liveInfo", async (ctx) => {
  const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
  const recorders = recorderManager.manager.recorders;

  const list: {
    owner: string;
    title: string;
    avatar: string;
    cover: string;
  }[] = [];
  for (const recoder of recorders) {
    const info = await recoder.getLiveInfo();
    list.push(info);
  }

  // const livingStatus = await Promise.all(ids.map(getLiveStatus));

  ctx.body = {
    payload: list,
  };
});

export default router;
