import { EventEmitter } from "node:events";
import { ControlEvent, TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

import type { Comment } from "@bililive-tools/manager";

interface TikTokChatEvent {
  content?: string;
  common?: {
    createTime?: number | string;
  };
  user?: {
    id?: number | string;
    nickname?: string;
    avatarThumb?: {
      urlList?: string[];
    };
  };
}

export interface TikTokLiveConnectionLike {
  connect(): Promise<unknown>;
  disconnect(): Promise<unknown>;
  on(event: string, listener: (...args: any[]) => void): unknown;
}

export interface TikTokDanmaClientOptions {
  auth?: string;
  connectionFactory?: (uniqueId: string, auth?: string) => TikTokLiveConnectionLike;
  maxRetryCount?: number;
  retryDelay?: number;
}

const createConnection = (uniqueId: string, auth?: string): TikTokLiveConnectionLike => {
  const cookies = new Map(
    auth
      ?.split(";")
      .map((item) => item.trim().split(/=(.*)/s, 2))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, value] as const),
  );
  const sessionId = cookies.get("sessionid");

  return new TikTokLiveConnection(uniqueId, {
    // 不处理连接前的历史消息，避免把录制前的评论写入 XML。
    processInitialData: false,
    // 录制器已确认直播状态，无需重复请求房间信息。
    fetchRoomInfoOnConnect: false,
    ...(sessionId
      ? {
          session: {
            cookie: {
              type: "cookie" as const,
              value: {
                sessionId,
                ttTargetIdc: cookies.get("tt-target-idc") ?? "",
              },
            },
          },
        }
      : {}),
  }) as unknown as TikTokLiveConnectionLike;
};

function getTimestamp(value: number | string | undefined): number {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return Date.now();
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
}

export class TikTokDanmaClient extends EventEmitter {
  private connection: TikTokLiveConnectionLike | null = null;
  private readonly connectionFactory: NonNullable<TikTokDanmaClientOptions["connectionFactory"]>;
  private readonly maxRetryCount: number;
  private readonly retryDelay: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private stopped = true;
  private connectionGeneration = 0;

  constructor(
    private readonly uniqueId: string,
    {
      auth,
      connectionFactory = createConnection,
      maxRetryCount = 10,
      retryDelay = 2_000,
    }: TikTokDanmaClientOptions = {},
  ) {
    super();
    this.auth = auth;
    this.connectionFactory = connectionFactory;
    this.maxRetryCount = maxRetryCount;
    this.retryDelay = retryDelay;
  }

  private readonly auth: string | undefined;

  async start(): Promise<void> {
    this.stopped = false;
    this.retryCount = 0;
    await this.connect();
  }

  private async connect(): Promise<void> {
    if (this.stopped) return;

    const connectionGeneration = ++this.connectionGeneration;
    const previousConnection = this.connection;
    if (previousConnection) {
      void previousConnection.disconnect().catch((error) => this.emit("ConnectionError", error));
    }
    const connection = this.connectionFactory(this.uniqueId, this.auth);
    this.connection = connection;

    connection.on(WebcastEvent.CHAT, (data: TikTokChatEvent) => {
      const text = data.content?.trim().replace(/[\r\n]/g, "");
      if (!text) return;

      const comment: Comment = {
        type: "comment",
        timestamp: getTimestamp(data.common?.createTime),
        text,
        sender: {
          uid: data.user?.id == null ? undefined : String(data.user.id),
          name: data.user?.nickname || data.user?.id?.toString() || "未知用户",
          avatar: data.user?.avatarThumb?.urlList?.[0],
        },
      };
      this.emit("Message", comment);
    });
    connection.on(ControlEvent.DISCONNECTED, () => {
      if (
        this.stopped ||
        this.connection !== connection ||
        connectionGeneration !== this.connectionGeneration
      ) {
        return;
      }
      this.emit("close");
      this.scheduleReconnect();
    });
    connection.on(ControlEvent.ERROR, (error: unknown) => {
      if (
        this.stopped ||
        this.connection !== connection ||
        connectionGeneration !== this.connectionGeneration
      ) {
        return;
      }
      this.emit("ConnectionError", error);
      this.scheduleReconnect();
    });

    try {
      await connection.connect();
      if (
        this.stopped ||
        this.connection !== connection ||
        connectionGeneration !== this.connectionGeneration
      ) {
        return;
      }
      this.retryCount = 0;
      this.emit("open");
    } catch (error) {
      if (
        this.stopped ||
        this.connection !== connection ||
        connectionGeneration !== this.connectionGeneration
      ) {
        return;
      }
      this.emit("ConnectionError", error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.stopped) return;
    if (this.retryCount >= this.maxRetryCount) {
      this.emit("RetryExhausted", { maxRetry: this.maxRetryCount });
      return;
    }

    this.retryCount += 1;
    const delay = Math.min(this.retryDelay * 2 ** (this.retryCount - 1), 30_000);
    this.emit("reconnect", { retryCount: this.retryCount, maxRetry: this.maxRetryCount, delay });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  stop() {
    this.stopped = true;
    this.connectionGeneration += 1;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const connection = this.connection;
    this.connection = null;
    if (connection) {
      void connection.disconnect().catch((error) => this.emit("ConnectionError", error));
    }
  }
}

export default TikTokDanmaClient;
