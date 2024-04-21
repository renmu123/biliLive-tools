import { join, parse } from "path";
import os from "os";
import fs from "fs-extra";
import ffmpeg from "fluent-ffmpeg";

import { appConfig } from "@biliLive-tools/shared";
import { escaped, genFfmpegParams, pathExists, trashItem, uuid } from "./utils/index";
import log from "./utils/log";
import { executeCommand } from "../utils/index";
import { taskQueue, FFmpegTask } from "./task";

import type { IpcMainInvokeEvent, WebContents } from "electron";
import type { File, FfmpegOptions, VideoMergeOptions, Video2Mp4Options } from "../types";

export const setFfmpegPath = async () => {
  const config = appConfig.getAll();
  if (config.ffmpegPath) {
    ffmpeg.setFfmpegPath(config.ffmpegPath);
  }
  if (config.ffprobePath) {
    ffmpeg.setFfprobePath(config.ffprobePath);
  }
};

export const readVideoMeta = async (input: string): Promise<ffmpeg.FfprobeData> => {
  await setFfmpegPath();
  return new Promise((resolve, reject) => {
    ffmpeg(input).ffprobe(function (err, metadata) {
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
  webContents: WebContents,
  inputDir: string,
  output: string,
  options: {
    removeOrigin: boolean;
    internal?: number;
  },
) => {
  await setFfmpegPath();
  const command = ffmpeg(`${inputDir}\\%4d.png`)
    .inputOption("-r", `1/${options.internal || 30}`)
    .output(output);
  const task = new FFmpegTask(
    command,
    webContents,
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
  return {
    status: "success",
    text: "添加到任务队列",
    taskId: task.taskId,
  };
};

export const convertVideo2Mp4 = async (
  _event: IpcMainInvokeEvent,
  file: File,
  options: Video2Mp4Options = {
    saveRadio: 1,
    saveOriginPath: true,
    savePath: "",

    override: false,
    removeOrigin: false,
  },
) => {
  await setFfmpegPath();

  // 相同文件覆盖提示
  const { name, path, dir } = file;
  let output = join(dir, `${name}.mp4`);
  const input = path;

  if (options.saveRadio === 2 && options.savePath) {
    output = join(options.savePath, `${name}.mp4`);
  }

  if (!(await pathExists(input))) {
    log.error("convertVideo2Mp4, file not exist", input);
    throw new Error("输入文件不存在");
  }
  if (!options.override && (await pathExists(output))) {
    log.error("convertVideo2Mp4, 文件已存在，跳过", input);
    throw new Error("目标文件已存在");
  }

  const command = ffmpeg(input).videoCodec("copy").audioCodec("copy").output(output);

  // const videoMeta = await readVideoMeta(path);
  // log.info("convertVideo2Mp4: videoMeta", videoMeta);

  const task = new FFmpegTask(
    command,
    _event.sender,
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

  taskQueue.addTask(task, true);
  return {
    status: "success",
    text: "添加到任务队列",
    taskId: task.taskId,
  };
};

/**
 * 弹幕压制
 * @param {*} _event
 * @param {object} files 文件相关
 * @param {string} files.videoFilePath 视频文件路径
 * @param {string} files.assFilePath 弹幕文件路径，不能有空格
 * @param {string} files.outputPath 输出文件路径
 * @param {object} options
 * @param {boolean} options.removeOrigin 是否删除原始文件
 * @param {object} ffmpegOptions ffmpeg参数
 */
export const mergeAssMp4 = async (
  _event: IpcMainInvokeEvent,
  files: {
    videoFilePath: string;
    assFilePath: string;
    outputPath: string;
    hotProgressFilePath: string | undefined;
  },
  options: {
    removeOrigin: boolean;
  } = {
    removeOrigin: false,
  },
  ffmpegOptions: FfmpegOptions = {
    encoder: "libx264",
  },
) => {
  await setFfmpegPath();

  const videoInput = files.videoFilePath;
  const assFile = files.assFilePath;
  const output = files.outputPath;

  if (!(await pathExists(videoInput))) {
    log.error("mergrAssMp4, file not exist", videoInput);
    _event.sender.send("task-error", "文件不存在");
    return;
  }

  const command = ffmpeg(videoInput).audioCodec("copy").output(output);

  if (files.hotProgressFilePath) {
    command.input(files.hotProgressFilePath);
    // command.outputOptions(
    //   `-filter_complex [0:v]subtitles=${escaped(assFile)}[i];[1]colorkey=black:0.1:0.1[1d];[i][1d]overlay=W-w-0:H-h-0'`,
    // );
    command.complexFilter([
      {
        filter: "subtitles",
        options: `${escaped(assFile)}`,
        inputs: "0:v",
        outputs: "i",
      },
      {
        filter: "colorkey",
        options: "black:0.1:0.1",
        inputs: "1",
        outputs: "1d",
      },
      {
        filter: "overlay",
        options: "W-w-0:H-h-0",
        inputs: ["i", "1d"],
      },
    ]);
  } else {
    // command.outputOptions(`-filter_complex subtitles=${escaped(assFile)}`);
    command.complexFilter([
      {
        filter: "subtitles",
        options: `${escaped(assFile)}`,
      },
    ]);
  }
  if (["h264_nvenc", "hevc_nvenc", "av1_nvenc"].includes(ffmpegOptions.encoder)) {
    if (ffmpegOptions.decode) {
      command.inputOptions("-hwaccel cuda");
      command.inputOptions("-hwaccel_output_format cuda");
      command.inputOptions("-extra_hw_frames 10");
    }
  }
  const ffmpegParams = genFfmpegParams(ffmpegOptions);

  ffmpegParams.forEach((param) => {
    command.outputOptions(param);
  });

  const task = new FFmpegTask(
    command,
    _event.sender,
    {
      output,
      name: `压制任务:${parse(output).name}`,
    },
    {
      onEnd: async () => {
        if (options.removeOrigin) {
          if (await pathExists(videoInput)) {
            log.info("mergrAssMp4, remove video origin file", videoInput);
            await trashItem(videoInput);
          }
          if (await pathExists(assFile)) {
            log.info("mergrAssMp4, remove ass origin file", assFile);
            await trashItem(assFile);
          }
        }
        if (files.hotProgressFilePath && (await pathExists(files.hotProgressFilePath))) {
          log.info("mergrAssMp4, remove hot progress origin file", assFile);
          await fs.unlink(files.hotProgressFilePath);
        }
      },
      onError: async () => {
        if (files.hotProgressFilePath && (await pathExists(files.hotProgressFilePath))) {
          log.info("mergrAssMp4, remove hot progress origin file", assFile);
          await fs.unlink(files.hotProgressFilePath);
        }
      },
    },
  );
  taskQueue.addTask(task, true);

  return {
    taskId: task.taskId,
  };
};

export const mergeVideos = async (
  event: IpcMainInvokeEvent,
  videoFiles: File[],
  options: VideoMergeOptions = {
    savePath: "",
    removeOrigin: false,
  },
) => {
  await setFfmpegPath();

  const output = options.savePath;

  const tempDir = os.tmpdir();
  const fileTxtPath = join(tempDir, `${uuid()}.txt`);
  const fileTxtContent = videoFiles.map((videoFile) => `file '${videoFile.path}'`).join("\n");
  await fs.writeFile(fileTxtPath, fileTxtContent);

  const command = ffmpeg(fileTxtPath)
    .inputOptions("-f concat")
    .inputOptions("-safe 0")
    .videoCodec("copy")
    .audioCodec("copy")
    .output(output);

  const videoMetas = await Promise.all(videoFiles.map((file) => readVideoMeta(file.path)));
  log.debug(videoFiles);
  log.debug(videoMetas);

  let nbFrames = 0;

  for (let i = 0; i < videoMetas.length; i++) {
    const videoMeta = videoMetas[i];
    const videoStream = videoMeta.streams.find((stream) => stream.codec_type === "video");
    if (videoStream?.nb_frames !== "N/A") {
      nbFrames += Number(videoStream?.nb_frames);
    } else {
      const frameRate = Number(videoStream.avg_frame_rate?.split("/")[0]);
      const duration = videoMeta.format.duration || 0;
      nbFrames += Math.floor(frameRate * duration);
    }
  }

  const task = new FFmpegTask(
    command,
    event.sender,
    {
      output,
      name: `合并视频任务: ${videoFiles[0].name}等文件`,
    },
    {
      onProgress(progress) {
        return { ...progress, percentage: Math.round((progress.frames / nbFrames) * 100) };
      },
      onEnd: async () => {
        fs.remove(fileTxtPath);
        if (options.removeOrigin) {
          for (let i = 0; i < videoFiles.length; i++) {
            const videoInput = videoFiles[i].path;
            if (await pathExists(videoInput)) {
              log.info("mergrAssMp4, remove video origin file", videoInput);
              await trashItem(videoInput);
            }
          }
        }
      },
    },
  );

  taskQueue.addTask(task, true);
  return {
    status: "success",
    text: "添加到任务队列",
    taskId: task.taskId,
  };
};

export const handleGetTaskList = () => {
  return taskQueue.list();
};
export const handleGetTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return taskQueue.queryTask(taskId);
};

export const handleReadVideoMeta = async (_event: IpcMainInvokeEvent, input: string) => {
  return readVideoMeta(input);
};
