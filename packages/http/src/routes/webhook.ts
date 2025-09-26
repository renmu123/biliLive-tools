import path from "node:path";

import Router from "koa-router";
import { Client } from "@renmu/bili-api";

import { handler, appConfig } from "../index.js";
import log from "@biliLive-tools/shared/utils/log.js";
import recorderService from "../services/recorder.js";

import type { BlrecEventType } from "../types/blrecEvent.js";
import type { CloseEvent, OpenEvent, CustomEvent } from "../types/webhook.js";

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
    (event.EventType === "FileOpening" || event.EventType === "FileClosed")
  ) {
    const isDocker = process.env.IS_DOCKER;
    if (!isDocker && !config.webhook.recoderFolder) {
      ctx.body = "ok";
      return;
    }

    const roomId = event.EventData.RoomId;
    // 如果是docker，那么将recoderFolder参数修改为 /app/video路径
    const recoderFolder = isDocker ? "/app/video" : config.webhook.recoderFolder;
    const filePath = path.join(recoderFolder, event.EventData.RelativePath);
    log.info("录播姬文件路径：", filePath, recoderFolder);

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
    const originType = event.type;
    const typeMap: {
      VideoFileCompletedEvent: CloseEvent;
      VideoFileCreatedEvent: OpenEvent;
    } = {
      VideoFileCompletedEvent: "FileClosed",
      VideoFileCreatedEvent: "FileOpening",
    };
    const type = typeMap[originType];

    const roomId = event.data.room_id;
    const client = new Client();
    const masterRes = await client.live.getRoomInfo(event.data.room_id);
    const userRes = await client.live.getMasterInfo(masterRes.uid);

    const isDocker = process.env.IS_DOCKER;
    const filePath = isDocker ? event.data.path.replace("/rec", "/app/video") : event.data.path;

    handler.handle({
      event: type,
      filePath: filePath,
      roomId: roomId,
      time: event.date,
      title: masterRes.title,
      username: userRes.info.uname,
      platform: "blrec",
    });
  }
  ctx.body = "ok";
});

router.post("/webhook/ddtv", async (ctx) => {
  const webhook = appConfig.get("webhook");
  const event = ctx.request.body as any;

  if (webhook?.open && (event.cmd === "RecordingEnd" || event.cmd === "StartRecording")) {
    log.info("ddtv webhook：", ctx.request.body);

    // TODO: 还要测试不开启分片的情况
    const files = getDDTVTrueFile(event);
    if (!files.videoFile) {
      ctx.body = "ok";
      return;
    }

    const info: {
      roomId: number;
      platform: "ddtv";
      username: string;
      title: string;
      filePath: string;
      danmuPath?: string;
    } = {
      roomId: event.data.RoomId,
      platform: "ddtv",
      username: event.data.Name,
      title: event.data.Title.Value,
      filePath: files.videoFile,
      danmuPath: files.danmuFile,
    };

    // 实际为分片结束信号，并不存在开始信号
    const startTime = event.data.DownInfo.StartTime;
    const nowTime = new Date().toISOString();

    // 由于DDTV就没有发送开始事件，需要模拟开始事件，5秒后发送FileClosed事件
    handler.handle({
      event: "FileOpening",
      time: startTime,
      ...info,
    });

    setTimeout(() => {
      handler.handle({
        event: "FileClosed",
        time: nowTime,
        ...info,
      });
    }, 5000);
  }
  ctx.body = "ok";
});

const getDDTVTrueFile = (event: any) => {
  if (!event.data.DownInfo.LiveChatListener) {
    log.error("DDTV数据格式错误", event);
    throw new Error("没有检测到LiveChatListener数据结构");
  }
  // 上一个切片文件路径，但是不包含后缀，如_original_fix.mp4或_fix.mp4
  const lastVideoFile: string = path.normalize(event.data.DownInfo.LiveChatListener.File);
  // 当前拥有的所有切片文件列表，不代表所有文件都在文件夹下
  const viodeoFileList: string[] = event.data.DownInfo.DownloadFileList.VideoFile.map(
    path.normalize,
  );
  // 通过局部匹配查看lastFile是否在FileList中，需要从后往前查找，找到真正的文件路径
  const videoFileTruePath: string | undefined = viodeoFileList.findLast((item: string) =>
    item.includes(lastVideoFile),
  );
  const danmuFileList: string[] = event.data.DownInfo.DownloadFileList.DanmuFile;
  const danmuFileTruePath: string | undefined = danmuFileList.findLast((item: string) =>
    item.includes(lastVideoFile),
  );
  // TODO:通过event.data.cover_from_user.Value来下载封面并保存到临时文件夹，还需要判定是否开启了“使用直播封面”选项
  return {
    videoFile: videoFileTruePath,
    danmuFile: danmuFileTruePath,
  };
};

router.post("/webhook/custom", async (ctx) => {
  const webhook = appConfig.get("webhook");
  log.info("custom: webhook", ctx.request.body);
  const event = ctx.request.body as CustomEvent;

  if (["FileOpening", "FileClosed", "FileError"].includes(event.event) === false) {
    throw new Error("event should be FileOpening or FileClosed or FileError");
  }

  if (!event.filePath) {
    throw new Error("filePath is required");
  }
  if (!event.roomId) {
    throw new Error("roomId is required");
  }
  if (["FileOpening", "FileClosed"].includes(event.event)) {
    if (!event.time) {
      throw new Error("time is required");
    }
    if (!event.title) {
      throw new Error("title is required");
    }
    if (!event.username) {
      throw new Error("username is required");
    }
  }

  if (webhook?.open) {
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

router.get("/bili/stream", async (ctx) => {
  const { id } = ctx.query as {
    id: string;
  };
  try {
    const m3u8Content = await recorderService.getBiliStream(id);
    ctx.set("Content-Type", "application/vnd.apple.mpegurl");
    ctx.body = m3u8Content;
  } catch (error) {
    log.error("获取bili直播流内容失败", error);
    ctx.status = 403;
  }
});

export default router;
