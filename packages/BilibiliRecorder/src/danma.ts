import { EventEmitter } from "node:events";
import { startListen, MsgHandler } from "./blive-message-listener/index.js";
import type { Comment, GiveGift, SuperChat, Guard } from "@bililive-tools/manager";

class DanmaClient extends EventEmitter {
  private client: ReturnType<typeof startListen> | null = null;
  private roomId: number;
  private auth: string | undefined;
  private uid: number | undefined;
  private retryCount: number = 10;

  constructor(roomId: number, auth: string | undefined, uid: number | undefined) {
    super();
    this.roomId = roomId;
    this.auth = auth;
    this.uid = uid;
  }

  start() {
    const handler: MsgHandler = {
      onIncomeDanmu: (msg) => {
        let content = msg.body.content;
        content = content.replace(/(^\s*)|(\s*$)/g, "").replace(/[\r\n]/g, "");
        if (content === "") return;

        const comment: Comment = {
          type: "comment",
          timestamp: msg.timestamp,
          text: content,
          color: msg.body.content_color,
          mode: msg.body.type,
          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            extra: {
              badgeName: msg.body.user.badge?.name,
              badgeLevel: msg.body.user.badge?.level,
            },
          },
        };
        this.emit("Message", comment);
      },
      onIncomeSuperChat: (msg) => {
        const content = msg.body.content.replaceAll(/[\r\n]/g, "");
        const comment: SuperChat = {
          type: "super_chat",
          timestamp: msg.timestamp,
          text: content,
          price: msg.body.price,
          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            extra: {
              badgeName: msg.body.user.badge?.name,
              badgeLevel: msg.body.user.badge?.level,
            },
          },
        };
        this.emit("Message", comment);
      },
      onGuardBuy: (msg) => {
        const gift: Guard = {
          type: "guard",
          timestamp: msg.timestamp,
          name: msg.body.gift_name,
          price: msg.body.price,
          count: 1,
          level: msg.body.guard_level,
          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            extra: {
              badgeName: msg.body.user.badge?.name,
              badgeLevel: msg.body.user.badge?.level,
            },
          },
        };
        this.emit("Message", gift);
      },
      onGift: (msg) => {
        const gift: GiveGift = {
          type: "give_gift",
          timestamp: msg.timestamp,
          name: msg.body.gift_name,
          count: msg.body.amount,
          price: msg.body.coin_type === "silver" ? 0 : msg.body.price / 1000,
          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            extra: {
              badgeName: msg.body.user.badge?.name,
              badgeLevel: msg.body.user.badge?.level,
            },
          },
          extra: {
            hits: msg.body.combo?.combo_num,
          },
        };
        this.emit("Message", gift);
      },
    };

    this.client = startListen(this.roomId, handler, {
      ws: {
        headers: {
          Cookie: this.auth ?? "",
        },
        uid: this.uid ?? 0,
      },
    });

    this.client.live.on("error", (err) => {
      this.retryCount -= 1;
      if (this.retryCount > 0) {
        setTimeout(
          () => {
            this.client && this.client.reconnect();
          },
          1000 * (10 - this.retryCount),
        );
      }
      this.emit("error", err);
    });
  }

  stop() {
    this.client?.close();
  }
}

export default DanmaClient;
