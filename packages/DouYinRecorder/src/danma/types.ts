interface AvatarThumb {
  urlListList: string[];
  uri: string;
  avgColor: string;
}

interface BadgeImage {
  urlListList: string[];
  height: string;
  width: string;
  imageType: number;
  content: {
    level: string;
    alternativeText: string;
  };
}

interface User {
  id: string;
  nickName: string;
  AvatarThumb: AvatarThumb;
  BadgeImageList: BadgeImage[];
}

interface AnchorDisplayText {
  key: string;
  defaultPatter: string;
  defaultFormat: {
    color: string;
    weight: number;
  };
  piecesList: {
    type: boolean;
    format: {
      color: string;
      weight: number;
    };
  }[];
}

interface DisplayControlInfo {
  showText: boolean;
  showIcons: boolean;
}

interface Image {
  urlListList: string[];
  uri: string;
  avgColor: string;
}

interface Gift {
  image: Image;
  describe: string;
  id: string;
  forLinkmic: boolean;
  combo: boolean;
  type: number;
  diamondCount: number;
  isDisplayedOnPanel: boolean;
  name: string;
  icon: Image;
}

interface UserLabel {
  urlListList: string[];
  uri: string;
  avgColor: string;
}

interface PublicAreaCommon {
  userLabel: UserLabel;
}

interface Format {
  color: string;
  weight: number;
  useRemoteClor: boolean;
}

interface Piece {
  type: boolean;
  format: Format;
}

interface TrayDisplayText {
  key: string;
  defaultPatter: string;
  defaultFormat: Format;
  piecesList: Piece[];
}

interface Rank {
  user: User;
  rank: string;
}

export interface ChatMessage {
  common: {
    method: "WebcastChatMessage";
    msgId: string;
    roomId: string;
    isShowMsg: boolean;
    priorityScore: string;
  };
  user: User;
  content: string;
  giftImage: {
    urlListList: string[];
    width: string;
    content: Record<string, unknown>;
  };
  individualChatPriority: number;
}

export interface MemberMessage {
  common: {
    method: "WebcastMemberMessage";
    msgId: string;
    roomId: string;
    isShowMsg: boolean;
    foldType: string;
    anchorFoldType: string;
    priorityScore: string;
    anchorFoldTypeV2: string;
  };
  user: User;
  memberCount: string;
  action: string;
  anchorDisplayText: AnchorDisplayText;
  publicAreaCommon: Record<string, unknown>;
}

export interface LikeMessage {
  common: {
    method: "WebcastLikeMessage";
    msgId: string;
    roomId: string;
    isShowMsg: boolean;
    anchorFoldType: string;
    anchorFoldTypeV2: string;
  };
  count: string;
  total: string;
  user: User;
  displayControlInfo: DisplayControlInfo;
}

export interface SocialMessage {
  common: {
    method: "WebcastSocialMessage";
    msgId: string;
    roomId: string;
    isShowMsg: boolean;
    priorityScore: string;
  };
  user: User;
  action: string;
  shareTarget: string;
  followCount: string;
  publicAreaCommon: Record<string, unknown>;
}

export interface GiftMessage {
  common: {
    method: "WebcastSocialMessage";
    msgId: string;
    roomId: string;
    isShowMsg: boolean;
    priorityScore: string;
  };
  user: User;
  groupId: string;
  gift: Gift;
  publicAreaCommon: PublicAreaCommon;
  trayDisplayText: TrayDisplayText;
  totalCount: string;
  clientGiftSource: number;
  sendTime: string;
}

export interface RoomUserSeqMessage {
  common: {
    method: "WebcastRoomUserSeqMessage";
    msgId: string;
    roomId: string;
    createTime: string;
  };
  ranksList: Rank[];
  total: string;
  totalUser: string;
  totalUserStr: string;
  totalStr: string;
  onlineUserForAnchor: string;
  totalPvForAnchor: string;
}

export interface RoomStatsMessage {
  common: {
    method: "WebcastRoomStatsMessage";
    msgId: string;
    roomId: string;
    createTime: string;
  };
  displayShort: string;
  displayMiddle: string;
  displayLong: string;
  displayValue: string;
  displayVersion: string;
  total: string;
  displayType: string;
}

export interface RoomRankMessage {
  common: {
    method: "WebcastRoomRankMessage";
    msgId: string;
    roomId: string;
    createTime: string;
  };
  ranks: {
    user: User;
  }[];
}

export type Message =
  | ChatMessage
  | MemberMessage
  | LikeMessage
  | SocialMessage
  | GiftMessage
  | RoomUserSeqMessage
  | RoomStatsMessage
  | RoomRankMessage;
