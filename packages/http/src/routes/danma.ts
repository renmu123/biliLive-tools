import Router from "@koa/router";

import { mergeXml } from "@biliLive-tools/shared/task/danmu.js";
import { parseDanmu } from "@biliLive-tools/shared/danmu/index.js";

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

router.post("/parseForArtPlayer", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };
  const data = await parseDanmu(filepath);
  const danmuList: {
    text: string; // 弹幕文本
    time: number; // 弹幕时间, 默认为当前播放器时间
    mode: 0 | 1 | 2; // 弹幕模式: 0: 滚动(默认)，1: 顶部，2: 底部
    color: string; // 弹幕颜色，默认为白色
    border: boolean; // 弹幕是否有描边, 默认为 false
    style: {}; // 弹幕自定义样式, 默认为空对象
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
  ctx.body = danmuList;
});

export default router;
