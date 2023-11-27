import { app } from "electron";
import { join } from "path";

export const BILIUP_PATH = join(__dirname, "../../resources/bin/biliup.exe").replace(
  "app.asar",
  "app.asar.unpacked",
);

export const BILIUP_COOKIE_PATH = join(app.getPath("userData"), "cookies.json");
export const UPLOAD_PRESET_PATH = join(app.getPath("userData"), "presets.json");

export const DANMU_PRESET_PATH = join(app.getPath("userData"), "danmu_presets.json");
