export const MONITOR_ROOM_SIZES = [
  "1x1",
  "2x1",
  "1x2",
  "2x2",
  "3x1",
  "1x3",
  "3x2",
  "2x3",
  "3x3",
] as const;
export const MONITOR_ROOM_STAT_KEY = "monitor_room_layout";

export type MonitorRoomSize = (typeof MONITOR_ROOM_SIZES)[number];

export type MonitorRoomLayout = {
  manageButtonVisible: boolean;
  hideTitleBar: boolean;
  rooms: Array<{ id: string; size: MonitorRoomSize; muted: boolean; volume: number }>;
};
