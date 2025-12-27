import { TypedEmitter } from "tiny-typed-emitter";
import type {
  ChatMessage,
  MemberMessage,
  LikeMessage,
  SocialMessage,
  GiftMessage,
  RoomUserSeqMessage,
  RoomStatsMessage,
  RoomRankMessage,
  Message,
  PrivilegeScreenChatMessage,
} from "../types/types.js";
import WebSocket from "ws";

interface Events {
  open: () => void;
  close: () => void;
  reconnect: (count: number) => void;
  heartbeat: () => void;
  error: (error: Error) => void;
  chat: (message: ChatMessage) => void;
  member: (message: MemberMessage) => void;
  like: (message: LikeMessage) => void;
  social: (message: SocialMessage) => void;
  gift: (message: GiftMessage) => void;
  roomUserSeq: (message: RoomUserSeqMessage) => void;
  roomStats: (message: RoomStatsMessage) => void;
  roomRank: (message: RoomRankMessage) => void;
  message: (message: Message) => void;
  privilegeScreenChat: (message: PrivilegeScreenChatMessage) => void;
}
declare class DouYinDanmaClient extends TypedEmitter<Events> {
  private ws: WebSocket;
  constructor(
    roomId: string,
    options?: {
      autoStart?: boolean;
      autoReconnect?: number;
      heartbeatInterval?: number;
      cookie?: string;
    },
  );
  connect(): Promise<void>;
}
export default DouYinDanmaClient;
