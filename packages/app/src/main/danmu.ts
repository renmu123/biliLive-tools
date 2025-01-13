import { invokeWrap } from "./utils/index";

import { parseDanmu } from "@biliLive-tools/shared/danmu/index.js";
import { genTimeData } from "@biliLive-tools/shared/danmu/hotProgress.js";

export const handlers = {
  "danmu:genTimeData": invokeWrap(genTimeData),
  "danmu:parseDanmu": invokeWrap(parseDanmu),
};
