import { join } from "path";
import os from "os";
import fs from "fs-extra";
import ffmpeg from "fluent-ffmpeg";
import { sum } from "lodash";

import { getAppConfig } from "./config/app";
import { escaped, genFfmpegParams, pathExists, trashItem, uuid } from "./utils/index";
import log from "./utils/log";
import { taskQueue, FFmpegTask, pauseTask, resumeTask, killTask } from "./task";

import { type IpcMainInvokeEvent } from "electron";
import type { File, DanmuOptions, FfmpegOptions, VideoMergeOptions } from "../types";

export const setFfmpegPath = () => {
  const appConfig = getAppConfig();
  if (appConfig.ffmpegPath) {
    ffmpeg.setFfmpegPath(appConfig.ffmpegPath);
  }
  if (appConfig.ffprobePath) {
    ffmpeg.setFfprobePath(appConfig.ffprobePath);
  }
};

export const readVideoMeta = async (input: string): Promise<ffmpeg.FfprobeData> => {
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

export const getAvailableEncoders = async () => {
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

export const convertVideo2Mp4 = async (
  _event: IpcMainInvokeEvent,
  file: File,
  options: DanmuOptions = {
    saveRadio: 1,
    saveOriginPath: true,
    savePath: "",

    override: false,
    removeOrigin: false,
  },
) => {
  // 相同文件覆盖提示
  const { name, path, dir } = file;
  let output = join(dir, `${name}.mp4`);
  const input = path;

  if (options.saveRadio === 2 && options.savePath) {
    output = join(options.savePath, `${name}.mp4`);
  }

  if (!(await pathExists(input))) {
    log.error("convertVideo2Mp4, file not exist", input);
    _event.sender.send("task-error", "文件不存在");
    return {
      status: "error",
      text: "文件不存在",
    };
  }
  if (!options.override && (await pathExists(output))) {
    log.error("convertVideo2Mp4, 文件已存在，跳过", input);
    return {
      status: "error",
      text: "文件已存在",
    };
  }

  const command = ffmpeg(input).videoCodec("copy").audioCodec("copy").output(output);

  const videoMeta = await readVideoMeta(path);
  log.info("convertVideo2Mp4: videoMeta", videoMeta);
  // const nbFrames =
  //   Number(videoMeta.streams.find((stream) => stream.codec_type === "video")?.nb_frames) || 0;
  // const duration = Number(videoMeta.format.duration) || 0;

  const task = new FFmpegTask(
    command,
    _event.sender,
    {
      output,
    },
    {
      onProgress(progress) {
        if (progress.percent) {
          progress.percentage = progress.percent;
        }

        _event.sender.send("task-progress-update", {
          taskId: task.taskId,
          progress: progress,
        });

        return false;
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

export const mergeAssMp4 = async (
  _event: IpcMainInvokeEvent,
  videoFile: File,
  assFile: File,
  options: DanmuOptions = {
    saveRadio: 1,
    saveOriginPath: true,
    savePath: "",

    override: false,
    removeOrigin: false,
  },
  ffmpegOptions: FfmpegOptions = {
    encoder: "libx264",
  },
) => {
  // 相同文件覆盖提示
  const { name, path, dir } = videoFile;
  let output = join(dir, `${name}-弹幕版.mp4`);
  const videoInput = path;

  if (options.saveRadio === 2 && options.savePath) {
    output = join(options.savePath, `${name}-弹幕版.mp4`);
  }

  if (!(await pathExists(videoInput))) {
    log.error("mergrAssMp4, file not exist", videoInput);
    _event.sender.send("task-error", "文件不存在");
    return;
  }
  if (!options.override && (await pathExists(output))) {
    log.error("mergrAssMp4, 文件已存在，跳过", videoInput);
    _event.sender.send("task-end", { output });
    return;
  }

  const command = ffmpeg(videoInput)
    .outputOptions(`-filter_complex subtitles=${escaped(assFile.path)}`)
    .audioCodec("copy")
    .output(output);

  const ffmpegParams = genFfmpegParams(ffmpegOptions);

  ffmpegParams.forEach((param) => {
    command.outputOptions(param);
  });

  const task = new FFmpegTask(
    command,
    _event.sender,
    {
      output,
    },
    {
      onEnd: async () => {
        if (options.removeOrigin) {
          if (await pathExists(videoInput)) {
            log.info("mergrAssMp4, remove video origin file", videoInput);
            await trashItem(videoInput);
          }
          if (await pathExists(assFile.path)) {
            log.info("mergrAssMp4, remove ass origin file", assFile);
            await trashItem(assFile.path);
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

export const mergeVideos = async (
  event: IpcMainInvokeEvent,
  videoFiles: File[],
  options: VideoMergeOptions = {
    savePath: "",
    removeOrigin: false,
  },
) => {
  const output = options.savePath;

  const tempDir = os.tmpdir();
  const fileTxtPath = join(tempDir, `${uuid()}.txt`);
  const fileTxtContent = videoFiles.map((videoFile) => `file '${videoFile.path}'`).join("\n");
  await fs.writeFile(fileTxtPath, fileTxtContent);
  console.log(fileTxtPath);

  const command = ffmpeg(fileTxtPath)
    .inputOptions("-f concat")
    .inputOptions("-safe 0")
    .audioCodec("copy")
    .output(output);

  const videoMetas = await Promise.all(videoFiles.map((file) => readVideoMeta(file.path)));
  // 获取所有视频轨的nb_frames
  const nbFrames = sum(
    videoMetas.map((meta) => {
      const videoStream = meta.streams.find((stream) => stream.codec_type === "video");
      return videoStream?.nb_frames || 0;
    }),
  );

  console.log({ nbFrames });

  const task = new FFmpegTask(
    command,
    event.sender,
    {
      output,
    },
    {
      onProgress(progress) {
        event.sender.send("task-progress-update", {
          taskId: task.taskId,
          progress: { ...progress, percentage: Math.round((progress.frames / nbFrames) * 100) },
        });

        return false;
      },
      onEnd: async () => {
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

export const handlePauseTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return pauseTask(taskQueue, taskId);
};
export const handleResumeTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return resumeTask(taskQueue, taskId);
};
export const handleKillTask = (_event: IpcMainInvokeEvent, taskId: string) => {
  return killTask(taskQueue, taskId);
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
