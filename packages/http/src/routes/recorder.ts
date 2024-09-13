import Router from "koa-router";
import { v4 as uuid } from "uuid";
import { live } from "douyu-api";
import axios from "axios";

import { genSavePathFromRule } from "@autorecord/manager";
import { createRecorderManager } from "@biliLive-tools/shared";
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
  return recorderManager.manager.recorders.map((item) => recorderToClient(item));
}

function getRecorder(args: API.getRecorder.Args): API.getRecorder.Resp {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
  const recorder = recorderManager.manager.recorders.find((item) => item.id === args.id);
  // TODO: 之后再处理
  if (recorder == null) throw new Error("404");

  return recorderToClient(recorder);
}

function addRecorder(args: API.addRecorder.Args): API.addRecorder.Resp {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");

  const config = {
    id: uuid(),
    ...args,
    extra: {
      createTimestamp: Date.now(),
    },
  };
  // const recorder = recorderManager.manager.addRecorder(config);
  // recorder.extra.createTimestamp = Date.now();

  // recorderManager.config.add(config);
  const recorder = recorderManager.addRecorder(config);
  return recorderToClient(recorder);
}

function updateRecorder(args: API.updateRecorder.Args): API.updateRecorder.Resp {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
  const { id, ...data } = args;
  const recorder = recorderManager.manager.recorders.find((item) => item.id === id);
  if (recorder == null) throw new Error("配置不存在");

  // TODO: 需要重新处理
  recorderManager.config.update(args);
  Object.assign(recorder, data);
  return recorderToClient(recorder);
}

function removeRecorder(args: API.removeRecorder.Args): API.removeRecorder.Resp {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
  const recorder = recorderManager.manager.recorders.find((item) => item.id === args.id);
  if (recorder == null) return null;

  recorderManager.config.remove(args.id);
  recorderManager.manager.removeRecorder(recorder);
  return null;
}

async function startRecord(args: API.startRecord.Args): Promise<API.startRecord.Resp> {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
  const recorder = recorderManager.manager.recorders.find((item) => item.id === args.id);
  if (recorder == null) throw new Error("配置不存在");

  if (recorder.recordHandle == null) {
    await recorder.checkLiveStatusAndRecord({
      getSavePath(data) {
        return genSavePathFromRule(recorderManager.manager, recorder, data);
      },
    });
  }

  return recorderToClient(recorder);
}

async function stopRecord(args: API.stopRecord.Args): Promise<API.stopRecord.Resp> {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");
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
    "noGlobalFollowFields",
    "line",
    "disableProvideCommentsWhenRecording",
    "saveGiftDanma",
    "saveSCDanma",
    "segment",
    "sendToWebhook",
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
    "noGlobalFollowFields",
    "line",
    "disableProvideCommentsWhenRecording",
    "saveGiftDanma",
    "saveSCDanma",
    "segment",
    "sendToWebhook",
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

router.get("/manager/resolveChannel", async (ctx) => {
  const recorderManager =
    container.resolve<ReturnType<typeof createRecorderManager>>("recorderManager");

  const { url } = ctx.query;
  ctx.body = { payload: await recorderManager.resolveChannel(url as string) };
});

const getLiveStatus = async (channelId: string) => {
  const res = await axios.get<
    | {
        error: number;
        data: {
          room_status: string;
          owner_name: string;
          avatar: string;
          room_name: string;
          start_time: string;
          gift: {
            id: string;
            name: string;
            himg: string;
            pc: number;
          }[];
        };
      }
    | string
  >(`http://open.douyucdn.cn/api/RoomApi/room/${channelId}`);

  if (res.status !== 200) {
    if (res.status === 404 && res.data === "Not Found") {
      throw new Error("错误的地址 " + channelId);
    }

    throw new Error(`Unexpected status code, ${res.status}, ${res.data}`);
  }

  if (typeof res.data !== "object")
    throw new Error(`Unexpected response, ${res.status}, ${res.data}`);

  const json = res.data;
  if (json.error === 101) throw new Error("错误的地址 " + channelId);
  if (json.error !== 0) throw new Error("Unexpected error code, " + json.error);
  const living = json.data.room_status === "1";
  return living;
};

router.get("/manager/liveInfo", async (ctx) => {
  const ids = (ctx.query.ids as string)?.split(",");
  if (ids == null) throw new Error("ids 不能为空");
  const fns = ids.map((id) => live.getRoomInfo(Number(id)));
  const results = await Promise.all(fns);

  const livingStatus = await Promise.all(ids.map(getLiveStatus));

  ctx.body = {
    payload: results.map((item, index) => {
      let living = livingStatus[index];
      if (living) {
        const isVideoLoop = item.room.videoLoop === 1;
        if (isVideoLoop) {
          living = false;
        }
      }
      return {
        owner: item.room.nickname,
        roomTitle: item.room.room_name,
        cover: item.room.room_pic,
        avatar: item.room.avatar.middle,
        roomId: item.room.room_id.toString(),
        living,
      };
    }),
  };
});

export default router;
