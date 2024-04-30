import { app } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const __dirname = dirname(fileURLToPath(import.meta.url));

const userDataPath = app.getPath("userData");
const binPath = join(
  dirname(app.getPath("exe")),
  "resources",
  "app.asar.unpacked",
  "resources",
  "bin",
);

export const VIDEO_PRESET_PATH = join(userDataPath, "presets.json");

export const DANMU_PRESET_PATH = join(userDataPath, "danmu_presets.json");
export const FFMPEG_PRESET_PATH = join(userDataPath, "ffmpeg_presets.json");
export const LOG_PATH = join(app.getPath("logs"), `main.log`);

export let FFMPEG_PATH = join(binPath, "ffmpeg.exe");
export let FFPROBE_PATH = join(binPath, "ffprobe.exe");
export let DANMUKUFACTORY_PATH = join(binPath, "DanmakuFactory.exe");

if (process.platform === "linux") {
  FFMPEG_PATH = join(binPath, "ffmpeg");
  FFPROBE_PATH = join(binPath, "ffprobe");
  DANMUKUFACTORY_PATH = join(binPath, "DanmakuFactory");
}
