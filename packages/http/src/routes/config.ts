import path from "node:path";
import fs from "fs-extra";
import JSZip from "jszip";

import Router from "koa-router";
import { appConfig, container } from "../index.js";
import { _send } from "@biliLive-tools/shared/notify.js";

import type { GlobalConfig } from "@biliLive-tools/types";
import type { VideoPreset } from "@biliLive-tools/shared";

const router = new Router({
  prefix: "/config",
});

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
  usedImageSet: Set<string>;
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
        zip.folder("cover").file(name, await fs.readFile(filePath));
      }
    }
  }

  const zip = new JSZip();
  await Promise.all([
    addToZip(opts.configPath),
    addToZip(opts.videoPresetPath),
    addToZip(opts.danmuPresetPath),
    addToZip(opts.ffmpegPresetPath),
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
      .filter(Boolean)
      .filter((cover) => !path.isAbsolute(cover));

    const usedImageSet = new Set(usedImages);

    const buffer = await exportConfig({
      configPath,
      videoPresetPath,
      danmuPresetPath,
      ffmpegPresetPath,
      coverPath,
      usedImageSet,
    });
    ctx.body = buffer;
  } catch (e) {
    console.log(e);
    ctx.status = 500;
    ctx.body = "export error";
  }
});

router.post("/notifyTest", async (ctx) => {
  const { title, desp, options } = ctx.request.body;
  await _send(title, desp, options);
  ctx.body = "success";
});

export default router;
