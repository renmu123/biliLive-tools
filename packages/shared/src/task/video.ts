import path, { join, parse } from "node:path";
import { spawn } from "node:child_process";

import fs from "fs-extra";
import ffmpeg from "@renmu/fluent-ffmpeg";
import { sumBy } from "lodash-es";

import { container } from "../index.js";
import { appConfig } from "../config.js";
import {
  escaped,
  genFfmpegParams,
  pathExists,
  trashItem,
  uuid,
  executeCommand,
  getHardwareAcceleration,
  timemarkToSeconds,
  readLines,
  getTempPath,
  parseSavePath,
  getUnusedFileName,
} from "../utils/index.js";
import log from "../utils/log.js";
import { taskQueue, FFmpegTask, AbstractTask } from "./task.js";
import { isEmptyDanmu, convertXml2Ass, genHotProgress } from "./danmu.js";

import type {
  FfmpegOptions,
  VideoMergeOptions,
  GlobalConfig,
  DanmuConfig,
  HotProgressOptions,
} from "@biliLive-tools/types";
import type Ffmpeg from "@biliLive-tools/types/ffmpeg.js";

export const getFfmpegPath = () => {
  const config = appConfig.getAll();
  let ffmpegPath = config.ffmpegPath;
  let ffprobePath = config.ffprobePath;
  let mesioPath = config.mesioPath;
  if (!config.customExecPath) {
    const globalConfig = container.resolve<GlobalConfig>("globalConfig");
    ffmpegPath = globalConfig.defaultFfmpegPath;
    ffprobePath = globalConfig.defaultFfprobePath;
    mesioPath = globalConfig.defaultMesioPath;
  }

  return {
    ffmpegPath,
    ffprobePath,
    mesioPath,
  };
};

export const setFfmpegPath = async () => {
  const { ffmpegPath, ffprobePath } = getFfmpegPath();

  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);
};

export const readVideoMeta = async (
  input: string,
  options: {
    json?: boolean;
  } = {},
): Promise<Ffmpeg.FfprobeData> => {
  await setFfmpegPath();
  return new Promise((resolve, reject) => {
    const lastOptions = Object.assign({ json: false }, options);
    // @ts-ignore
    ffmpeg.ffprobe(input, lastOptions, function (err, metadata) {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
};

export const readNbFrames = async (input: string): Promise<number> => {
  const config = appConfig.getAll();
  const command = `${config.ffprobePath} -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "${input}"`;
  const nbFrames = await executeCommand(command);
  return Number(nbFrames) || 0;
};

export const getAvailableEncoders = async () => {
  await setFfmpegPath();
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableEncoders(function (err, codecs) {
      if (err) {
        reject(err);
      } else {
        resolve(codecs);
      }
    });
  });
};

interface Resolution {
  width: number;
  height: number;
}

/**
 * 分析视频分辨率变化
 * @param filePath 视频文件路径
 * @returns 分辨率变化
 */
export async function analyzeResolutionChanges(filePath: string): Promise<Resolution[]> {
  const { ffprobePath } = getFfmpegPath();
  const command = `${ffprobePath}`;
  const args = [
    "-v",
    "error",
    "-skip_frame",
    "nokey",
    "-select_streams",
    "v:0",
    "-show_entries",
    "frame=width,height",
    "-of",
    "csv=p=0",
    filePath,
  ];

  const ffprobe = spawn(command, args);

  const resolutions: Resolution[] = [];

  ffprobe.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line: string) => {
      const [width, height] = line.split(",");
      if (!width || !height) {
        return;
      }

      // 不要添加重复的分辨率
      const resolution = {
        width: parseInt(width, 10),
        height: parseInt(height, 10),
      };
      if (
        !resolutions.some((r) => r.width === resolution.width && r.height === resolution.height)
      ) {
        resolutions.push(resolution);
      }
    });
  });

  ffprobe.stderr.on("data", (data) => {
    console.error(`Stderr: ${data}`);
  });

  return new Promise((resolve, reject) => {
    ffprobe.on("close", (code) => {
      if (code !== 0) {
        reject(`ffprobe process exited with code ${code}`);
      } else {
        resolve(resolutions);
      }
    });
  });
}

export const convertImage2Video = async (
  inputDir: string,
  output: string,
  options: {
    removeOrigin: boolean;
    interval?: number;
  },
) => {
  await setFfmpegPath();
  const command = ffmpeg(join(inputDir, "%4d.png"))
    .inputOption("-r", `1/${options.interval || 30}`)
    .output(output);
  const task = new FFmpegTask(
    command,
    {
      output,
      name: `高能进度条: ${output}`,
    },
    {
      onProgress(progress) {
        if (progress.percent) {
          progress.percentage = progress.percent;
        }
        return progress;
      },
      onEnd: async () => {
        if (options.removeOrigin && (await pathExists(inputDir))) {
          log.info("convertImage2Video, remove origin file", inputDir);
          fs.rm(inputDir, { recursive: true, force: true });
        }
      },
    },
  );

  taskQueue.addTask(task, true);
  return task;
};

