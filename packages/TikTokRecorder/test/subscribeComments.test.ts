import { describe, expect, it, vi } from "vitest";
import { getInfo } from "../src/stream.js";
import { provider } from "../src/index.js";

const mockState = vi.hoisted(() => ({ clients: [] as any[] }));

vi.mock("../src/stream.js", () => ({ getInfo: vi.fn(), getStream: vi.fn() }));
vi.mock("../src/danma.js", async () => {
  const { EventEmitter } = await import("node:events");
  return {
    default: class extends EventEmitter {
      uniqueId: string;
      options: object;
      start = vi.fn(async () => {});
      stop = vi.fn();

      constructor(uniqueId: string, options: object) {
        super();
        this.uniqueId = uniqueId;
        this.options = options;
        mockState.clients.push(this);
      }
    },
  };
});

describe("TikTokRecorder.subscribeComments", () => {
  it("未录制时独立接收评论，并在取消订阅后关闭连接", async () => {
    vi.mocked(getInfo).mockResolvedValue({ living: true, webcastRoomId: "room-123" } as any);
    const recorder = provider.createRecorder({
      channelId: "example",
      quality: "origin",
      streamPriorities: [],
      sourcePriorities: [],
      disableProvideCommentsWhenRecording: true,
      auth: "sessionid=test",
      proxy: "http://127.0.0.1:7890",
    });
    const listener = vi.fn();

    expect(recorder.recordHandle).toBeUndefined();
    const unsubscribe = await recorder.subscribeComments!(listener);
    const client = mockState.clients.at(-1);
    expect(getInfo).toHaveBeenCalledWith("example", {
      api: "auto",
      auth: "sessionid=test",
      proxy: "http://127.0.0.1:7890",
    });
    expect(client.uniqueId).toBe("example");
    expect(client.options).toEqual({
      auth: "sessionid=test",
      proxy: "http://127.0.0.1:7890",
      roomId: "room-123",
    });
    expect(client.start).toHaveBeenCalledTimes(1);

    const comment = { type: "comment", timestamp: 1700000000000, text: "测试评论" };
    client.emit("Message", comment);
    expect(listener).toHaveBeenCalledWith(comment);

    unsubscribe();
    unsubscribe();
    client.emit("Message", comment);
    expect(client.stop).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(recorder.recordHandle).toBeUndefined();
  });

  it("未开播时不创建弹幕连接", async () => {
    vi.mocked(getInfo).mockResolvedValue({ living: false } as any);
    const recorder = provider.createRecorder({
      channelId: "example",
      quality: "origin",
      streamPriorities: [],
      sourcePriorities: [],
    });
    const count = mockState.clients.length;

    await expect(recorder.subscribeComments!(vi.fn())).rejects.toThrow("直播间未开播");
    expect(mockState.clients).toHaveLength(count);
  });
});
