import type VideoSubDataModel from "../model/videoSubData.js";
import type { BaseVideoSubData } from "../model/videoSubData.js";

export default class VideoSubDataService {
  private videoSubDataModel: VideoSubDataModel;

  constructor({ videoSubDataModel }: { videoSubDataModel: VideoSubDataModel }) {
    this.videoSubDataModel = videoSubDataModel;
  }

  add(options: BaseVideoSubData) {
    return this.videoSubDataModel.add(options);
  }

  list(options: { platform: "douyu" | "huya"; subId: string }) {
    return this.videoSubDataModel.list(options);
  }

  delete(id: number) {
    return this.videoSubDataModel.deleteById(id);
  }
}
