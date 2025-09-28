import { EventEmitter } from "node:events";
import { startListen, MsgHandler } from "blive-message-listener";
import { getBuvidConf } from "./bilibili_api.js";
import type { Comment, GiveGift, SuperChat, Guard } from "@bililive-tools/manager";

// 缓存接口
interface BuvidCache {
  data: any;
  timestamp: number;
}

// 全局缓存，一天过期时间 (24 * 60 * 60 * 1000 ms)
const CACHE_DURATION = 24 * 60 * 60 * 1000;
let buvidCache: BuvidCache | null = null;

// 获取带缓存的 buvid 配置
async function getCachedBuvidConf() {
  const now = Date.now();

  // 检查缓存是否有效
  if (buvidCache && now - buvidCache.timestamp < CACHE_DURATION) {
    return buvidCache.data;
  }

  // 缓存失效或不存在，重新获取（带重试）
  const info = await getBuvidConfWithRetry();
  buvidCache = {
    data: info,
    timestamp: now,
  };

  return info;
}

// 带重试功能的 getBuvidConf
async function getBuvidConfWithRetry(maxRetries = 3, retryDelay = 1000) {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await getBuvidConf();

      return result;
    } catch (error) {
      lastError = error as Error;

      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        throw error;
      }

      // 等待指定时间后重试，使用指数退避策略
      const delay = retryDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 这里不应该到达，但为了类型安全
  throw lastError!;
}

class DanmaClient extends EventEmitter {
  private client: ReturnType<typeof startListen> | null = null;
  private roomId: number;
  private auth: string | undefined;
  private uid: number | undefined;
  private retryCount: number = 10;
  private useServerTimestamp: boolean;

  constructor(
    roomId: number,
    {
      auth,
      uid,
      useServerTimestamp,
    }: { auth: string | undefined; uid: number | undefined; useServerTimestamp?: boolean },
  ) {
    super();
    this.roomId = roomId;
    this.auth = auth;
    this.uid = uid;
    this.useServerTimestamp = useServerTimestamp ?? true;
  }

  async start() {
    const info = await getCachedBuvidConf();
    const buvid3 = info.data.b_3;
    const handler: MsgHandler = {
      onIncomeDanmu: (msg) => {
        let content = msg.body.content;
        content = content.replace(/(^\s*)|(\s*$)/g, "").replace(/[\r\n]/g, "");
        if (content === "") return;

        const comment: Comment = {
          type: "comment",
          timestamp: this.useServerTimestamp ? msg.body.timestamp : Date.now(),
          text: content,
          color: msg.body.content_color,
          mode: msg.body.type,
          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            // extra: {
            //   badgeName: msg.body.user?.badge?.name,
            //   badgeLevel: msg.body.user?.badge?.level,
            // },
          },
        };
        this.emit("Message", comment);
      },
      onIncomeSuperChat: (msg) => {
        const content = msg.body.content.replaceAll(/[\r\n]/g, "");
        const comment: SuperChat = {
          type: "super_chat",
          timestamp: this.useServerTimestamp ? msg.raw.send_time : Date.now(),
          text: content,
          price: msg.body.price,
          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            // extra: {
            //   badgeName: msg.body.user?.badge?.name,
            //   badgeLevel: msg.body.user?.badge?.level,
            // },
          },
        };
        this.emit("Message", comment);
      },
      onGuardBuy: (msg) => {
        const gift: Guard = {
          type: "guard",
          timestamp: this.useServerTimestamp ? msg.timestamp : Date.now(),
          name: msg.body.gift_name,
          price: msg.body.price,
          count: 1,
          level: msg.body.guard_level,
          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            // extra: {
            //   badgeName: msg.body.user?.badge?.name,
            //   badgeLevel: msg.body.user?.badge?.level,
            // },
          },
        };
        this.emit("Message", gift);
      },
      onGift: (msg) => {
        const gift: GiveGift = {
          type: "give_gift",
          timestamp: this.useServerTimestamp ? msg?.raw?.data?.timestamp * 1000 : Date.now(),
          name: msg.body.gift_name,
          count: msg.body.amount,
          price: msg.body.coin_type === "silver" ? 0 : msg.body.price / 1000,
          sender: {
            uid: String(msg.body.user.uid),
            name: msg.body.user.uname,
            avatar: msg.body.user.face,
            // extra: {
            //   badgeName: msg.body.user?.badge?.name,
            //   badgeLevel: msg.body.user?.badge?.level,
            // },
          },
          extra: {
            hits: msg.body.combo?.combo_num,
          },
        };
        this.emit("Message", gift);
      },
      onRoomInfoChange: (msg) => {
        this.emit("RoomInfoChange", msg);
      },
    };
    let lastAuth = "";
    if (this.auth?.includes("buvid3")) {
      lastAuth = this.auth;
    } else {
      if (this.auth) {
        lastAuth = `${this.auth}; buvid3=${buvid3}`;
      } else {
        lastAuth = `buvid3=${buvid3}`;
      }
    }

    this.client = startListen(this.roomId, handler, {
      ws: {
        headers: {
          Cookie: lastAuth,
        },
        uid: this.uid ?? 0,
      },
    });

    this.client.live.on("error", (err) => {
      this.retryCount -= 1;
      if (this.retryCount > 0) {
        setTimeout(() => {
          this.client && this.client.reconnect();
        }, 2000);
      }
      this.emit("error", err);
    });
  }

  stop() {
    this.client?.close();
  }
}

export default DanmaClient;
