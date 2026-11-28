import { afterEach, describe, expect, it, vi } from "vitest";
import HuYaDanMu from "huya-danma-listener";

describe("虎牙弹幕连接生命周期", () => {
  afterEach(() => vi.useRealTimers());

  it("初始化期间停止后不再建立 WebSocket", async () => {
    const client = new HuYaDanMu("910323");
    let resolveInfo!: (info: object) => void;
    (client as any)._get_chat_info = vi.fn(() => new Promise((resolve) => (resolveInfo = resolve)));

    const starting = client.start();
    expect(() => client.stop()).not.toThrow();
    resolveInfo({ subsid: 1, topsid: 2, yyuid: 3 });
    await starting;

    expect((client as any)._client).toBeNull();
  });

  it("普通断线保留已安排的重试，手动停止取消重试", async () => {
    vi.useFakeTimers();
    const client = new HuYaDanMu("910323") as any;
    client._try_connect = vi.fn();

    client._throttled_retry();
    client._stop();
    await vi.advanceTimersByTimeAsync(2000);
    expect(client._try_connect).toHaveBeenCalledTimes(1);

    const stoppedClient = new HuYaDanMu("910323") as any;
    stoppedClient._try_connect = vi.fn();
    stoppedClient._throttled_retry();
    stoppedClient.stop();
    await vi.advanceTimersByTimeAsync(2000);
    expect(stoppedClient._try_connect).not.toHaveBeenCalled();
  });
});
