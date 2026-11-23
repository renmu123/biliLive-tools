import type { Comment, GiveGift, Message, SuperChat } from "@bililive-tools/manager";
import type { Message as DYMessage } from "./dy_client/index.js";
import { colorTab, giftMap } from "./danma.js";

interface NormalizeDanmaOptions {
  useServerTimestamp?: boolean;
  saveGiftDanma?: boolean;
  saveSCDanma?: boolean;
}

/** 将斗鱼协议消息转换为录制器和外部订阅共用的消息格式。 */
export function normalizeDanma(
  msg: DYMessage,
  options: NormalizeDanmaOptions = {},
): Message | null {
  switch (msg.type) {
    case "chatmsg": {
      const comment: Comment = {
        type: "comment",
        timestamp: options.useServerTimestamp && msg.cst ? Number(msg.cst) : Date.now(),
        text: msg.txt,
        color: colorTab[String(msg.col)] ?? "#ffffff",
        sender: {
          uid: msg.uid,
          name: msg.nn,
          avatar: msg.ic,
          extra: { level: msg.level },
        },
      };
      return comment;
    }
    case "dgb": {
      if (options.saveGiftDanma === false) return null;
      const gift: GiveGift = {
        type: "give_gift",
        timestamp: Date.now(),
        name: giftMap[msg.gfid]?.name ?? msg.gfn,
        price: (giftMap[msg.gfid]?.pc ?? 0) / 100,
        count: Number(msg.gfcnt),
        color: "#ffffff",
        sender: {
          uid: msg.uid,
          name: msg.nn,
          avatar: msg.ic,
          extra: { level: msg.level },
        },
        extra: { hits: Number(msg.hits) },
      };
      return gift;
    }
    case "odfbc":
    case "rndfbc": {
      if (options.saveGiftDanma === false) return null;
      const gift: GiveGift = {
        type: "give_gift",
        timestamp: Date.now(),
        name: "钻粉",
        price: Number(msg.price) / 100,
        count: 1,
        color: "#ffffff",
        sender: { uid: msg.uid, name: msg.nick },
      };
      return gift;
    }
    case "comm_chatmsg": {
      if (options.saveSCDanma === false || msg.btype !== "voiceDanmu") return null;
      const comment: SuperChat = {
        type: "super_chat",
        timestamp: Date.now(),
        text: msg.chatmsg?.txt,
        price: Number(msg.cprice) / 100,
        sender: {
          uid: msg.uid,
          name: msg.chatmsg?.nn,
          avatar: msg.chatmsg?.ic,
          extra: { level: msg.chatmsg?.level },
        },
      };
      return comment;
    }
  }
  return null;
}
