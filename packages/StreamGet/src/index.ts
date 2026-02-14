/**
 * StreamGet - 直播平台链接解析器
 *
 * 使用方式：
 *
 * 1. 通用解析（自动检测平台）：
 *    const parser = new StreamParser({ proxy: 'http://127.0.0.1:7890' });
 *    const result = await parser.parse('https://live.bilibili.com/123');
 *
 * 2. 平台特定调用：
 *    const biliParser = new BilibiliParser({ cookie: 'your_cookie' });
 *    const liveInfo = await biliParser.getLiveInfo('123');
 *    const sources = await biliParser.getStreams('123');
 */

// 注册所有平台
import { registry } from "./registry.js";
import { BilibiliParser } from "./bilibili/parser.js";
import { DouyinParser } from "./douyin/parser.js";
import { DouyuParser } from "./douyu/parser.js";
import { HuyaParser } from "./huya/parser.js";

// 自动注册平台解析器
registry.register("bilibili", (opts) => new BilibiliParser(opts));
registry.register("douyin", (opts) => new DouyinParser(opts));
registry.register("douyu", (opts) => new DouyuParser(opts));
registry.register("huya", (opts) => new HuyaParser(opts));

// 导出类型
export type * from "./types.js";
export type * from "./errors.js";

// 导出平台特定类型（可选）
export type * from "./bilibili/types.js";

// 导出通用解析器（统一入口）
export { StreamParser } from "./parser.js";

// 导出平台特定解析器（特定调用）
export { BilibiliParser } from "./bilibili/parser.js";
export { DouyinParser } from "./douyin/parser.js";
export { DouyuParser } from "./douyu/parser.js";
export { HuyaParser } from "./huya/parser.js";

// 导出错误类
export {
  StreamGetError,
  UnsupportedPlatformError,
  RoomNotFoundError,
  NotLivingError,
  NetworkError,
  ParseError,
} from "./errors.js";

// 导出注册表（高级用法）
export { registry } from "./registry.js";

// 导出 HTTP 客户端（高级用法）
export { HttpClient } from "./http.js";
