import fs from "fs-extra";
import path from "node:path";
import { compile } from "ass-compiler";
import { parseXmlFile } from "./index.js";
import { createCanvas } from "@napi-rs/canvas";
import { countByIntervalInSeconds } from "../utils/index.js";

import type { HotProgressOptions } from "@biliLive-tools/types";

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type ChartPoint = {
  x: number;
  y: number;
  color: string;
};

export const genTimeData = async (input: string): Promise<number[]> => {
  const ext = path.extname(input);
  if (ext === ".xml") {
    const { danmuku } = await parseXmlFile(input);
    return danmuku.map((item) => {
      const p = item["@_p"] as string;
      return Math.floor(Number(p.split(",")[0]));
    });
  } else if (ext === ".ass") {
    const content = await fs.readFile(input, "utf-8");
    const assData = compile(content, {});
    return assData["dialogues"].map((item) => Math.floor(item.start));
  } else {
    throw new Error("not support file");
  }
};

export const generateDanmakuData = async (
  input: string,
  options: {
    interval: number;
    duration: number;
    color: string;
  },
) => {
  const data = await genTimeData(input);
  let fData = data.filter((time) => time < options.duration).sort((a, b) => a - b);
  const countData = countByIntervalInSeconds(fData, options.interval, options.duration);
  return countData.map((item) => ({
    time: item.start,
    value: item.count,
    color: options.color,
  }));
};

// 生成高能弹幕图片
export const generateDanmakuImage = async (
  input: string,
  output: string,
  iOptions: WithRequired<HotProgressOptions, "duration">,
) => {
  const defaultOptins = {
    interval: 30,
    height: 60,
    width: 1920,
    color: "#f9f5f3",
    fillColor: "#333333",
  };
  const options = Object.assign(defaultOptins, iOptions);

  const data = await generateDanmakuData(input, options);
  await fs.ensureDir(output);
  const canvas = createCanvas(options.width, options.height);
  const ctx = canvas.getContext("2d");
  const points = createChartPoints(data, options.width, options.height);

  for (let i = 0; i < data.length; i++) {
    data[i].color = options.fillColor;
    points[i].color = options.fillColor;
    ctx.clearRect(0, 0, options.width, options.height);
    drawSmoothCurve(ctx, points);
    const outputPath = path.join(output, `${String(i).padStart(4, "0")}.png`);
    const png = await canvas.encode("png");
    await fs.promises.writeFile(outputPath, png);
  }
  return data;
};

// 绘制平滑曲线
function drawSmoothCurve(ctx, points: ChartPoint[]) {
  const len = points.length;
  if (len < 2) return;

  let lastX = points[0].x;
  let lastY = points[0].y;
  for (let i = 1; i < len - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);

    ctx.strokeStyle = points[i].color;
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;

    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    lastX = xc;
    lastY = yc;
    ctx.stroke();
  }
}

// 计算平滑折线图坐标。所有帧共用坐标，避免重复创建大量临时对象。
function createChartPoints(data, width: number, height: number): ChartPoint[] {
  const length = data.length;
  const maxValue = Math.max(...data.map((item) => item.value));
  const xRation = width / (length - 1);
  const yRatio = height / maxValue;

  const points: ChartPoint[] = [];

  // 计算数据点的坐标
  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    const x = i * xRation;
    const y = height - item.value * yRatio;
    points.push({
      x: x,
      y: y,
      color: item.color ?? "#333333",
    });
  }

  return points;
}
