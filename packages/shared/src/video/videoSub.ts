import path from "node:path";

import fs from "fs-extra";
import axios from "axios";
import { live, video } from "douyu-api";
import filenamify from "filenamify";
import { provider as providerForDouYu } from "@bililive-tools/douyu-recorder";

import { videoSubService, videoSubDataService } from "../db/index.js";
import { appConfig } from "../config.js";
import logger from "../utils/log.js";
import douyu from "./douyu.js";
import huya from "./huya.js";
import { sleep } from "../utils/index.js";

import type { VideoSubItem } from "../db/model/videoSub.js";

/**
 * 保存订阅
 */
export function add(data: Parameters<typeof videoSubService.add>[0]) {
  const item = videoSubService.query({
    platform: data.platform,
    subId: data.subId,
  });
  if (!item) {
    return videoSubService.add(data);
  } else {
    throw new Error("已存在相同订阅");
  }
}

/**
 * 删除订阅
 */
export function remove(id: number) {
  return videoSubService.delete(id);
}

/**
 * 更新订阅
 */
export function update(data: Parameters<typeof videoSubService.update>[0]) {
  return videoSubService.update(data);
}

/**
 * 解析url，查看是否支持
 * @param url
 */
export async function parse(url: string): Promise<Parameters<typeof videoSubService.add>[0]> {
  const douyuMathReg = /https?:\/\/(?:.*?\.)?douyu.com\//;
  const huyaMathReg = /https?:\/\/(?:.*?\.)?huya.com\//;
  if (douyuMathReg.test(url)) {
    const res = await providerForDouYu.resolveChannelInfoFromURL(url);
    if (!res) {
      throw new Error("解析失败，请检查链接");
    }
    const room_id = res.id;
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
    const res = await axios.get<string>(url);
    const html = res.data;
    const match = html.match(/var hyPlayerConfig = ({[^]+?};)/);
    const hyPlayerConfigString = match?.[1];
    if (!hyPlayerConfigString) {
      throw new Error(`解析失败，请检查链接: ${url}`);
    }

    const hyPlayerConfig = new Function(`return ${hyPlayerConfigString}`)();
    const gameLiveInfo = hyPlayerConfig?.stream?.data?.[0]?.gameLiveInfo;
    if (!gameLiveInfo) {
      throw new Error(`解析失败，请检查链接: ${url}`);
    }
    return {
      name: gameLiveInfo.nick,
      subId: gameLiveInfo.uid,
      platform: "huya",
      enable: true,
      roomId: String(gameLiveInfo.profileRoom),
      options: {
        danma: false,
        sendWebhook: false,
        quality: "highest",
      },
    };
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
          platform: "douyu",
          software: "biliLive-tools",
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
          platform: "douyu",
          software: "biliLive-tools",
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

async function downloadHuyaVideo(videoId: string, item: VideoSubItem) {
  // 解析视频信息
  const videoData = await huya.parseVideo(videoId);
  const rawName = videoData.moment.title;
  const name = filenamify(rawName, { replacement: "_" });
  const output = path.join(appConfig.data.video.subSavePath, `${name}.mp4`);

  // 获取最高(或指定)清晰度的视频链接
  const definitions = videoData.moment.videoInfo.definitions;
  let videoUrl = "";

  if (item.options.quality === "highest") {
    // 获取最高清晰度
    videoUrl = definitions[0].m3u8;
  } else {
    // 查找指定清晰度
    const targetDef = definitions.find((def) => def.definition === item.options.quality);
    videoUrl = targetDef ? targetDef.m3u8 : definitions[0].m3u8;
  }
  if (!videoUrl) {
    throw new Error("无法找到对应的流");
  }

  // 下载视频
  const task = await huya.download(output, videoUrl, {
    override: false,
  });

  return new Promise((resolve, reject) => {
    task.on("task-end", async () => {
      if (item.options.sendWebhook) {
        // 发送webhook
        const webhookUrl = `http://127.0.0.1:${appConfig.data.port}/webhook/custom`;
        await axios.post(webhookUrl, {
          event: "FileOpening",
          filePath: output,
          roomId: item.roomId,
          time: new Date().toISOString(),
          title: rawName,
          username: item.name,
          platform: "huya",
          software: "biliLive-tools",
        });
        await sleep(4000);
        await axios.post(webhookUrl, {
          event: "FileClosed",
          filePath: output,
          roomId: item.roomId,
          time: new Date().toISOString(),
          title: rawName,
          username: item.name,
          platform: "huya",
          software: "biliLive-tools",
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
  const downloadVideos = videoSubDataService
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
    videoSubDataService.add({
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

async function runHuyaTask(item: VideoSubItem) {
  // 获取虎牙回放列表
  const replayList = await huya.parseReplayList(item.subId);

  // 获取已下载的视频ID列表
  const downloadVideos = videoSubDataService
    .list({
      platform: "huya",
      subId: item.subId,
    })
    .map((item) => String(item.videoId));

  // 过滤出未下载的视频
  const videoIds = replayList
    .slice(0, 1)
    .map((video) => String(video.vid))
    .filter((id) => !downloadVideos.includes(id));

  // 下载新视频
  for (const videoId of videoIds) {
    videoSubDataService.add({
      subId: item.subId,
      platform: "huya",
      videoId,
      completed: 1,
      retry: 0,
    });

    try {
      await downloadHuyaVideo(videoId, item);
    } catch (error) {
      logger.error(`下载虎牙视频${videoId}失败`, error);
      throw error;
    }
  }
}

async function runTask(item: VideoSubItem) {
  if (item.platform === "douyu") {
    await runDouyuTask(item);
  } else if (item.platform === "huya") {
    await runHuyaTask(item);
  } else {
    throw new Error("不支持的平台");
  }

  // 更新订阅时间
  videoSubService.updateLastRunTime({
    id: item.id,
    lastRunTime: new Date().getTime(),
  });
}

export async function check(id: number) {
  // 根据间隔时间检查，下载完成后将数据存到数据库
  const item = videoSubService.query({
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
  const items = videoSubService.list();
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
  } catch (error) {
    logger.error("检查订阅失败", error);
  } finally {
    const interval = appConfig?.data?.video?.subCheckInterval ?? 60;
    setTimeout(createInterval, interval * 60 * 1000);
  }
}

export default {
  list: () => videoSubService.list(),
  add,
  remove,
  update,
  parse,
  check,
  createInterval,
};
