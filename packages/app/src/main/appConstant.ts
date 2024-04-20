import { app } from "electron";
import { join, dirname } from "node:path";

export const BILIUP_COOKIE_PATH = join(app.getPath("userData"), "cookies.json");
export const UPLOAD_PRESET_PATH = join(app.getPath("userData"), "presets.json");

export const DANMU_PRESET_PATH = join(app.getPath("userData"), "danmu_presets.json");
export const FFMPEG_PRESET_PATH = join(app.getPath("userData"), "ffmpeg_presets.json");

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
