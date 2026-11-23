import type { Comment, GiveGift, Message } from "@bililive-tools/manager";
import type { HuYaMessage } from "huya-danma-listener";

export function normalizeDanma(msg: HuYaMessage, saveGiftDanma = true): Message | null {
  switch (msg.type) {
    case "chat": {
      const comment: Comment = {
        type: "comment",
        timestamp: Date.now(),
        text: msg.content,
        color: msg.color,
        sender: {
          uid: msg.from.rid,
          name: msg.from.name,
        },
      };
      return comment;
    }
    case "gift": {
      if (!saveGiftDanma) return null;
      const gift: GiveGift = {
        type: "give_gift",
        timestamp: Date.now(),
        name: msg.name,
        count: msg.count,
        price: Number((msg.price / msg.count).toFixed(2)),
        sender: {
          uid: msg.from.rid,
          name: msg.from.name,
        },
      };
      return gift;
    }
  }
  return null;
}
