// import { createHash, randomInt } from "node:crypto";
// import { URLSearchParams } from "node:url";

import axios from "axios";

import { utils } from "@bililive-tools/manager";
import { assert } from "./utils.js";

const requester = axios.create({
  timeout: 10e3,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko)",
  },
});

export async function getRoomInfo(roomIdOrShortId: string) {
  const res = await requester.get(
    `https://mp.huya.com/cache.php?m=Live&do=profileRoom&roomid=${roomIdOrShortId}`,
  );
  const html = res.data;

  assert(html, `Unexpected resp, hyPlayerConfig is null`);
  if (res.status !== 200) {
    throw new Error(`Unexpected resp, status is ${res.status}`);
  }

  const profile: CacheProfileOnData = html.data;

  const sources = {
    flv: [],
    hls: [],
  } as StreamResult;

  // const uid = await getAnonymousUid();
  for (const item of profile?.stream?.baseSteamInfoList ?? []) {
    if (item.sFlvAntiCode && item.sFlvAntiCode.length > 0) {
      // const { uid, urlQuery, seq_id, ws_time, ws_secret } = generateStreamParams({
      //   sFlvAntiCode: item.sFlvAntiCode,
      //   sStreamName: item.sStreamName,
      // });
      // console.log("uid", uid, urlQuery);
      // const url = `${item.sFlvUrl}/${item.sStreamName}.${item.sFlvUrlSuffix}?wsSecret=${ws_secret}&wsTime=${ws_time}&seqid=${seq_id}&ctype=${urlQuery.get("ctype")}&ver=1&fs=${urlQuery.get("fs")}&t=${urlQuery.get("t")}&uid=${uid}`;
      const url = `${item.sFlvUrl}/${item.sStreamName}.${item.sFlvUrlSuffix}?${item.sFlvAntiCode}`;
      sources.flv.push({
        name: item.sCdnType,
        url,
      });
    }
    if (item.sHlsAntiCode && item.sHlsAntiCode.length > 0) {
      const url = `${item.sHlsUrl}/${item.sStreamName}.${item.sHlsUrlSuffix}?${item.sHlsAntiCode}`;
      sources.flv.push({
        name: item.sCdnType,
        url,
      });
    }
  }
  const streams: { hls: StreamProfile[]; flv: StreamProfile[] } = {
    hls: profile.stream.hls.rateArray.map((info) => ({
      desc: info.sDisplayName,
      bitRate: info.iBitRate,
    })),
    flv: profile.stream.flv.rateArray.map((info) => ({
      desc: info.sDisplayName,
      bitRate: info.iBitRate,
    })),
  };

  const startTime = new Date(profile.liveData?.startTime * 1000);
  return {
    living: profile.liveStatus === "ON",
    id: profile.liveData.profileRoom,
    owner: profile.liveData.nick,
    title: profile.liveData.introduction,
    roomId: profile.liveData.profileRoom,
    avatar: profile.liveData.avatar180,
    cover: profile.liveData.screenshot,
    streams: streams.flv,
    sources: sources.flv,
    startTime,
    liveId: utils.md5(`${roomIdOrShortId}-${startTime?.getTime()}`),
  };
}

// async function getAnonymousUid() {
//   const url = "https://udblgn.huya.com/web/anonymousLogin";
//   const json = {
//     appId: 5002,
//     byPass: 3,
//     context: "",
//     version: "2.4",
//     data: {},
//   };

//   const res = await requester.post(url, json);
//   // const obj = (await resp.json()) as { data: { uid: string } };
//   console.log("uid", res.data);

//   return res.data?.data?.uid;
// }

// function newUuid() {
//   const now = new Date().getTime();
//   const rand = Math.floor(Math.random() * 1000) | 0;
//   return ((now % 10000000000) * 1000 + rand) % 4294967295;
// }

// function parseAnticode(code: string, uid: string, streamname: string) {
//   const q = {} as Record<string, [string]>;
//   for (const [k, v] of new URLSearchParams(code)) {
//     q[k] = [v];
//   }
//   q.ver = ["1"];
//   q.sv = ["2110211124"];

//   q.seqid = [String(Number.parseInt(uid) + new Date().getTime())];
//   console.log("seqid", q.seqid);

