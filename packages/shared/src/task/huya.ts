import path from "node:path";
import fs from "fs-extra";

import M3U8Downloader from "@renmu/m3u8-downloader";
import axios from "axios";

import { taskQueue, HuyaDownloadVideoTask } from "./task.js";
import { getFfmpegPath } from "./video.js";
import { uuid } from "../utils/index.js";
import { getTempPath } from "../utils/index.js";

async function download(
  output: string,
  url: string,
  options: {
    override?: boolean;
  },
) {
  if ((await fs.pathExists(output)) && !options.override) throw new Error(`${output}已存在`);

  const { ffmpegPath } = getFfmpegPath();
  const downloader = new M3U8Downloader(url, output, {
    convert2Mp4: true,
    ffmpegPath: ffmpegPath,
    segmentsDir: path.join(getTempPath(), uuid()),
  });
  const task = new HuyaDownloadVideoTask(downloader, {
    name: `下载任务：${path.parse(output).name}`,
  });
  taskQueue.addTask(task, true);
  return task;
}

/**
 * 解析视频
 */
const parseVideo = async (
  vid: string,
): Promise<{
  moment: {
    title: string;
    videoInfo: { definitions: { defName: string; m3u8: string; definition: string }[] };
  };
}> => {
  const res = await axios.get(`https://liveapi.huya.com/moment/getMomentContent?videoId=${vid}`);
  if (res.data.status !== 200) {
    throw new Error("请求错误");
  }
  return res.data.data;
};

/**
 * 解析录播列表
 */
const parseReplayList = async (uid: string): Promise<{ vid: number }[]> => {
  const res = await axios.get(`https://www.huya.com/video/u/${uid}?tabName=live&pageIndex=1`);
  const html = res.data;
  const match = html.match(/window.HNF_GLOBAL_INIT = ({[^]+?}) \<\/script\>/);
  if (!match) {
    throw new Error("解析失败，请检查链接");
  }
  const initData = JSON.parse(match[1]);
  const videoDataList = initData?.userPageLiveRecordVideoRsp?.videoDataList?.value ?? [];
  const list = videoDataList.map((item) => {
    const data = item.videoData;
    return {
      vid: data.vid,
      title: data.videoTitle,
    };
  });
  return list;
};

export default { download, parseVideo, parseReplayList };
