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
  PrivilegeScreenChatMessage,
  ScreenChatMessage,
} from "../types/types.js";

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
  privilegeScreenChat: (message: PrivilegeScreenChatMessage) => void;
  screenChat: (message: ScreenChatMessage) => void;
  message: (message: Message) => void;
}

class DouYinDanmaClient extends TypedEmitter<Events> {
  private ws?: WebSocket;
  private roomId: string;
  private heartbeatInterval: number;
  private heartbeatTimer!: NodeJS.Timeout;
  private isHeartbeatRunning: boolean = false;
  private autoStart: boolean;
  private autoReconnect: number;
  private reconnectAttempts: number;
  private reconnectInterval: number;
  private cookie?: string;
  private timeoutInterval: number;
  private lastMessageTime: number;
  private timeoutTimer!: NodeJS.Timeout;
  private isTimeoutCheckRunning: boolean = false;
  private connectTimeout: number;
  private connectTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private connectionController?: AbortController;
  private connectionId: number = 0;
  private connecting: boolean = false;
  private stopped: boolean = false;
  private host: string;

  constructor(
    roomId: string,
    options: {
      autoStart?: boolean;
      autoReconnect?: number;
      heartbeatInterval?: number;
      reconnectInterval?: number;
      cookie?: string;
      timeoutInterval?: number;
      connectTimeout?: number;
      host?: string;
    } = {},
  ) {
    super();
    this.roomId = roomId;
    this.heartbeatInterval = options.heartbeatInterval ?? 10000;
    this.autoStart = options.autoStart ?? false;
    this.autoReconnect = options.autoReconnect ?? 10;
    this.reconnectAttempts = 0;
    this.reconnectInterval = options.reconnectInterval ?? 10000;
    this.cookie = options.cookie;
    this.timeoutInterval = options.timeoutInterval ?? 100000; // 默认100秒
    this.connectTimeout = options.connectTimeout ?? 15000;
    this.lastMessageTime = Date.now();
    this.host = options.host ?? "webcast100-ws-web-hl.douyin.com";

    if (this.autoStart) {
      this.connect();
    }
  }