/**
 * 判断是否需要缩放以及缩放方式
 */
export const selectScaleMethod = (
  ffmpegOptions: FfmpegOptions,
): "none" | "auto" | "before" | "after" => {
  if (!ffmpegOptions.resetResolution) {
    return "none";
  }
  if (
    ffmpegOptions.resetResolution &&
    ffmpegOptions.resolutionWidth &&
    ffmpegOptions.resolutionHeight
  ) {
    return ffmpegOptions.scaleMethod || "auto";
  } else {
    return "none";
  }
};

export class ComplexFilter {
  private filters: {
    filter: string;
    options?: string;
    inputs?: string | string[];
    outputs?: string;
  }[] = [];
  private streamIndex: number = 0;
  private latestOutputStream: string;

  constructor(initialInputStream: string = "0:v") {
    this.latestOutputStream = initialInputStream;
  }

  private getNextStream(): string {
    return `${this.streamIndex++}:video`;
  }

  addFilter(filter: string, options: string, inputs?: string[], outputs?: string) {
    const inputStream = inputs || [this.latestOutputStream];
    const outputStream = outputs || this.getNextStream();
    this.filters.push({
      filter,
      options,
      inputs: inputStream,
      outputs: outputStream,
    });
    this.latestOutputStream = outputStream;
    return outputStream;
  }

  addScaleFilter({
    resolutionWidth,
    resolutionHeight,
    swsFlags,
    encoder,
    useHardware,
    forceOriginalAspectRatio,
  }: {
    resolutionWidth: number;
    resolutionHeight: number;
    swsFlags: string;
    encoder: FfmpegOptions["encoder"];
    useHardware: boolean;
    forceOriginalAspectRatio: "auto" | "decrease" | "increase";
  }) {
    let scaleFilter = `${resolutionWidth}:${resolutionHeight}`;

    const hardware = getHardwareAcceleration(encoder);
    if (useHardware) {
      if (hardware === "nvenc") {
        if (swsFlags && swsFlags !== "auto" && swsFlags !== "neighbor") {
          scaleFilter += `:interp_algo=${swsFlags}:passthrough=1`;
        }
        return this.addFilter("hwupload_cuda,scale_cuda", scaleFilter);
      } else if (hardware === "qsv") {
        return this.addFilter("hwupload,scale_qsv", scaleFilter);
      }
      // else if (hardware === "amf") {
      //   if (resolutionHeight === -1) {
      //     scaleFilter = `${resolutionWidth}:-2`;
      //   }
      //   if (resolutionWidth === -1) {
      //     scaleFilter = `-2:${resolutionHeight}`;
      //   }
      //   if (["bilinear", "bicubic"].includes(swsFlags)) {
      //     scaleFilter += `:scale_type=${swsFlags}`;
      //   }
      //   return this.addFilter("vpp_amf", scaleFilter);
      // }
    }
    if (swsFlags && swsFlags !== "auto") {
      scaleFilter += `:flags=${swsFlags}`;
    }
    if (forceOriginalAspectRatio && forceOriginalAspectRatio !== "auto") {
      scaleFilter += `:force_original_aspect_ratio=${forceOriginalAspectRatio}`;
    }
    return this.addFilter("scale", scaleFilter);
  }

  addSubtitleFilter(assFile: string) {
    return this.addFilter("subtitles", `${escaped(assFile)}`);
  }

  addColorkeyFilter(inputs?: string[]) {
    return this.addFilter("colorkey", "black:0.1:0.1", inputs);
  }

  addOverlayFilter(inputs: string[]) {
    return this.addFilter("overlay", "W-w-0:H-h-0", inputs);
  }

  addDrawtextFilter({
    startTimestamp,
    fontColor,
    fontSize,
    x,
    y,
    font,
    format,
    extraOptions,
  }: {
    startTimestamp: number;
    fontColor: string;
    fontSize: number;
    x: number;
    y: number;
    font?: string;
    format?: string;
    extraOptions?: string;
  }) {
    if (!format) {
      format = "%Y-%m-%d %T";
    }
    let options = `text='%{pts\\:localtime\\:${startTimestamp}\\:${format}}':fontcolor=${fontColor}:fontsize=${fontSize}:x=${x}:y=${y}`;
    if (font) {
      options += `:font=${font}`;
    }
    if (extraOptions) {
      options += `:${extraOptions}`;
    }

    return this.addFilter("drawtext", options);
  }

