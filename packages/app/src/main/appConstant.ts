import { app } from "electron";
import { join, dirname } from "node:path";

const userDataPath = app.getPath("userData");

export const BILIUP_COOKIE_PATH = join(userDataPath, "cookies.json");
export const UPLOAD_PRESET_PATH = join(userDataPath, "presets.json");

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
