import type VirtualRecordModel from "../model/virtualRecord.js";

export default class VirtualRecordService {
  private virtualRecordModel: VirtualRecordModel;

  constructor({ virtualRecordModel }: { virtualRecordModel: VirtualRecordModel }) {
    this.virtualRecordModel = virtualRecordModel;
  }

  add({ path }: { path: string }) {
    return this.virtualRecordModel.add({ path });
  }

  list() {
    return this.virtualRecordModel.list({});
  }

  delete(id: number) {
    return this.virtualRecordModel.deleteById(id);
  }
}