  getFilters() {
    return this.filters;
  }

  getLatestOutputStream() {
    return this.latestOutputStream;
  }
}

/**
 * 弹幕元数据开始时间匹配
 * @param {string} str 需要匹配的字符串
 */
export const matchDanmaTimestamp = (str: string): number | null => {
  const bililiveRecorderRegex = /start_time="(.+?)"/;
  const blrecRegex = /<record_start_time>(.+?)<\/record_start_time>/;
  const douyuRegex = /<video_start_time>(.+?)<\/video_start_time>/;
  const bililiveRecorderVideoRegex = /录制时间: (.+)/;

  const regexes = [bililiveRecorderRegex, blrecRegex, douyuRegex, bililiveRecorderVideoRegex];
  for (const regex of regexes) {
    const timestamp = matchTimestamp(str, regex);
    if (timestamp) {
      return timestamp;
    }
  }
  return null;
};

/**
 * 元数据房间号匹配
 * @param {string} str 需要匹配的字符串
 */
export const matchRoomId = (str: string): number | null => {
  const bililiveRecorderRegex = /roomid="(.+?)"/;
  // douyu的和blrec的参数一致
  const blrecRegex = /<room_id>(.+?)<\/room_id>/;

  const regexes = [bililiveRecorderRegex, blrecRegex];
  for (const regex of regexes) {
    const match = str.match(regex);
    if (match) {
      return Number(match[1]) || null;
    }
  }
  return null;
};

/**
 * 元数据标题匹配
 * @param {string} str 需要匹配的字符串
 */
export const matchTitle = (str: string): string | null => {
  const bililiveRecorderRegex = /title="(.+?)"/;
  // douyu的和blrec的参数一致
  const blrecRegex = /<room_title>(.+?)<\/room_title>/;
  const bililiveRecorderVideoRegex = /直播标题: (.+)/;

  const regexes = [bililiveRecorderRegex, blrecRegex, bililiveRecorderVideoRegex];
  for (const regex of regexes) {
    const match = str.match(regex);
    if (match) {
      return match[1];
    }
  }
  return null;
};

/**
 * 元数据用户名匹配
 * @param {string} str 需要匹配的字符串
 */
export const matchUser = (str: string): string | null => {
  const bililiveRecorderRegex = /name="(.+?)"/;
  // douyu的和blrec的参数一致
  const blrecRegex = /<user_name>(.+?)<\/user_name>/;
  const bililiveRecorderVideoRegex = /主播名: (.+)/;

  const regexes = [bililiveRecorderRegex, blrecRegex, bililiveRecorderVideoRegex];
  for (const regex of regexes) {
    const match = str.match(regex);
    if (match) {
      return match[1];
    }
  }
  return null;
};

/**
 * 使用正则匹配时间戳
 * param {string} str 需要匹配的字符串
 * param {RegExp} regex 匹配的正则，捕获组为时间
 */
export function matchTimestamp(str: string, regex: RegExp): number | null {
  const match = str.match(regex);
  if (match) {
    const time = match[1];
    // 检查是否是纯数字（支持毫秒时间戳）
    if (/^\d+$/.test(time)) {
      return Math.floor(parseInt(time, 10) / 1000);
    }
    // 尝试解析日期字符串
    const timestamp = Math.floor(new Date(time).getTime() / 1000);
    return timestamp || null;
  }

  return null;
}

/**
 * 读取xml文件中的时间戳
 * start_time="2024-08-20T09:48:07.7164935+08:00";
 * <record_start_time>2024-07-23T18:26:30+08:00</record_start_time>
 * <video_start_time>2024-11-06T15:14:02.000Z</video_start_time>
 */
export async function readXmlTimestamp(filePath: string, timeout = 10000): Promise<number | 0> {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("读取xml时间戳超时")), timeout),
    );

    const result = await Promise.race([
      (async () => {
        if (!(await pathExists(filePath))) {
          return 0;
        }
        const content = await readLines(filePath, 0, 30);
        const timestamp = matchDanmaTimestamp(content.join("\n"));
        return timestamp ? timestamp : 0;
      })(),
      timeoutPromise,
    ]);

    return result as number;
  } catch (error) {
    log.error("readXmlTimestamp error", error);
    return 0;
  }
}

/**
 * 解析元数据
 * @param files
 * @param files.videoFilePath 视频文件路径
 * @param files.assFilePath 弹幕文件路径
 */
