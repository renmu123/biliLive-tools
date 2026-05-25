import type SubtitleStyleModel from "../model/subtitleStyle.js";
import type { SubtitleStyleConfig } from "../model/subtitleStyle.js";

export default class SubtitleStyleService {
  private subtitleStyleModel: SubtitleStyleModel;

  constructor({ subtitleStyleModel }: { subtitleStyleModel: SubtitleStyleModel }) {
    this.subtitleStyleModel = subtitleStyleModel;
  }

  add(options: { id: string; config: SubtitleStyleConfig }) {
    return this.subtitleStyleModel.add(options);
  }

  update(id: string, config: SubtitleStyleConfig) {
    const data = JSON.stringify(config);
    //@ts-ignore
    return this.subtitleStyleModel.update({ id, config: data });
  }

  get(id: string) {
    return this.subtitleStyleModel.get(id);
  }

  list() {
    const list = this.subtitleStyleModel.list({});
    return list.map((item) => ({
      id: item.id as string,
      config: JSON.parse(item.config),
    }));
  }

  remove(id: string) {
    return this.subtitleStyleModel.remove(id);
  }
}
