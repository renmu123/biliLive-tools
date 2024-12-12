import path, { join, parse } from "node:path";

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
  formatFile,
  getHardwareAcceleration,
  timemarkToSeconds,
  readLines,
  getTempPath,
} from "../utils/index.js";
import log from "../utils/log.js";
import { taskQueue, FFmpegTask } from "./task.js";

import type {
  FfmpegOptions,
  VideoMergeOptions,
  Video2Mp4Options,
  GlobalConfig,
} from "@biliLive-tools/types";
import type Ffmpeg from "@biliLive-tools/types/ffmpeg.js";

export const getFfmpegPath = () => {
  const config = appConfig.getAll();
  let ffmpegPath = config.ffmpegPath;
  let ffprobePath = config.ffprobePath;
  if (!config.customExecPath) {
    const globalConfig = container.resolve<GlobalConfig>("globalConfig");
    ffmpegPath = globalConfig.defaultFfmpegPath;
    ffprobePath = globalConfig.defaultFfprobePath;
  }

  return {
    ffmpegPath,
    ffprobePath,
  };
};

export const setFfmpegPath = async () => {
  const { ffmpegPath, ffprobePath } = getFfmpegPath();

  log.info("setFfmpegPath", ffmpegPath, ffprobePath);
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

export const convertImage2Video = async (
  inputDir: string,
  output: string,
  options: {
    removeOrigin: boolean;
    internal?: number;
  },
) => {
  await setFfmpegPath();
  const command = ffmpeg(join(inputDir, "%4d.png"))
    .inputOption("-r", `1/${options.internal || 30}`)
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
 * 只有webhook在用，几乎废弃，不再更新，之后直接重构
 */
export const convertVideo2Mp4 = async (
  file: {
    input: string;
    output?: string;
  },
  options: Video2Mp4Options = {
    saveRadio: 1,
    saveOriginPath: true,
    savePath: "",

    override: false,
    removeOrigin: false,
  },
  ffmpegOptions: FfmpegOptions = {
    encoder: "copy",
    audioCodec: "copy",
  },
  autoStart = false,
) => {
  await setFfmpegPath();

  // 相同文件覆盖提示
  const { name, path, dir } = formatFile(file.input);

  let outputName = file.output;
  if (!outputName) {
    outputName = `${name}.mp4`;
  } else {
    outputName = `${outputName}.mp4`;
  }

  let output = join(dir, outputName);
  if (options.saveRadio === 2 && options.savePath) {
    output = join(options.savePath, `${outputName}`);
  }

  const input = path;
  if (!(await pathExists(input))) {
    log.error("convertVideo2Mp4, file not exist", input);
    throw new Error("输入文件不存在");
  }
  if (!options.override && (await pathExists(output))) {
    log.error("convertVideo2Mp4, 文件已存在，跳过", input);
    throw new Error("目标文件已存在");
  }

  const command = ffmpeg(input).output(output);

  if (
    ffmpegOptions.encoder !== "copy" &&
    ffmpegOptions.resetResolution &&
    ffmpegOptions.resolutionWidth &&
    ffmpegOptions.resolutionHeight
  ) {
    let scaleFilter = `${ffmpegOptions.resolutionWidth}:${ffmpegOptions.resolutionHeight}`;
    if (ffmpegOptions.swsFlags) {
      scaleFilter += `:flags=${ffmpegOptions.swsFlags}`;
    }
    command.outputOptions(`-vf scale=${scaleFilter}`);
  }

  // 硬件解码
  if (ffmpegOptions.decode) {
    const hardware = getHardwareAcceleration(ffmpegOptions.encoder);
    if (hardware === "nvenc") {
      command.inputOptions("-hwaccel cuda");
      command.inputOptions("-hwaccel_output_format cuda");
      command.inputOptions("-extra_hw_frames 10");
    } else if (hardware === "amf") {
      command.inputOptions("-hwaccel d3d11va");
      command.inputOptions("-hwaccel_output_format d3d11");
      command.inputOptions("-extra_hw_frames 10");
    }
  }
  const ffmpegParams = genFfmpegParams(ffmpegOptions);

  ffmpegParams.forEach((param) => {
    command.outputOptions(param);
  });

  const task = new FFmpegTask(
    command,
    {
      output,
      name: `转码任务: ${name}`,
    },
    {
      onProgress(progress) {
        if (progress.percent) {
          progress.percentage = progress.percent;
        }
        return progress;
      },
      onEnd: async () => {
        if (options.removeOrigin && (await pathExists(input))) {
          log.info("convertVideo2Mp4, remove origin file", input);
          await trashItem(input);
        }
      },
    },
  );

  taskQueue.addTask(task, autoStart);
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

  addScaleFilter(resolutionWidth: number, resolutionHeight: number, swsFlags?: string) {
    let scaleFilter = `${resolutionWidth}:${resolutionHeight}`;
    if (swsFlags) {
      scaleFilter += `:flags=${swsFlags}`;
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
 * 弹幕元数据时间匹配
 * @param {string} str 需要匹配的字符串
 */
export const matchDanmaTimestamp = (str: string): number | null => {
  const bililiveRecorderRegex = /start_time="(.+)"/;
  const blrecRegex = /<record_start_time>(.+)<\/record_start_time>/;
  const douyuRegex = /<video_start_time>(.+)<\/video_start_time>/;

  const regexes = [bililiveRecorderRegex, blrecRegex, douyuRegex];
  for (const regex of regexes) {
    const timestamp = matchTimestamp(str, regex);
    if (timestamp) {
      return timestamp;
    }
  }
  return null;
};

/**
 * 使用正则匹配时间戳
 * param {string} str 需要匹配的字符串
 * param {RegExp} regex 匹配的正则，捕获组为时间
 */
function matchTimestamp(str: string, regex: RegExp): number | null {
  const match = str.match(regex);
  if (match) {
    const time = match[1];
    try {
      const timestamp = Math.floor(new Date(time).getTime() / 1000);
      return timestamp;
    } catch {
      // do nothing
    }
  }

  return null;
}

/**
 * 读取xml文件中的时间戳
 * start_time="2024-08-20T09:48:07.7164935+08:00";
 * <record_start_time>2024-07-23T18:26:30+08:00</record_start_time>
 * <video_start_time>2024-11-06T15:14:02.000Z</video_start_time>
 */
export async function readXmlTimestamp(filePath: string): Promise<number | 0> {
  if (!(await pathExists(filePath))) {
    return 0;
  }
  const content = await readLines(filePath, 0, 30);
  const timestamp = matchDanmaTimestamp(content.join("\n"));

  return timestamp ? timestamp : 0;
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

  async function addDefaultComplexFilter() {
    const scaleMethod = selectScaleMethod(ffmpegOptions);

    // 先缩放后渲染
    if (
      scaleMethod === "before" &&
      ffmpegOptions.resolutionWidth &&
      ffmpegOptions.resolutionHeight
    ) {
      complexFilter.addScaleFilter(
        ffmpegOptions.resolutionWidth,
        ffmpegOptions.resolutionHeight,
        ffmpegOptions.swsFlags,
      );
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
      complexFilter.addScaleFilter(
        ffmpegOptions.resolutionWidth,
        ffmpegOptions.resolutionHeight,
        ffmpegOptions.swsFlags,
      );
    }

    // 如果设置了添加时间戳
    const startTimestamp = await getDrawtextParams();
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
  }

  if (ffmpegOptions.vf) {
    const vfArray = ffmpegOptions.vf.split(";");
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
    await addDefaultComplexFilter();
  }

  if (complexFilter.getFilters().length) {
    command.complexFilter(complexFilter.getFilters(), complexFilter.getLatestOutputStream());
    command.outputOptions("-map 0:a");
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
    command.inputOptions("-copyts");
  }
  if (ffmpegOptions.to) {
    command.inputOptions(`-to ${ffmpegOptions.to}`);
  }

  // 硬件解码
  if (ffmpegOptions.decode) {
    const hardware = getHardwareAcceleration(ffmpegOptions.encoder);
    if (hardware === "nvenc") {
      command.inputOptions("-hwaccel cuda");
      command.inputOptions("-hwaccel_output_format cuda");
      command.inputOptions("-extra_hw_frames 10");
    } else if (hardware === "amf") {
      command.inputOptions("-hwaccel d3d11va");
      // command.inputOptions("-hwaccel_output_format d3d11");
      command.inputOptions("-extra_hw_frames 10");
    }
  }
  const ffmpegParams = genFfmpegParams(ffmpegOptions);

  ffmpegParams.forEach((param) => {
    command.outputOptions(param);
  });

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
  const command = await genMergeAssMp4Command(files, ffmpegOptions, {
    startTimestamp: startTimestamp,
    timestampFont: options.timestampFont,
  });

  await setFfmpegPath();
  const task = new FFmpegTask(
    command,
    {
      output,
      name: `压制任务:${parse(output).name}`,
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
  taskQueue.addTask(task, false);

  return task;
};

/**
 * 转码
 */
export const transcode = async (
  input: string,
  /** 包含后缀 */
  outputName: string,
  ffmpegOptions: FfmpegOptions,
  option: {
    override?: boolean;
    removeOrigin?: boolean;
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
  let savePath: string;
  if (options.saveType === 1) {
    savePath = path.dirname(input);
  } else if (options.saveType === 2) {
    savePath = path.resolve(path.dirname(input), options.savePath);
  } else {
    throw new Error("保存类型错误");
  }

  if (!savePath) {
    throw new Error("没有找到保存路径");
  }
  if (!(await pathExists(savePath))) {
    await fs.ensureDir(savePath);
  }
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
    },
    ffmpegOptions,
  );
};

/**
 * 生成一个未被使用的文件名
 * @param filePath 文件路径
 * @returns 未被使用的文件名
 */
async function getUnusedFileName(filePath: string): Promise<string> {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);

  let newFilePath = filePath;
  let counter = 1;

  while (await fs.pathExists(newFilePath)) {
    newFilePath = path.join(dir, `${baseName}(${counter})${ext}`);
    counter++;
    if (counter > 100) {
      throw new Error("文件名生成失败");
    }
  }

  return newFilePath;
}

export const mergeVideos = async (
  inputFiles: string[],
  output: string,
  options: VideoMergeOptions = {
    removeOrigin: false,
    saveOriginPath: false,
  },
) => {
  let outputFile = output;
  if (options.saveOriginPath) {
    outputFile = await getUnusedFileName(output);
  }
  await setFfmpegPath();

  const fileTxtPath = join(getTempPath(), `${uuid()}.txt`);
  const fileTxtContent = inputFiles.map((videoFile) => `file '${videoFile}'`).join("\n");
  await fs.writeFile(fileTxtPath, fileTxtContent);

  const command = ffmpeg(fileTxtPath)
    .inputOptions("-f concat")
    .inputOptions("-safe 0")
    .videoCodec("copy")
    .audioCodec("copy")
    .output(outputFile);

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