export async function parseMeta(files: { videoFilePath?: string; danmaFilePath?: string }) {
  const data: {
    // 秒级时间戳
    startTimestamp: number | null;
    roomId: number | null;
    title: string | null;
    username: string | null;
    duration: number;
  } = {
    startTimestamp: null,
    roomId: null,
    title: null,
    username: null,
    duration: 0,
  };
  let content = "";
  if (files.danmaFilePath && (await fs.pathExists(files.danmaFilePath))) {
    content += (await readLines(files.danmaFilePath, 0, 30)).join("\n");
  }

  if (files.videoFilePath && (await fs.pathExists(files.videoFilePath))) {
    try {
      const meta = await readVideoMeta(files.videoFilePath, {
        json: true,
      });
      content += String(meta?.format?.tags?.comment) ?? "";
      data.duration = parseInt(String(Number(meta?.format?.duration) || 0));
    } catch (e) {
      log.error("parseMeta, read video file error", e);
    }
  }
  if (!content) {
    return data;
  }
  data.startTimestamp = matchDanmaTimestamp(content);
  data.roomId = matchRoomId(content);
  data.title = matchTitle(content);
  data.username = matchUser(content);

  return data;
}

/**
 * 生成弹幕压制相关的ffmpeg命令
 * @param {object} files 文件相关
 * @param {string} files.videoFilePath 视频文件路径
 * @param {string} files.assFilePath 弹幕文件路径，不能有空格
 * @param {string} files.outputPath 输出文件路径
 * @param {object} ffmpegOptions ffmpeg参数
 */
