import type { AppRoomConfig, CommonRoomConfig } from "@biliLive-tools/types";
import type { AppConfig } from "@biliLive-tools/shared/config.js";

export interface RoomConfig {
  /* 是否需要压制弹幕 */
  danmu: boolean;
  /* 是否合并到一个文件中 */
  mergePart: boolean;
  /* 最小文件大小 */
  minSize: number;
  /* 上传preset */
  uploadPresetId: string;
  /* 上传标题 */
  title: string;
  /* 弹幕preset */
  danmuPresetId?: string | null;
  /* 视频压制preset */
  videoPresetId?: string | null;
  /* 是否开启 */
  open?: boolean;
  /* 上传uid */
  uid?: number;
  /* 自动合并part时间 */
  partMergeMinute: number;
  /* 高能进度条 */
  hotProgress: boolean;
  /* 使用直播封面 */
  useLiveCover: boolean;
  /** 高能进度条：采样间隔 */
  hotProgressSample?: number;
  /** 高能进度条：高度 */
  hotProgressHeight?: number;
  /** 高能进度条：默认颜色 */
  hotProgressColor?: string;
  /** 高能进度条：覆盖颜色 */
  hotProgressFillColor?: string;
  /** 转封装为mp4 */
  convert2Mp4Option?: boolean;
  /** 转封装后删除源文件 */
  removeSourceAferrConvert2Mp4?: boolean;
  /** flv修复 */
  flvRepair?: boolean;
  /** flv修复后删除源文件 */
  removeAfterFlvRepair?: boolean;
  /** 删除小文件 */
  removeSmallFile?: boolean;
  /** 压制完成后的操作 */
  afterConvertAction: Array<
    | "removeVideo"
    | "removeXml"
    | "removeAfterConvert2Mp4"
    | "removeSmallFile"
    | "removeAfterFlvRepair"
  >;
  /** 是否在处理后删除视频 */
  afterConvertRemoveVideo: boolean;
  /** 是否在处理后删除XML弹幕 */
  afterConvertRemoveXml: boolean;
  /** 限制只在某一段时间上传 */
  limitUploadTime?: boolean;
  /** 允许上传处理时间 */
  uploadHandleTime: [string, string];
  /** 同时上传无弹幕视频 */
  uploadNoDanmu: boolean;
  /** 同时上传无弹幕视频预设 */
  noDanmuVideoPreset: string;
  /** 限制只在某一段时间处理视频 */
  limitVideoConvertTime?: boolean;
  /** 允许视频处理时间 */
  videoHandleTime?: [string, string];
  /** 分p标题模板 */
  partTitleTemplate: string;
  /** 上传完成后删除操作 */
  afterUploadDeletAction: "none" | "delete" | "deleteAfterCheck";
  /** 同步器 */
  syncId?: string | null;
}

/**
 * 配置管理器 - 负责处理webhook配置相关逻辑
 */
export class ConfigManager {
  constructor(private appConfig: AppConfig) {}

  /**
   * 判断房间是否开启
   */
  canRoomOpen(
    roomSetting: { open: boolean } | undefined,
    webhookBlacklist: string,
    roomId: string,
  ): boolean {
    if (roomSetting) {
      // 如果配置了房间，那么以房间设置为准
      return roomSetting.open;
    } else {
      // 如果没有配置房间，那么以黑名单为准
      const blacklist = (webhookBlacklist || "").split(",");
      if (blacklist.includes("*")) return false;
      if (blacklist.includes(String(roomId))) return false;

      return true;
    }
  }

