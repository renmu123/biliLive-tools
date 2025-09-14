import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import JSZip from "jszip";

import Router from "koa-router";
import { appConfig, container } from "../index.js";
import multer from "../middleware/multer.js";
import { _send } from "@biliLive-tools/shared/notify.js";
import { getTempPath } from "@biliLive-tools/shared/utils/index.js";
import db, { reconnectDB } from "@biliLive-tools/shared/db/index.js";

import type { GlobalConfig } from "@biliLive-tools/types";
import type { VideoPreset } from "@biliLive-tools/shared";

const router = new Router({
  prefix: "/config",
});

const upload = multer({ dest: getTempPath() });

router.get("/", async (ctx) => {
  const config = appConfig.getAll();
  ctx.body = config;
});

router.post("/", async (ctx) => {
  const data = ctx.request.body;
  // @ts-ignore
  appConfig.setAll(data);
  ctx.body = "success";
});

router.post("/set", async (ctx) => {
  const data = ctx.request.body;
  if (!data.key || !data.value) {
    ctx.body = "key and value is required";
    return;
  }
  // @ts-ignore
  appConfig.set(data.key, data.value);
  ctx.body = "success";
});

router.post("/resetBin", async (ctx) => {
  const data = ctx.request.body;
  const type = data.type;
  if (!type) {
    ctx.body = "type is required";
    return;
  }

  const globalConfig = container.resolve<GlobalConfig>("globalConfig");

  if (type === "ffmpeg") {
    ctx.body = globalConfig.defaultFfmpegPath;
  } else if (type === "ffprobe") {
    ctx.body = globalConfig.defaultFfprobePath;
  } else if (type === "danmakuFactory") {
    ctx.body = globalConfig.defaultDanmakuFactoryPath;
  } else {
    ctx.body = "type should be ffmpeg, ffprobe or danmakuFactory";
  }
});

async function exportConfig(opts: {
  configPath: string;
  videoPresetPath: string;
  danmuPresetPath: string;
  ffmpegPresetPath: string;
  coverPath: string;
  dbPath: string;
  usedImageSet: Set<string | undefined>;
}) {
  async function addToZip(file: string) {
    if (await fs.pathExists(file)) {
      zip.file(path.parse(file).base, await fs.readFile(file));
    }
  }
  async function AddCoverToZip(dir: string) {
    if (!(await fs.pathExists(dir))) return;
    // 遍历coverPath文件夹
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) continue;

      const name = path.basename(file);
      if (!opts.usedImageSet.has(name)) continue;

      if (await fs.pathExists(filePath)) {
        zip.folder("cover")?.file(name, await fs.readFile(filePath));
      }
    }
  }

  const zip = new JSZip();
  await Promise.all([
    addToZip(opts.configPath),
    addToZip(opts.videoPresetPath),
    addToZip(opts.danmuPresetPath),
    addToZip(opts.ffmpegPresetPath),
    addToZip(opts.dbPath),
    AddCoverToZip(opts.coverPath),
  ]);

  // 生成 ZIP 文件
  const content = zip.generateNodeStream({ type: "nodebuffer" });
  return content;
}

router.get("/export", async (ctx) => {
  try {
    const globalConfig = container.resolve<GlobalConfig>("globalConfig");
    const { configPath, videoPresetPath, danmuPresetPath, ffmpegPresetPath, userDataPath } =
      globalConfig;
    const coverPath = path.join(userDataPath, "cover");

    const preset = container.resolve<VideoPreset>("videoPreset");
    const videoPresets = await preset.list();
    const usedImages = videoPresets
      .map((item) => item.config.cover)
      .filter((cover) => cover && !path.isAbsolute(cover));

    const usedImageSet = new Set(usedImages);
    const backupPath = path.join(os.tmpdir(), "biliLive-tools");
    await fs.ensureDir(backupPath);
    const dbPath = path.join(backupPath, "app.db");
    await db.backup(dbPath);

    const buffer = await exportConfig({
      configPath,
      videoPresetPath,
      danmuPresetPath,
      ffmpegPresetPath,
      coverPath,
      dbPath,
      usedImageSet,
    });
    ctx.body = buffer;
  } catch (e) {
    console.log(e);
    ctx.status = 500;
    ctx.body = "export error";
  }
});

router.post("/import", upload.single("file"), async (ctx) => {
  const file = ctx.request?.file?.path as string;
  if (!file) {
    ctx.status = 400;
    ctx.body = "No file selected";
    return;
  }

  const globalConfig = container.resolve<GlobalConfig>("globalConfig");
  const { configPath, userDataPath } = globalConfig;

  await fs.ensureDir(path.join(userDataPath, "cover"));

  const zip = new JSZip();
  const data = await zip.loadAsync(await fs.readFile(file));
  await Promise.all(
    Object.keys(data.files).map(async (filename) => {
      const file = data.files[filename];
      if (!file.dir) {
        const content = await file.async("nodebuffer");
        const filePath = path.join(userDataPath, filename);

        if (
          ["appConfig.json", "presets.json", "danmu_presets.json", "ffmpeg_presets.json"].includes(
            filename,
          )
        ) {
          // 备份文件
          if (await fs.pathExists(filePath))
            await fs.copyFile(filePath, path.join(userDataPath, `${filename}.backup`));

          await fs.writeFile(filePath, content);
          // 如果filename是 appConfig.json，那么替换掉ffmpegPath、ffprobePath、danmuFactoryPath配置
          if (filename === "appConfig.json") {
            const data = await fs.readJSON(path.join(userDataPath, `${filename}.backup`));
            const appConfig = await fs.readJSON(configPath);
            appConfig.ffmpegPath = data.ffmpegPath;
            appConfig.ffprobePath = data.ffprobePath;
            appConfig.danmuFactoryPath = data.danmuFactoryPath;
            appConfig.mesioPath = data.mesioPath;
            appConfig.webhook.recoderFolder = data.webhook.recoderFolder;
            appConfig.recorder.savePath = data.recorder.savePath;
            appConfig.losslessCutPath = data.losslessCutPath;
            await fs.writeJSON(filePath, appConfig);
          }
        } else if (filename === "app.db") {
          // 备份文件
          db.close();
          if (await fs.pathExists(filePath)) {
            await fs.move(filePath, path.join(userDataPath, `${filename}.backup`), {
              overwrite: true,
            });
          }
          await fs.writeFile(filePath, content);
          db.open();
          reconnectDB();
        } else if (filename.startsWith("cover/")) {
          await fs.writeFile(filePath, content);
        } else {
          console.log(`不支持导入的文件: ${filename}`);
        }
      }
    }),
  );

  ctx.body = "success";
});

router.post("/notifyTest", async (ctx) => {
  const { title, desp, options, notifyType } = ctx.request.body;
  await _send(title, desp, options, notifyType);
  ctx.body = "success";
});

export default router;
