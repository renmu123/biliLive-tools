import { app } from "electron";
import { join } from "node:path";

export const BILIUP_COOKIE_PATH = join(app.getPath("userData"), "cookies.json");
export const UPLOAD_PRESET_PATH = join(app.getPath("userData"), "presets.json");

export const DANMU_PRESET_PATH = join(app.getPath("userData"), "danmu_presets.json");
export const FFMPEG_PRESET_PATH = join(app.getPath("userData"), "ffmpeg_presets.json");
