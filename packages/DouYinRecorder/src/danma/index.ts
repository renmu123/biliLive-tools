import path from "node:path";
import { parse, format } from "node:url";
import { gunzip } from "node:zlib";
import protobuf from "protobufjs";

import { getCookie } from "../douyin_api.js";
import { getUserUniqueId, getXMsStub, getSignature } from "./utils.js";

function decompressGzip(buffer) {
  return new Promise((resolve, reject) => {
    gunzip(buffer, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function buildRequestUrl(url: string): string {
  const parsedUrl = parse(url, true);
  const existingParams = parsedUrl.query;

  existingParams["aid"] = "6383";
  existingParams["device_platform"] = "web";
  existingParams["browser_language"] = "zh-CN";
  existingParams["browser_platform"] = "Win32";
  existingParams["browser_name"] = "Mozilla";
  existingParams["browser_version"] = "92.0.4515.159";

  parsedUrl.search = undefined;
  parsedUrl.query = existingParams;

  return format(parsedUrl);
}

export default class DouyinDanma {
  private static heartbeat = Buffer.from(":\x02hb");
  private static heartbeatInterval = 10;
  private headers: Record<string, string>;

  constructor() {}
  async getCookie() {
    const cookies = await getCookie();
    this.headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
      cookie: cookies,
    };
  }

  async getWsInfo(roomId: string): Promise<[string, any[]]> {
    // const userUniqueId = getUserUniqueId();
    const userUniqueId = "7877922945687137703";
    const versionCode = 180800;
    const webcastSdkVersion = "1.0.14-beta.0";

    const sigParams = {
      live_id: "1",
      aid: "6383",
      version_code: versionCode,
      webcast_sdk_version: webcastSdkVersion,
      room_id: roomId,
      sub_room_id: "",
      sub_channel_id: "",
      did_rule: "3",
      user_unique_id: userUniqueId,
      device_platform: "web",
      device_type: "",
      ac: "",
      identity: "audience",
    };

    let signature: string;
    try {
      const m = getXMsStub(sigParams);
      signature = getSignature(m); // 这里应该获取签名
      console.log("m:", m, sigParams, signature);
    } catch (e) {
      console.error("获取抖音弹幕签名失败:", e);
    }

    const webcast5Params = {
      room_id: roomId,
      compress: "gzip",
      version_code: String(versionCode),
      webcast_sdk_version: webcastSdkVersion,
      live_id: "1",
      did_rule: "3",
      user_unique_id: userUniqueId,
      identity: "audience",
      signature: signature.toString(),
    };

    const wssUrl = `wss://webcast5-ws-web-lf.douyin.com/webcast/im/push/v2/?${new URLSearchParams(webcast5Params).toString()}`;
    return [buildRequestUrl(wssUrl), []];
  }

  async decodeMsg(data: Buffer) {
    const root = await protobuf.load(
      "C:\\Users\\renmu\\Desktop\\biliLive-tools\\packages\\DouYinRecorder\\src\\danma\\dy.proto",
    );
    const PushFrame = root.lookupType("PushFrame");
    const Response = root.lookupType("Response");
    const ChatMessage = root.lookupType("ChatMessage");
    // console.log("PushFrame:", PushFrame);

    const wssPackage = PushFrame.decode(data);
    // console.log("wssPackage", wssPackage);
    const logId = wssPackage.logId;

    let decompressed;
    try {
      decompressed = await decompressGzip(wssPackage.payload);
    } catch (e) {
      console.error("解压缩失败:", e, wssPackage.payload);
      return [[], null];
    }

    const payloadPackage = Response.decode(decompressed);
    // console.log("payloadPackage", payloadPackage);

    let ack = null;
    if (payloadPackage.needAck) {
      const obj = PushFrame.create({
        // payloadType: "ack",
        logId: logId,
        payloadType: payloadPackage.internalExt,
      });
      ack = PushFrame.encode(obj).finish();
    }

    const msgs: any[] = [];
    for (const msg of payloadPackage.messagesList) {
      const now = new Date();
      let msgDict;
      if (msg.method === "WebcastChatMessage") {
        const chatMessage = ChatMessage.decode(msg.payload);
        const name = chatMessage.user.nickName;
        const content = chatMessage.content;
        msgDict = { time: now, name, content, msg_type: "danmaku", color: "ffffff" };
      } else {
        msgDict = { time: now, name: "", content: "", msg_type: "other", raw_data: msg };
      }
      msgs.push(msgDict);
    }
    return [msgs, ack];
  }
}
