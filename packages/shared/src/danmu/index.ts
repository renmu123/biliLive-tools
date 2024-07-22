import fs from "fs-extra";
import path from "node:path";
import { ChildProcess, exec } from "node:child_process";

import { createCanvas } from "@napi-rs/canvas";
import { compile } from "ass-compiler";

import { keyBy } from "lodash-es";
import { pathExists } from "../utils/index.js";
import log from "../utils/log.js";
import { XMLParser } from "fast-xml-parser";
import { DANMU_DEAFULT_CONFIG } from "../presets/danmuPreset.js";

import type { DanmuConfig, hotProgressOptions } from "@biliLive-tools/types";

export class Danmu {
  execPath: string;
  command?: string;
  child?: ChildProcess;
  constructor(execPath: string) {
    this.execPath = execPath;
  }

  genDanmuArgs = (config: DanmuConfig) => {
    const params = Object.entries(config).map(([key, value]) => {
      // 如果配置字段不在默认中，则直接返回，用于处理版本回退可能导致的问题
      if (!Object.hasOwn(DANMU_DEAFULT_CONFIG, key)) return "";

      if (["resolution", "msgboxsize", "msgboxpos"].includes(key)) {
        // @ts-ignore
        return `--${key} ${value.join("x")}`;
      } else if (key === "blockmode") {
        // @ts-ignore
        if (value.length === 0) return `--${key} null`;
        // @ts-ignore
        return `--${key} ${value.join("-")}`;
      } else if (key === "statmode") {
        // @ts-ignore
        if (value.length === 0) return ``;
        // @ts-ignore
        return `--${key} ${value.join("-")}`;
      } else if (key === "fontname") {
        return `--${key} "${value}"`;
      } else if (["resolutionResponsive", "customDensity", "opacity"].includes(key)) {
        // do nothing
        return "";
      } else if (key === "blacklist") {
        if (value) return `--${key} ${value}`;
        return "";
      } else if (key === "density") {
        if (value === -2) return `--density ${config.customDensity}`;
        return `--${key} ${value}`;
      } else if (key === "opacity100") {
        const value = ((config.opacity100 / 100) * 255).toFixed(0);
        return `--opacity ${value}`;
      } else {
        return `--${key} ${value}`;
      }
    });

    return params.filter((item) => item !== "");
  };

  convertXml2Ass = async (input: string, output: string, argsObj: DanmuConfig) => {
    if (!(await pathExists(input))) {
      throw new Error("input not exists");
    }

    const requiredArgs = [`-i "${input}"`, `-o "${output}"`, "--ignore-warnings"];
    const args = this.genDanmuArgs(argsObj);
    const command = `"${this.execPath}" ${requiredArgs.join(" ")} ${args.join(" ")}`;
    log.info("danmakufactory command: ", command);
    this.command = command;

    return new Promise((resolve, reject) => {
      const child = exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
      this.child = child;
    });
  };
}

const traversalObject = (obj: any, callback: (key: string, value: any) => any) => {
  for (const key in obj) {
    if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      traversalObject(obj[key], callback);
    } else {
      callback(key, obj[key]);
    }
  }
};

/**
 * 处理xml文件
 */
const parseXmlFile = async (input: string) => {
  const XMLdata = await fs.promises.readFile(input, "utf8");
  return parseXmlObj(XMLdata);
};

/**
 * 解析弹幕数据为对象
 */
export const parseXmlObj = async (XMLdata: string) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => {
      if (["d", "gift", "guard", "sc"].includes(name)) return true;
    },
  });
  const jObj = parser.parse(XMLdata);

  let danmuku = [];
  let sc = [];
  let guard = [];
  let gift = [];

  traversalObject(jObj, (key, value) => {
    if (key === "d") {
      danmuku = value;
    } else if (key === "sc") {
      sc = value;
    } else if (key === "guard") {
      guard = value;
    } else if (key === "gift") {
      gift = value;
    }
  });

  return { jObj, danmuku, sc, guard, gift };
};

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
    ...sc.map((item) => ({ ...item, type: "sc" })),
    ...guard.map((item) => ({ ...item, type: "guard" })),
    ...gift.map((item) => ({ ...item, type: "gift" })),
  ];
  const giftGroupByUser = Array.from(groupBy(priceDanmu, (item) => item["@_user"])).map(
    ([key, items]) => {
      return {
        user: key,
        value: calculateGiftPrice({
          gift: items.filter((item) => item.type === "gift"),
          sc: items.filter((item) => item.type === "sc"),
          guard: items.filter((item) => item.type === "guard"),
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

async function handleAss(
  input: string,
  options = {
    interval: 30,
  },
) {
  // 读取Ass文件
  const assContent = await fs.readFile(input, "utf8");
  // 解析Ass文件
  const assData = compile(assContent, {});

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
export function handleDanmu(
  danmuku: any[],
  options = {
    interval: 30,
  },
) {
  const data = danmuku.map((item) => {
    return {
      start: item["@_p"].split(",")[0],
      text: item["#text"],
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

export const generateDanmakuData = async (
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

// 生成高能弹幕图片
export const generateDanmakuImage = async (
  input: string,
  output: string,
  iOptions: hotProgressOptions,
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
};
