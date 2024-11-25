import { streamerModel, liveModel } from "../index.js";

import type { BaseLive } from "../model/live.js";
import type { BaseStreamer } from "../model/streamer.js";

export default class LiveService {
  static addWithStreamer(data: Omit<BaseLive, "streamer_id"> & BaseStreamer) {
    const streamer = streamerModel.upsert({
      where: {
        room_id: data.room_id,
        platform: data.platform,
      },
      create: {
        name: data.name,
        room_id: data.room_id,
        platform: data.platform,
      },
    });
    if (!streamer) return null;

    const live = liveModel.upsert({
      where: {
        streamer_id: streamer.id,
        start_time: data.start_time,
      },
      create: {
        title: data.title,
        streamer_id: streamer.id,
        start_time: data.start_time,
        video_file: data.video_file,
      },
    });
    return live;
  }
  static upadteEndTime(video_file: string, end_time: number) {
    const live = liveModel.query({ video_file });
    if (live) {
      liveModel.update({
        id: live.id,
        end_time,
      });
      return {
        ...live,
        end_time,
      };
    }

    return null;
  }
}
