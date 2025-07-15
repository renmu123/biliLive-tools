import fs from "fs-extra";
import path from "path";
import M3U8Downloader from "@renmu/m3u8-downloader";
import axios from "axios";

import { taskQueue, KuaishouDownloadVideoTask } from "./task.js";
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
  const task = new KuaishouDownloadVideoTask(downloader, {
    name: `下载任务：${path.parse(output).name}`,
  });
  taskQueue.addTask(task, true);
  return task;
}

/**
 * 解析视频
 */
const parseVideo = async (
  productId: string,
): Promise<{
  currentWork: {
    author: {
      name: string;
    };
    playUrlV2: {
      hevc: string;
      h264: string;
    };
    playUrlV3: {
      h264: {
        adaptationSet: {
          representation: {
            url: string;
            qualityType: string;
            qualityLabel: string;
          }[];
        }[];
      };
    };
    createTime: number;
  };
}> => {
  const res = await axios.get(`https://live.kuaishou.com/live_api/playback/detail`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      host: "live.kuaishou.com",
    },
    params: {
      productId,
    },
  });
  if (res.status !== 200) {
    throw new Error("请求错误");
  }
  return res.data.data;
};

export default {
  parseVideo,
  download,
};
