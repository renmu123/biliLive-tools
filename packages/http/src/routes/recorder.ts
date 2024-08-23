import Router from "koa-router";
import { v4 as uuid } from "uuid";

import { genSavePathFromRule, createRecorderManager } from "@autorecord/manager";
import { container } from "../index.js";
// import { addRecorderWithAutoIncrementId, recorderManager } from "../manager";
import { pick } from "lodash-es";
import { API } from "./api_types.js";
import { recorderToClient } from "./utils.js";

const router = new Router({
  prefix: "/recorder",
});

// API 的实际实现，这里负责实现对外暴露的接口，并假设 Args 都已经由上一层解析好了
// TODO: 暂时先一起放这个文件里，后面要拆分放到合适的地方

async function getRecorders(): Promise<API.getRecorders.Resp> {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
  return recorderManager.recorders.map((item) => recorderToClient(item));
}

function getRecorder(args: API.getRecorder.Args): API.getRecorder.Resp {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
  const recorder = recorderManager.recorders.find((item) => item.id === args.id);
  // TODO: 之后再处理
  if (recorder == null) throw new Error("404");

  return recorderToClient(recorder);
}

function addRecorder(args: API.addRecorder.Args): API.addRecorder.Resp {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
  const recorder = recorderManager.addRecorder({
    id: uuid(),
    ...args,
  });
  recorder.extra.createTimestamp = Date.now();
  // TODO: 目前没必要性能优化，直接全量写回。另外可以考虑监听 manager 的事件来自动触发。
  return recorderToClient(recorder);
}

function updateRecorder(args: API.updateRecorder.Args): API.updateRecorder.Resp {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
  const { id, ...data } = args;
  const recorder = recorderManager.recorders.find((item) => item.id === id);
  // TODO: 之后再处理
  if (recorder == null) throw new Error("404");

  Object.assign(recorder, data);
  return recorderToClient(recorder);
}

function removeRecorder(args: API.removeRecorder.Args): API.removeRecorder.Resp {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
  const recorder = recorderManager.recorders.find((item) => item.id === args.id);
  if (recorder == null) return null;

  recorderManager.removeRecorder(recorder);
  return null;
}

async function startRecord(args: API.startRecord.Args): Promise<API.startRecord.Resp> {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
  const recorder = recorderManager.recorders.find((item) => item.id === args.id);
  if (recorder == null) throw new Error("404");

  if (recorder.recordHandle == null) {
    await recorder.checkLiveStatusAndRecord({
      getSavePath(data) {
        return genSavePathFromRule(recorderManager, recorder, data);
      },
    });
  }

  return recorderToClient(recorder);
}

async function stopRecord(args: API.stopRecord.Args): Promise<API.stopRecord.Resp> {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
  const recorder = recorderManager.recorders.find((item) => item.id === args.id);
  if (recorder == null) throw new Error("404");

  if (recorder.recordHandle != null) {
    await recorder.recordHandle.stop("manual stop");
    // TODO: 或许还应该自动将 recorder.disableAutoCheck 设置为 true
  }
  return recorderToClient(recorder);
}

// API 与外部系统的连接，负责将外部系统传递的数据解析为正确的参数后调用合适的 API 并返回结果

router.get("/list", async (ctx) => {
  ctx.body = { payload: await getRecorders() };
});
router.post("/add", (ctx) => {
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
  );

  ctx.body = { payload: addRecorder(args) };
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

export default router;
