import { statisticsModel } from "../index.js";

type Key = "start_time" | "pan123_token";

export default class StatisticsService {
  static query(key: Key) {
    return statisticsModel.query(key);
  }
  static addOrUpdate(options: {
    where: { stat_key: Key };
    create: { stat_key: Key; value: string };
  }) {
    const { where, create } = options;
    const data = statisticsModel.query(where.stat_key);
    if (data) {
      statisticsModel.update(create);
    } else {
      statisticsModel.add(create);
    }
  }
}
