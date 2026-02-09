import { type } from "arktype";

const fontSizeResponsiveParam = type(["number", "number"]);

export const danmuConfig = type({
  /** 弹幕画面分辨率，格式为 [宽, 高]，单位为像素 */
  resolution: ["number > 0", "number > 0"],
  /** 滚动弹幕通过时间，单位为秒 */
  scrolltime: "number",
  /** 固定弹幕停留时间，单位为秒 */
  fixtime: "number",
  /** 弹幕密度，0=无限，-1=不重叠，-2=自定义条数 */
  density: "number",
  /** 自定义弹幕条数，仅 density=-2 时生效 */
  customDensity: "number",
  /** 字体名称 */
  fontname: "string",
  /** 基础字体大小，单位为像素 */
  fontsize: "number > 0",
  /** 文字不透明度，百分比（0-100） */
  opacity100: "number > 0",
  /** 描边宽度 */
  outline: "number",
  /** 描边模糊半径 */
  "outline-blur": "number >= 0",
  /** 描边不透明度，百分比（0-100） */
  "outline-opacity-percentage": "0 <= number <= 100",
  /** 阴影宽度 */
  shadow: "number",
  /** 全部弹幕显示区域（0-1，比例） */
  displayarea: "number",
  /** 滚动弹幕显示区域（0-1，比例） */
  scrollarea: "number",
  /** 是否加粗字体 */
  bold: "boolean",
  /** 是否显示用户名 */
  showusernames: "boolean",
  /** 是否保存被屏蔽的弹幕 */
  saveblocked: "boolean",
  /** 是否显示礼物框 */
  showmsgbox: "boolean",
  /** 礼物框尺寸 [宽, 高] */
  msgboxsize: ["number", "number"],
  /** 礼物框位置 [X, Y] */
  msgboxpos: ["number", "number"],
  /** 礼物框文字大小 */
  msgboxfontsize: "number",
  /** 礼物框持续时间，单位为秒 */
  msgboxduration: "number",
  /** 礼物最小价值，单位为 RMB */
  giftminprice: "number",
  /** 按类型屏蔽弹幕，数组，值包括 R2L（右左滚动）、L2R（左右滚动）、TOP（顶部固定）、BOTTOM（底部固定）、SPECIAL（特殊）、COLOR（非白色）、REPEAT（内容重复） */
  blockmode: '("R2L" | "L2R" | "TOP" | "BOTTOM" | "SPECIAL" | "COLOR" | "REPEAT")[]',
  /** 调试统计模式，数组，值包括 TABLE（统计图）、HISTOGRAM（直方图） */
  statmode: "string[]",
  /** 是否自适应视频分辨率 */
  resolutionResponsive: "boolean",
  /** 是否自适应分辨率字体大小 */
  fontSizeResponsive: "boolean",
  /** 字体大小自适应参数，二维数组，每项为 [分辨率高度, 字体大小]，高度递增且不能重复 */
  fontSizeResponsiveParams: fontSizeResponsiveParam.array(),
  /** 弹幕屏蔽规则，英文逗号分隔，支持关键词、UID、用户名、正则表达式 */
  blacklist: "string",
  /** 自定义弹幕过滤函数，字符串形式 */
  filterFunction: "string",
  /** 屏蔽规则是否启用正则表达式模式 */
  "blacklist-regex": "boolean",
  /** 弹幕行间距 */
  "line-spacing": "number",
  /** 弹幕顶部间距 */
  "top-margin": "number",
  /** 弹幕底部间距 */
  "bottom-margin": "number",
  /** 弹幕时间偏移，单位为秒 */
  timeshift: "number",
});
export type DanmuConfig = typeof danmuConfig.infer;

// 弹幕预设配置
export const danmuPresetSchema = type({
  id: "string",
  name: "string",
  config: danmuConfig,
});

export type DanmuPreset = typeof danmuPresetSchema.infer;
