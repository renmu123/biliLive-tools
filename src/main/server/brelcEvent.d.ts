import { type } from "os";

// 用户信息类型定义
interface UserInfo {
  name: string;
  gender: string;
  face: string;
  uid: number;
  level: number;
  sign: string;
}

// 直播间信息类型定义
interface RoomInfo {
  uid: number;
  room_id: number;
  short_room_id: number;
  area_id: number;
  area_name: string;
  parent_area_id: number;
  parent_area_name: string;
  live_status: number;
  live_start_time: number;
  online: number;
  title: string;
  cover: string;
  tags: string;
  description: string;
}

// 事件数据的通用结构
interface CommonEventData {
  user_info: UserInfo;
  room_info: RoomInfo;
}
interface CommonEvent {
  id: string;
  date: string;
  type: string;
  data: any;
}

// 不同事件类型的定义
interface LiveBeganEvent extends CommonEvent {
  type: "LiveBeganEvent";
  data: CommonEventData;
}

interface LiveEndedEvent extends CommonEvent {
  type: "LiveEndedEvent";
  data: CommonEventData;
}

interface RoomChangeEvent extends CommonEvent {
  type: "RoomChangeEvent";
  data: {
    room_info: RoomInfo;
  };
}

interface RecordingStartedEvent extends CommonEvent {
  type: "RecordingStartedEvent";
  data: CommonEventData;
}

interface RecordingFinishedEvent extends CommonEvent {
  type: "RecordingFinishedEvent";
  data: CommonEventData;
}

interface RecordingCancelledEvent extends CommonEvent {
  type: "RecordingCancelledEvent";
  data: {
    room_info: RoomInfo;
  };
}

interface VideoFileCreatedEvent extends CommonEvent {
  type: "VideoFileCreatedEvent";
  data: {
    room_id: number;
    path: string;
  };
}

interface VideoFileCompletedEvent extends CommonEvent {
  type: "VideoFileCompletedEvent";
  data: {
    room_id: number;
    path: string;
  };
}

interface DanmakuFileCreatedEvent extends CommonEvent {
  type: "DanmakuFileCreatedEvent";
  data: {
    room_id: number;
    path: string;
  };
}

interface DanmakuFileCompletedEvent extends CommonEvent {
  type: "DanmakuFileCompletedEvent";
  data: {
    room_id: number;
    path: string;
  };
}

interface RawDanmakuFileCreatedEvent extends CommonEvent {
  type: "RawDanmakuFileCreatedEvent";
  data: {
    room_id: number;
    path: string;
  };
}

interface RawDanmakuFileCompletedEvent extends CommonEvent {
  type: "RawDanmakuFileCompletedEvent";
  data: {
    room_id: number;
    path: string;
  };
}

interface VideoPostprocessingCompletedEvent extends CommonEvent {
  type: "VideoPostprocessingCompletedEvent";
  data: {
    room_id: number;
    path: string;
  };
}

interface SpaceNoEnoughEvent extends CommonEvent {
  type: "SpaceNoEnoughEvent";
  data: {
    path: string;
    threshold: number;
    usage: {
      total: number;
      used: number;
      free: number;
    };
  };
}

interface ErrorEvent extends CommonEvent {
  type: "Error";
  data: {
    name: string;
    detail: string;
  };
}

// 联合类型，包括所有可能的事件类型
export type BlrecEventType =
  | LiveBeganEvent
  | LiveEndedEvent
  | RoomChangeEvent
  | RecordingStartedEvent
  | RecordingFinishedEvent
  | RecordingCancelledEvent
  | VideoFileCreatedEvent
  | VideoFileCompletedEvent
  | DanmakuFileCreatedEvent
  | DanmakuFileCompletedEvent
  | RawDanmakuFileCreatedEvent
  | RawDanmakuFileCompletedEvent
  | VideoPostprocessingCompletedEvent
  | SpaceNoEnoughEvent
  | ErrorEvent;
