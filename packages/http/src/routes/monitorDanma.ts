import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, WebSocket } from "ws";
import type { Message } from "@bililive-tools/manager";
import { container } from "../index.js";

const PATH = "/recorder/ws/monitor-danma";
const MAX_ROOMS = 9;
const MAX_BUFFERED_BYTES = 512 * 1024;
const server = new WebSocketServer({ noServer: true, maxPayload: 2048 });

type Listener = {
  onMessage: (message: Message) => void;
  onError: (error: unknown) => void;
};
type Session = {
  listeners: Set<Listener>;
  unsubscribe?: () => void;
  closed: boolean;
};

// 同一进程内的监控室窗口共享每个录制器的外部弹幕连接。
const sessions = new Map<string, Session>();

const subscribeRoom = (id: string, listener: Listener): (() => void) => {
  let session = sessions.get(id);
  if (!session) {
    const recorder = container.resolve("recorderManager").manager.getRecorder(id);
    if (!recorder?.subscribeComments) throw new Error("录制器不存在或不支持弹幕订阅");

    session = { listeners: new Set(), closed: false };
    sessions.set(id, session);
    const current = session;
    void recorder
      .subscribeComments((message) => {
        if (current.closed) return;
        for (const subscriber of current.listeners) subscriber.onMessage(message);
      })
      .then((unsubscribe) => {
        if (current.closed) unsubscribe();
        else current.unsubscribe = unsubscribe;
      })
      .catch((error) => {
        if (current.closed) return;
        current.closed = true;
        sessions.delete(id);
        for (const subscriber of current.listeners) subscriber.onError(error);
        current.listeners.clear();
      });
  }

  session.listeners.add(listener);
  return () => {
    if (session.closed) return;
    session.listeners.delete(listener);
    if (session.listeners.size) return;
    session.closed = true;
    sessions.delete(id);
    session.unsubscribe?.();
  };
};

server.on("connection", (socket) => {
  const subscriptions = new Map<string, () => void>();
  let closed = false;

  const send = (payload: unknown) => {
    if (socket.readyState !== WebSocket.OPEN) return;
    if (socket.bufferedAmount > MAX_BUFFERED_BYTES) {
      socket.close(1013, "slow client");
      return;
    }
    socket.send(JSON.stringify(payload));
  };
  const cleanup = () => {
    if (closed) return;
    closed = true;
    for (const unsubscribe of subscriptions.values()) unsubscribe();
    subscriptions.clear();
  };

  socket.on("message", (raw) => {
    let payload: unknown;
    try {
      payload = JSON.parse(raw.toString());
    } catch {
      socket.close(1008, "invalid message");
      return;
    }
    if (!payload || typeof payload !== "object" || !("type" in payload)) return;
    if (payload.type !== "set_rooms" || !("ids" in payload) || !Array.isArray(payload.ids)) {
      socket.close(1008, "invalid rooms");
      return;
    }
    const ids: unknown[] = payload.ids;
    if (
      ids.length > MAX_ROOMS ||
      ids.some((id) => typeof id !== "string" || !id || id.length > 200)
    ) {
      socket.close(1008, "invalid rooms");
      return;
    }
    const requested = new Set(ids as string[]);
    for (const [id, unsubscribe] of subscriptions) {
      if (requested.has(id)) continue;
      unsubscribe();
      subscriptions.delete(id);
    }
    for (const id of requested) {
      if (subscriptions.has(id)) continue;
      try {
        let lastCommentAt = 0;
        const unsubscribe = subscribeRoom(id, {
          onMessage: (message) => {
            if (message.type !== "comment" && message.type !== "super_chat") return;
            if (message.type === "comment") {
              const now = Date.now();
              if (now - lastCommentAt < 250) return;
              lastCommentAt = now;
            }
            send({ type: "danma", id, message });
          },
          onError: (error) => {
            subscriptions.delete(id);
            send({ type: "error", id, message: String(error) });
          },
        });
        subscriptions.set(id, unsubscribe);
      } catch (error) {
        send({ type: "error", id, message: String(error) });
      }
    }
  });

  socket.on("close", cleanup);
  socket.on("error", cleanup);
});

export function handleMonitorDanmaUpgrade(
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer,
  auth: { enabled: boolean; passKey: string },
): boolean {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (url.pathname !== PATH) return false;
  if (auth.enabled && url.searchParams.get("auth") !== auth.passKey) {
    server.handleUpgrade(request, socket, head, (ws) => ws.close(1008, "Unauthorized"));
    return true;
  }
  server.handleUpgrade(request, socket, head, (ws) => server.emit("connection", ws, request));
  return true;
}
