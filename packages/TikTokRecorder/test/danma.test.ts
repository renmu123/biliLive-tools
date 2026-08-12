import { EventEmitter } from "node:events";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ControlEvent, WebcastEvent } from "tiktok-live-connector";

import { TikTokDanmaClient } from "../src/danma.js";

const { TikTokLiveConnectionMock } = vi.hoisted(() => ({
  TikTokLiveConnectionMock: vi.fn(),
}));

vi.mock("tiktok-live-connector", async (importOriginal) => ({
  ...(await importOriginal<typeof import("tiktok-live-connector")>()),
  TikTokLiveConnection: TikTokLiveConnectionMock,
}));

class MockConnection extends EventEmitter {
  connect = vi.fn<(roomId?: string) => Promise<unknown>>().mockResolvedValue({});
  disconnect = vi.fn<() => Promise<unknown>>().mockResolvedValue({});
}

describe("TikTokDanmaClient", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    TikTokLiveConnectionMock.mockReset();
  });

  it("只转发普通评论，不订阅礼物事件", async () => {
    const connection = new MockConnection();
    const client = new TikTokDanmaClient("example", {
      connectionFactory: () => connection,
    });
    const onMessage = vi.fn();
    client.on("Message", onMessage);

    await client.start();
    connection.emit(WebcastEvent.CHAT, {
      content: "  测试\n评论  ",
      common: { createTime: 1_710_000_000 },
      user: {
        id: "123",
        nickname: "观众",
        avatarThumb: { urlList: ["https://example.com/avatar.jpg"] },
      },
    });
    connection.emit(WebcastEvent.GIFT, {});

    expect(onMessage).toHaveBeenCalledExactlyOnceWith({
      type: "comment",
      timestamp: 1_710_000_000_000,
      text: "测试评论",
      sender: {
        uid: "123",
        name: "观众",
        avatar: "https://example.com/avatar.jpg",
      },
    });
    expect(connection.listenerCount(WebcastEvent.GIFT)).toBe(0);
    client.stop();
  });

  it("断开后以退避间隔重连", async () => {
    vi.useFakeTimers();
    const first = new MockConnection();
    const second = new MockConnection();
    const connectionFactory = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const client = new TikTokDanmaClient("example", {
      connectionFactory,
      maxRetryCount: 2,
      retryDelay: 1_000,
    });
    const onReconnect = vi.fn();
    client.on("reconnect", onReconnect);

    await client.start();
    first.emit(ControlEvent.DISCONNECTED, { code: 1006 });

    expect(onReconnect).toHaveBeenCalledWith({ retryCount: 1, maxRetry: 2, delay: 1_000 });
    await vi.advanceTimersByTimeAsync(1_000);

    expect(connectionFactory).toHaveBeenCalledTimes(2);
    expect(second.connect).toHaveBeenCalledOnce();
    client.stop();
  });

  it("首次连接失败时自动重试", async () => {
    vi.useFakeTimers();
    const first = new MockConnection();
    first.connect.mockRejectedValueOnce(new Error("连接失败"));
    const second = new MockConnection();
    const connectionFactory = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const client = new TikTokDanmaClient("example", {
      connectionFactory,
      retryDelay: 1_000,
    });

    await client.start();
    await vi.advanceTimersByTimeAsync(1_000);

    expect(connectionFactory).toHaveBeenCalledTimes(2);
    expect(second.connect).toHaveBeenCalledOnce();
    client.stop();
  });

  it("将代理传递给连接工厂", async () => {
    const connection = new MockConnection();
    const connectionFactory = vi.fn().mockReturnValue(connection);
    const client = new TikTokDanmaClient("example", {
      auth: "sessionid=test",
      proxy: "http://127.0.0.1:7890",
      connectionFactory,
    });

    await client.start();

    expect(connectionFactory).toHaveBeenCalledExactlyOnceWith(
      "example",
      "sessionid=test",
      "http://127.0.0.1:7890",
    );
    client.stop();
  });

  it("使用已有的数值 Room ID 连接", async () => {
    const connection = new MockConnection();
    const client = new TikTokDanmaClient("example", {
      roomId: "7672766824583105301",
      connectionFactory: () => connection,
    });

    await client.start();

    expect(connection.connect).toHaveBeenCalledExactlyOnceWith("7672766824583105301");
    client.stop();
  });

  it("为 HTTP 请求和 WebSocket 配置代理 Agent", async () => {
    TikTokLiveConnectionMock.mockImplementationOnce(
      class {
        connect = vi.fn<(roomId?: string) => Promise<unknown>>().mockResolvedValue({});
        disconnect = vi.fn<() => Promise<unknown>>().mockResolvedValue({});
        on = vi.fn();
      },
    );
    const client = new TikTokDanmaClient("example", {
      proxy: "http://127.0.0.1:7890",
    });

    await client.start();

    expect(TikTokLiveConnectionMock).toHaveBeenCalledExactlyOnceWith(
      "@example",
      expect.objectContaining({
        webClientOptions: {
          agent: {
            http: expect.any(HttpProxyAgent),
            https: expect.any(HttpsProxyAgent),
          },
        },
        wsClientOptions: {
          agent: expect.any(HttpsProxyAgent),
        },
      }),
    );
    client.stop();
  });
});
