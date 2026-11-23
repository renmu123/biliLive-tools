import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getInfo } from "../src/stream.js";
import { provider } from "../src/index.js";
import { listenDanmaMessages } from "../src/danmaMessages.js";

const mockState = vi.hoisted(() => ({ clients: [] as any[] }));

vi.mock("../src/stream.js", () => ({ getInfo: vi.fn(), getStream: vi.fn() }));
vi.mock("douyin-danma-listener", async () => {
  const { EventEmitter } = await import("node:events");
  return {
    default: class extends EventEmitter {
      roomId: string;
      options: object;
      connect = vi.fn(async () => {});
      close = vi.fn();

      constructor(roomId: string, options: object) {
        super();
        this.roomId = roomId;
        this.options = options;
        mockState.clients.push(this);
      }
    },
  };
});

const gift = {
  groupId: "group",
  giftId: "gift",
  common: { createTime: "1700000000" },
  gift: { name: "礼物", diamondCount: 20 },
  totalCount: "2",
  user: { id: "123", nickName: "测试用户" },
};

describe("DouYinRecorder.subscribeComments", () => {
  afterEach(() => vi.useRealTimers());

  it("未录制时独立接收弹幕和合并后的礼物，取消订阅后关闭连接", async () => {
    vi.useFakeTimers();
    vi.mocked(getInfo).mockResolvedValue({ living: true, liveId: "live-123" } as any);
    const recorder = provider.createRecorder({
      channelId: "203641303310",
      quality: "origin",
      streamPriorities: [],
      sourcePriorities: [],
      disableProvideCommentsWhenRecording: true,
      saveGiftDanma: false,
      useServerTimestamp: true,
    });
    const listener = vi.fn();

    expect(recorder.recordHandle).toBeUndefined();
    const unsubscribe = await recorder.subscribeComments!(listener);
    const client = mockState.clients.at(-1);
    expect(getInfo).toHaveBeenCalledWith("203641303310", expect.any(Object));
    expect(client.roomId).toBe("live-123");
    expect(client.connect).toHaveBeenCalledTimes(1);

    client.emit("chat", {
      content: "测试弹幕",
      eventTime: "1700000000",
      user: { id: "123", nickName: "测试用户" },
    });
    client.emit("gift", gift);
    await vi.advanceTimersByTimeAsync(5000);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "comment", text: "测试弹幕", timestamp: 1700000000000 }),
    );
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "give_gift", name: "礼物", count: 2 }),
    );

    unsubscribe();
    unsubscribe();
    client.emit("chat", {
      content: "已取消",
      user: { id: "123", nickName: "测试用户" },
    });
    expect(client.close).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(recorder.recordHandle).toBeUndefined();
  });

  it("录制礼物开关和停止时的待发送礼物保持原有行为", () => {
    vi.useFakeTimers();
    const client = new EventEmitter();
    const listener = vi.fn();
    const filtered = listenDanmaMessages(client as any, { saveGiftDanma: false }, listener);
    client.emit("gift", gift);
    filtered.dispose(true);
    expect(listener).not.toHaveBeenCalled();

    const active = listenDanmaMessages(client as any, {}, listener);
    client.emit("gift", gift);
    active.dispose(true);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: "give_gift" }));
  });

  it("延迟合并的礼物写入到达时所在的分段", () => {
    vi.useFakeTimers();
    const client = new EventEmitter();
    const firstSegment = vi.fn();
    const nextSegment = vi.fn();
    let currentSegment = firstSegment;
    const messages = listenDanmaMessages(
      client as any,
      { captureGiftDelivery: () => currentSegment },
      vi.fn(),
    );

    client.emit("gift", gift);
    currentSegment = nextSegment;
    messages.dispose(true);

    expect(firstSegment).toHaveBeenCalledWith(
      expect.objectContaining({ type: "give_gift", name: "礼物" }),
    );
    expect(nextSegment).not.toHaveBeenCalled();
  });
});
