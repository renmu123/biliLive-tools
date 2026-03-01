import fs from "fs-extra";
import readline from "node:readline";
import { XMLParser } from "fast-xml-parser";

import { parseMeta } from "../task/video.js";

import type { Danmu, SC, Gift, Guard } from "@biliLive-tools/types";

const traversalObject = (obj: any, callback: (key: string, value: any) => any) => {
  for (const key in obj) {
    if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      traversalObject(obj[key], callback);
    } else {
      callback(key, obj[key]);
    }
  }
};

async function processRawStream(inputFilePath: string) {
  const readStream = fs.createReadStream(inputFilePath, { encoding: "utf8" });

  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  let data = "";
  for await (const line of rl) {
    const newLine = line.replace(/raw=".*?"/, "");
    data += newLine + "\n";
  }
  return data;
}

/**
 * 处理xml文件
 */
export const parseXmlFile = async (input: string, parseRaw = false) => {
  let XMLdata: string;
  const stat = await fs.stat(input);

  // 如果文件大于400M，且未开启parseRaw，使用processRawStream
  if (stat.size > 400 * 1024 * 1024 && !parseRaw) {
    XMLdata = await processRawStream(input);
  } else {
    XMLdata = await fs.promises.readFile(input, "utf8");
    if (!parseRaw) {
      XMLdata = XMLdata.replace(/raw=".*?"/g, "");
    }
  }
  return parseXmlObj(XMLdata, parseRaw);
};

/**
 * 解析弹幕数据为对象
 */
export const parseXmlObj = async (XMLdata: string, parseRaw: boolean = false) => {
  const parser = new XMLParser({
    ignoreAttributes: parseRaw ? false : ["raw"],
    parseTagValue: false,
    isArray: (name) => {
      if (["d", "gift", "guard", "sc"].includes(name)) return true;
      return false;
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

export const parseMetadata = async (input: string) => {
  const data = await parseMeta({ danmaFilePath: input });
  const metadata = {
    streamer: data.username,
    room_id: data.roomId,
    live_title: data.title,
    video_start_time: data.startTimestamp,
    platform: undefined,
  };
  return metadata;
};

/**
 * 解析弹幕
 * @param input 弹幕文件路径
 * @param type 弹幕文件录制平台，解析会有所不同，如果不传则自动判断
 */
export const parseDanmu = async (input: string) => {
  const { danmuku, sc, gift, guard } = await parseXmlFile(input);
  const metadata = await parseMetadata(input);

  const parsedDanmuku = danmuku.map((item) => {
    const pArray = (item["@_p"] as string).split(",");
    const data: Danmu = {
      type: "text",

      text: item["#text"],
      user: item["@_user"],
      ts: Number(pArray[0]),
      timestamp: item["@_timestamp"] ? Number(item["@_timestamp"]) : Number(pArray[4]),
      p: item["@_p"],
    };
    return data;
  });

  const parsedSC = sc.map((item) => {
    const data: SC = {
      type: "sc",
      text: item["#text"],
      user: item["@_user"],
      ts: Number(item["@_ts"]),
      timestamp: item["@_timestamp"] ? Number(item["@_timestamp"]) : undefined,
      gift_count: 1,
      gift_price: item["@_price"],
    };
    return data;
  });

  const parsedGift = gift.map((item) => {
    const data: Gift = {
      type: "gift",
      text: "",
      user: item["@_user"],
      ts: Number(item["@_ts"]),
      timestamp: item["@_timestamp"] ? Number(item["@_timestamp"]) : undefined,
      gift_name: item["@_giftname"],
      gift_count: item["@_giftcount"],
      gift_price: item["@_price"],
    };
    return data;
  });

  const parsedGuard = guard.map((item) => {
    const data: Guard = {
      type: "guard",
      text: "",
      user: item["@_user"],
      ts: Number(item["@_ts"]),
      timestamp: item["@_timestamp"] ? Number(item["@_timestamp"]) : undefined,
      gift_name: item["@_giftname"],
      gift_count: item["@_giftcount"],
      gift_price: item["@_price"],
    };
    return data;
  });

  return { danmu: parsedDanmuku, sc: parsedSC, gift: parsedGift, guard: parsedGuard, metadata };
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
// const calculateGiftPrice = ({ gift, sc, guard }) => {
//   const giftPrice = gift.reduce((acc, cur) => {
//     const raw = JSON.parse(cur["@_raw"]);
//     if (raw.coin_type === "gold") {
//       return acc + raw.total_coin;
//     }
//     return acc;
//   }, 0);

//   const scPrice = sc.reduce((acc, cur) => {
//     return acc + cur["@_price"] * 1000;
//   }, 0);

//   const guardPrice = guard.reduce((acc, cur) => {
//     const raw = JSON.parse(cur["@_raw"]);
//     return acc + raw.price * raw.num;
//   }, 0);

//   return (giftPrice + scPrice + guardPrice) / 1000;
// };

// 生成弹幕报告
export const danmaReport = async (
  input: string,
  options: {
    top: number;
  } = {
    top: 5,
  },
) => {
  // 读取Ass文件
  const { danmuku, sc, guard, gift } = await parseXmlFile(input, true);

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
  // const priceDanmu = [
  //   ...sc.map((item: any) => ({ ...item, type: "sc" })),
  //   ...guard.map((item: any) => ({ ...item, type: "guard" })),
  //   ...gift.map((item: any) => ({ ...item, type: "gift" })),
  // ];
  // const giftGroupByUser = Array.from(groupBy(priceDanmu, (item) => item["@_user"])).map(
  //   ([key, items]) => {
  //     return {
  //       user: key,
  //       value: calculateGiftPrice({
  //         gift: items.filter((item: any) => item.type === "gift"),
  //         sc: items.filter((item: any) => item.type === "sc"),
  //         guard: items.filter((item: any) => item.type === "guard"),
  //       }),
  //     };
  //   },
  // );
  // giftGroupByUser.sort((a, b) => b.value - a.value);
  // giftGroupByUser.splice(options.top);

  // 总流水计算
  // const giftPrice = calculateGiftPrice({ sc, guard, gift });

  //   const report = `弹幕总数：${danmukuLength}
  // 互动人数：${uniqMember}
  // sc总数：${scLength}
  // 上船总数：${guardLength}
  // 流水：${giftPrice}元

  // 富哥V我50：
  // ${giftGroupByUser.map((item) => `用户：${item.user}，流水：${item.value}元`).join("\n")}

  // 谁是大水王：
  // ${danmukuGroupByUser.map((item) => `用户：${item.user}，弹幕数量：${item.value}`).join("\n")}
  // `;

  return {
    danmaNum: danmukuLength,
    uniqMember,
    scNum: scLength,
    guardNum: guardLength,
    // giftPrice,
  };
};
