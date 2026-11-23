import type { Comment, GiveGift, Message } from "@bililive-tools/manager";
import type DouYinDanmaClient from "douyin-danma-listener";

interface Options {
  useServerTimestamp?: boolean;
  saveGiftDanma?: boolean;
  canReceive?: () => boolean;
  captureGiftDelivery?: () => (message: GiveGift) => void;
}

/** 录制和独立订阅共用的抖音弹幕转换与礼物合并。 */
export function listenDanmaMessages(
  client: DouYinDanmaClient,
  options: Options,
  onMessage: (message: Message) => void,
) {
  const giftMessageCache = new Map<
    string,
    { gift: GiveGift; timer: NodeJS.Timeout; deliver: (message: GiveGift) => void }
  >();
  const canReceive = () => options.canReceive?.() ?? true;

  const onChat = (msg: Parameters<Parameters<typeof client.on<"chat">>[1]>[0]) => {
    if (!canReceive()) return;
    const comment: Comment = {
      type: "comment",
      timestamp:
        options.useServerTimestamp && msg.eventTime ? Number(msg.eventTime) * 1000 : Date.now(),
      text: msg.content,
      color: "#ffffff",
      sender: {
        uid: msg.user.id,
        name: msg.user.nickName,
      },
    };
    onMessage(comment);
  };

  const onPrivilegeScreenChat = (
    msg: Parameters<Parameters<typeof client.on<"privilegeScreenChat">>[1]>[0],
  ) => {
    if (!canReceive()) return;
    const comment: Comment = {
      type: "comment",
      timestamp: Date.now(),
      text: msg.content,
      color: "#e0c39c",
      sender: {
        uid: msg.user.id,
        name: msg.user.nickName,
      },
    };
    onMessage(comment);
  };

  const onScreenChat = (msg: Parameters<Parameters<typeof client.on<"screenChat">>[1]>[0]) => {
    if (!canReceive()) return;
    const comment: Comment = {
      type: "comment",
      timestamp: options.useServerTimestamp ? Number(msg.eventTime) / 1000000 : Date.now(),
      text: msg.content,
      color: "#d7f6fc",
      sender: {
        uid: msg.user.id,
        name: msg.user.nickName,
      },
    };
    onMessage(comment);
  };

  const onGift = (msg: Parameters<Parameters<typeof client.on<"gift">>[1]>[0]) => {
    if (!canReceive() || options.saveGiftDanma === false) return;
    const serverTimestamp =
      Number(msg.common.createTime) > 9999999999
        ? Number(msg.common.createTime)
        : Number(msg.common.createTime) * 1000;
    const gift: GiveGift = {
      type: "give_gift",
      timestamp: options.useServerTimestamp ? serverTimestamp : Date.now(),
      name: msg.gift.name,
      price: msg.gift.diamondCount / 10 || 0,
      count: Number(msg.totalCount ?? 1),
      color: "#ffffff",
      sender: {
        uid: msg.user.id,
        name: msg.user?.nickName || "unknown",
      },
    };

    const groupId = `${msg.groupId}_${msg.user.id}_${msg.giftId}`;
    const deliver = options.captureGiftDelivery?.() ?? onMessage;
    const existing = giftMessageCache.get(groupId);
    if (existing) clearTimeout(existing.timer);
    const timer = setTimeout(() => {
      const cachedGift = giftMessageCache.get(groupId);
      if (!cachedGift) return;
      cachedGift.deliver(cachedGift.gift);
      giftMessageCache.delete(groupId);
    }, 5000);
    giftMessageCache.set(groupId, { gift, timer, deliver });
  };

  client.on("chat", onChat);
  client.on("privilegeScreenChat", onPrivilegeScreenChat);
  client.on("screenChat", onScreenChat);
  client.on("gift", onGift);

  return {
    dispose(flushPendingGifts = false) {
      client.off("chat", onChat);
      client.off("privilegeScreenChat", onPrivilegeScreenChat);
      client.off("screenChat", onScreenChat);
      client.off("gift", onGift);
      for (const cached of giftMessageCache.values()) {
        clearTimeout(cached.timer);
        if (flushPendingGifts) cached.deliver(cached.gift);
      }
      giftMessageCache.clear();
    },
  };
}
