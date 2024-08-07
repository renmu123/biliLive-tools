import fs from "fs-extra";
import path from "node:path";
import { compile } from "ass-compiler";
import { keyBy } from "lodash-es";
import { createCanvas } from "@napi-rs/canvas";
import { parseXmlFile } from "./index.js";

import type { hotProgressOptions } from "@biliLive-tools/types";

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

async function handleAss(
  content: string,
  options = {
    interval: 30,
  },
) {
  // 解析Ass文件
  const assData = compile(content, {});

  const items = Array.from(
    groupBy(
      assData["dialogues"],
      (item) => Math.floor(item.start / options.interval) * options.interval,
    ),
  ).map(([key, items]) => {
    return {
      time: key,
      value: items.length,
    };
  });
  return items;
}

/**
 * 处理弹幕为高能弹幕所需数据格式
 */
function handleDanmu(
  danmuku: {
    "@_p": string;
  }[],
  options = {
    interval: 30,
  },
) {
  const data = danmuku.map((item) => {
    return {
      start: item["@_p"].split(",")[0],
    };
  });
  const items = Array.from(
    groupBy(data, (item) => Math.floor(item.start / options.interval) * options.interval),
  ).map(([key, items]) => {
    return {
      time: key,
      value: items.length,
    };
  });
  return items;
}

export const _generateDanmakuData = async (
  input: string,
  options: {
    interval?: number;
    duration: number;
    color?: string;
  },
) => {
  const defaultOptions = {
    interval: 30,
    color: "#f9f5f3",
  };
  const config = Object.assign(defaultOptions, options);
  let items: { time: number; value: number }[] = [];
  const ext = path.extname(input);
  if (ext === ".xml") {
    // 读取xml文件
    const { danmuku } = await parseXmlFile(input);

    items = handleDanmu(danmuku, {
      interval: config.interval,
    });
  } else if (ext === ".ass") {
    items = await handleAss(input, {
      interval: config.interval,
    });
  }

  const map = keyBy(items, "time");

  const data: { time: number; value: number; color: string }[] = [];
  for (let i = 0; i < config.duration - config.interval; i += config.interval) {
    const item = map[i];
    if (item) {
      data.push({ ...item, color: config.color });
    } else {
      data.push({
        time: i,
        value: 0,
        color: config.color,
      });
    }
  }
  return data;
};

/**
 * 处理数据为高能弹幕所需要数据结构
 */
const handleItems = (
  items: {
    time: any;
    value: any;
  }[],
  config: {
    interval: number;
    duration: number;
    color?: string;
  },
) => {
  const map = keyBy(items, "time");

  const data: { time: number; value: number; color?: string }[] = [];
  for (let i = 0; i < config.duration - config.interval; i += config.interval) {
    const item = map[i];
    if (item) {
      data.push({ ...item, color: config.color });
    } else {
      data.push({
        time: i,
        value: 0,
        color: config.color,
      });
    }
  }
  return data;
};

/**
 * 根据ass生成的高能弹幕数据
 */
export const genHotDataByAss = async (
  file: string,
  options: {
    interval: number;
    duration: number;
    color?: string;
  },
) => {
  const content = await fs.readFile(file, "utf-8");
  const items = await handleAss(content, options);
  return handleItems(items, options);
};

/**
 * 根据xml生成高能弹幕数据
 */
export const genHotDataByXml = async (
  danmuku: { "@_p": string }[],
  options: {
    interval: number;
    duration: number;
    color?: string;
  },
) => {
  const items = handleDanmu(danmuku, options);
  return handleItems(items, options);
};

export const generateDanmakuData = async (
  input: string,
  iOptions: {
    interval?: number;
    duration: number;
    color?: string;
  },
) => {
  const defaultOptions = {
    interval: 30,
    color: "#f9f5f3",
  };
  const options = Object.assign(defaultOptions, iOptions);

  const ext = path.extname(input);
  if (ext === ".xml") {
    const { danmuku } = await parseXmlFile(input);
    return genHotDataByXml(danmuku, options);
  } else if (ext === ".ass") {
    return genHotDataByAss(input, options);
  } else {
    throw new Error("not support file");
  }
};

// 生成高能弹幕图片
export const generateDanmakuImage = async (
  input: string,
  output: string,
  iOptions: WithRequired<hotProgressOptions, "duration">,
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
  for (let i = 0; i < data.length; i++) {
    data[i].color = options.fillColor;
    const canvas = drawSmoothLineChart(data, options.width, options.height);
    const outputPath = path.join(output, `${String(i).padStart(4, "0")}.png`);
    const stream = await canvas.encode("png");
    await fs.promises.writeFile(outputPath, stream);
  }
  return data;
};

