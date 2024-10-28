import path from "node:path";
import fs from "fs-extra";
import os from "node:os";

import { video, convert2Xml } from "douyu-api";
import M3U8Downloader from "@renmu/m3u8-downloader";
import { cloneDeep } from "lodash-es";

import { taskQueue, DouyuDownloadVideoTask } from "./task.js";
import { getFfmpegPath } from "./video.js";
import { uuid } from "../utils/index.js";

import type { Video } from "douyu-api";

/**
 * 获取所有清晰度的视频流
 */
const getAvailableStreams = async (data: string) => {
  const res = await video.getStreamUrls(data);
  const streams = Object.values(res.thumb_video);
  streams.sort((a, b) => {
    return b.bit_rate - a.bit_rate;
  });
  return streams;
};

/**
 * 获取视频流
 */
const getStream = async (
  data: string,
  resoltion: "highest" | string,
): Promise<undefined | string> => {
  const streams = await getAvailableStreams(data);
  console.log(streams);
  if (resoltion === "highest") {
    return streams[0].url;
  } else {
    return streams.find((item) => item.stream_type === resoltion)?.url;
  }
};

/**
 * 下载斗鱼录播视频
 */
async function download(
  output: string,
  decodeData: string,
  options: {
    danmu: "none" | "xml" | "ass";
    resoltion: "highest" | string;
    override: boolean;
    vid?: string;
    user_name?: string;
    room_id?: string;
    room_title?: string;
    live_start_time?: string;
    platform?: "douyu";
  },
) {
  if ((await fs.pathExists(output)) && !options.override) throw new Error(`${output}已存在`);
  if (options.danmu !== "none" && !options.vid) throw new Error("下载弹幕时vid不能为空");

  let m3u8Url = await getStream(decodeData, options.resoltion);
  if (!m3u8Url) {
    // 如果没有分辨率对应的流，那么获取最大分辨率的视频
    m3u8Url = await getStream(decodeData, "highest");
  }
  if (!m3u8Url) throw new Error("无法找到对应的流");

  const { ffmpegPath } = getFfmpegPath();
  const downloader = new M3U8Downloader(m3u8Url, output, {
    convert2Mp4: true,
    ffmpegPath: ffmpegPath,
    segmentsDir: path.join(os.tmpdir(), "biliLive-tools", uuid()),
  });

  const task = new DouyuDownloadVideoTask(
    downloader,
    {
      name: `下载任务：${path.parse(output).name}`,
    },
    {
      onEnd: async () => {
        if (options.danmu !== "none") {
          const danmu = await video.getVideoDanmu(options.vid);
          const metatdata: {
            user_name?: string;
            room_id?: string;
            room_title?: string;
            live_start_time?: string;
            video_start_time?: string;
            platform?: "douyu";
            danmu?: string;
            vid?: string;
          } = cloneDeep(options);
          delete metatdata.danmu;
          delete metatdata.vid;
          const xml = convert2Xml(danmu, metatdata);
          fs.writeFile(path.join(path.dirname(output), `${path.parse(output).name}.xml`), xml);
        }
      },
    },
  );
  taskQueue.addTask(task, false);

  return {
    taskId: task.taskId,
  };
}

/**
 * 构建视频页链接
 */
const buildVideoUrl = (videoId: string) => {
  return `https://v.douyu.com/show/${videoId}`;
};

/**
 * 解析视频
 */
const parseVideo = async (url: string) => {
  const videoData = await video.parseVideo(url);
  const res = await video.getVideos(videoData.ROOM.vid, videoData.ROOM.up_id);

  let videoList: Video[] = [];
  await Promise.all(
    res.list.map(async (item) => {
      const videoData = await video.parseVideo(buildVideoUrl(item.hash_id));
      videoList.push({ ...videoData });
    }),
  );
  videoList = videoList.sort((a, b) => a?.DATA?.content?.start_time - b?.DATA?.content?.start_time);
  return videoList;
};

export default { download, parseVideo, getAvailableStreams };
