import path from "node:path";
import Database from "better-sqlite3";
import { createContainer, asClass, asValue, asFunction, InjectionMode } from "awilix";

import StatisticsModel from "./model/statistics.js";
import VirtualRecordModel from "./model/virtualRecord.js";
import VideoSubDataModel from "./model/videoSubData.js";
import StreamerModel from "./model/streamer.js";
import VideoSubModel from "./model/videoSub.js";
import RecordHistoryModel from "./model/recordHistory.js";
import UploadPartModel from "./model/uploadPart.js";

import StatisticsService from "./service/statisticsService.js";
import VirtualRecordService from "./service/virtualRecordService.js";
import VideoSubDataService from "./service/videoSubDataService.js";
import StreamerService from "./service/streamerService.js";
import VideoSubService from "./service/videoSubService.js";
import RecordHistoryService from "./service/recordHistoryService.js";
import UploadPartService from "./service/uploadPartService.js";
import DanmuService from "./service/danmuService.js";

import type { Database as DatabaseType } from "better-sqlite3";

export interface Container {
  db: DatabaseType;
  danmuDb: DatabaseType;

  mainDbPath: string;
  danmuDbPath: string;
  dbRootPath: string;

  statisticsModel: StatisticsModel;
  virtualRecordModel: VirtualRecordModel;
  videoSubDataModel: VideoSubDataModel;
  streamerModel: StreamerModel;
  videoSubModel: VideoSubModel;
  recordHistoryModel: RecordHistoryModel;
  uploadPartModel: UploadPartModel;

  statisticsService: StatisticsService;
  virtualRecordService: VirtualRecordService;
  videoSubDataService: VideoSubDataService;
  streamerService: StreamerService;
  videoSubService: VideoSubService;
  recordHistoryService: RecordHistoryService;
  uploadPartService: UploadPartService;
  danmuService: DanmuService;
}

/**
 * 创建数据库连接工厂函数
 */
function createDatabase({ mainDbPath }: { mainDbPath: string }): DatabaseType {
  const db = Database(mainDbPath);
  // 启用外键支持
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  return db;
}

/**
 * 创建弹幕数据库连接工厂函数
 */
function createDanmuDatabase({ danmuDbPath }: { danmuDbPath: string }): DatabaseType {
  const db = Database(danmuDbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  return db;
}

export function setupContainer(dbRootPath: string) {
  const mainDbPath = path.join(dbRootPath, "app.db");
  const danmuDbPath = path.join(dbRootPath, "dm0.db");

  const container = createContainer<Container>({
    injectionMode: InjectionMode.PROXY,
  });

  // Register database paths
  container.register({
    dbRootPath: asValue(dbRootPath),
    mainDbPath: asValue(mainDbPath),
    danmuDbPath: asValue(danmuDbPath),
  });

  // Register database instances using factory functions
  container.register({
    db: asFunction(createDatabase).singleton(),
    danmuDb: asFunction(createDanmuDatabase).singleton(),
  });

  // Register all Repositories
  container.register({
    statisticsModel: asClass(StatisticsModel).singleton(),
    virtualRecordModel: asClass(VirtualRecordModel).singleton(),
    videoSubDataModel: asClass(VideoSubDataModel).singleton(),
    streamerModel: asClass(StreamerModel).singleton(),
    videoSubModel: asClass(VideoSubModel).singleton(),
    recordHistoryModel: asClass(RecordHistoryModel).singleton(),
    uploadPartModel: asClass(UploadPartModel).singleton(),
  });

  // Register all Services
  container.register({
    statisticsService: asClass(StatisticsService).singleton(),
    virtualRecordService: asClass(VirtualRecordService).singleton(),
    videoSubDataService: asClass(VideoSubDataService).singleton(),
    streamerService: asClass(StreamerService).singleton(),
    videoSubService: asClass(VideoSubService).singleton(),
    recordHistoryService: asClass(RecordHistoryService).singleton(),
    uploadPartService: asClass(UploadPartService).singleton(),
    danmuService: asClass(DanmuService).singleton(),
  });

  return container;
}