export const genMergeAssMp4Command = async (
  files: {
    videoFilePath: string;
    assFilePath: string | undefined;
    outputPath: string;
    hotProgressFilePath: string | undefined;
  },
  ffmpegOptions: FfmpegOptions = {
    encoder: "libx264",
    audioCodec: "copy",
  },
  options: {
    startTimestamp?: number;
    timestampFont?: string;
  } = {
    // 视频录制开始的秒时间戳
    startTimestamp: 0,
    timestampFont: undefined,
  },
) => {
  const command = ffmpeg(files.videoFilePath).output(files.outputPath);
  const assFile = files.assFilePath;
  const complexFilter = new ComplexFilter();

  // 获取添加drawtext的参数，为空就是不支持添加
  // 优先从视频元数据读取（如录播姬注释），如果是webhook，那么优先从webhook中读取
  async function getDrawtextParams(): Promise<number | null> {
    if (!ffmpegOptions.addTimestamp) return null;
    // webhook传递过来的参数
    if (options.startTimestamp) return options.startTimestamp;

    // 视频元数据读取（如录播姬注释）
    const data = await readVideoMeta(files.videoFilePath, {
      json: true,
    });
    const comment = String(data?.format?.tags?.comment) ?? "";
    const commentTimestamp = matchTimestamp(comment, /录制时间: (.+)/);
    return commentTimestamp;
  }

  async function addDefaultComplexFilter(scaleHardware: boolean = false) {
    if (ffmpegOptions.pkOptimize) {
      ffmpegOptions.forceOriginalAspectRatio = "decrease";
    }
    const scaleMethod = selectScaleMethod(ffmpegOptions);
    const startTimestamp = await getDrawtextParams();

    // 先缩放后渲染
    if (
      scaleMethod === "before" &&
      ffmpegOptions.resolutionWidth &&
      ffmpegOptions.resolutionHeight
    ) {
      let uesHardwareScale = false;
      if (scaleHardware) {
        uesHardwareScale = !assFile && !startTimestamp;
      }
      complexFilter.addScaleFilter({
        resolutionWidth: ffmpegOptions.resolutionWidth,
        resolutionHeight: ffmpegOptions.resolutionHeight,
        swsFlags: ffmpegOptions.swsFlags ?? "",
        encoder: ffmpegOptions.encoder,
        useHardware: ffmpegOptions.hardwareScaleFilter ? uesHardwareScale : false,
        forceOriginalAspectRatio: ffmpegOptions.forceOriginalAspectRatio ?? "auto",
      });
    }

    if (assFile) {
      if (files.hotProgressFilePath) {
        const subtitleStream = complexFilter.addSubtitleFilter(assFile);
        const colorkeyStream = complexFilter.addColorkeyFilter(["1"]);
        complexFilter.addOverlayFilter([subtitleStream, colorkeyStream]);
      } else {
        complexFilter.addSubtitleFilter(assFile);
      }
    }
    // 先渲染后缩放
    if (
      (scaleMethod === "auto" || scaleMethod === "after") &&
      ffmpegOptions.resolutionWidth &&
      ffmpegOptions.resolutionHeight
    ) {
      let uesHardwareScale = false;
      if (scaleHardware) {
        uesHardwareScale = !startTimestamp;
      }

      complexFilter.addScaleFilter({
        resolutionWidth: ffmpegOptions.resolutionWidth,
        resolutionHeight: ffmpegOptions.resolutionHeight,
        swsFlags: ffmpegOptions.swsFlags ?? "",
        encoder: ffmpegOptions.encoder,
        useHardware: ffmpegOptions.hardwareScaleFilter ? uesHardwareScale : false,
        forceOriginalAspectRatio: ffmpegOptions.forceOriginalAspectRatio ?? "auto",
      });
    }

    // 如果设置了添加时间戳
    if (startTimestamp) {
      complexFilter.addDrawtextFilter({
        startTimestamp: startTimestamp,
        fontColor: ffmpegOptions.timestampFontColor ?? "white",
        fontSize: ffmpegOptions.timestampFontSize ?? 24,
        x: ffmpegOptions.timestampX ?? 10,
        y: ffmpegOptions.timestampY ?? 10,
        font: options.timestampFont,
        format: ffmpegOptions.timestampFormat,
        extraOptions: ffmpegOptions.timestampExtra,
      });
    }
    // pk优化
    if (ffmpegOptions.pkOptimize) {
      complexFilter.addFilter(
        "pad",
        `${ffmpegOptions.resolutionWidth}:${ffmpegOptions.resolutionHeight}:(ow-iw)/2:(oh-ih)/2`,
      );
    }
  }

  if (ffmpegOptions.vf) {
    const vfArray = ffmpegOptions.vf.split(";").filter((vf) => vf);
    for (const vf of vfArray) {
      if (vf === "$origin") {
        await addDefaultComplexFilter();
      } else {
        const vfOptions = vf.split("=");
        complexFilter.addFilter(vfOptions[0], vfOptions.slice(1).join("="));
      }
    }
  } else {
    // 添加默认滤镜
    await addDefaultComplexFilter(true);
  }

  // 输入参数
  if (assFile) {
    if (files.hotProgressFilePath) {
      command.input(files.hotProgressFilePath);
    }
  }
  // 切片
  if (ffmpegOptions.ss) {
    command.inputOptions(`-ss ${ffmpegOptions.ss}`);
    if (ffmpegOptions.encoder !== "copy") {
      command.inputOptions("-copyts");
    }
  }
  if (ffmpegOptions.to) {
    command.inputOptions(`-to ${ffmpegOptions.to}`);
  }

  // 如果不存在滤镜，但存在硬件编码，添加硬件解码
  if (!complexFilter.getFilters().length && ffmpegOptions.decode) {
    const hardware = getHardwareAcceleration(ffmpegOptions.encoder);
    if (hardware === "nvenc") {
      command.inputOptions("-hwaccel cuda");
      command.inputOptions("-hwaccel_output_format cuda");
    } else if (hardware === "qsv") {
      command.inputOptions("-init_hw_device qsv=hw");
      command.inputOptions("-filter_hw_device hw");
    }
  }

  // 如果存在scale_qsv滤镜，添加硬件相关代码
  if (complexFilter.getFilters().some((filter) => filter.filter === "hwupload,scale_qsv")) {
    command.inputOptions("-init_hw_device qsv=hw");
    command.inputOptions("-filter_hw_device hw");
  }

  // 当存在filter存在hwupload_cuda,scale_cuda且在第一个时，需要硬件解码
  if (complexFilter.getFilters()?.[0]?.filter === "hwupload_cuda,scale_cuda") {
    command.inputOptions("-hwaccel cuda");
    command.inputOptions("-hwaccel_output_format cuda");
    complexFilter.getFilters()[0].filter = "scale_cuda";
  } else if (complexFilter.getFilters()?.[0]?.filter === "scale_qsv") {
    // 仅在第一个时，需要硬件解码，其他情况不需要
    command.inputOptions("-hwaccel qsv");
  } else if (complexFilter.getFilters()?.[0]?.filter === "vpp_amf") {
    command.inputOptions("-hwaccel amf");
    command.inputOptions("-init_hw_device amf=amf");
    command.inputOptions("-filter_hw_device amf");
  }

  // 构建最后的输出内容
  if (complexFilter.getFilters().length) {
    command.complexFilter(complexFilter.getFilters(), complexFilter.getLatestOutputStream());
    command.outputOptions("-map 0:a");
  }
  const ffmpegParams = genFfmpegParams(ffmpegOptions);
  ffmpegParams.forEach((param) => {
    command.outputOptions(param);
  });

  // 编码线程数
  if (ffmpegOptions.encoderThreads && ffmpegOptions.encoderThreads > 0) {
    command.outputOptions(`-threads ${ffmpegOptions.encoderThreads}`);
  }

  return command;
};

