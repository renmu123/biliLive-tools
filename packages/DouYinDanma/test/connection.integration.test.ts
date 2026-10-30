import { createServer, type Server } from "node:http";
import type { Socket } from "node:net";
import { gzipSync } from "node:zlib";
import { WebSocketServer } from "ws";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DouYinDanmaClient from "../src/index.js";
import protobuf from "../src/proto.js";

describe("DouYinDanmaClient with a local WebSocket server", () => {
  let server: Server;
  let webSocketServer: WebSocketServer;
  let sockets: Set<Socket>;
  let client: DouYinDanmaClient;

  beforeEach(() => {
    server = createServer();
    webSocketServer = new WebSocketServer({ noServer: true });
    sockets = new Set();
    server.on("connection", (socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
    });
  });

  afterEach(async () => {
    client?.close();
    for (const socket of webSocketServer.clients) socket.terminate();
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => webSocketServer.close(() => resolve()));
    await new Promise<void>((resolve) => server.close(() => resolve()));
    vi.restoreAllMocks();
  });

  async function createClient(options: ConstructorParameters<typeof DouYinDanmaClient>[1] = {}) {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing local server port");
    client = new DouYinDanmaClient("test-room", {
      cookie: "ttwid=test",
      connectTimeout: 200,
      reconnectInterval: 30,
      autoReconnect: 2,
      ...options,
    });
    vi.spyOn(client, "getWsInfo").mockResolvedValue(`ws://127.0.0.1:${address.port}/`);
    return client;
  }

  function chatPacket() {
    // @ts-expect-error Generated protobuf namespaces are added dynamically to Root.
    const { ChatMessage, Response, PushFrame } = protobuf.douyin;
    const payload = ChatMessage.encode({
      user: { id: 123, nickName: "test-user" },
      content: "recovered chat",
    }).finish();
    const response = Response.encode({
      messagesList: [{ method: "WebcastChatMessage", payload }],
    }).finish();
    return PushFrame.encode({ payload: gzipSync(response) }).finish();
  }

  it("recovers from a stalled HTTP upgrade and receives chat on the replacement socket", async () => {
    let upgrades = 0;
    server.on("upgrade", (request, socket, head) => {
      upgrades++;
      if (upgrades === 1) return;
      webSocketServer.handleUpgrade(request, socket, head, (ws) => ws.send(chatPacket()));
    });
    const client = await createClient();
    const onChat = vi.fn();
    const onError = vi.fn();
    client.on("chat", onChat);
    client.on("error", onError);
    await client.connect();
    await vi.waitFor(() => expect(onChat).toHaveBeenCalledOnce(), { timeout: 3000 });
    expect(upgrades).toBe(2);
    expect(onError).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ message: "抖音弹幕连接超时" }),
    );
    expect(onChat).toHaveBeenCalledWith(expect.objectContaining({ content: "recovered chat" }));
  });

  it("replaces a silent open connection and receives chat without restarting a recorder", async () => {
    let upgrades = 0;
    server.on("upgrade", (request, socket, head) => {
      upgrades++;
      webSocketServer.handleUpgrade(request, socket, head, (ws) => {
        if (upgrades > 1) ws.send(chatPacket());
      });
    });
    const client = await createClient({ timeoutInterval: 100 });
    const onChat = vi.fn();
    const onError = vi.fn();
    client.on("chat", onChat);
    client.on("error", onError);
    await client.connect();
    await vi.waitFor(() => expect(onChat).toHaveBeenCalledOnce(), { timeout: 3000 });
    expect(upgrades).toBe(2);
    expect(onError).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(webSocketServer.clients.size).toBe(1));
  });
});
