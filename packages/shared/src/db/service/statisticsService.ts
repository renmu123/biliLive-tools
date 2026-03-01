import type StatisticsModel from "../model/statistics.js";

/**
 * start_time: 记录程序启动时间
 * pan123_token: 记录123网盘的token
 * bili_last_upload_time: 记录上次上传到b站的时间
 */
type Key = "start_time" | "pan123_token" | "bili_last_upload_time" | string;

export default class StatisticsService {
  private statisticsModel: StatisticsModel;
  constructor({ statisticsModel }: { statisticsModel: StatisticsModel }) {
    this.statisticsModel = statisticsModel;
  }
  query(key: Key) {
    return this.statisticsModel.findOne({ where: { stat_key: key } });
  }
  addOrUpdate(options: { where: { stat_key: Key }; create: { stat_key: Key; value: string } }) {
    const { where, create } = options;
    const data = this.query(where.stat_key);
    if (data) {
      this.statisticsModel.update(create);
    } else {
      this.statisticsModel.add(create);
    }
  }
}