/**
 * 弹幕压制
 * @param {object} files 文件相关
 * @param {string} files.videoFilePath 视频文件路径
 * @param {string} files.assFilePath 弹幕文件路径，不能有空格
 * @param {string} files.outputPath 输出文件路径
 * @param {object} options
 * @param {boolean} options.removeOrigin 是否删除原始文件
 * @param {object} ffmpegOptions ffmpeg参数
 */
export const mergeAssMp4 = async (
  files: {
    videoFilePath: string;
    assFilePath: string | undefined;
    outputPath: string;
    hotProgressFilePath: string | undefined;
  },
  options: {
    removeOrigin: boolean;
    startTimestamp?: number;
    override?: boolean;
    timestampFont?: string;
    limitTime?: [] | [string, string];
  } = {
    removeOrigin: false,
    startTimestamp: 0,
    override: true,
  },
  ffmpegOptions: FfmpegOptions = {
    encoder: "libx264",
    audioCodec: "copy",
  },
) => {
  const defaultOptions = {
    removeOrigin: false,
    startTimestamp: 0,
    override: true,
  };
  options = { ...defaultOptions, ...options };
  const videoInput = files.videoFilePath;
  const output = files.outputPath;

  if (!(await pathExists(videoInput))) {
    log.error("mergrAssMp4, file not exist", videoInput);
    throw new Error("输入文件不存在");
  }
  if (!options.override && (await pathExists(output))) {
    log.error("mergrAssMp4, 文件已存在，跳过", output);
    throw new Error(`${output}文件已存在`);
  }

  const assFile = files.assFilePath;
  const startTimestamp = options.startTimestamp || 0;
  log.debug("genMergeAssMp4Command start", startTimestamp);
  const command = await genMergeAssMp4Command(files, ffmpegOptions, {
    startTimestamp: startTimestamp,
    timestampFont: options.timestampFont,
  });
  log.debug("mergrAssMp4, command");

  await setFfmpegPath();
  const task = new FFmpegTask(
    command,
    {
      output,
      name: `压制任务:${parse(output).name}`,
      limitTime: options.limitTime,
    },
    {
      onProgress(progress) {
        if (ffmpegOptions.ss) {
          // 单独计算进度条，根据timemark
          const currentTime = timemarkToSeconds(progress.timemark);
          const duration = ffmpegOptions.to
            ? Number(ffmpegOptions.to) - Number(ffmpegOptions.ss)
            : 0;
          return { ...progress, percentage: Math.round((currentTime / duration) * 100) };
        }
        return progress;
      },
      onEnd: async () => {
        if (options.removeOrigin) {
          await trashItem(videoInput);

          if (assFile) {
            log.info("mergrAssMp4, remove ass origin file", assFile);
            await trashItem(assFile);
          }
        }
        if (files.hotProgressFilePath) {
          log.info("mergrAssMp4, remove hot progress origin file", assFile);
          await fs.unlink(files.hotProgressFilePath);
        }
      },
      onError: async () => {
        if (files.hotProgressFilePath) {
          log.info("mergrAssMp4, remove hot progress origin file", assFile);
          await fs.unlink(files.hotProgressFilePath);
        }
      },
    },
  );
  log.debug("mergeAssMp4 start task", task.taskId);
  taskQueue.addTask(task, false);

  return task;
};

/**
 * 切割视频
 */
export const cut = async (
  files: { videoFilePath: string; assFilePath?: string },
  output: string,
  ffmpegOptions: FfmpegOptions,
  option: {
    override?: boolean;
    /** 支持绝对路径和相对路径 */
    savePath?: string;
    /** 1: 保存到原始文件夹，2：保存到特定文件夹 */
    saveType: 1 | 2;
  },
) => {
  const options = Object.assign(
    {
      override: false,
      removeOrigin: false,
      saveType: 1,
      savePath: "",
    },
    option,
  );
  let outputFile = output;
  if (!path.isAbsolute(output)) {
    let savePath = await parseSavePath(files.videoFilePath, {
      saveType: options.saveType,
      savePath: options.savePath,
    });
    outputFile = path.join(savePath, output);
  }
  log.debug("Cut function call", outputFile);

  return mergeAssMp4(
    {
      videoFilePath: files.videoFilePath,
      assFilePath: files.assFilePath,
      outputPath: outputFile,
      hotProgressFilePath: undefined,
    },
    {
      removeOrigin: false,
      override: options.override,
    },
    ffmpegOptions,
  );
};

/**
 * 转码
 */
