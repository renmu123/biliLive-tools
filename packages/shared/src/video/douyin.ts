import fs from "fs-extra";
import path from "node:path";
import axios from "axios";
import { DownloaderHelper as RangeDownloader } from "node-downloader-helper";

import { taskQueue, DouyinDownloadVideoTask } from "../task/task.js";

async function download(
  output: string,
  url: string,
  options: {
    override?: boolean;
  },
) {
  if ((await fs.pathExists(output)) && !options.override) throw new Error(`${output}已存在`);
  console.log(`开始下载视频，url=${url}，output=${output}`);
  const dir = path.parse(output).dir;
  const fileName = path.parse(output).base;
  const downloader = new RangeDownloader(url, dir, {
    fileName: fileName,
    retry: {
      maxRetries: 5,
      delay: 3000,
    },
  });
  const task = new DouyinDownloadVideoTask(downloader, {
    name: `下载任务：${path.parse(output).name}`,
  });
  taskQueue.addTask(task, true);
  return task;
}

/**
 * 解析视频
 */
const parseVideo = async (
  id: string,
): Promise<{
  title: string;
  resolutions: Array<{
    label: string;
    value: string;
    url: string;
  }>;
}> => {
  const res = await axios.get(`https://www.douyin.com/aweme/v1/web/show/episode/enter/`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    params: {
      device_platform: "webapp",
      aid: "6383",
      episode_id: id,
    },
  });
  if (res.status !== 200) {
    throw new Error("请求错误");
  }
  const episode = res.data.data.episode;
  const playUrls = episode.video_info.unfold_play_info.play_urls.sort(
    (a: any, b: any) => b.width - a.width,
  );

  return {
    title: episode.title,
    resolutions: playUrls.map((item: any) => ({
      label: item.definition,
      value: item.definition,
      url: item.main,
    })),
  };
};

export default {
  parseVideo,
  download,
};
