import { shell } from "electron";
import { join } from "path";
import fs from "fs";

import ffmpeg from "fluent-ffmpeg";
import { escaped, genFfmpegParams } from "./utils";
import { TaskQueue, Task } from "./task";

import type { IpcMainInvokeEvent } from "electron";
import type { File, DanmuOptions, FfmpegOptions } from "../types";

const FFMPEG_PATH = join(__dirname, "../../bin/ffmpeg.exe");
const FFPROBE_PATH = join(__dirname, "../../bin/ffprobe.exe");

const taskQueue = new TaskQueue();

const readVideoMeta = async (input: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(input, function (err, metadata) {
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

  if (!fs.existsSync(input)) {
    _event.sender.send("task-error", "文件不存在");
    return {
      status: "error",
      text: "文件不存在",
    };
  }
  if (!options.override && fs.existsSync(output)) {
    return {
      status: "error",
      text: "文件已存在",
    };
  }

  const meta = await readVideoMeta(input);
  const size = meta.format.size / 1000;
  const command = ffmpeg(input)
    .setFfmpegPath(FFMPEG_PATH)
    .setFfprobePath(FFPROBE_PATH)
    .videoCodec("copy")
    .audioCodec("copy")
    .output(output);

  const task = new Task(
    command,
    _event.sender,
    {
      output,
      size,
    },
    {
      onEnd: async () => {
        if (options.removeOrigin && fs.existsSync(input)) {
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
  console.log(options.override, fs.existsSync(output), escaped(assFile.path));

  if (!fs.existsSync(videoInput)) {
    _event.sender.send("task-error", "文件不存在");
    return;
  }
  if (!options.override && fs.existsSync(output)) {
    _event.sender.send("task-end");
    return;
  }

  const command = ffmpeg(videoInput)
    .setFfmpegPath(FFMPEG_PATH)
    .setFfprobePath(FFPROBE_PATH)
    .outputOptions(`-filter_complex subtitles=${escaped(assFile.path)}`)
    .audioCodec("copy")
    .output(output);

  const ffmpegParams = genFfmpegParams(ffmpegOptions);
  console.log(ffmpegParams, ffmpegOptions);

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
          if (fs.existsSync(videoInput)) {
            await shell.trashItem(videoInput);
          }
          if (fs.existsSync(assFile.path)) {
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