  /**
   * 获取房间配置
   * @param roomId 房间ID
   * @returns 房间配置对象
   */
  getConfig(roomId: string): RoomConfig {
    const appConfigAll = this.appConfig.getAll();
    const roomSetting: AppRoomConfig | undefined = appConfigAll.webhook?.rooms?.[roomId];

    const danmu = this.getRoomSetting("danmu", roomSetting) ?? false;
    const mergePart = this.getRoomSetting("autoPartMerge", roomSetting) ?? false;
    const minSize = this.getRoomSetting("minSize", roomSetting) ?? 10;
    const uploadPresetId = this.getRoomSetting("uploadPresetId", roomSetting) || "default";
    const title = this.getRoomSetting("title", roomSetting) || "";
    const danmuPresetId = this.getRoomSetting("danmuPreset", roomSetting);
    const videoPresetId = this.getRoomSetting("ffmpegPreset", roomSetting);
    const uid = this.getRoomSetting("uid", roomSetting);
    let partMergeMinute = this.getRoomSetting("partMergeMinute", roomSetting) ?? 10;
    const hotProgress = this.getRoomSetting("hotProgress", roomSetting) ?? false;
    const useLiveCover = this.getRoomSetting("useLiveCover", roomSetting) ?? false;
    const hotProgressSample = this.getRoomSetting("hotProgressSample", roomSetting);
    const hotProgressHeight = this.getRoomSetting("hotProgressHeight", roomSetting);
    const hotProgressColor = this.getRoomSetting("hotProgressColor", roomSetting);
    const hotProgressFillColor = this.getRoomSetting("hotProgressFillColor", roomSetting);
    const convert2Mp4 = this.getRoomSetting("convert2Mp4", roomSetting);
    const flvRepair = this.getRoomSetting("flvRepair", roomSetting);
    const limitVideoConvertTime =
      this.getRoomSetting("limitVideoConvertTime", roomSetting) ?? false;
    const videoHandleTime = this.getRoomSetting("videoHandleTime", roomSetting) || [
      "00:00:00",
      "23:59:59",
    ];
    const syncId = this.getRoomSetting("syncId", roomSetting);
    const afterConvertAction = this.getRoomSetting("afterConvertAction", roomSetting) ?? [];

    // TODO: 兼容废弃选项，过渡期后删除
    const removeSourceAferrConvert2Mp4Before = this.getRoomSetting(
      "removeSourceAferrConvert2Mp4",
      roomSetting,
    );
    const removeSourceAferrConvert2Mp4 =
      afterConvertAction.includes("removeAfterConvert2Mp4") || !!removeSourceAferrConvert2Mp4Before;
    const afterConvertRemoveVideoRaw = afterConvertAction.includes("removeVideo");
    const afterConvertRemoveXmlRaw = afterConvertAction.includes("removeXml");
    const afterConvertRemoveFlvRaw = afterConvertAction.includes("removeAfterFlvRepair");
    const removeSmallFile = afterConvertAction.includes("removeSmallFile");

    const limitUploadTime = this.getRoomSetting("limitUploadTime", roomSetting) ?? false;
    const uploadHandleTime = this.getRoomSetting("uploadHandleTime", roomSetting) || [
      "00:00:00",
      "23:59:59",
    ];
    const uploadNoDanmu = this.getRoomSetting("uploadNoDanmu", roomSetting) ?? false;
    const noDanmuVideoPreset = this.getRoomSetting("noDanmuVideoPreset", roomSetting) || "default";

    // 如果没有开启断播续传，那么不需要合并part
    if (!mergePart) partMergeMinute = -1;

    let afterConvertRemoveVideo: boolean = afterConvertRemoveVideoRaw;
    let afterConvertRemoveXml: boolean = afterConvertRemoveXmlRaw;

    // 如果存在同步器，那么使用原始配置，如果未开启，那么只有存在视频预设时才会进行删除
    if (!syncId) {
      if (videoPresetId) {
        afterConvertRemoveVideo = afterConvertRemoveVideoRaw;
      } else {
        afterConvertRemoveVideo = false;
      }
    }
    if (!syncId) {
      if (danmuPresetId) {
        afterConvertRemoveXml = afterConvertRemoveXmlRaw;
      } else {
        afterConvertRemoveXml = false;
      }
    }

    const open = this.canRoomOpen(roomSetting, appConfigAll?.webhook?.blacklist, roomId);

    return {
      danmu,
      mergePart,
      minSize,
      uploadPresetId,
      title,
      danmuPresetId,
      videoPresetId,
      open,
      uid,
      partMergeMinute,
      hotProgress,
      useLiveCover,
      hotProgressSample,
      hotProgressHeight,
      hotProgressColor,
      hotProgressFillColor,
      convert2Mp4Option: convert2Mp4,
      removeSourceAferrConvert2Mp4: convert2Mp4 ? removeSourceAferrConvert2Mp4 : false,
      afterConvertAction,
      afterConvertRemoveVideo,
      afterConvertRemoveXml,
      limitUploadTime,
      uploadHandleTime,
      uploadNoDanmu,
      noDanmuVideoPreset,
      videoHandleTime: limitVideoConvertTime ? videoHandleTime : undefined,
      partTitleTemplate: this.getRoomSetting("partTitleTemplate", roomSetting) || "{{filename}}",
      afterUploadDeletAction: this.getRoomSetting("afterUploadDeletAction", roomSetting) ?? "none",
      syncId,
      flvRepair,
      removeAfterFlvRepair: flvRepair ? afterConvertRemoveFlvRaw : false,
      removeSmallFile,
    };
  }

  /**
   * 获取房间配置项
   * @param key 配置键
   * @param roomSetting 房间设置
   * @returns 配置值
   */
  private getRoomSetting<K extends keyof CommonRoomConfig>(
    key: K,
    roomSetting?: AppRoomConfig,
  ): CommonRoomConfig[K] | undefined {
    const appConfigAll = this.appConfig.getAll();

    if (roomSetting) {
      if (roomSetting.noGlobal?.includes(key)) {
        return roomSetting[key];
      }
      return appConfigAll.webhook?.[key];
    } else {
      return appConfigAll.webhook?.[key];
    }
  }

  /**
   * 获取同步配置
   * @param roomId 房间ID
   * @returns 同步配置或undefined
   */
  getSyncConfig(roomId: string) {
    const { syncId } = this.getConfig(roomId);
    if (!syncId) return null;
    const appConfig = this.appConfig.getAll();
    const syncConfig = appConfig.sync?.syncConfigs?.find((cfg) => cfg.id === syncId);
    if (!syncConfig) return null;
    return syncConfig;
  }
}
