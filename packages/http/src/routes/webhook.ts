import path from "node:path";

import Router from "koa-router";
import { Client } from "@renmu/bili-api";

import { handler } from "../index.js";
import { appConfig } from "@biliLive-tools/shared";
import log from "@biliLive-tools/shared/utils/log.js";

import type { BlrecEventType } from "../types/blrecEvent.js";

interface CustomEvent {
  /** 如果你想使用断播续传功能，请在上一个`FileClosed`事件后在时间间隔内发送`FileOpening`事件 */
  event: "FileOpening" | "FileClosed";
  /** 视频文件的绝对路径 */
  filePath: string;
  /** 房间号，用于断播续传需要 */
  roomId: number;
  /** 用于标题格式化的时间，示例："2021-05-14T17:52:54.946" */
  time: string;
  /** 标题，用于格式化视频标题 */
  title: string;
  /** 主播名称，用于格式化视频标题 */
  username: string;
  /** 封面路径 */
  coverPath?: string;
  /** 弹幕路径 */
  danmuPath?: string;
}

const router = new Router();

router.get("/webhook", async (ctx) => {
  ctx.body = "webhook 服务器已启动";
});

router.post("/webhook/bililiverecorder", async (ctx) => {
  const config = appConfig.getAll();
  log.info("录播姬：", ctx.request.body);

  const event: any = ctx.request.body;
  if (
    config.webhook.open &&
    config.webhook.recoderFolder &&
    (event.EventType === "FileOpening" || event.EventType === "FileClosed")
  ) {
    const roomId = event.EventData.RoomId;
    const filePath = path.join(config.webhook.recoderFolder, event.EventData.RelativePath);

    handler.handle({
      event: event.EventType,
      filePath: filePath,
      roomId: roomId,
      time: event.EventTimestamp,
      title: event.EventData.Title,
      username: event.EventData.Name,
      platform: "bili-recorder",
    });
  }
  ctx.body = "ok";
});

router.post("/webhook/blrec", async (ctx) => {
  const webhook = appConfig.get("webhook");
  log.info("blrec webhook：", ctx.request.body);
  const event = ctx.request.body as BlrecEventType;

  if (
    webhook?.open &&
    (event.type === "VideoFileCompletedEvent" || event.type === "VideoFileCreatedEvent")
  ) {
    const roomId = event.data.room_id;
    const client = new Client();
    const masterRes = await client.live.getRoomInfo(event.data.room_id);
    const userRes = await client.live.getMasterInfo(masterRes.uid);

    handler.handle({
      event: event.type,
      filePath: event.data.path,
      roomId: roomId,
      time: event.date,
      title: masterRes.title,
      username: userRes.info.uname,
      platform: "blrec",
    });
  }
  ctx.body = "ok";
});

router.post("/webhook/custom", async (ctx) => {
  const webhook = appConfig.get("webhook");
  log.info("custom: webhook", ctx.request.body);
  const event = ctx.request.body as CustomEvent;

  if (!event.filePath) {
    throw new Error("filePath is required");
  }
  if (!event.roomId) {
    throw new Error("roomId is required");
  }
  if (!event.time) {
    throw new Error("time is required");
  }
  if (!event.title) {
    throw new Error("title is required");
  }
  if (!event.username) {
    throw new Error("username is required");
  }
  if (["FileOpening", "FileClosed"].includes(event.event) === false) {
    throw new Error("event should be FileOpening or FileClosed");
  }
  if (webhook?.open && (event.event === "FileOpening" || event.event === "FileClosed")) {
    handler.handle({
      event: event.event,
      filePath: event.filePath,
      roomId: event.roomId,
      time: event.time,
      title: event.title,
      username: event.username,
      coverPath: event?.coverPath,
      danmuPath: event?.danmuPath,
      platform: "custom",
    });
  }
  ctx.body = "ok";
});

checkFileInterval();

async function checkFileInterval() {
  setInterval(async () => {
    for (let i = 0; i < handler.liveData.length; i++) {
      const live = handler.liveData[i];
      handler.handleLive(live);
    }
  }, 1000 * 60);
}

export default router;
