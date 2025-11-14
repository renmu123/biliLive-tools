import type UploadPartModel from "../model/uploadPart.js";
import type { BaseUploadPart, UploadPart } from "../model/uploadPart.js";

export default class UploadPartService {
  private uploadPartModel: UploadPartModel;

  constructor({ uploadPartModel }: { uploadPartModel: UploadPartModel }) {
    this.uploadPartModel = uploadPartModel;
  }

  add(options: BaseUploadPart) {
    return this.uploadPartModel.add(options);
  }

  addOrUpdate(options: Omit<BaseUploadPart, "expire_time">) {
    return this.uploadPartModel.addOrUpdate(options);
  }

  findByHash(file_hash: string, file_size: number) {
    return this.uploadPartModel.findByHash(file_hash, file_size);
  }

  findValidPartByHash(file_hash: string, file_size: number): UploadPart | null {
    return this.uploadPartModel.findValidPartByHash(file_hash, file_size);
  }

  removeExpired() {
    return this.uploadPartModel.removeExpired();
  }

  removeByCids(cids: number[]) {
    return this.uploadPartModel.removeByCids(cids);
  }
}
