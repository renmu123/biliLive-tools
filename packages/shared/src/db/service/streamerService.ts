import type StreamerModel from "../model/streamer.js";
import type { BaseStreamer, Streamer } from "../model/streamer.js";

export default class StreamerService {
  private streamerModel: StreamerModel;

  constructor({ streamerModel }: { streamerModel: StreamerModel }) {
    this.streamerModel = streamerModel;
  }

  add(options: BaseStreamer) {
    return this.streamerModel.add(options);
  }

  addMany(list: BaseStreamer[]) {
    return this.streamerModel.addMany(list);
  }

  list(options: Partial<Streamer> = {}): Streamer[] {
    return this.streamerModel.list(options);
  }

  query(options: Partial<Streamer>) {
    return this.streamerModel.query(options);
  }

  upsert(options: { where: Partial<Streamer & { id: number }>; create: BaseStreamer }) {
    return this.streamerModel.upsert(options);
  }

  /**
   * 批量查询多个频道的主播信息
   * @param channels 频道信息数组
   * @returns 主播信息数组
   */
  batchQueryByChannels(
    channels: Array<{ room_id: string; platform: string }>,
  ): ReturnType<StreamerModel["batchQueryByChannels"]> {
    return this.streamerModel.batchQueryByChannels(channels);
  }
}
