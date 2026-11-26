import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMonitorDanmaSocket } from "@renderer/apis/common";
import { createMonitorDanmaSocket } from "./danmaSocket";

vi.mock("@renderer/apis/common", () => ({ getMonitorDanmaSocket: vi.fn() }));

class FakeSocket {
  static OPEN = 1;
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;

  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  send(value: string) {
    this.sent.push(value);
  }
  receive(value: unknown) {
    this.onmessage?.({ data: JSON.stringify(value) });
  }
  close(code = 1000) {
    this.readyState = 3;
    this.onclose?.({ code });
  }
}

const getSocket = vi.mocked(getMonitorDanmaSocket);

beforeEach(() => {
  vi.stubGlobal("WebSocket", FakeSocket);
  getSocket.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("monitor room danmaku socket", () => {
  it("multiplexes rooms over one socket and closes it when no room needs danmaku", async () => {
    const socket = new FakeSocket();
    getSocket.mockResolvedValue(socket as unknown as WebSocket);
    const onMessage = vi.fn();
    const connection = createMonitorDanmaSocket({
      onMessage,
      onRoomError: vi.fn(),
      onFatal: vi.fn(),
    });

    connection.setRooms(["room-a"]);
    await vi.waitFor(() => expect(getSocket).toHaveBeenCalledTimes(1));
    socket.open();
    expect(JSON.parse(socket.sent[0])).toEqual({ type: "set_rooms", ids: ["room-a"] });

    connection.setRooms(["room-a", "room-b"]);
    expect(JSON.parse(socket.sent[1])).toEqual({ type: "set_rooms", ids: ["room-a", "room-b"] });
    socket.receive({ type: "danma", id: "room-b", message: { type: "comment", text: "hi" } });
    expect(onMessage).toHaveBeenCalledWith("room-b", { type: "comment", text: "hi" });

    connection.setRooms([]);
    expect(socket.readyState).toBe(3);
    connection.close();
  });

  it("reconnects after a transient close and stops after an authorization failure", async () => {
    vi.useFakeTimers();
    const first = new FakeSocket();
    const second = new FakeSocket();
    getSocket
      .mockResolvedValueOnce(first as unknown as WebSocket)
      .mockResolvedValueOnce(second as unknown as WebSocket);
    const onFatal = vi.fn();
    const connection = createMonitorDanmaSocket({
      onMessage: vi.fn(),
      onRoomError: vi.fn(),
      onFatal,
    });

    connection.setRooms(["room-a"]);
    await Promise.resolve();
    first.open();
    first.close(1006);
    await vi.advanceTimersByTimeAsync(1000);
    expect(getSocket).toHaveBeenCalledTimes(2);

    second.open();
    second.close(1008);
    expect(onFatal).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(getSocket).toHaveBeenCalledTimes(2);
    connection.close();
  });
});
