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
  init: (url: string) => void;
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
  private ws!: WebSocket;
  private roomId: string;
  private heartbeatInterval: number;
  private heartbeatTimer!: NodeJS.Timeout;
  private isHeartbeatRunning: boolean = false;
  private autoStart: boolean;
  private autoReconnect: number;
  private reconnectAttempts: number;
  private cookie?: string;
  private timeoutInterval: number;
  private lastMessageTime: number;
  private timeoutTimer!: NodeJS.Timeout;
  private isTimeoutCheckRunning: boolean = false;

  constructor(
    roomId: string,
    options: {
      autoStart?: boolean;
      autoReconnect?: number;
      heartbeatInterval?: number;
      cookie?: string;
      timeoutInterval?: number;
    } = {},
  ) {
    super();
    this.roomId = roomId;
    this.heartbeatInterval = options.heartbeatInterval ?? 10000;
    this.autoStart = options.autoStart ?? false;
    this.autoReconnect = options.autoReconnect ?? 10;
    this.reconnectAttempts = 0;
    this.cookie = options.cookie;
    this.timeoutInterval = options.timeoutInterval ?? 100000; // 默认100秒
    this.lastMessageTime = Date.now();

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
    this.emit("init", url);
    const cookies = this.cookie || (await getCookie());
    this.ws = new WebSocket(url, {
      headers: {
        Cookie: cookies,
      },
    });

    this.ws.on("open", () => {
      this.emit("open");
      this.startHeartbeat();
      this.startTimeoutCheck();
    });

    this.ws.on("message", (data) => {
      this.lastMessageTime = Date.now();
      this.decode(data as Buffer);
    });

    this.ws.on("close", () => {
      this.emit("close");
      this.reconnect();
    });

    this.ws.on("error", (error) => {
      this.emit("error", error);
      this.reconnect();
    });
  }

  send(data: any) {
    if (!this.ws) {
      return;
    }
    this.ws.send(data);
  }

  close() {
    if (!this.ws) {
      return;
    }
    this.reconnectAttempts = this.autoReconnect;
    this.stopHeartbeat();
    this.stopTimeoutCheck();

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  private startHeartbeat() {
    if (this.isHeartbeatRunning) {
      return;
    }

    this.stopHeartbeat();
    this.isHeartbeatRunning = true;

    this.heartbeatTimer = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.emit("heartbeat");
        this.send(":\x02hb");
      } else {
        console.log("连接未就绪，当前状态:", this.ws.readyState);
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.isHeartbeatRunning = false;
    }
  }

  private startTimeoutCheck() {
    if (this.isTimeoutCheckRunning) {
      return;
    }

    this.stopTimeoutCheck();
    this.isTimeoutCheckRunning = true;

    // 重置最后消息时间，给连接一些初始化时间
    this.lastMessageTime = Date.now();
    this.timeoutTimer = setInterval(() => {
      const now = Date.now();
      if (now - this.lastMessageTime > this.timeoutInterval) {
        console.log("No message received for too long, reconnecting...");
        // 在重连前重置时间，避免立即触发下一次重连
        this.lastMessageTime = now;
        this.reconnect();
      }
    }, 1000);
  }

  private stopTimeoutCheck() {
    if (this.timeoutTimer) {
      clearInterval(this.timeoutTimer);
      this.isTimeoutCheckRunning = false;
    }
  }

  private reconnect() {
    this.stopHeartbeat();
    this.stopTimeoutCheck();
    if (this.reconnectAttempts < this.autoReconnect) {
      this.reconnectAttempts++;
      this.connect();
      this.emit("reconnect", this.reconnectAttempts);
    }
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
    // @ts-ignore
    const PushFrame = protobuf.douyin.PushFrame;
    // @ts-ignore
    const Response = protobuf.douyin.Response;
    // @ts-ignore
    const ChatMessage = protobuf.douyin.ChatMessage;
    // @ts-ignore
    const RoomUserSeqMessage = protobuf.douyin.RoomUserSeqMessage;
    // @ts-ignore
    const MemberMessage = protobuf.douyin.MemberMessage;
    // @ts-ignore
    const GiftMessage = protobuf.douyin.GiftMessage;
    // @ts-ignore
    const LikeMessage = protobuf.douyin.LikeMessage;
    // @ts-ignore
    const SocialMessage = protobuf.douyin.SocialMessage;
    // @ts-ignore
    const RoomStatsMessage = protobuf.douyin.RoomStatsMessage;
    // @ts-ignore
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
      this.emit("error", e as Error);
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
