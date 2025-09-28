import { app } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

export const __dirname2 = dirname(fileURLToPath(import.meta.url));

const binPath = join(
  dirname(app.getPath("exe")),
  "resources",
  "app.asar.unpacked",
  "resources",
  "bin",
);

export const LOG_PATH = join(app.getPath("logs"), `main.log`);

export const getConfigPath = async () => {
  let userDataPath = app.getPath("userData");
  let APP_CONFIG_PATH = join(userDataPath, "appConfig.json");
  let VIDEO_PRESET_PATH = join(userDataPath, "presets.json");
  let DANMU_PRESET_PATH = join(userDataPath, "danmu_presets.json");
  let FFMPEG_PRESET_PATH = join(userDataPath, "ffmpeg_presets.json");

  const portablePath = dirname(app.getPath("exe"));
  const isPortable = await fs.pathExists(join(portablePath, "portable"));
  if (isPortable) {
    APP_CONFIG_PATH = join(portablePath, "appConfig.json");
    VIDEO_PRESET_PATH = join(portablePath, "presets.json");
    DANMU_PRESET_PATH = join(portablePath, "danmu_presets.json");
    FFMPEG_PRESET_PATH = join(portablePath, "ffmpeg_presets.json");
    userDataPath = portablePath;
  }

  return {
    APP_CONFIG_PATH,
    VIDEO_PRESET_PATH,
    DANMU_PRESET_PATH,
    FFMPEG_PRESET_PATH,
    userDataPath,
    LOG_PATH,
  };
};

export let FFMPEG_PATH = join(binPath, "ffmpeg.exe");
export let FFPROBE_PATH = join(binPath, "ffprobe.exe");
export let DANMUKUFACTORY_PATH = join(binPath, "DanmakuFactory.exe");
export let MESIO_PATH = join(binPath, "mesio.exe");

if (process.platform === "linux") {
  FFMPEG_PATH = join(binPath, "ffmpeg");
  FFPROBE_PATH = join(binPath, "ffprobe");
  DANMUKUFACTORY_PATH = join(binPath, "DanmakuFactory");
  MESIO_PATH = join(binPath, "mesio");
}
