import { shell } from "electron";
import type { IpcMainInvokeEvent } from "electron";

import { join } from "path";
import fs from "fs";

import ffmpeg from "fluent-ffmpeg";
import type { File, DanmuOptions } from "../types";

const FFMPEG_PATH = join(__dirname, "../../bin/ffmpeg.exe");
const FFPROBE_PATH = join(__dirname, "../../bin/ffprobe.exe");

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
  console.log(options.override, fs.existsSync(output));

  if (!fs.existsSync(input)) {
    _event.sender.send("task-error", "文件不存在");
    return;
  }
  if (!options.override && fs.existsSync(output)) {
    _event.sender.send("task-end");
    return;
  }

  const meta = await readVideoMeta(input);
  const size = meta.format.size / 1000;
  const command = ffmpeg(input)
    .setFfmpegPath(FFMPEG_PATH)
    .setFfprobePath(FFPROBE_PATH)
    .videoCodec("copy")
    .audioCodec("copy");

  command.on("start", (commandLine: string) => {
    console.log("Conversion start", commandLine);
    _event.sender.send("task-start", commandLine);
  });
  command.on("end", async () => {
    console.log("Conversion ended");
    _event.sender.send("task-end", output);
    if (options.removeOrigin && fs.existsSync(input)) {
      await shell.trashItem(input);
    }
  });
  command.on("error", (err) => {
    console.log(`An error occurred: ${err.message}`);
    _event.sender.send("task-error", err);
  });
  command.on("progress", (progress) => {
    progress.percentage = Math.round((progress.targetSize / size) * 100);
    // console.log(progress);

    _event.sender.send("task-progress-update", progress);
  });

  command.save(output);
};
