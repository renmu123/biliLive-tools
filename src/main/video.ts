import { shell } from "electron";
import { join } from "path";

import { getAppConfig } from "./config/app";
import ffmpeg from "fluent-ffmpeg";
import { escaped, genFfmpegParams, pathExists } from "./utils/index";
import log from "./utils/log";
import { TaskQueue, Task, pauseTask, resumeTask, killTask } from "./task";

import type { IpcMainInvokeEvent } from "electron";
import type { File, DanmuOptions, FfmpegOptions } from "../types";

export const setFfmpegPath = () => {
  const appConfig = getAppConfig();
  if (appConfig.ffmpegPath) {
    ffmpeg.setFfmpegPath(appConfig.ffmpegPath);
  }
  if (appConfig.ffprobePath) {
    ffmpeg.setFfprobePath(appConfig.ffprobePath);
  }
};

const taskQueue = new TaskQueue();

const readVideoMeta = async (input: string): Promise<any> => {
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

  const meta = await readVideoMeta(input);
  const size = meta.format.size / 1000;
  const command = ffmpeg(input).videoCodec("copy").audioCodec("copy").output(output);

  const task = new Task(
    command,
    _event.sender,
    {
      output,
      size,
    },
    {
      onEnd: async () => {
        if (options.removeOrigin && (await pathExists(input))) {
          log.info("convertVideo2Mp4, remove origin file", input);
          await shell.trashItem(input);
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
    _event.sender.send("task-end");
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

  const task = new Task(
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
            await shell.trashItem(videoInput);
          }
          if (await pathExists(assFile.path)) {
            log.info("mergrAssMp4, remove ass origin file", assFile);
            await shell.trashItem(assFile.path);
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
