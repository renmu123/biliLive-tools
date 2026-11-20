import request from "./request";

import type { MonitorRoomLayout } from "@biliLive-tools/http/types/monitorRoom.js";

export const getMonitorRoomLayout = async (): Promise<MonitorRoomLayout | null> => {
  const response = await request.get("/common/monitor-room");
  return response.data.payload;
};

export const saveMonitorRoomLayout = async (
  layout: MonitorRoomLayout,
): Promise<MonitorRoomLayout> => {
  const response = await request.put("/common/monitor-room", layout);
  return response.data.payload;
};
