import Client from "biliAPI";
import { BILIUP_COOKIE_PATH } from "./appConstant";
import { type IpcMainInvokeEvent } from "electron";

type ClientInstance = InstanceType<typeof Client>;

export class BiliClient {
  client: Client;
  constructor(cookiePath?: string) {
    this.client = new Client();
    this.client.loadCookieFile(cookiePath || BILIUP_COOKIE_PATH);
  }
  getArchives(_event: IpcMainInvokeEvent, params: Parameters<ClientInstance["getArchives"]>[0]) {
    return this.client.getArchives(params);
  }
  // async login(username: string, password: string) {
  //   return await this.client.login(username, password);
  // }
  // async uploadVideo(videoPath: string, options: any) {
  //   return await this.client.uploadVideo(videoPath, options);
  // }
  // async uploadVideoWithPreset(videoPath: string, presetId: string) {
  //   return await this.client.uploadVideoWithPreset(videoPath, presetId);
  // }
  // async getVideoInfo(aid: string) {
  //   return await this.client.getVideoInfo(aid);
  // }
  // async getVideoInfoByBvid(bvid: string) {
  //   return await this.client.getVideoInfoByBvid(bvid);
  // }
  // async getVideoInfoByCid(cid: string) {
  //   return await this.client.getVideoInfoByCid(cid);
  // }
  // async getVideoInfoByPcid(pcid: string) {
  //   return await this.client.getVideoInfoByPcid(pcid);
  // }
  // async getVideoInfoBySeasonId(seasonId: string) {
  //   return await this.client.getVideoInfoBySeasonId(seasonId);
  // }
  // async getVideoInfoBySeasonType(seasonType: string) {
  //   return await this.client.getVideoInfoBySeasonType(seasonType);
  // }
  // async getVideoInfoBySeasonIdAndType(seasonId: string, seasonType: string) {
  //   return await this.client.getVideoInfoBySeasonIdAndType(seasonId, seasonType);
  // }
  // async getVideoInfoByEpId(epId: string) {
  //   return await this.client.getVideoInfoByEpId(epId);
  // }
  // async getVideoInfoByEpIdAndType(epId: string, epType: string) {
  //   return await this.client.getVideoInfoByEpIdAndType(epId, epType);
  // }
  // async getVideoInfoByBvidAndType(bvid: string, type: string) {
  //   return await this.client.getVideoInfoByBvidAndType(bvid, type);
  // }
}