//   q.uid = [uid];
//   q.uuid = [String(newUuid())];
//   console.log("uuid", q.uuid);

//   const ss = createHash("md5").update(`${q.seqid[0]}|${q.ctype[0]}|${q.t[0]}`).digest("hex");
//   console.log("ss", ss);

//   q.fm[0] = Buffer.from(q.fm[0], "base64")
//     .toString("utf-8")
//     .replace("$0", q.uid[0])
//     .replace("$1", streamname)
//     .replace("$2", ss)
//     .replace("$3", q.wsTime[0]);

//   q.wsSecret[0] = createHash("md5").update(q.fm[0]).digest("hex");
//   console.log("wsSecret", q.wsSecret);

//   delete q.fm;
//   if ("txyp" in q) {
//     delete q.txyp;
//   }

//   const queryString = Object.entries(q)
//     .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value[0])}`)
//     .join("&");

//   return queryString;
// }

// function generateStreamParams(streamInfo: { sFlvAntiCode: string; sStreamName: string }) {
//   const urlQuery = new URLSearchParams(streamInfo.sFlvAntiCode);
//   const uid = randomInt(1400000000000, 1500000000000);
//   const ws_time = Math.floor(Date.now() / 1000 + 21600).toString(16);
//   const seq_id = Math.round(Date.now()) + uid;

//   const fmDecoded = base64Decode(decodeURIComponent(urlQuery.get("fm") || ""));
//   const ws_secret_prefix = fmDecoded.split("_")[0];

//   const ws_secret_hash = createHash("md5")
//     .update(`${seq_id}|${urlQuery.get("ctype")}|${urlQuery.get("t")}`)
//     .digest("hex");

//   const ws_secret = createHash("md5")
//     .update(`${ws_secret_prefix}_${uid}_${streamInfo.sStreamName}_${ws_secret_hash}_${ws_time}`)
//     .digest("hex");

//   return { uid, ws_time, seq_id, ws_secret, urlQuery };
// }

// function base64Decode(str: string): string {
//   return Buffer.from(str, "base64").toString("utf-8");
// }

// interface CacheProfileOffData {
//   liveStatus: "OFF";
// }

// interface CacheProfileReplayData {
//   liveStatus: "REPLAY";
// }

interface CacheProfileOnData {
  liveStatus: "ON";
  stream: {
    baseSteamInfoList: {
      sCdnType: keyof typeof cdn;
      sStreamName: string;
      sFlvUrl: string;
      sFlvAntiCode: string;
      sFlvUrlSuffix: string;
      sHlsUrl: string;
      sHlsAntiCode: string;
      sHlsUrlSuffix: string;
      newCFlvAntiCode: string;
    }[];
    hls: {
      multiLine: {
        url: string;
        cdnType: keyof typeof cdn;
        webPriorityRate: number;
        lineIndex: number;
      }[];
      rateArray: {
        sDisplayName: string;
        iBitRate: number;
        iCodecType: number;
        iCompatibleFlag: number;
        iHEVCBitRate: number;
      }[];
    };
    flv: {
      multiLine: {
        url: string;
        cdnType: keyof typeof cdn;
        webPriorityRate: number;
        lineIndex: number;
      }[];
      rateArray: {
        sDisplayName: string;
        iBitRate: number;
        iCodecType: number;
        iCompatibleFlag: number;
        iHEVCBitRate: number;
      }[];
    };
  };
  liveData: {
    startTime: number;
    profileRoom: number;
    nick: string;
    introduction: string;
    avatar180: string;
    screenshot: string;
    /** 分区：1英雄联盟，1633星秀  */
    gid: number;
  };
}

// type CacheProfileData = CacheProfileOffData | CacheProfileReplayData | CacheProfileOnData;

const cdn = {
  AL: "阿里",
  AL13: "阿里13",
  TX: "腾讯",
  HW: "华为",
  HS: "火山",
  WS: "网宿",
} as const;

interface StreamResult {
  flv: {
    name: string;
    url: string;
  }[];
  hls: {
    name: string;
    url: string;
  }[];
}

export interface StreamProfile {
  desc: string;
  bitRate: number;
}

export interface SourceProfile {
  name: string;
  url: string;
}
