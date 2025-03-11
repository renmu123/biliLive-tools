import WebSocket from "ws";
import EventEmitter from "events";
import DouyinDanma from "./index.js";
import to_arraybuffer from "to-arraybuffer";

import { getCookie } from "../douyin_api.js";

class WebSocketClient extends EventEmitter {
  private ws: WebSocket;
  private roomId: string;
  private url: string;
  private heartbeatInterval: number;
  private heartbeatTimer: NodeJS.Timeout;

  constructor(roomId: string) {
    super();
    this.roomId = roomId;
    this.heartbeatInterval = 5000;
  }

  async connect() {
    const utils = new DouyinDanma();
    const [url] = await utils.getWsInfo(this.roomId);
    console.log("ws url:", url);
    this.url = url;
    const cookies = await getCookie();
    this.ws = new WebSocket(this.url, {
      headers: {
        Cookie: cookies,
      },
    });
    console.log("ws:", cookies);

    this.ws.on("open", () => {
      this.emit("open");
      this.startHeartbeat();
    });

    this.ws.on("message", (data) => {
      this.handleRawData(data as Buffer);
    });

    this.ws.on("close", () => {
      this.emit("close");
      this.stopHeartbeat();
    });

    this.ws.on("error", (error) => {
      this.emit("error", error);
      this.stopHeartbeat();
    });
  }

  async handleRawData(data: Buffer) {
    const utils = new DouyinDanma();
    const msg = await utils.decodeMsg(data);
    console.log("msg11:", msg);
    // this.emit("message", json);
  }

  send(data: any) {
    this.ws.send(data);
  }

  close() {
    this.ws.close();
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send(":\x02hb");
    }, this.heartbeatInterval);
  }

  private stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
  }
}

export default WebSocketClient;
