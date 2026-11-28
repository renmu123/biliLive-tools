import { getMonitorDanmaSocket } from "@renderer/apis/common";

type Callbacks = {
  onMessage: (id: string, message: Record<string, unknown>) => void;
  onRoomError: (id: string, error: string) => void;
  onFatal: (error: string) => void;
};

export function createMonitorDanmaSocket(callbacks: Callbacks) {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = 1000;
  let generation = 0;
  let opening = false;
  let destroyed = false;
  let roomIds: string[] = [];

  const clearReconnect = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };
  const sendRooms = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "set_rooms", ids: roomIds }));
    }
  };
  const scheduleReconnect = () => {
    if (destroyed || !roomIds.length || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
  };
  const connect = async () => {
    if (destroyed || opening || socket || !roomIds.length) return;
    opening = true;
    const currentGeneration = ++generation;
    try {
      const nextSocket = await getMonitorDanmaSocket();
      if (destroyed || currentGeneration !== generation || !roomIds.length) {
        nextSocket.close();
        return;
      }
      socket = nextSocket;
      nextSocket.onopen = () => {
        reconnectDelay = 1000;
        sendRooms();
      };
      nextSocket.onmessage = (event) => {
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!data || typeof data !== "object" || typeof data.id !== "string") return;
        if (data.type === "danma" && data.message && typeof data.message === "object") {
          callbacks.onMessage(data.id, data.message as Record<string, unknown>);
        } else if (data.type === "error") {
          callbacks.onRoomError(data.id, String(data.message || "弹幕连接失败"));
        }
      };
      nextSocket.onclose = (event) => {
        if (socket !== nextSocket) return;
        socket = null;
        if (event.code === 1008) {
          callbacks.onFatal("弹幕连接被拒绝，请检查连接权限");
          return;
        }
        scheduleReconnect();
      };
    } catch {
      scheduleReconnect();
    } finally {
      opening = false;
      if (!destroyed && roomIds.length && !socket && !reconnectTimer) scheduleReconnect();
    }
  };

  const releaseSocket = () => {
    generation += 1;
    clearReconnect();
    if (socket) {
      socket.onclose = null;
      socket.close();
      socket = null;
    }
  };

  return {
    setRooms(ids: string[]) {
      if (destroyed) return;
      roomIds = [...ids];
      if (!roomIds.length) {
        releaseSocket();
      } else if (socket?.readyState === WebSocket.OPEN) {
        sendRooms();
      } else if (!socket) {
        void connect();
      }
    },
    close() {
      destroyed = true;
      roomIds = [];
      releaseSocket();
    },
  };
}
