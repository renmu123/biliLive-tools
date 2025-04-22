import { join, parse } from "node:path";
import fs from "fs-extra";
import os from "node:os";
import readline from "node:readline";
import { isNumber } from "lodash-es";

import {
  pathExists,
  trashItem,
  uuid,
  getTempPath,
  parseSavePath,
  getUnusedFileName,
} from "../utils/index.js";
import log from "../utils/log.js";
import { appConfig } from "../config.js";
import { DanmakuFactory } from "../danmu/danmakuFactory.js";
import { generateDanmakuImage } from "../danmu/hotProgress.js";
import { DanmuTask, taskQueue } from "./task.js";
import { convertImage2Video, readVideoMeta } from "./video.js";
import { container } from "../index.js";
import { parseXmlFile } from "../danmu/index.js";
import { XMLBuilder } from "fast-xml-parser";

import type {
  DanmuConfig,
  DanmaOptions,
  HotProgressOptions,
  GlobalConfig,
} from "@biliLive-tools/types";
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

const getDanmuFactoryPath = () => {
  const config = appConfig.getAll();
  let danmuFactoryPath = config.danmuFactoryPath;
  if (!config.customExecPath) {
    const globalConfig = container.resolve<GlobalConfig>("globalConfig");
    danmuFactoryPath = globalConfig.defaultDanmakuFactoryPath;
  }

  return danmuFactoryPath;
};

/**
 * 不要调用，调用convertXml2Ass
 */
const addConvertDanmu2AssTask = async (
  originInput: string,
  output: string,
  danmuOptions: DanmuConfig,
  options: Pick<DanmaOptions, "copyInput" | "removeOrigin"> = {},
) => {
  if (await pathExists(output)) {
    log.info("danmufactory", {
      status: "success",
      text: "文件已存在，删除",
      input: originInput,
      output: output,
    });
    await fs.unlink(output);
  }
  const DANMUKUFACTORY_PATH = getDanmuFactoryPath();
  const danmu = new DanmakuFactory(DANMUKUFACTORY_PATH);
  let tempInput: string | undefined;

  if (options.copyInput) {
    tempInput = join(os.tmpdir(), `${uuid()}.xml`);
    await fs.copyFile(originInput, tempInput);
  }

  if (danmuOptions.blacklist) {
    const tempDir = os.tmpdir();
    const fileTxtPath = join(tempDir, `${uuid()}.txt`);
    const fileTxtContent = danmuOptions.blacklist
      .split(",")
      .filter((value) => value)
      .join("\n");
    await fs.writeFile(fileTxtPath, fileTxtContent);
    danmuOptions.blacklist = fileTxtPath;
  }

  const input = tempInput || originInput;
  const task = new DanmuTask(
    danmu,
    {
      input: input,
      output,
      options: danmuOptions,
      name: `弹幕转换任务: ${parse(originInput).name}`,
    },
    {
      onEnd: async () => {
        if (options.removeOrigin) {
          await trashItem(originInput);
        }

        if (tempInput && (await pathExists(tempInput))) {
          await fs.unlink(tempInput);
        }
        if (danmuOptions.blacklist && (await pathExists(danmuOptions.blacklist))) {
          await fs.unlink(danmuOptions.blacklist);
        }
      },
      onError: async (error) => {
        log.error("danmufactory", {
          status: "error",
          text: error,
          input: originInput,
          output: output,
        });
        if (tempInput && (await pathExists(tempInput))) {
          await fs.unlink(tempInput);
        }
        if (danmuOptions.blacklist && (await pathExists(danmuOptions.blacklist))) {
          await fs.unlink(danmuOptions.blacklist);
        }
      },
    },
  );
  taskQueue.addTask(task, true);
  return task;
};

export const convertXml2Ass = async (
  file: {
    input: string;
    output: string;
  },
  danmuOptions: DanmuConfig,
  options: DanmaOptions,
) => {
  if (await isEmptyDanmu(file.input)) {
    throw new Error("弹幕为空，无须处理");
  }

  let output: string;
  if (!options.temp) {
    let savePath = await parseSavePath(file.input, {
      saveType: options.saveRadio,
      savePath: options.savePath,
    });
    output = join(savePath, `${file.output}.ass`);
  } else {
    const tempFile = join(getTempPath(), `${uuid()}.ass`);
    output = tempFile;
  }

  if (!options.override && (await pathExists(output))) {
    throw new Error(`${output}文件已存在`);
  }

  const task = await addConvertDanmu2AssTask(file.input, output, danmuOptions, options);

  return task;
};

/**
 * 判断xml中弹幕是否为空
 * 如果文件中存在<d>, <gift>, <sc>, <guard>标签则认为不为空
 *
 */
export const isEmptyDanmu = async (filepath: string) => {
  const readStream = fs.createReadStream(filepath, { encoding: "utf8" });
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });
  // "d": 普通弹幕，"gift": 录播姬 - 普通礼物，"sc": 录播姬 - SuperChat，"guard": 录播姬 - 舰长
  for await (const line of rl) {
    if (
      line.includes("</d>") ||
      line.includes("</gift>") ||
      line.includes("</sc>") ||
      line.includes("</guard>")
    )
      return false;
  }
  return true;
};

/**
 * 生成高能进度条，输出文件在临时文件夹
 */
export const genHotProgress = async (input: string, options: HotProgressOptions) => {
  const output = join(getTempPath(), `${uuid()}.mp4`);
  return _genHotProgress(input, output, options);
};

/**
 * 生成高能进度条
 */
