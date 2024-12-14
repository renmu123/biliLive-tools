import {
  listenAll
} from "./chunk-5NTNTWA4.js";

// src/index.ts
import { KeepLiveTCP } from "tiny-bilibili-ws";

// src/types/const.ts
var GuardLevel = /* @__PURE__ */ ((GuardLevel2) => {
  GuardLevel2[GuardLevel2["None"] = 0] = "None";
  GuardLevel2[GuardLevel2["Zongdu"] = 1] = "Zongdu";
  GuardLevel2[GuardLevel2["Tidu"] = 2] = "Tidu";
  GuardLevel2[GuardLevel2["Jianzhang"] = 3] = "Jianzhang";
  return GuardLevel2;
})(GuardLevel || {});

// src/index.ts
var startListen = (roomId, handler, options) => {
  const live = new KeepLiveTCP(roomId, options?.ws);
  listenAll(live, roomId, handler);
  const listenerInstance = {
    live,
    roomId: live.roomId,
    online: live.online,
    closed: live.closed,
    close: () => live.close(),
    getAttention: () => live.getOnline(),
    getOnline: () => live.getOnline(),
    reconnect: () => live.reconnect(),
    heartbeat: () => live.heartbeat(),
    send: (op, data) => live.send(op, data)
  };
  return listenerInstance;
};
export {
  GuardLevel,
  startListen
};
