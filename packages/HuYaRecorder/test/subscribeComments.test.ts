import { describe, expect, it, vi } from "vitest";
import { provider } from "../src/index.js";
import { normalizeDanma } from "../src/normalizeDanma.js";

const mockState = vi.hoisted(() => ({ clients: [] as any[] }));

vi.mock("huya-danma-listener", async () => {
  const { EventEmitter } = await import("node:events");
  return {
    default: class extends EventEmitter {
      roomId: string;
      start = vi.fn(async () => {});
      stop = vi.fn();

      constructor(roomId: string) {
        super();
        this.roomId = roomId;
        mockState.clients.push(this);
      }
    },
  };
});

describe("HuYaRecorder.subscribeComments", () => {
  it("未录制时独立接收弹幕和礼物，取消订阅后关闭连接", async () => {
    const recorder = provider.createRecorder({
      channelId: "910323",
      quality: 0,
      streamPriorities: [],
      sourcePriorities: [],
      disableProvideCommentsWhenRecording: true,
      saveGiftDanma: false,
    });
    const listener = vi.fn();

    expect(recorder.recordHandle).toBeUndefined();
    const unsubscribe = await recorder.subscribeComments!(listener);
    const client = mockState.clients.at(-1);
    expect(client.roomId).toBe("910323");
    expect(client.start).toHaveBeenCalledTimes(1);

    client.emit("message", {
      type: "chat",
      content: "测试弹幕",
      color: "#ffffff",
      from: { rid: "123", name: "测试用户" },
    });
    client.emit("message", {
      type: "gift",
      name: "礼物",
      count: 2,
      price: 6,
      from: { rid: "123", name: "测试用户" },
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "comment", text: "测试弹幕" }),
    );
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "give_gift", name: "礼物", price: 3 }),
    );
    expect(normalizeDanma({ type: "gift", count: 2, price: 6 } as any, false)).toBeNull();

    unsubscribe();
    unsubscribe();
    expect(client.stop).toHaveBeenCalledTimes(1);
    expect(recorder.recordHandle).toBeUndefined();
  });
});
