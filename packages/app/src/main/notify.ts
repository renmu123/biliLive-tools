import { send, _send } from "@biliLive-tools/shared/lib/notify";

import type { IpcMainInvokeEvent } from "electron";
import type { AppConfig } from "@biliLive-tools/types";

export const handlers = {
  "notify:send": async (_event: IpcMainInvokeEvent, title: string, desp: string) => {
    send(title, desp);
  },
  "notify:sendTest": async (
    _event: IpcMainInvokeEvent,
    title: string,
    desp: string,
    options: AppConfig,
  ) => {
    _send(title, desp, options);
  },
};
