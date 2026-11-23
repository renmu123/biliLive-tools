import { describe, expect, it, vi } from "vitest";
import { createDYClient } from "../src/dy_client/index.js";
import { provider } from "../src/index.js";
import { normalizeDanma } from "../src/normalizeDanma.js";

vi.mock("../src/dy_client/index.js", () => ({ createDYClient: vi.fn() }));

describe("DouYuRecorder.subscribeComments", () => {
  it("未录制时独立接收规范化弹幕，并在取消订阅后关闭连接", async () => {
    const handlers = new Map<string, (message: any) => void>();
    const client = {
      on: vi.fn((event: string, handler: (message: any) => void) => {
        handlers.set(event, handler);
      }),
      off: vi.fn((event: string) => {
        handlers.delete(event);
      }),
      start: vi.fn(),
      stop: vi.fn(),
    };
    vi.mocked(createDYClient).mockReturnValue(client as any);

    const recorder = provider.createRecorder({
      channelId: "74751",
      quality: 0,
      streamPriorities: [],
      sourcePriorities: [],
      disableProvideCommentsWhenRecording: true,
      saveGiftDanma: false,
      useServerTimestamp: true,
    });
    const listener = vi.fn();

    expect(recorder.recordHandle).toBeUndefined();
    const unsubscribe = await recorder.subscribeComments!(listener);
    expect(createDYClient).toHaveBeenCalledWith(74751, { notAutoStart: true });
    expect(client.start).toHaveBeenCalledTimes(1);

    handlers.get("message")?.({
      type: "chatmsg",
      cst: "1700000000000",
      txt: "测试弹幕",
      col: "2",
      uid: "123",
      nn: "测试用户",
      ic: "",
      level: "5",
    });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "comment",
        timestamp: 1700000000000,
        text: "测试弹幕",
        color: "#00ccff",
      }),
    );

    handlers.get("message")?.({
      type: "dgb",
      gfid: "20002",
      gfn: "办卡",
      gfcnt: "1",
      hits: "1",
      uid: "123",
      nn: "测试用户",
      ic: "",
      level: "5",
    });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "give_gift", name: "办卡" }),
    );

    unsubscribe();
    unsubscribe();
    expect(client.stop).toHaveBeenCalledTimes(1);
    expect(handlers.has("message")).toBe(false);
    expect(recorder.recordHandle).toBeUndefined();
  });
});

describe("斗鱼录制弹幕过滤", () => {
  it("保留礼物和 SC 的保存开关", () => {
    const gift = {
      type: "dgb" as const,
      gfid: "20002",
      gfn: "办卡",
      gfcnt: "1",
      hits: "1",
      uid: "123",
      nn: "测试用户",
      ic: "",
      level: "5",
    };
    const superChat = {
      type: "comm_chatmsg" as const,
      btype: "voiceDanmu" as const,
      cprice: "100",
      uid: "123",
      chatmsg: { txt: "测试 SC", nn: "测试用户", ic: "", level: "5" },
    };

    expect(normalizeDanma(gift as any, { saveGiftDanma: false })).toBeNull();
    expect(normalizeDanma(superChat as any, { saveSCDanma: false })).toBeNull();
    expect(normalizeDanma(gift as any)?.type).toBe("give_gift");
    expect(normalizeDanma(superChat as any)?.type).toBe("super_chat");
  });
});
