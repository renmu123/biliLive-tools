import path from "node:path";
import fs from "fs-extra";
import os from "node:os";
import {
  M3U8Downloader,
  getVideoDanmu,
  getStreamUrls,
  getVideos,
  parseVideo as _parseVideo,
} from "douyu-cli";
import { convert2Xml } from "douyu-cli/dist/utils/index.js";
import { taskQueue, DouyuDownloadVideoTask } from "./task.js";
import { getFfmpegPath } from "./video.js";
import { uuid } from "../utils/index.js";

import type { Video } from "douyu-cli";

/**
 * 获取最高清晰度的视频流
 */
const getStream = async (data: string) => {
  const res = await getStreamUrls(data);

  const streams = Object.values(res.thumb_video);
  if (streams.length === 0) {
    throw new Error("没有找到视频流");
  }
  streams.sort((a, b) => {
    return b.bit_rate - a.bit_rate;
  });
  return streams[0].url;
};

/**
 * 下载斗鱼录播视频
 */
async function download(
  output: string,
  decodeData: string,
  options: { danmu: boolean; vid?: string },
) {
  const m3u8Url = await getStream(decodeData);

  const { ffmpegPath } = getFfmpegPath();
  const downloader = new M3U8Downloader(m3u8Url, output, {
    convert2Mp4: true,
    ffmpegPath: ffmpegPath,
    tempDir: path.join(os.tmpdir(), "biliLive-tools", uuid()),
  });

  const task = new DouyuDownloadVideoTask(
    downloader,
    {
      name: `下载任务：${path.parse(output).name}`,
    },
    {
      onEnd: async () => {
        if (options.danmu) {
          const danmu = await getVideoDanmu(options.vid);
          const xml = convert2Xml(danmu);
          fs.writeFile(path.join(path.dirname(output), `${path.parse(output).name}.xml`), xml);
        }
      },
    },
  );
  task.exec();
  taskQueue.addTask(task, true);

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
  const videoData = await _parseVideo(url);
  const res = await getVideos(videoData.ROOM.vid, videoData.ROOM.up_id);

  let videoList: Video[] = [];
  await Promise.all(
    res.list.map(async (video) => {
      const videoData = await _parseVideo(buildVideoUrl(video.hash_id));
      videoList.push({ ...videoData });
    }),
  );
  videoList = videoList.sort((a, b) => a?.DATA?.content?.start_time - b?.DATA?.content?.start_time);
  return videoList;
};

export default { download, parseVideo };
