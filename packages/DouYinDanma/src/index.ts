import { parse, format } from "node:url";
import WebSocket from "ws";
import { TypedEmitter } from "tiny-typed-emitter";

import { decompressGzip, getXMsStub, getSignature, getUserUniqueId } from "./utils.js";
import protobuf from "./proto.js";
import { getCookie } from "./api.js";

import type {
  ChatMessage,
  MemberMessage,
  LikeMessage,
  SocialMessage,
  GiftMessage,
  RoomUserSeqMessage,
  RoomStatsMessage,
  RoomRankMessage,
  Message,
} from "../types/types.js";

function buildRequestUrl(url: string): string {
  const parsedUrl = parse(url, true);
  const existingParams = parsedUrl.query;

  existingParams["aid"] = "6383";
  existingParams["device_platform"] = "web";
  existingParams["browser_language"] = "zh-CN";
  existingParams["browser_platform"] = "Win32";
  existingParams["browser_name"] = "Mozilla";
  existingParams["browser_version"] = "92.0.4515.159";

  parsedUrl.search = null;
  parsedUrl.query = existingParams;

  return format(parsedUrl);
}

interface Events {
  open: () => void;
  close: () => void;
  reconnect: (count: number) => void;
  heartbeat: () => void;
  error: (error: Error) => void;
  chat: (message: ChatMessage) => void;
  member: (message: MemberMessage) => void;
  like: (message: LikeMessage) => void;
  social: (message: SocialMessage) => void;
  gift: (message: GiftMessage) => void;
  roomUserSeq: (message: RoomUserSeqMessage) => void;
  roomStats: (message: RoomStatsMessage) => void;
  roomRank: (message: RoomRankMessage) => void;
  message: (message: Message) => void;
}

class DouYinDanmaClient extends TypedEmitter<Events> {
  private ws: WebSocket;
  private roomId: string;
  private url: string;
  private heartbeatInterval: number;
  private heartbeatTimer: NodeJS.Timeout;
  private autoStart: boolean;
  private autoReconnect: number;
  private reconnectAttempts: number;

  constructor(
    roomId: string,
    options: { autoStart?: boolean; autoReconnect?: number; heartbeatInterval?: number } = {},
  ) {
    super();
    this.roomId = roomId;
    this.heartbeatInterval = options.heartbeatInterval ?? 5000;
    this.autoStart = options.autoStart ?? false;
    this.autoReconnect = options.autoReconnect ?? 3;
    this.reconnectAttempts = 0;

    if (this.autoStart) {
      this.connect();
    }
  }

  async connect() {
    const url = await this.getWsInfo(this.roomId);
    if (!url) {
      this.emit("error", new Error("获取抖音弹幕签名失败"));
      return;
    }
    this.url = url;
    const cookies = await getCookie();
    this.ws = new WebSocket(this.url, {
      headers: {
        Cookie: cookies,
      },
    });

    this.ws.on("open", () => {
      this.emit("open");
      this.startHeartbeat();
    });

    this.ws.on("message", (data) => {
      this.decode(data as Buffer);
    });

    this.ws.on("close", () => {
      this.emit("close");
      this.stopHeartbeat();
      if (this.reconnectAttempts < this.autoReconnect) {
        this.reconnectAttempts++;
        this.connect();
        this.emit("reconnect", this.reconnectAttempts);
      }
    });

    this.ws.on("error", (error) => {
      this.emit("error", error);
      this.stopHeartbeat();
      if (this.reconnectAttempts < this.autoReconnect) {
        this.reconnectAttempts++;
        this.connect();
        this.emit("reconnect", this.reconnectAttempts);
      }
    });
  }

  send(data: any) {
    this.ws.send(data);
  }

