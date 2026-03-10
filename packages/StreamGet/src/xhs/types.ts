/**
 * 小红书类型定义
 */

// 直播状态
export type LiveStatus = "success" | "offline";

// 房间信息
export interface RoomInfo {
  roomTitle: string;
  deeplink: string;
  [key: string]: any;
}

// 直播流数据
export interface LiveStreamData {
  liveStatus?: LiveStatus;
  roomData?: {
    roomInfo: RoomInfo;
    hostInfo: {
      nickName: string;
      avatar: string;
    };
  };
  [key: string]: any;
}

// 页面初始状态
export interface InitialState {
  liveStream?: LiveStreamData;
  [key: string]: any;
}

// 直播信息响应
export interface LiveInfoResponse {
  anchor_name?: string;
  is_live: boolean;
  title?: string;
  flv_url?: string;
  m3u8_url?: string;
  avatar?: string;
}
