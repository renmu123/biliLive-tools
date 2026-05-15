import Router from "@koa/router";

import { pick } from "lodash-es";
import recorderService from "../services/recorder.js";
import { appConfig } from "../index.js";
import streamerDetailService from "@biliLive-tools/shared/db/service/streamerDetailService.js";

import type { RecorderAPI } from "../types/recorder.js";

const router = new Router({
  prefix: "/recorder",
});

const getSingleQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

/**
 * 录制任务相关接口
 * @route GET /recorder/list
 * @param platform 直播平台，DouYu: 斗鱼, HuYa: 虎牙, Bilibili: 哔哩哔哩, DouYin: 抖音
 * @param recordStatus 录制状态 recording: 录制中 unrecorded: 未录制
 * @param name 备注名称或直播间号，模糊搜索
 * @param autoCheck 是否自动监控
 * @param page 页码
 * @param pageSize 每页数量
 * @param sortField 排序字段 living: 直播状态 state: 录制状态 monitorStatus: 监控状态
 * @param sortDirection 排序方向 asc: 升序 desc: 降序
 * @returns 录制任务列表
 */
router.get("/list", async (ctx) => {
  const query: RecorderAPI["getRecorders"]["Args"] = ctx.request.query;

  ctx.body = { payload: await recorderService.getRecorders(query) };
});

router.get("/detail", async (ctx) => {
  const recorderId = getSingleQueryValue(ctx.request.query.recorderId);
  const page = getSingleQueryValue(ctx.request.query.page);
  const pageSize = getSingleQueryValue(ctx.request.query.pageSize);
  const startTime = getSingleQueryValue(ctx.request.query.startTime);
  const endTime = getSingleQueryValue(ctx.request.query.endTime);

  if (!recorderId) {
    ctx.status = 400;
    ctx.body = {
      message: "recorderId 不能为空",
    };
    return;
  }

  const recorder = recorderService.getRecorder({ id: recorderId });
  const recorderInfo = recorderService.getRecorderInfo({ id: recorderId });
  if (!recorder) {
    ctx.status = 404;
    ctx.body = {
      message: "录制器不存在",
    };
    return;
  }

  const payload = streamerDetailService.queryStreamerDetail({
    room_id: recorder.channelId,
    platform: recorder.providerId,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
    startTime: startTime ? Number(startTime) : undefined,
    endTime: endTime ? Number(endTime) : undefined,
  });

  ctx.body = {
    payload: {
      ...payload,
      recorderInfo,
    },
  };
});

router.post("/add", async (ctx) => {
  const args = pick(
    (ctx.request.body ?? {}) as RecorderAPI["addRecorder"]["Args"],
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
    "saveCover",
    "convert2Mp4",
    "qualityRetry",
    "formatName",
    "useM3U8Proxy",
    "customHost",
    "codecName",
    "titleKeywords",
    "liveStartNotification",
    "liveEndNotification",
    "weight",
    "source",
    "videoFormat",
    "recorderType",
    "cookie",
    "doubleScreen",
    "onlyAudio",
    "useServerTimestamp",
    "handleTime",
    "debugLevel",
    "api",
  );

  const data = await recorderService.addRecorder(args);
  ctx.body = { payload: data };
});

/**
 * 获取直播间配置信息
 * @route GET /recorder/:recorderId
 * @param recorderId 直播间ID
 * @returns 录制器配置信息
 */
router.get("/:id", (ctx) => {
  const { id } = ctx.params;
  ctx.body = { payload: recorderService.getRecorder({ id }) };
});

router.put("/:id", (ctx) => {
  const { id } = ctx.params;
  const patch = pick(
    ctx.request.body as Omit<RecorderAPI["updateRecorder"]["Args"], "id">,
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
    "saveCover",
    "segment",
    "sendToWebhook",
    "uid",
    "qualityRetry",
    "formatName",
    "useM3U8Proxy",
    "customHost",
    "codecName",
    "titleKeywords",
    "liveStartNotification",
    "liveEndNotification",
    "weight",
    "source",
    "videoFormat",
    "recorderType",
    "cookie",
    "doubleScreen",
    "onlyAudio",
    "useServerTimestamp",
    "handleTime",
    "debugLevel",
    "convert2Mp4",
    "api",
  );

  ctx.body = { payload: recorderService.updateRecorder({ id, ...patch }) };
});