export const transcode = async (
  input: string,
  /** 文件名非绝对路径，包含后缀 */
  outputName: string,
  ffmpegOptions: FfmpegOptions,
  option: {
    override?: boolean;
    removeOrigin?: boolean;
    /** 支持绝对路径和相对路径 */
    savePath?: string;
    /** 1: 保存到原始文件夹，2：保存到特定文件夹 */
    saveType: 1 | 2;
    /** 限制处理时间 */
    limitTime?: [string, string];
  },
) => {
  const options = Object.assign(
    {
      override: false,
      removeOrigin: false,
      saveType: 1,
      savePath: "",
    },
    option,
  );
  let savePath = await parseSavePath(input, options);
  const output = path.join(savePath, outputName);
  return mergeAssMp4(
    {
      videoFilePath: input,
      assFilePath: undefined,
      outputPath: output,
      hotProgressFilePath: undefined,
    },
    {
      removeOrigin: options.removeOrigin,
      override: options.override,
      limitTime: options.limitTime,
    },
    ffmpegOptions,
  );
};

/**
 * 检查无损合并视频文件是否符合要求
 * @param inputFiles 输入文件
 * @returns 检查结果
 */
export const checkMergeVideos = async (
  inputFiles: string[],
): Promise<{
  warnings: string[];
  errors: string[];
}> => {
  if (inputFiles.length < 2) {
    return { warnings: [], errors: [] };
  }
  const videoMetas = await Promise.all(inputFiles.map((file) => readVideoMeta(file)));
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const meta of videoMetas) {
    if (meta.format.format_name !== videoMetas[0].format.format_name) {
      errors.push("输入视频容器不一致");
    }
    const videoStream = meta.streams.find((stream) => stream.codec_type === "video");
    const videoStream0 = videoMetas[0].streams.find((stream) => stream.codec_type === "video");
    const audioStream = meta.streams.find((stream) => stream.codec_type === "audio");
    const audioStream0 = videoMetas[0].streams.find((stream) => stream.codec_type === "audio");

    if (videoStream?.codec_name !== videoStream0?.codec_name) {
      errors.push("输入视频编码器不一致");
    }
    if (audioStream?.codec_name !== audioStream0?.codec_name) {
      errors.push("输入视频音频编码器不一致");
    }
    // 分辨率不一致警告
    if (videoStream?.width !== videoStream0?.width) {
      warnings.push("输入视频分辨率宽不一致");
    }
    if (videoStream?.height !== videoStream0?.height) {
      warnings.push("输入视频分辨率高不一致");
    }
  }

  return {
    warnings,
    errors,
  };
};

/**
 * 合并视频
 * @param inputFiles 输入文件
 * @param output 输出文件
 * @param options 选项
 */
export const mergeVideos = async (
  inputFiles: string[],
  options: VideoMergeOptions = {
    removeOrigin: false,
    saveOriginPath: false,
    keepFirstVideoMeta: false,
  },
) => {
  if (!inputFiles || inputFiles.length < 2) {
    throw new Error("inputVideos length must be greater than 1");
  }

  let outputFile: string | undefined = undefined;
  if (options.saveOriginPath) {
    const { dir, name } = path.parse(inputFiles[0]);
    const filePath = path.join(dir, `${name}-合并.mp4`);

    outputFile = await getUnusedFileName(filePath);
  } else {
    outputFile = options.output;
  }
  if (!outputFile) {
    throw new Error("output is required or saveOriginPath should be true");
  }
  await setFfmpegPath();

  const fileTxtPath = join(getTempPath(), `${uuid()}.txt`);
  const fileTxtContent = inputFiles.map((videoFile) => `file '${videoFile}'`).join("\n");
  await fs.writeFile(fileTxtPath, fileTxtContent);

  const command = ffmpeg(fileTxtPath).inputOptions("-f concat").inputOptions("-safe 0");
  if (options.keepFirstVideoMeta) {
    command.input(inputFiles[0]).outputOptions("-map 0").outputOptions(`-map_metadata 1`);
  }
  command.outputOptions("-c copy").output(outputFile);

  let duration = 1;
  let videoMetas: Awaited<ReturnType<typeof readVideoMeta>>[] = [];
  try {
    videoMetas = await Promise.all(inputFiles.map((file) => readVideoMeta(file)));
    duration = sumBy(videoMetas, (meta) => Number(meta?.format?.duration ?? 0));
  } catch (error) {
    log.error("mergeVideos, read video meta error", error);
  }
  // 时长仅用来计算进度，优先保持任务进行
  if (!duration) {
    log.error("mergeVideos, read video meta duration error", videoMetas);
    duration = 1;
  }

  const task = new FFmpegTask(
    command,
    {
      output: outputFile,
      name: `合并视频任务: ${path.dirname(inputFiles[0])}等文件`,
    },
    {
      onProgress(progress) {
        const currentTime = timemarkToSeconds(progress.timemark);

        return { ...progress, percentage: Math.round((currentTime / duration) * 100) };
      },
      onEnd: async () => {
        fs.remove(fileTxtPath);
        if (options.removeOrigin) {
          await Promise.all(inputFiles.map((videoInput) => trashItem(videoInput)));
        }
      },
      onError: async () => {
        fs.remove(fileTxtPath);
      },
    },
  );

  taskQueue.addTask(task, false);
  return {
    status: "success",
    text: "添加到任务队列",
    taskId: task.taskId,
  };
};

