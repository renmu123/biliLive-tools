import { app } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

export const __dirname2 = dirname(fileURLToPath(import.meta.url));

export const getConfigPath = async () => {
  const binPath = join(
    dirname(app.getPath("exe")),
    "resources",
    "app.asar.unpacked",
    "resources",
    "bin",
  );

  let userDataPath = app.getPath("userData");
  let APP_CONFIG_PATH = join(userDataPath, "appConfig.json");
  let VIDEO_PRESET_PATH = join(userDataPath, "presets.json");
  let DANMU_PRESET_PATH = join(userDataPath, "danmu_presets.json");
  let FFMPEG_PRESET_PATH = join(userDataPath, "ffmpeg_presets.json");
  const LOG_PATH = join(app.getPath("logs"), `main.log`);

  const portablePath = dirname(app.getPath("exe"));
  const isPortable = await fs.pathExists(join(portablePath, "portable"));
  if (isPortable) {
    APP_CONFIG_PATH = join(portablePath, "appConfig.json");
    VIDEO_PRESET_PATH = join(portablePath, "presets.json");
    DANMU_PRESET_PATH = join(portablePath, "danmu_presets.json");
    FFMPEG_PRESET_PATH = join(portablePath, "ffmpeg_presets.json");
    userDataPath = portablePath;
  }

  // 二进制依赖
  let FFMPEG_PATH = join(binPath, "ffmpeg.exe");
  let FFPROBE_PATH = join(binPath, "ffprobe.exe");
  let DANMUKUFACTORY_PATH = join(binPath, "DanmakuFactory.exe");
  let MESIO_PATH = join(binPath, "mesio.exe");
  let BILILIVERECORDER_PATH = join(binPath, "BililiveRecorder.Cli.exe");
  let AUDIOWAVEFORM_PATH = join(binPath, "audiowaveform.exe");
  if (process.platform === "linux") {
    FFMPEG_PATH = join(binPath, "ffmpeg");
    FFPROBE_PATH = join(binPath, "ffprobe");
    DANMUKUFACTORY_PATH = join(binPath, "DanmakuFactory");
    MESIO_PATH = join(binPath, "mesio");
    BILILIVERECORDER_PATH = join(binPath, "BililiveRecorder.Cli");
    AUDIOWAVEFORM_PATH = join(binPath, "audiowaveform");
  }

  return {
    APP_CONFIG_PATH,
    VIDEO_PRESET_PATH,
    DANMU_PRESET_PATH,
    FFMPEG_PRESET_PATH,
    userDataPath,
    LOG_PATH,
    FFMPEG_PATH,
    FFPROBE_PATH,
    DANMUKUFACTORY_PATH,
    MESIO_PATH,
    BILILIVERECORDER_PATH,
    AUDIOWAVEFORM_PATH,
  };
};