  close() {
    this.reconnectAttempts = this.autoReconnect;
    this.ws.close();
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.emit("heartbeat");
      this.send(":\x02hb");
    }, this.heartbeatInterval);
  }

  private stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
  }

  async handleMessage() {}

  /**
   * 处理弹幕消息
   */
  async handleChatMessage(chatMessage: ChatMessage) {
    this.emit("chat", chatMessage);
    this.emit("message", chatMessage);
  }

  /**
   * 处理进入房间
   */
  async handleEnterRoomMessage(message: MemberMessage) {
    this.emit("member", message);
    this.emit("message", message);
  }

  /**
   * 处理礼物消息
   */
  async handleGiftMessage(message: GiftMessage) {
    this.emit("gift", message);
    this.emit("message", message);
  }

  /**
   * 处理点赞消息
   */
  async handleLikeMessage(message: LikeMessage) {
    this.emit("like", message);
    this.emit("message", message);
  }

  /**
   * 处理social消息
   */
  async handleSocialMessage(message: SocialMessage) {
    this.emit("social", message);
    this.emit("message", message);
  }

  /**
   * 处理RoomUserSeqMessage
   */
  async handleRoomUserSeqMessage(message: RoomUserSeqMessage) {
    this.emit("roomUserSeq", message);
    this.emit("message", message);
  }

  /**
   * 处理 WebcastRoomStatsMessage
   */
  async handleRoomStatsMessage(message: RoomStatsMessage) {
    this.emit("roomStats", message);
    this.emit("message", message);
  }

  /**
   * 处理 WebcastRoomRankMessage
   */
  async handleRoomRankMessage(message: RoomRankMessage) {
    this.emit("roomRank", message);
    this.emit("message", message);
  }

  /**
   * 处理其他消息
   */
  async handleOtherMessage(message: any) {
    this.emit("message", message);
  }

  async decode(data: Buffer) {
    const PushFrame = protobuf.douyin.PushFrame;
    const Response = protobuf.douyin.Response;
    const ChatMessage = protobuf.douyin.ChatMessage;
    const RoomUserSeqMessage = protobuf.douyin.RoomUserSeqMessage;
    const MemberMessage = protobuf.douyin.MemberMessage;
    const GiftMessage = protobuf.douyin.GiftMessage;
    const LikeMessage = protobuf.douyin.LikeMessage;
    const SocialMessage = protobuf.douyin.SocialMessage;
    const RoomStatsMessage = protobuf.douyin.RoomStatsMessage;
    const RoomRankMessage = protobuf.douyin.RoomRankMessage;
    const wssPackage = PushFrame.decode(data);

    // @ts-ignore
    const logId = wssPackage.logId;

    let decompressed;
    try {
      // @ts-ignore
      if (wssPackage.payload instanceof Buffer) {
        // @ts-ignore
        decompressed = await decompressGzip(wssPackage.payload);
      } else {
        return;
      }
    } catch (e) {
      this.emit("error", e);
      return;
    }

    const payloadPackage = Response.decode(decompressed);

    let ack = null;
    // @ts-ignore
    if (payloadPackage.needAck) {
      const obj = PushFrame.create({
        logId: logId,
        // @ts-ignore
        payloadType: payloadPackage.internalExt,
      });
      ack = PushFrame.encode(obj).finish();
    }

    const msgs: any[] = [];
    // @ts-ignore
    for (const msg of payloadPackage.messagesList) {
      // const now = new Date();
      try {
        if (msg.method === "WebcastChatMessage") {
          const chatMessage = ChatMessage.decode(msg.payload);
          this.handleChatMessage(chatMessage.toJSON() as ChatMessage);
        } else if (msg.method === "WebcastMemberMessage") {
          const memberMessage = MemberMessage.decode(msg.payload);
          this.handleEnterRoomMessage(memberMessage.toJSON() as MemberMessage);
        } else if (msg.method === "WebcastGiftMessage") {
          const giftMessage = GiftMessage.decode(msg.payload);
          this.handleGiftMessage(giftMessage.toJSON() as GiftMessage);
        } else if (msg.method === "WebcastLikeMessage") {
          const message = LikeMessage.decode(msg.payload);
          this.handleLikeMessage(message.toJSON() as LikeMessage);
        } else if (msg.method === "WebcastSocialMessage") {
          const message = SocialMessage.decode(msg.payload);
          this.handleSocialMessage(message.toJSON() as SocialMessage);
        } else if (msg.method === "WebcastRoomUserSeqMessage") {
          const message = RoomUserSeqMessage.decode(msg.payload);
          this.handleRoomUserSeqMessage(message.toJSON() as RoomUserSeqMessage);
        } else if (msg.method === "WebcastRoomStatsMessage") {
          const message = RoomStatsMessage.decode(msg.payload);
          this.handleRoomStatsMessage(message.toJSON() as RoomStatsMessage);
        } else if (msg.method === "WebcastRoomRankMessage") {
          const message = RoomRankMessage.decode(msg.payload);
          this.handleRoomRankMessage(message.toJSON() as RoomRankMessage);
        } else {
          // WebcastRanklistHourEntranceMessage,WebcastInRoomBannerMessage,WebcastRoomStreamAdaptationMessage
        }
      } catch (e) {
        console.error("error:", e, msg);
      }
    }
    if (ack) {
      this.send(ack);
    }
    return [msgs, ack];
  }
  async getWsInfo(roomId: string): Promise<string | undefined> {
    const userUniqueId = getUserUniqueId();
    // const userUniqueId = "7877922945687137703";
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
    } catch (e) {
      return;
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
    return buildRequestUrl(wssUrl);
  }
}

export default DouYinDanmaClient;