const promiseTask = async (task: AbstractTask) => {
  return new Promise((resolve, reject) => {
    task.on("task-end", () => {
      resolve(task.output);
    });
    task.on("task-error", ({ error }) => {
      reject(new Error(error));
    });
    task.on("task-cancel", () => {
      reject(new Error("任务取消"));
    });
  });
};

/**
 * 烧录字幕到视频
 */
export const burn = async (
  files: { videoFilePath: string; subtitleFilePath: string },
  output: string,
  options: {
    danmaOptions: DanmuConfig;
    ffmpegOptions: FfmpegOptions;
    hotProgressOptions: Omit<HotProgressOptions, "videoPath">;
    hasHotProgress: boolean;
    override?: boolean;
    removeOrigin?: boolean;
    /** 支持绝对路径和相对路径 */
    savePath?: string;
    /** 1: 保存到原始文件夹，2：保存到特定文件夹 */
    saveType?: 1 | 2;
    limitTime?: [string, string];
  },
) => {
  if (options.ffmpegOptions.encoder === "copy") {
    throw new Error("视频编码不能为copy");
  }

  const { videoFilePath, subtitleFilePath } = files;
  let assFilePath = subtitleFilePath;
  let hotProgressInput: string | undefined = undefined;
  let startTimestamp = 0;
  let timestampFont: string | undefined = undefined;

  const hasHotProgress = options.hasHotProgress || false;
  const override = options.override || false;
  const removeOrigin = options.removeOrigin || false;

  const videoMeta = await readVideoMeta(videoFilePath);
  const videoStream = videoMeta.streams.find((stream) => stream.codec_type === "video");
  const { width, height } = videoStream || {};
  const duration = videoMeta.format.duration;

  // 弹幕转换
  if (subtitleFilePath.endsWith(".xml")) {
    if (await isEmptyDanmu(subtitleFilePath)) {
      throw new Error("弹幕文件为空，无需压制");
    }
    const name = uuid();
    const danmaOptions = options.danmaOptions;
    // 开启跟随视频分辨率
    if (danmaOptions.resolutionResponsive && width && height) {
      danmaOptions.resolution[0] = width;
      danmaOptions.resolution[1] = height;
    }
    const task = await convertXml2Ass(
      {
        input: subtitleFilePath,
        output: name,
      },
      options.danmaOptions,
      {
        saveRadio: 2,
        savePath: getTempPath(),
        removeOrigin: removeOrigin,
        copyInput: true,
      },
    );
    log.debug("convertXml2Ass task start", task.taskId);
    await promiseTask(task);
    log.debug("convertXml2Ass task end", task.taskId);
    assFilePath = task.output!;
    if (options.ffmpegOptions.addTimestamp) {
      startTimestamp = await readXmlTimestamp(files.subtitleFilePath);
      log.debug("readXmlTimestamp end", startTimestamp);
    }
    if (options.ffmpegOptions.timestampFollowDanmu) {
      timestampFont = options.danmaOptions.fontname;
    }
  }
  // 高能进度条转换
  if (hasHotProgress) {
    const hotProgressOptions = options.hotProgressOptions;
    const task = await genHotProgress(files.subtitleFilePath, {
      ...hotProgressOptions,
      width,
      duration,
    });
    await promiseTask(task);
    hotProgressInput = task.output;
  }

  // 烧录
  let outputFile = output;
  if (!path.isAbsolute(output)) {
    let savePath = await parseSavePath(videoFilePath, {
      saveType: options.saveType,
      savePath: options.savePath,
    });
    outputFile = path.join(savePath, output);
  }
  log.debug("burn function call", outputFile);
  const task = await mergeAssMp4(
    {
      videoFilePath,
      assFilePath,
      outputPath: outputFile,
      hotProgressFilePath: hotProgressInput,
    },
    {
      removeOrigin: removeOrigin,
      override: override,
      startTimestamp,
      timestampFont,
      limitTime: options.limitTime,
    },
    options.ffmpegOptions,
  );

  return task;
};
