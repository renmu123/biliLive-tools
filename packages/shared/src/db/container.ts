import { createContainer, asClass, asValue, InjectionMode } from "awilix";

import StatisticsModel from "./model/statistics.js";
import VirtualRecordModel from "./model/virtualRecord.js";
import VideoSubDataModel from "./model/videoSubData.js";

import StatisticsService from "./service/statisticsService.js";
import VirtualRecordService from "./service/virtualRecordService.js";
import VideoSubDataService from "./service/videoSubDataService.js";

import type { Database } from "better-sqlite3";

export interface Container {
  db: Database;
  statisticsModel: StatisticsModel;
  virtualRecordModel: VirtualRecordModel;
  videoSubDataModel: VideoSubDataModel;

  statisticsService: StatisticsService;
  virtualRecordService: VirtualRecordService;
  videoSubDataService: VideoSubDataService;
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
  });

  // Register all Services
  container.register({
    statisticsService: asClass(StatisticsService).singleton(),
    virtualRecordService: asClass(VirtualRecordService).singleton(),
    videoSubDataService: asClass(VideoSubDataService).singleton(),
  });

  return container;
}
