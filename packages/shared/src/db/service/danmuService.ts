import {
  //  streamerModel,
  //  liveModel,
  danmuModel,
} from "../index.js";

// import type { DanmuItem } from "@biliLive-tools/types";
import type { BaseDanmu } from "../model/danmu.js";

export default class DanmuService {
  // addWithStreamer(list: DanmuItem[]) {
  //   if (!Array.isArray(list)) return;
  //   const streamMap = new Map();
  //   const liveMap = new Map();

  //   const danmaList: (DanmuItem & BaseDanmu)[] = [];
  //   for (const item of list) {
  //     const options: DanmuItem & BaseDanmu = item;
  //     let streamer_id: number | undefined;

  //     // 如果有streamer和room_id，就去查找或新建streamer_id
  //     if (options.streamer && options.room_id) {
  //       const key = `${options.room_id}-${options.streamer}`;

  //       if (!streamMap.has(key)) {
  //         const streamer = streamerModel.upsert({
  //           where: {
  //             name: options.streamer,
  //             room_id: options.room_id,
  //           },
  //           create: {
  //             name: options.streamer,
  //             room_id: options.room_id,
  //             platform: options.platform,
  //           },
  //         });
  //         if (!streamer?.id) {
  //           throw new Error("streamer upsert failed");
  //         }
  //         streamMap.set(key, streamer.id);
  //       }
  //       streamer_id = streamMap.get(key);
  //     }
  //     // 如果有streamer_id和live_start_time和live_title，就去查找或新建live
  //     if (streamer_id && options.live_start_time && options.live_title) {
  //       const key = `${streamer_id}-${options.live_start_time}`;
  //       if (!liveMap.has(key)) {
  //         const live = liveModel.upsert({
  //           where: {
  //             streamer_id: streamer_id,
  //             start_time: options.live_start_time,
  //           },
  //           create: {
  //             title: options.live_title,
  //             streamer_id: streamer_id,
  //             start_time: options.live_start_time,
  //           },
  //         });
  //         if (!live?.id) {
  //           throw new Error("live upsert failed");
  //         }
  //         liveMap.set(key, live.id);
  //       }
  //       options.live_id = liveMap.get(key);
  //     }
  //     danmaList.push(options);
  //   }

  //   danmuModel.addMany(danmaList);
  //   return true;
  // }
  static addMany(list: BaseDanmu[]) {
    return danmuModel.addMany(list);
  }
}
