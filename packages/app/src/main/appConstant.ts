import { app } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const __dirname = dirname(fileURLToPath(import.meta.url));

const userDataPath = app.getPath("userData");

export const VIDEO_PRESET_PATH = join(userDataPath, "presets.json");

export const DANMU_PRESET_PATH = join(userDataPath, "danmu_presets.json");
export const FFMPEG_PRESET_PATH = join(userDataPath, "ffmpeg_presets.json");

export const FFMPEG_PATH = join(
  dirname(app.getPath("exe")),
  "resources",
  "app.asar.unpacked",
  "resources",
  "bin",
  "ffmpeg.exe",
);
export const FFPROBE_PATH = join(
  dirname(app.getPath("exe")),
  "resources",
  "app.asar.unpacked",
  "resources",
  "bin",
  "ffprobe.exe",
);

export const DANMUKUFACTORY_PATH = join(
  dirname(app.getPath("exe")),
  "resources",
  "app.asar.unpacked",
  "resources",
  "bin",
  "DanmakuFactory.exe",
);

export const LOG_PATH = join(app.getPath("logs"), `main.log`);
