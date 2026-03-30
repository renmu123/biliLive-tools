import fs from "fs-extra";
import path from "path";
import M3U8Downloader from "@renmu/m3u8-downloader";
import axios from "axios";

import { taskQueue, KuaishouDownloadVideoTask } from "../task/task.js";
import { getBinPath, transcode } from "../task/video.js";
import { uuid } from "../utils/index.js";
import { getTempPath, replaceExtName, sleep } from "../utils/index.js";

async function download(
  output: string,
  url: string,
  options: {
    override?: boolean;
  },
) {
  const mp4Output = replaceExtName(output, ".mp4");
  if ((await fs.pathExists(mp4Output)) && !options.override) throw new Error(`${mp4Output}已存在`);

  const { dir, name } = path.parse(output);
  const tsOutput = path.join(dir, `${name}.ts`);
  if (await fs.pathExists(tsOutput)) {
    throw new Error(`${tsOutput}已存在，您可以直接执行转封装命令，或者删除后重新下载`);
  }

  const { ffmpegPath } = getBinPath();
  const downloader = new M3U8Downloader(url, tsOutput, {
    convert2Mp4: false,
    ffmpegPath: ffmpegPath,
    segmentsDir: path.join(getTempPath(), uuid()),
  });
  const task = new KuaishouDownloadVideoTask(
    downloader,
    {
      name: `下载任务：${path.parse(output).name}`,
    },
    {
      onEnd: async () => {
        const outputName = `${name}.mp4`;
        await sleep(2000);
        await transcode(
          tsOutput,
          outputName,
          { encoder: "copy", audioCodec: "copy" },
          {
            saveType: 2,
            savePath: dir,
            override: true,
            removeOrigin: true,
            autoRun: true,
          },
        );
      },
    },
  );
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
