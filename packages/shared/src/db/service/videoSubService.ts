import type VideoSubModel from "../model/videoSub.js";
import type { VideoSub, VideoSubItem, AddVideoSub, UpdateVideoSub } from "../model/videoSub.js";

export default class VideoSubService {
  private videoSubModel: VideoSubModel;

  constructor({ videoSubModel }: { videoSubModel: VideoSubModel }) {
    this.videoSubModel = videoSubModel;
  }

  add(data: AddVideoSub) {
    return this.videoSubModel.add(data);
  }

  list(options: Partial<VideoSub> = {}): VideoSubItem[] {
    return this.videoSubModel.list(options).map((item) => {
      return {
        ...item,
        enable: !!item.enable,
        options: JSON.parse(item.options),
      };
    });
  }

  query(options: Partial<VideoSub>): VideoSubItem | null {
    const item = this.videoSubModel.query(options);
    if (!item) return null;
    return {
      ...item,
      enable: !!item.enable,
      options: JSON.parse(item.options),
    };
  }

  update(data: UpdateVideoSub) {
    return this.videoSubModel.updateVideoSub(data);
  }

  updateLastRunTime(data: { id: number; lastRunTime: number }) {
    return this.videoSubModel.updateLastRunTime(data);
  }

  delete(id: number) {
    return this.videoSubModel.deleteById(id);
  }
}
