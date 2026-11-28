import http from "node:http";
import { once } from "node:events";
import { WebSocket } from "ws";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleMonitorDanmaUpgrade } from "../src/routes/monitorDanma";

const mocks = vi.hoisted(() => ({
  subscribeComments: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("../src/index.js", () => ({
  container: {
    resolve: () => ({
      manager: { getRecorder: () => ({ subscribeComments: mocks.subscribeComments }) },
    }),
  },
}));

let httpServer: http.Server;
let url: string;

beforeEach(async () => {
  mocks.subscribeComments.mockReset();
  mocks.unsubscribe.mockReset();
  mocks.subscribeComments.mockResolvedValue(mocks.unsubscribe);
  httpServer = http.createServer();
  httpServer.on("upgrade", (request, socket, head) => {
    if (!handleMonitorDanmaUpgrade(request, socket, head, { enabled: true, passKey: "test-key" })) {
      socket.destroy();
    }
  });
  httpServer.listen(0, "127.0.0.1");
  await once(httpServer, "listening");
  const address = httpServer.address();
  if (!address || typeof address === "string") throw new Error("missing server address");
  url = `ws://127.0.0.1:${address.port}/recorder/ws/monitor-danma`;
});

afterEach(async () => {
  httpServer.closeAllConnections();
  httpServer.close();
  await once(httpServer, "close");
});

const openSocket = async () => {
  const socket = new WebSocket(`${url}?auth=test-key`);
  await once(socket, "open");
  return socket;
};

describe("monitor room danmaku WebSocket", () => {
  it("shares a room subscription between windows and releases it after the last client", async () => {
    const first = await openSocket();
    const second = await openSocket();
    const subscribe = JSON.stringify({ type: "set_rooms", ids: ["room-a"] });
    first.send(subscribe);
    second.send(subscribe);
    await vi.waitFor(() => expect(mocks.subscribeComments).toHaveBeenCalledTimes(1));
    const firstMessage = once(first, "message");
    const secondMessage = once(second, "message");
    mocks.subscribeComments.mock.calls[0][0]({ type: "comment", text: "hi" });
    const [firstPayload] = await firstMessage;
    const [secondPayload] = await secondMessage;
    expect(JSON.parse(firstPayload.toString())).toMatchObject({
      type: "danma",
      id: "room-a",
      message: { text: "hi" },
    });
    expect(JSON.parse(secondPayload.toString()).id).toBe("room-a");

    first.close();
    await once(first, "close");
    expect(mocks.unsubscribe).not.toHaveBeenCalled();

    second.close();
    await once(second, "close");
    await vi.waitFor(() => expect(mocks.unsubscribe).toHaveBeenCalledOnce());
  });

  it("rejects an unauthenticated connection before subscribing", async () => {
    const socket = new WebSocket(url);
    const [code] = await once(socket, "close");
    expect(code).toBe(1008);
    expect(mocks.subscribeComments).not.toHaveBeenCalled();
  });
});
