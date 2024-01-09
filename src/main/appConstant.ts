import { app } from "electron";
import { join } from "node:path";

import { __dirname } from "./utils/index";

export const BILIUP_PATH = join(__dirname, "../../resources/bin/biliup.exe").replace(
  "app.asar",
  "app.asar.unpacked",
);

export const BILIUP_COOKIE_PATH = join(app.getPath("userData"), "cookies.json");
export const UPLOAD_PRESET_PATH = join(app.getPath("userData"), "presets.json");

export const DANMU_PRESET_PATH = join(app.getPath("userData"), "danmu_presets.json");
export const FFMPEG_PRESET_PATH = join(app.getPath("userData"), "ffmpeg_presets.json");
