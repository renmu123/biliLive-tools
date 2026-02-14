/**
 * DouYu 平台类型定义
 */

export interface SourceProfile {
  name: string;
  cdn: string;
  isH265: boolean;
}

export interface StreamProfile {
  name: string;
  rate: number;
  highBit: number;
  bit: number;
  diamondFan: number;
}

export interface GetH5PlaySuccessData {
  room_id: number;
  is_mixed: false;
  mixed_live: string;
  mixed_url: string;
  rtmp_cdn: string;
  rtmp_url: string;
  rtmp_live: string;
  client_ip: string;
  inNA: number;
  rateSwitch: number;
  rate: number;
  cdnsWithName: SourceProfile[];
  multirates: StreamProfile[];
  isPassPlayer: number;
  eticket: null;
  online: number;
  mixedCDN: string;
  p2p: number;
  streamStatus: number;
  smt: number;
  p2pMeta: unknown;
  p2pCid: number;
  p2pCids: string;
  player_1: string;
  h265_p2p: number;
  h265_p2p_cid: number;
  h265_p2p_cids: string;
  acdn: string;
  av1_url: string;
  rtc_stream_url: string;
  rtc_stream_config: string;
}

export interface RoomInfo {
  room: {
    /** 主播id */
    up_id: string;
    /** 主播昵称 */
    nickname: string;
    /** 主播头像 */
    avatar: {
      big: string;
      middle: string;
      small: string;
    };
    /** 直播间标题 */
    room_name: string;
    /** 直播间封面 */
    room_pic: string;
    /** 直播间号 */
    room_id: number;
    /** 直播状态，1是正在直播 */
    status: "1" | string;
    /** 轮播：1是正在轮播 */
    videoLoop: 1 | number;
    /** 开播时间，秒时间戳 */
    show_time: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface LiveInfoResult {
  living: boolean;
  sources?: SourceProfile[];
  streams?: StreamProfile[];
  isSupportRateSwitch?: boolean;
  isOriginalStream?: boolean;
  currentStream?: {
    onlyAudio: boolean;
    source: string;
    name: string;
    rate: number;
    url: string;
  };
}
