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
}