export const _genHotProgress = async (
  input: string,
  output: string,
  options: HotProgressOptions,
) => {
  log.debug("generateDanmakuImage config", options);
  if (options.videoPath) {
    const videoMeta = await readVideoMeta(options.videoPath);
    const videoStream = videoMeta.streams.find((stream) => stream.codec_type === "video");
    const { width } = videoStream || {};
    options.width = width;
    options.duration = videoMeta.format.duration;
  }
  if (!options.duration || !isNumber(options.duration)) {
    throw new Error(`can not read duration in genHotProgress`);
  }
  if (!options.width) {
    throw new Error("can not read width in genHotProgress");
  }

  const imageDir = join(getTempPath(), uuid());
  const data = await generateDanmakuImage(
    input,
    imageDir,
    options as WithRequired<HotProgressOptions, "duration">,
  );
  log.debug("generateDanmakuImage done", `${data.length} images generated`);

  return convertImage2Video(imageDir, output, {
    removeOrigin: true,
    interval: options.interval,
  });
};

// 定义XML弹幕数据的接口
interface DanmuItem {
  "@_p": string;
}

interface CommonItem {
  "@_ts": string;
}

interface VideoDataItem {
  path: string;
  videoDuration: number;
  startOffset: number;
  meta: any;
  danmuku: {
    "@_p": string;
  }[];
  sc: CommonItem[];
  guard: CommonItem[];
  gift: CommonItem[];
}

/**
 * 处理弹幕时间偏移（纯函数）
 * @param items 弹幕数据
 * @param videoDuration 视频时长
 * @param startOffset 起始偏移时间
 * @param isP 是否是p属性（普通弹幕）
 * @returns 处理后的弹幕数据
 */
export function processDanmuOffset<T extends DanmuItem | CommonItem>(
  items: T[],
  videoDuration: number,
  startOffset: number,
  isP: boolean = false,
): T[] {
  return items
    .filter((item) => {
      // 判断弹幕时间是否超出视频时长
      const timeValue = isP
        ? parseFloat((item as DanmuItem)["@_p"].split(",")[0])
        : parseFloat((item as CommonItem)["@_ts"]);

      return timeValue <= videoDuration;
    })
    .map((item) => {
      const newItem = { ...item };

      if (isP) {
        // 处理普通弹幕
        const pValues = (newItem as DanmuItem)["@_p"].split(",");
        const timestamp = parseFloat(pValues[0]);
        const newTimestamp = timestamp + startOffset;
        pValues[0] = newTimestamp.toString();
        (newItem as DanmuItem)["@_p"] = pValues.join(",");
      } else {
        // 处理其他类型
        const ts = parseFloat((newItem as CommonItem)["@_ts"]);
        (newItem as CommonItem)["@_ts"] = (ts + startOffset).toString();
      }

      return newItem;
    });
}

/**
 * 生成合并后的XML内容（纯函数）
 */
export function generateMergedXmlContent(
  mergedDanmuku: DanmuItem[],
  mergedGift: CommonItem[],
  mergedSc: CommonItem[],
  mergedGuard: CommonItem[],
): string {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
  });

  const xmlContent = builder.build({
    i: {
      d: mergedDanmuku,
      gift: mergedGift,
      sc: mergedSc,
      guard: mergedGuard,
    },
  });

  return `<?xml version="1.0" encoding="utf-8"?>\n${xmlContent}`;
}

/**
 * 根据视频合并xml弹幕
 */
export const mergeXml = async (
  inputFiles: { videoPath: string; danmakuPath: string }[],
  options: {
    output?: string;
  } = {},
) => {
  if (inputFiles.length === 0) {
    throw new Error("输入文件不能为空");
  }

  // 确定输出路径
  let outputPath: string;
  if (options.output) {
    outputPath = options.output;
  } else {
    const { dir, name } = parse(inputFiles[0].danmakuPath);
    const filePath = join(dir, `${name}-合并.xml`);
    outputPath = await getUnusedFileName(filePath);
  }

  // 如果输出文件已存在，删除它
  if (await pathExists(outputPath)) {
    await trashItem(outputPath);
  }

  // 读取视频时长和累计时长
  let cumulativeDuration = 0;
  const videoData: VideoDataItem[] = [];

  for (const file of inputFiles) {
    // 读取视频元数据获取时长
    const meta = await readVideoMeta(file.videoPath);
    const duration = meta.format.duration || 0;

    // 解析XML文件
    const { jObj, danmuku, sc, guard, gift } = await parseXmlFile(file.danmakuPath);

    videoData.push({
      path: file.danmakuPath,
      videoDuration: duration,
      startOffset: cumulativeDuration,
      meta: jObj.i?.metadata || {},
      danmuku: danmuku || [],
      sc: sc || [],
      guard: guard || [],
      gift: gift || [],
    });

    cumulativeDuration += duration;
  }

  // 处理所有弹幕并合并
  const mergedDanmuku: DanmuItem[] = [];
  const mergedSc: CommonItem[] = [];
  const mergedGuard: CommonItem[] = [];
  const mergedGift: CommonItem[] = [];

  for (const data of videoData) {
    // 处理各类型弹幕并添加到对应数组
    mergedDanmuku.push(
      ...processDanmuOffset(data.danmuku, data.videoDuration, data.startOffset, true),
    );
    mergedSc.push(...processDanmuOffset(data.sc, data.videoDuration, data.startOffset));
    mergedGuard.push(...processDanmuOffset(data.guard, data.videoDuration, data.startOffset));
    mergedGift.push(...processDanmuOffset(data.gift, data.videoDuration, data.startOffset));
  }

  // 生成XML内容
  const xmlContent = generateMergedXmlContent(mergedDanmuku, mergedGift, mergedSc, mergedGuard);

  // 写入合并后的XML文件
  await fs.writeFile(outputPath, xmlContent);

  log.info("mergeXml", {
    status: "success",
    text: `合并完成，共处理了${inputFiles.length}个文件`,
    output: outputPath,
  });

  return outputPath;
};
