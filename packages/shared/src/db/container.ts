import { createContainer, asClass, asValue, InjectionMode } from "awilix";

import StatisticsModel from "./model/statistics.js";
import VirtualRecordModel from "./model/virtualRecord.js";
import VideoSubDataModel from "./model/videoSubData.js";
import StreamerModel from "./model/streamer.js";
import VideoSubModel from "./model/videoSub.js";
import RecordHistoryModel from "./model/recordHistory.js";

import StatisticsService from "./service/statisticsService.js";
import VirtualRecordService from "./service/virtualRecordService.js";
import VideoSubDataService from "./service/videoSubDataService.js";
import StreamerService from "./service/streamerService.js";
import VideoSubService from "./service/videoSubService.js";
import RecordHistoryService from "./service/recordHistoryService.js";

import type { Database } from "better-sqlite3";

export interface Container {
  db: Database;
  statisticsModel: StatisticsModel;
  virtualRecordModel: VirtualRecordModel;
  videoSubDataModel: VideoSubDataModel;
  streamerModel: StreamerModel;
  videoSubModel: VideoSubModel;
  recordHistoryModel: RecordHistoryModel;

  statisticsService: StatisticsService;
  virtualRecordService: VirtualRecordService;
  videoSubDataService: VideoSubDataService;
  streamerService: StreamerService;
  videoSubService: VideoSubService;
  recordHistoryService: RecordHistoryService;
}

export function setupContainer(db: Database) {
  const container = createContainer<Container>({
    injectionMode: InjectionMode.PROXY,
  });

  // Register database instance
  container.register({
    db: asValue(db),
  });

  // Register all Repositories
  container.register({
    statisticsModel: asClass(StatisticsModel).singleton(),
    virtualRecordModel: asClass(VirtualRecordModel).singleton(),
    videoSubDataModel: asClass(VideoSubDataModel).singleton(),
    streamerModel: asClass(StreamerModel).singleton(),
    videoSubModel: asClass(VideoSubModel).singleton(),
    recordHistoryModel: asClass(RecordHistoryModel).singleton(),
  });

  // Register all Services
  container.register({
    statisticsService: asClass(StatisticsService).singleton(),
    virtualRecordService: asClass(VirtualRecordService).singleton(),
    videoSubDataService: asClass(VideoSubDataService).singleton(),
    streamerService: asClass(StreamerService).singleton(),
    videoSubService: asClass(VideoSubService).singleton(),
    recordHistoryService: asClass(RecordHistoryService).singleton(),
  });

  return container;
}
