import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DouYinDanmaClient from "../src/index.js";
import { getCookie } from "../src/api.js";
import { decompressGzip } from "../src/utils.js";

const { WebSocketMock, decodeFrame, decodeResponse } = vi.hoisted(() => ({
  WebSocketMock: Object.assign(vi.fn(), { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 }),
  decodeFrame: vi.fn(),
  decodeResponse: vi.fn(),
}));

vi.mock("ws", () => ({ default: WebSocketMock }));
vi.mock("../src/api.js", () => ({ getCookie: vi.fn() }));
vi.mock("../src/utils.js", () => ({
  decompressGzip: vi.fn(),
  getXMsStub: vi.fn(),
  getSignature: vi.fn(),
  getUserUniqueId: vi.fn(),
}));
vi.mock("../src/proto.js", () => ({
  default: {
    douyin: {
      PushFrame: { decode: decodeFrame },
      Response: { decode: decodeResponse },
    },
  },
}));

class MockSocket extends EventEmitter {
  readyState = WebSocketMock.CONNECTING;
  send = vi.fn();
  close = vi.fn(() => this.disconnect());
  terminate = vi.fn(() => this.disconnect());

  open() {
    this.readyState = WebSocketMock.OPEN;
    this.emit("open");
  }

  disconnect() {
    this.readyState = WebSocketMock.CLOSED;
    this.emit("close");
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("DouYinDanmaClient connection recovery", () => {
  let sockets: MockSocket[];
  let clients: DouYinDanmaClient[];

  function createClient(options: ConstructorParameters<typeof DouYinDanmaClient>[1] = {}) {
    const client = new DouYinDanmaClient("test-room", {
      cookie: "ttwid=test",
      connectTimeout: 100,
      reconnectInterval: 50,
      timeoutInterval: 1000,
      ...options,
    });
    clients.push(client);
    const error = vi.fn();
    client.on("error", error);
    const getWsInfo = vi.spyOn(client, "getWsInfo").mockResolvedValue("wss://example.invalid/");
    return { client, error, getWsInfo };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    sockets = [];
    clients = [];
    WebSocketMock.mockReset();
    WebSocketMock.mockImplementation(function () {
      const socket = new MockSocket();
      sockets.push(socket);
      return socket;
    });
    vi.mocked(getCookie).mockReset().mockResolvedValue("ttwid=test");
    vi.mocked(decompressGzip).mockReset().mockResolvedValue(Buffer.alloc(0));
    decodeFrame.mockReset().mockReturnValue({ payload: Buffer.alloc(0) });
    decodeResponse.mockReset().mockReturnValue({ messagesList: [] });
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    for (const client of clients) client.close();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("aborts a stalled Cookie request and retries", async () => {
    const { client, error } = createClient({ cookie: undefined });
    let signal!: AbortSignal;
    vi.mocked(getCookie).mockImplementationOnce((requestSignal) => {
      signal = requestSignal!;
      return new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      });
    });
    const connecting = client.connect();
    await vi.advanceTimersByTimeAsync(100);
    await connecting;
    expect(signal.aborted).toBe(true);
    expect(error).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ message: "抖音弹幕连接超时" }),
    );
    await vi.advanceTimersByTimeAsync(50);
    expect(getCookie).toHaveBeenCalledTimes(2);
    expect(sockets).toHaveLength(1);
    sockets[0].open();
  });

  it("ignores a late Cookie result after its connection timed out", async () => {
    const pending = deferred<string>();
    vi.mocked(getCookie).mockReturnValueOnce(pending.promise);
    const { client } = createClient({ cookie: undefined });
    const first = client.connect();
    await vi.advanceTimersByTimeAsync(150);
    expect(sockets).toHaveLength(1);
    pending.resolve("ttwid=obsolete");
    await first;
    expect(sockets).toHaveLength(1);
    sockets[0].open();
  });

  it.each(["Cookie failure", "signature failure"])(
    "retries an asynchronous %s",
    async (failure) => {
      const { client, error, getWsInfo } = createClient({ cookie: undefined });
      const rejection = new Error(failure);
      if (failure === "Cookie failure") vi.mocked(getCookie).mockRejectedValueOnce(rejection);
      else getWsInfo.mockRejectedValueOnce(rejection);
      await expect(client.connect()).resolves.toBeUndefined();
      expect(error).toHaveBeenCalledExactlyOnceWith(rejection);
      await vi.advanceTimersByTimeAsync(50);
      expect(sockets).toHaveLength(1);
      sockets[0].open();
    },
  );

  it("retries when signature generation returns no URL", async () => {
    const { client, error, getWsInfo } = createClient();
    getWsInfo.mockResolvedValueOnce(undefined);
    await client.connect();
    expect(error).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ message: "获取抖音弹幕签名失败" }),
    );
    await vi.advanceTimersByTimeAsync(50);
    expect(sockets).toHaveLength(1);
    sockets[0].open();
  });

  it("bounds signature retrieval and ignores its obsolete result", async () => {
    const pending = deferred<string>();
    const { client, getWsInfo } = createClient();
    getWsInfo.mockReturnValueOnce(pending.promise);
    const first = client.connect();
    await vi.advanceTimersByTimeAsync(150);
    pending.resolve("wss://obsolete.invalid/");
    await first;
    expect(WebSocketMock).toHaveBeenCalledExactlyOnceWith(
      "wss://example.invalid/",
      expect.anything(),
    );
    sockets[0].open();
  });

  it("terminates a stalled handshake before retrying", async () => {
    const { client, error } = createClient();
    await client.connect();
    await vi.advanceTimersByTimeAsync(100);
    expect(sockets[0].terminate).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(50);
    expect(sockets).toHaveLength(2);
    sockets[1].open();
    await vi.advanceTimersByTimeAsync(100);
    expect(sockets[1].terminate).not.toHaveBeenCalled();
  });

  it("retries a synchronous WebSocket construction error", async () => {
    const { client, error } = createClient();
    WebSocketMock.mockImplementationOnce(function () {
      throw new Error("invalid URL");
    });
    await client.connect();
    expect(error).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(50);
    expect(sockets).toHaveLength(1);
    sockets[0].open();
  });

  it("allows only one concurrent connection attempt", async () => {
    const pending = deferred<string>();
    const { client, getWsInfo } = createClient();
    getWsInfo.mockReturnValueOnce(pending.promise);
    const first = client.connect();
    await client.connect();
    expect(getWsInfo).toHaveBeenCalledOnce();
    pending.resolve("wss://example.invalid/");
    await first;
    await client.connect();
    sockets[0].open();
    await client.connect();
    expect(sockets).toHaveLength(1);
  });

  it("schedules one retry for an error followed by close", async () => {
    const { client, error } = createClient();
    await client.connect();
    sockets[0].open();
    sockets[0].emit("error", new Error("disconnected"));
    sockets[0].emit("close");
    sockets[0].emit("error", new Error("late error"));
    expect(error).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(50);
    expect(sockets).toHaveLength(2);
    sockets[1].open();
  });

  it("ignores obsolete socket events after a replacement is connected", async () => {
    const { client, error } = createClient();
    const open = vi.fn();
    const decode = vi.spyOn(client, "decode");
    client.on("open", open);
    await client.connect();
    const first = sockets[0];
    first.emit("error", new Error("reconnect"));
    await vi.advanceTimersByTimeAsync(50);
    sockets[1].open();
    first.emit("open");
    first.emit("message", Buffer.alloc(0));
    first.emit("close");
    first.emit("error", new Error("obsolete"));
    expect(open).toHaveBeenCalledOnce();
    expect(decode).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledOnce();
    expect(sockets[1].terminate).not.toHaveBeenCalled();
  });

  it("terminates an inactive socket before replacing it", async () => {
    const { client } = createClient();
    await client.connect();
    sockets[0].open();
    await vi.advanceTimersByTimeAsync(2000);
    expect(sockets[0].terminate).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(50);
    sockets[1].open();
  });

  it("keeps a connection alive when server packets arrive without user chat", async () => {
    const { client } = createClient();
    await client.connect();
    sockets[0].open();
    for (let index = 0; index < 5; index++) {
      await vi.advanceTimersByTimeAsync(800);
      sockets[0].emit("message", Buffer.alloc(0));
      await vi.advanceTimersByTimeAsync(0);
    }
    expect(decodeResponse).toHaveBeenCalledTimes(5);
    expect(sockets[0].terminate).not.toHaveBeenCalled();
    expect(sockets).toHaveLength(1);
  });

  it("aborts Cookie retrieval when closed and permits a later explicit connection", async () => {
    const pending = deferred<string>();
    const { client, error } = createClient({ cookie: undefined });
    vi.mocked(getCookie).mockReturnValueOnce(pending.promise);
    const first = client.connect();
    await vi.advanceTimersByTimeAsync(0);
    const signal = vi.mocked(getCookie).mock.calls[0][0]!;
    client.close();
    expect(signal.aborted).toBe(true);
    await client.connect();
    pending.resolve("ttwid=obsolete");
    await first;
    expect(sockets).toHaveLength(1);
    expect(error).not.toHaveBeenCalled();
    sockets[0].open();
  });

  it("terminates a connecting socket on close without retrying", async () => {
    const { client, error } = createClient();
    const close = vi.fn();
    client.on("close", close);
    await client.connect();
    client.close();
    expect(sockets[0].terminate).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1000);
    expect(sockets).toHaveLength(1);
    expect(error).not.toHaveBeenCalled();
  });

  it("cancels a pending retry when closed", async () => {
    const { client } = createClient();
    await client.connect();
    sockets[0].emit("error", new Error("retry pending"));
    client.close();
    await vi.advanceTimersByTimeAsync(1000);
    expect(sockets).toHaveLength(1);
  });

  it("does not reset the configured retry limit after a successful open", async () => {
    const { client } = createClient({ autoReconnect: 1 });
    await client.connect();
    sockets[0].open();
    sockets[0].disconnect();
    await vi.advanceTimersByTimeAsync(50);
    sockets[1].open();
    sockets[1].disconnect();
    await vi.advanceTimersByTimeAsync(1000);
    expect(sockets).toHaveLength(2);
  });

  it("cleans up a failed connection when retries are disabled", async () => {
    const { client, error } = createClient({ autoReconnect: 0 });
    await client.connect();
    await vi.advanceTimersByTimeAsync(1000);
    expect(sockets[0].terminate).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
    expect(sockets).toHaveLength(1);
  });

  it("honors close from an error listener", async () => {
    const { client } = createClient();
    client.on("error", () => client.close());
    await client.connect();
    sockets[0].emit("error", new Error("stop"));
    await vi.advanceTimersByTimeAsync(1000);
    expect(sockets).toHaveLength(1);
  });

  it("honors close from an init listener before fetching Cookie", async () => {
    const { client } = createClient({ cookie: undefined });
    client.on("init", () => client.close());
    await client.connect();
    expect(getCookie).not.toHaveBeenCalled();
    expect(sockets).toHaveLength(0);
  });

  it("does not start heartbeat timers when an open listener closes the client", async () => {
    const { client } = createClient();
    client.on("open", () => client.close());
    await client.connect();
    sockets[0].open();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("catches rejected packet decoding and recovers the connection", async () => {
    const { client, error } = createClient();
    vi.spyOn(client, "decode").mockRejectedValueOnce(new Error("invalid packet"));
    await client.connect();
    sockets[0].open();
    sockets[0].emit("message", Buffer.alloc(0));
    await vi.advanceTimersByTimeAsync(50);
    expect(error).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ message: "invalid packet" }),
    );
    expect(sockets).toHaveLength(2);
    sockets[1].open();
  });

  it("discards a packet whose decompression completes after reconnect", async () => {
    const pending = deferred<Buffer>();
    const { client } = createClient();
    vi.mocked(decompressGzip).mockReturnValueOnce(pending.promise);
    await client.connect();
    sockets[0].open();
    sockets[0].emit("message", Buffer.alloc(0));
    sockets[0].emit("error", new Error("replace connection"));
    await vi.advanceTimersByTimeAsync(50);
    sockets[1].open();
    pending.resolve(Buffer.alloc(0));
    await vi.advanceTimersByTimeAsync(0);
    expect(decodeResponse).not.toHaveBeenCalled();
  });
});
