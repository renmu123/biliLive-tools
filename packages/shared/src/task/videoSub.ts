import path from "node:path";

import fs from "fs-extra";
import axios from "axios";
import { live, video } from "douyu-api";
import filenamify from "filenamify";

import { videoSubModel, videoSubDataModel } from "../db/index.js";
import { appConfig } from "../config.js";
import logger from "../utils/log.js";
import douyu from "./douyu.js";
import { sleep } from "../utils/index.js";

import type { VideoSubItem } from "../db/model/videoSub.js";

/**
 * 获取订阅列表
 */
function list() {
  const list = videoSubModel.list();
  return list;
}

/**
 * 保存订阅
 */
export function add(data: Parameters<typeof videoSubModel.add>[0]) {
  const item = videoSubModel.query({
    platform: data.platform,
    subId: data.subId,
  });
  if (!item) {
    return videoSubModel.add(data);
  } else {
    throw new Error("订阅已经有了");
  }
}

/**
 * 删除订阅
 */
export function remove(id: number) {
  return videoSubModel.delete(id);
}

/**
 * 更新订阅
 */
export function update(data: Parameters<typeof videoSubModel.update>[0]) {
  return videoSubModel.update(data);
}

/**
 * 解析url，查看是否支持
 * @param url
 */
export async function parse(url: string): Promise<Parameters<typeof videoSubModel.add>[0]> {
  const douyuMathReg = /https?:\/\/(?:.*?\.)?douyu.com\//;
  const huyaMathReg = /https?:\/\/(?:.*?\.)?huya.com\//;
  if (douyuMathReg.test(url)) {
    const res = await axios.get(url);
    const html = res.data;
    const matched = html.match(/\$ROOM\.room_id.?=(.*?);/);
    if (!matched) {
      throw new Error("解析失败，请检查链接");
    }
    const room_id = matched[1].trim();
    const roomInfo = await live.getRoomInfo(Number(room_id));
    return {
      name: roomInfo.room.nickname,
      subId: roomInfo.room.up_id,
      platform: "douyu",
      enable: true,
      roomId: room_id,
      options: {
        danma: true,
        sendWebhook: false,
        quality: "highest",
      },
    };
  } else if (huyaMathReg.test(url)) {
    throw new Error("不支持的平台");

    // return "huya";
  } else {
    throw new Error("不支持的平台");
  }
}

async function downloadDouyuVideo(videoId: string, item: VideoSubItem) {
  const videoData = await video.parseVideo(`https://v.douyu.com/show/${videoId}`);
  const rawName = videoData.ROOM.name;
  const name = filenamify(rawName, { replacement: "_" });
  let output = path.join(appConfig.data.video.subSavePath, `${name}.mp4`);

  const task = await douyu.download(output, videoData.decodeData, {
    danmu: item.options.danma ? "xml" : "none",
    override: false,
    resoltion: item.options.quality,
    vid: videoData.ROOM.vid,
    danmuMeta: {
      platform: "douyu",
      user_name: videoData.ROOM.author_name,
      room_id: videoData.DATA.content.room_id,
      room_title: videoData.DATA.content.title,
      live_start_time: new Date(videoData?.DATA?.liveShow?.starttime * 1000).toISOString(),
      video_start_time: new Date(videoData?.DATA?.content?.start_time * 1000).toISOString(),
    },
  });
  return new Promise((resolve, reject) => {
    task.on("task-end", async () => {
      if (item.options.sendWebhook) {
        // 发送webhook
        const webhookUrl = `http://127.0.0.1:${appConfig.data.port}/webhook/custom`;
        await axios.post(webhookUrl, {
          event: "FileOpening",
          filePath: output,
          roomId: videoData.DATA.content.room_id,
          time: new Date(videoData.DATA.content.start_time * 1000).toISOString(),
          title: rawName,
          username: videoData.ROOM.author_name,
        });
        await sleep(4000);
        await axios.post(webhookUrl, {
          event: "FileClosed",
          filePath: output,
          roomId: videoData.DATA.content.room_id,
          time: new Date(
            (videoData.DATA.content.start_time +
              Math.floor(videoData.DATA.content.video_duration)) *
              1000,
          ).toISOString(),
          title: rawName,
          username: videoData.ROOM.author_name,
        });
      }
      resolve(output);
    });
    task.on("task-error", (err) => {
      logger.error("下载失败", err);
      reject(err);
    });
  });
}

async function runDouyuTask(item: VideoSubItem) {
  const replayList = await video.getReplayList({
    up_id: item.subId,
    page: 1,
    limit: 1,
  });
  const downloadVideos = videoSubDataModel
    .list({
      platform: "douyu",
      subId: item.subId,
    })
    .map((item) => item.videoId);

  let videoIds: string[] = [];
  for (const replay of replayList.list) {
    for (const { hash_id } of replay.video_list) {
      const videos = await video.getVideos(hash_id, item.subId);
      videoIds.push(...videos.list.map((item) => item.hash_id));
    }
  }
  videoIds = Array.from(new Set(videoIds));
  videoIds = videoIds.filter((id) => !downloadVideos.includes(id));

  for (const videoId of videoIds) {
    videoSubDataModel.add({
      subId: item.subId,
      platform: "douyu",
      videoId,
      completed: 1,
      retry: 0,
    });
    try {
      await downloadDouyuVideo(videoId, item);
    } catch (error) {
      logger.error(`下载视频${videoId}失败`, error);
      // await deleteData(videoId);
      throw error;
    }
  }
}

async function runHuyaTask(item: VideoSubItem) {}

async function runTask(item: VideoSubItem) {
  if (item.platform === "douyu") {
    await runDouyuTask(item);
  } else if (item.platform === "huya") {
    await runHuyaTask(item);
  } else {
    throw new Error("不支持的平台");
  }

  // 更新订阅时间
  videoSubModel.updateLastRunTime({
    id: item.id,
    lastRunTime: new Date().getTime(),
  });
}

export async function check(id: number) {
  // 根据间隔时间检查，下载完成后将数据存到数据库
  const item = videoSubModel.query({
    id,
  });
  if (!item) {
    throw new Error("不存在的订阅");
  }
  if (!appConfig?.data?.video?.subSavePath) {
    throw new Error("请先设置下载路径");
  }
  await runTask(item);
}

export async function checkAll() {
  const items = list();
  const needCheckItems = items.filter((item) => item.enable);
  if (needCheckItems.length !== 0) {
    const savePath = appConfig?.data?.video?.subSavePath;
    if (!savePath) {
      throw new Error("请先设置下载路径");
    }
    await fs.ensureDir(savePath);
  }

  for (const item of needCheckItems) {
    try {
      await runTask(item);
    } catch (error) {
      logger.error(`订阅${item.name}失败`, error);
    }
  }
}

export async function createInterval() {
  try {
    await checkAll();
  } finally {
    const interval = appConfig?.data?.video?.subCheckInterval ?? 60;
    setTimeout(checkAll, interval * 60 * 1000);
  }
}

export default {
  list,
  add,
  remove,
  update,
  parse,
  check,
  createInterval,
};
