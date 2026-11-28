import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { startListen } from "blive-message-listener";
import { getBuvidConf } from "../src/bilibili_api.js";
import { provider } from "../src/index.js";

vi.mock("blive-message-listener", () => ({ startListen: vi.fn() }));
vi.mock("../src/bilibili_api.js", () => ({ getBuvidConf: vi.fn() }));

describe("BilibiliRecorder.subscribeComments", () => {
  it("未录制且禁用录制弹幕时仍能独立订阅，并单独关闭连接", async () => {
    vi.mocked(getBuvidConf).mockResolvedValue({ data: { b_3: "test-buvid" } } as any);
    const close = vi.fn();
    vi.mocked(startListen).mockReturnValue({ live: new EventEmitter(), close } as any);

    const recorder = provider.createRecorder({
      channelId: "7734200",
      quality: 10000,
      streamPriorities: [],
      sourcePriorities: [],
      disableProvideCommentsWhenRecording: true,
    });
    const listener = vi.fn();

    expect(recorder.recordHandle).toBeUndefined();
    const unsubscribe = await recorder.subscribeComments!(listener);
    expect(startListen).toHaveBeenCalledTimes(1);
    expect(startListen).toHaveBeenCalledWith(7734200, expect.any(Object), expect.any(Object));

    const handler = vi.mocked(startListen).mock.calls[0][1];
    handler.onIncomeDanmu?.({
      body: {
        content: "测试弹幕",
        timestamp: 1700000000000,
        content_color: "#ffffff",
        type: 1,
        user: { uid: 123, uname: "测试用户", face: "" },
      },
    } as any);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "comment", text: "测试弹幕" }),
    );

    unsubscribe();
    unsubscribe();
    expect(close).toHaveBeenCalledTimes(1);
    expect(recorder.recordHandle).toBeUndefined();
  });
  it("转发大表情和行内表情图片，不过滤纯图片消息", async () => {
    vi.mocked(startListen).mockClear();
    vi.mocked(getBuvidConf).mockResolvedValue({ data: { b_3: "test-buvid" } } as any);
    const close = vi.fn();
    vi.mocked(startListen).mockReturnValue({ live: new EventEmitter(), close } as any);
    const recorder = provider.createRecorder({
      channelId: "7734200",
      quality: 10000,
      streamPriorities: [],
      sourcePriorities: [],
    });
    const listener = vi.fn();
    const unsubscribe = await recorder.subscribeComments!(listener);
    const handler = vi.mocked(startListen).mock.calls[0][1];
    const body = {
      timestamp: 1700000000000,
      content_color: "#ffffff",
      type: 1,
      user: { uid: 123, uname: "测试用户", face: "" },
    };
    handler.onIncomeDanmu?.({
      body: {
        ...body,
        content: "",
        emoticon: { url: "https://example.com/large.png" },
      },
    } as any);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        text: "",
        img: "https://example.com/large.png",
      }),
    );
    handler.onIncomeDanmu?.({
      body: {
        ...body,
        content: "你好[dog]",
        in_message_emoticon: { "[dog]": { url: "https://example.com/dog.png" } },
      },
    } as any);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        text: "你好[dog]",
        emoticons: { "[dog]": "https://example.com/dog.png" },
      }),
    );
    unsubscribe();
  });
});