  async connect() {
    if (this.connecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.stopped = false;
    this.connecting = true;
    const connectionId = ++this.connectionId;
    const controller = new AbortController();
    this.connectionController = controller;
    // Cover signature/Cookie retrieval as well as the WebSocket handshake.
    this.connectTimer = setTimeout(() => {
      this.handleConnectionError(new Error("抖音弹幕连接超时"), connectionId);
    }, this.connectTimeout);

    try {
      const url = await this.getWsInfo(this.roomId);
      if (!this.isCurrentConnection(connectionId)) return;
      if (!url) throw new Error("获取抖音弹幕签名失败");
      this.emit("init", url);
      if (!this.isCurrentConnection(connectionId)) return;
      const cookies = this.cookie || (await getCookie(controller.signal));
      if (!this.isCurrentConnection(connectionId)) return;
      const ws = new WebSocket(url, {
        headers: {
          Cookie: cookies,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
          Origin: "https://live.douyin.com",
          Referer: "https://live.douyin.com/",
        },
      });
      this.ws = ws;

      ws.on("open", () => {
        if (!this.isCurrentConnection(connectionId)) return;
        clearTimeout(this.connectTimer);
        this.connectTimer = undefined;
        this.connectionController = undefined;
        this.connecting = false;
        this.emit("open");
        if (!this.isCurrentConnection(connectionId)) return;
        this.startHeartbeat();
        this.startTimeoutCheck();
      });

      ws.on("message", (data) => {
        if (!this.isCurrentConnection(connectionId)) return;
        this.lastMessageTime = Date.now();
        void this.decode(data as Buffer, connectionId).catch((error) => {
          this.handleConnectionError(error, connectionId);
        });
      });

      ws.on("close", () => {
        if (!this.isCurrentConnection(connectionId)) return;
        this.reconnect();
        this.emit("close");
      });

      ws.on("error", (error) => {
        this.handleConnectionError(error, connectionId);
      });
    } catch (error) {
      this.handleConnectionError(error, connectionId);
    }
  }

  private isCurrentConnection(connectionId: number) {
    return !this.stopped && connectionId === this.connectionId;
  }

  private handleConnectionError(error: unknown, connectionId: number) {
    if (!this.isCurrentConnection(connectionId)) return;
    this.reconnect();
    this.emit("error", error instanceof Error ? error : new Error(String(error)));
  }

  private clearConnection() {
    // Invalidate callbacks before aborting requests or terminating the old socket.
    this.connectionId++;
    this.connecting = false;
    clearTimeout(this.connectTimer);
    this.connectTimer = undefined;
    this.connectionController?.abort();
    this.connectionController = undefined;
    this.stopHeartbeat();
    this.stopTimeoutCheck();
    const ws = this.ws;
    this.ws = undefined;
    return ws;
  }

  send(data: any) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }
    this.ws.send(data);
  }

  close() {
    this.stopped = true;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    const ws = this.clearConnection();
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      ws.once("close", () => this.emit("close"));
      if (ws.readyState === WebSocket.OPEN) ws.close();
      else ws.terminate();
    }
  }

  private startHeartbeat() {
    if (this.isHeartbeatRunning) {
      return;
    }

    this.stopHeartbeat();
    this.isHeartbeatRunning = true;

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.emit("heartbeat");
        this.send(":\x02hb");
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
    if (this.stopped || this.reconnectTimer) {
      return;
    }

    const ws = this.clearConnection();
    if (ws && ws.readyState !== WebSocket.CLOSED) ws.terminate();

    if (this.reconnectAttempts < this.autoReconnect) {
      this.reconnectAttempts++;
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = undefined;
        if (this.stopped) return;
        this.emit("reconnect", this.reconnectAttempts);
        if (!this.stopped) void this.connect();
      }, this.reconnectInterval);
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

  async handlePrivilegeScreenChatMessage(message: PrivilegeScreenChatMessage) {
    this.emit("privilegeScreenChat", message);
    this.emit("message", message);
  }

  async handleScreenChatMessage(message: ScreenChatMessage) {
    this.emit("screenChat", message);
    this.emit("message", message);
  }

  /**
   * 处理其他消息
   */
  async handleOtherMessage(message: any) {
    this.emit("message", message);
  }

  async decode(data: Buffer, connectionId = this.connectionId) {
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
    // @ts-ignore
    const PrivilegeScreenChatMessage = protobuf.douyin.PrivilegeScreenChatMessage;
    // @ts-ignore
    const ScreenChatMessage = protobuf.douyin.ScreenChatMessage;
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
      if (!this.isCurrentConnection(connectionId)) return;
      this.emit("error", e as Error);
      return;
    }

    if (!this.isCurrentConnection(connectionId)) return;

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
      if (!this.isCurrentConnection(connectionId)) break;
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
        } else if (msg.method === "WebcastPrivilegeScreenChatMessage") {
          const message = PrivilegeScreenChatMessage.decode(msg.payload);
          this.handlePrivilegeScreenChatMessage(message.toJSON() as PrivilegeScreenChatMessage);
        } else if (msg.method === "WebcastScreenChatMessage") {
          const message = ScreenChatMessage.decode(msg.payload);
          this.handleScreenChatMessage(message.toJSON() as ScreenChatMessage);
        } else {
          // WebcastRanklistHourEntranceMessage,WebcastInRoomBannerMessage,WebcastRoomStreamAdaptationMessage
        }
      } catch (e) {
        console.error("error:", e, msg);
      }
    }
    if (ack && this.isCurrentConnection(connectionId)) {
      this.send(ack);
    }
    return [msgs, ack];
  }
  async getWsInfo(roomId: string): Promise<string | undefined> {
    const userUniqueId = getUserUniqueId();
    // const userUniqueId = "7877922945687137703";
    const versionCode = 180800;
    const webcastSdkVersion = "1.0.15";

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
      app_name: "douyin_web",
      room_id: roomId,
      compress: "gzip",
      version_code: String(versionCode),
      webcast_sdk_version: webcastSdkVersion,
      update_version_code: webcastSdkVersion,
      live_id: "1",
      did_rule: "3",
      user_unique_id: userUniqueId,
      identity: "audience",
      signature: signature.toString(),
      device_platform: "web",
      cookie_enabled: "true",
      screen_width: "1920",
      screen_height: "1080",
      browser_language: "zh-CN",
      browser_platform: "Win32",
      browser_name: "Mozilla",
      browser_version:
        "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      browser_online: "true",
      tz_name: "Etc/GMT-8",
      host: "https://live.douyin.com",
      aid: "6383",
      endpoint: "live_pc",
      support_wrds: "1",
      im_path: "/webcast/im/fetch/",
      need_persist_msg_count: "15",
      heartbeatDuration: "0",
    };

    const wssUrl = `wss://${this.host}/webcast/im/push/v2/?${new URLSearchParams(webcast5Params).toString()}`;
    return wssUrl;
  }
}

export default DouYinDanmaClient;
