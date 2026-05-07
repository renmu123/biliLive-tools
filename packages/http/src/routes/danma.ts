import path from "node:path";
import fs from "fs-extra";

import Router from "@koa/router";

import { mergeXml } from "@biliLive-tools/shared/task/danmu.js";
import { parseDanmu } from "@biliLive-tools/shared/danmu/index.js";
import { fileCache } from "../index.js";

const router = new Router({
  prefix: "/danma",
});

router.post("/mergeXml", async (ctx) => {
  const { inputFiles, options } = ctx.request.body as {
    inputFiles: { videoPath: string; danmakuPath: string }[];
    options: {
      output?: string;
      saveOriginPath: boolean;
      saveMeta?: boolean;
    };
  };
  await mergeXml(inputFiles, options);
  ctx.body = "OK";
});

function int2HexColor(color: number): string {
  let hex = color.toString(16);
  while (hex.length < 6) {
    hex = "0" + hex;
  }
  return `#${hex}`;
}

async function parseForArtPlayerData(filepath: string) {
  const data = await parseDanmu(filepath);
  const danmuList: {
    text: string;
    time: number;
    mode: 0 | 1 | 2;
    color: string;
    border: boolean;
    style: {};
  }[] = [];
  for (const item of data.danmu) {
    if (!item.text) continue;
    if (!item.p) continue;
    const pData = item.p.split(",");
    if (pData.length < 4) continue;

    let mode = 0;
    const rawMode = Number(pData[1]);
    if (rawMode < 4) {
      mode = 0;
    } else if (rawMode === 4) {
      mode = 2;
    } else if (rawMode === 5) {
      mode = 1;
    } else {
      continue;
    }

    danmuList.push({
      text: item.text,
      time: Number(pData[0]),
      mode: mode as 0 | 1 | 2,
      color: int2HexColor(Number(pData[3]) || 16777215),
      border: false,
      style: {},
    });
  }
  return danmuList;
}

router.get("/content/:id", async (ctx) => {
  const { id } = ctx.params;
  const file = fileCache.get(id);
  if (!file) {
    ctx.status = 404;
    ctx.body = { message: "弹幕文件不存在" };
    return;
  }
  if (!(await fs.pathExists(file.path))) {
    ctx.status = 404;
    ctx.body = { message: "弹幕文件不存在" };
    return;
  }

  const ext = path.extname(file.path).toLowerCase();
  if (ext === ".ass") {
    ctx.body = {
      danmaType: "ass",
      content: await fs.readFile(file.path, "utf-8"),
    };
    return;
  }
  if (ext === ".xml") {
    ctx.body = {
      danmaType: "xml",
      content: await parseForArtPlayerData(file.path),
    };
    return;
  }

  ctx.status = 400;
  ctx.body = { message: "不支持的弹幕格式" };
});

router.post("/parseForArtPlayer", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };
  ctx.body = await parseForArtPlayerData(filepath);
});

export default router;