/**
 * 删除直播间
 * @route DELETE /recorder/:recorderId
 * @param recorderId 直播间ID
 * @param removeHistory 是否删除录制历史，默认false
 * @returns null
 */
router.delete("/:id", (ctx) => {
  const { id } = ctx.params;
  const { removeHistory } = ctx.request.query;
  ctx.body = {
    payload: recorderService.removeRecorder({ id, removeHistory: removeHistory === "true" }),
  };
});

/**
 * 开始录制
 * @route POST /recorder/:recorderId/start_record
 * @param recorderId 直播间ID
 * @returns 录制任务信息
 */
router.post("/:id/start_record", async (ctx) => {
  const { id } = ctx.params;
  ctx.body = { payload: await recorderService.startRecord({ id }) };
});

/**
 * 停止录制
 * @route POST /recorder/:recorderId/stop_record
 * @param recorderId 直播间ID
 * @returns 录制任务信息
 */
router.post("/:id/stop_record", async (ctx) => {
  const { id } = ctx.params;
  ctx.body = { payload: await recorderService.stopRecord({ id }) };
});

/**
 * 切割录制
 * @route POST /recorder/:recorderId/cut
 * @param recorderId 直播间ID
 * @returns 录制任务信息
 */
router.post("/:id/cut", async (ctx) => {
  const { id } = ctx.params;
  ctx.body = { payload: await recorderService.cutRecord({ id }) };
});

/**
 * 批量开始录制
 * @route POST /recorder/manager/batch_start_record
 * @param ids 直播间ID列表
 * @returns 批量操作结果
 */
router.post("/manager/batch_start_record", async (ctx) => {
  const { ids } = ctx.request.body;
  ctx.body = { payload: await recorderService.batchStartRecord(ids as string[]) };
});

/**
 * 批量停止录制
 * @route POST /recorder/manager/batch_stop_record
 * @param ids 直播间ID列表
 * @returns 批量操作结果
 */
router.post("/manager/batch_stop_record", async (ctx) => {
  const { ids } = ctx.request.body;
  ctx.body = { payload: await recorderService.batchStopRecord(ids as string[]) };
});

/**
 * 解析直播间地址，获取对应的直播间信息
 * @route GET /recorder/manager/resolveChannel
 * @param url 直播间地址
 * @returns 直播间信息
 */
router.get("/manager/resolveChannel", async (ctx) => {
  const { url } = ctx.query;
  const data = await recorderService.resolveChannel(url as string);

  ctx.body = { payload: data };
});

/**
 * 解析直播间地址，返回所有添加需要的信息
 * @route GET /recorder/manager/resolve
 * @param url 直播间地址
 * @returns 直播间信息
 */
router.get("/manager/resolve", async (ctx) => {
  const { url } = ctx.query;
  const data = await recorderService.resolve(url as string);

  ctx.body = { payload: data };
});

/**
 * 批量解析直播间地址
 * @route POST /recorder/manager/batchResolveChannel
 * @param channelURLs 直播间地址数组
 * @returns 批量解析结果
 */
router.post("/manager/batchResolveChannel", async (ctx) => {
  const { channelURLs } = ctx.request.body;
  const data = await recorderService.batchResolveChannel(channelURLs as string[]);

  ctx.body = { payload: data };
});

/**
 * 获取直播间实时信息
 * @route POST /recorder/manager/liveInfo
 * @param ids 直播间ID列表
 * @param forceRequest 强制查询直播间信息，不受配置限制，默认true
 * @returns 直播间实时信息列表
 */
router.post("/manager/liveInfo", async (ctx) => {
  const { ids } = ctx.request.body;
  const forceRequest = ctx.request.body.forceRequest ?? true;

  let requestInfoForRecord = true;
  if (!forceRequest) {
    requestInfoForRecord = appConfig.get("requestInfoForRecord");
  }

  let list: any[] = [];
  if (requestInfoForRecord) {
    list = await recorderService.getLiveInfo(ids as unknown as string[]);
  }
  ctx.body = {
    payload: list,
  };
});

export default router;