// 绘制平滑曲线
function drawSmoothCurve(ctx, points) {
  const len = points.length;

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

// 绘制平滑折线图
function drawSmoothLineChart(data, width: number, height: number) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const length = data.length;
  const maxValue = Math.max(...data.map((item) => item.value));
  // const minValue = Math.min(...data.map((item) => item.value));
  const xRation = width / (length - 1);
  const yRatio = height / maxValue;

  const points: any[] = [];

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

  drawSmoothCurve(ctx, points);
  return canvas;
}

const groupBy = (arr, func) => {
  const map = new Map();
  arr.forEach((item) => {
    const key = func(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(item);
  });
  return map;
};

const uniqBy = (arr, predicate) => {
  const cb = typeof predicate === "function" ? predicate : (o) => o[predicate];

  return [
    ...arr
      .reduce((map, item) => {
        const key = item === null || item === undefined ? item : cb(item);

        map.has(key) || map.set(key, item);

        return map;
      }, new Map())
      .values(),
  ];
};

// 礼物价格计算，最后返回的是人民币价格，单位元
// <gift>，分别金瓜子和银瓜子礼物，银瓜子礼物不算入收入。金瓜子现在又成为金仓鼠，1000金仓鼠可兑换1元人民币，@_raw.total_coin 为这条总金瓜子数量
// @_raw.coin_type === "silver" 银瓜子礼物
// @_raw.coin_type === "gold" 金瓜子礼物
// <sc> @_price 为这条sc的人民币价格，换算成金瓜子需要乘1000
// <guard> @_raw.price*@_raw.num，单位金瓜子
const calculateGiftPrice = ({ gift, sc, guard }) => {
  const giftPrice = gift.reduce((acc, cur) => {
    const raw = JSON.parse(cur["@_raw"]);
    if (raw.coin_type === "gold") {
      return acc + raw.total_coin;
    }
    return acc;
  }, 0);

  const scPrice = sc.reduce((acc, cur) => {
    return acc + cur["@_price"] * 1000;
  }, 0);

  const guardPrice = guard.reduce((acc, cur) => {
    const raw = JSON.parse(cur["@_raw"]);
    return acc + raw.price * raw.num;
  }, 0);

  return (giftPrice + scPrice + guardPrice) / 1000;
};

// 生成弹幕报告
export const report = async (
  input: string,
  options: {
    top: number;
  } = {
    top: 5,
  },
) => {
  // 读取Ass文件
  const { danmuku, sc, guard, gift } = await parseXmlFile(input);

  const danmukuLength = danmuku.length;
  const scLength = sc.length;
  const guardLength = guard.length;

  const uniqMember = uniqBy([...danmuku, ...sc, ...gift, ...guard], "@_user").length;

  // danmuku根据@_user进行groupby并统计数量，并取前5名
  const danmukuGroupByUser = Array.from(groupBy(danmuku, (item) => item["@_user"])).map(
    ([key, items]) => {
      return {
        user: key,
        value: items.length,
      };
    },
  );
  danmukuGroupByUser.sort((a, b) => b.value - a.value);
  danmukuGroupByUser.splice(options.top);

  // 礼物价格根据@_user进行groupby并统计数量，并取前5名
  const priceDanmu = [
    ...sc.map((item: any) => ({ ...item, type: "sc" })),
    ...guard.map((item: any) => ({ ...item, type: "guard" })),
    ...gift.map((item: any) => ({ ...item, type: "gift" })),
  ];
  const giftGroupByUser = Array.from(groupBy(priceDanmu, (item) => item["@_user"])).map(
    ([key, items]) => {
      return {
        user: key,
        value: calculateGiftPrice({
          gift: items.filter((item: any) => item.type === "gift"),
          sc: items.filter((item: any) => item.type === "sc"),
          guard: items.filter((item: any) => item.type === "guard"),
        }),
      };
    },
  );
  giftGroupByUser.sort((a, b) => b.value - a.value);
  giftGroupByUser.splice(options.top);

  // 总流水计算
  const giftPrice = calculateGiftPrice({ sc, guard, gift });

  const report = `弹幕总数：${danmukuLength}
互动人数：${uniqMember}
sc总数：${scLength}
上船总数：${guardLength}
流水：${giftPrice}元

富哥V我50：
${giftGroupByUser.map((item) => `用户：${item.user}，流水：${item.value}元`).join("\n")}

谁是大水王：
${danmukuGroupByUser.map((item) => `用户：${item.user}，弹幕数量：${item.value}`).join("\n")}
`;

  return report;
};
