import ejs from "ejs";
import log from "./log.js";

/**
 * 支持{{title}},{{user}},{{now}}等占位符，会覆盖预设中的标题，如【{{user}}】{{title}}-{{now}}<br/>
 * 直播标题：{{title}}<br/>
 * 主播名：{{user}}<br/>
 * 房间号：{{roomId}}<br/>
 * 当前时间（快速）：{{now}}，示例：2024.01.24<br/>
 * 年：{{yyyy}}<br/>
 * 月（补零）：{{MM}}<br/>
 * 日（补零）：{{dd}}<br/>
 * 时（补零）：{{HH}}<br/>
 * 分（补零）：{{mm}}<br/>
 * 秒（补零）：{{ss}}<br/>
 * 文件名：{{filename}}<br/>
 *
 * @param {object} options 格式化参数
 * @param {string} options.title 直播标题
 * @param {string} options.username 主播名
 * @param {string} options.time 直播时间
 * @param {number} options.roomId 房间号
 * @param {string} options.filename 文件名
 * @param {string} template 格式化模板
 */
export function formatTitle(
  options: {
    title: string;
    username: string;
    time: string;
    roomId: number;
    filename: string;
  },
  template: string,
) {
  const { year, month, day, hours, minutes, seconds, now } = formatTime(options.time);
  let renderText = template;
  try {
    const renderOptions = {
      title: options.title,
      user: options.username,
      time: new Date(options.time),
      roomId: options.roomId,
      filename: options.filename,
    };
    renderText = ejs.render(template, renderOptions);
  } catch (error) {
    log.error("模板解析错误", error);
  }

  const title = renderText
    .replaceAll("{{title}}", options.title)
    .replaceAll("{{user}}", options.username)
    .replaceAll("{{roomId}}", String(options.roomId))
    .replaceAll("{{now}}", now)
    .replaceAll("{{yyyy}}", year)
    .replaceAll("{{MM}}", month)
    .replaceAll("{{dd}}", day)
    .replaceAll("{{HH}}", hours)
    .replaceAll("{{mm}}", minutes)
    .replaceAll("{{ss}}", seconds)
    .replaceAll("{{filename}}", options.filename)
    .trim()
    .slice(0, 80);

  return title;
}

/**
 * 分P标题格式化
 * 直播标题：{{title}}<br/>
 * 主播名：{{user}}<br/>
 * 房间号：{{roomId}}<br/>
 * 当前时间（快速）：{{now}}，示例：2024.01.24<br/>
 * 年：{{yyyy}}<br/>
 * 月（补零）：{{MM}}<br/>
 * 日（补零）：{{dd}}<br/>
 * 时（补零）：{{HH}}<br/>
 * 分（补零）：{{mm}}<br/>
 * 秒（补零）：{{ss}}<br/>
 * 文件名：{{filename}}<br/>
 *
 * @param {object} options 格式化参数
 * @param {string} options.title 直播标题
 * @param {string} options.username 主播名
 * @param {string} options.time 直播时间
 * @param {number} options.roomId 房间号
 * @param {string} options.filename 文件名
 * @param {string} template 格式化模板
 */
export function formatPartTitle(
  options: {
    title: string;
    username: string;
    time: string;
    roomId: number;
    filename: string;
    index: number;
  },
  template: string,
) {
  const { year, month, day, hours, minutes, seconds } = formatTime(options.time);
  let renderText = template;
  try {
    const renderOptions = {
      title: options.title,
      user: options.username,
      time: new Date(options.time),
      roomId: options.roomId,
      filename: options.filename,
    };
    renderText = ejs.render(template, renderOptions);
  } catch (error) {
    log.error("模板解析错误", error);
  }

  const title = renderText
    .replaceAll("{{title}}", options.title)
    .replaceAll("{{user}}", options.username)
    .replaceAll("{{roomId}}", String(options.roomId))
    .replaceAll("{{yyyy}}", year)
    .replaceAll("{{MM}}", month)
    .replaceAll("{{dd}}", day)
    .replaceAll("{{HH}}", hours)
    .replaceAll("{{mm}}", minutes)
    .replaceAll("{{ss}}", seconds)
    .replaceAll("{{filename}}", options.filename)
    .replaceAll("{{index}}", String(options.index))
    .trim()
    .slice(0, 80);

  return title;
}

export function formatTime(time: string) {
  // 创建一个Date对象
  const timestamp = new Date(time);

  // 提取年、月、日部分
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, "0");
  const day = String(timestamp.getDate()).padStart(2, "0");
  const hours = String(timestamp.getHours()).padStart(2, "0");
  const minutes = String(timestamp.getMinutes()).padStart(2, "0");
  const seconds = String(timestamp.getSeconds()).padStart(2, "0");

  // 格式化为"YYYY.MM.DD"的形式
  const formattedDate = `${year}.${month}.${day}`;
  return {
    year: String(year),
    month,
    day,
    hours,
    minutes,
    seconds,
    now: formattedDate,
  };
}
