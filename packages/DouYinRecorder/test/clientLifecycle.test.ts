import { afterEach, describe, expect, it, vi } from "vitest";
import DouYinDanmaClient from "douyin-danma-listener";

describe("抖音弹幕连接生命周期", () => {
  afterEach(() => vi.useRealTimers());

  it("初始化期间关闭后不再建立 WebSocket", async () => {
    const client = new DouYinDanmaClient("live-123");
    let resolveUrl!: (url: string) => void;
    (client as any).getWsInfo = vi.fn(() => new Promise((resolve) => (resolveUrl = resolve)));

    const connecting = client.connect();
    client.close();
    resolveUrl("wss://example.com");
    await connecting;

    expect((client as any).ws).toBeUndefined();
  });

  it("关闭后取消待执行的重连", async () => {
    vi.useFakeTimers();
    const client = new DouYinDanmaClient("live-123");
    const connect = vi.spyOn(client, "connect").mockResolvedValue();
    (client as any).reconnect();

    client.close();
    await vi.advanceTimersByTimeAsync(10000);
    expect(connect).not.toHaveBeenCalled();
  });
});
