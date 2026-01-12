import { type } from "arktype";

const fontSizeResponsiveParam = type(["number", "number"]);

export const danmuConfig = type({
  resolution: ["number > 0", "number > 0"],
  scrolltime: "number",
  fixtime: "number",
  density: "number",
  customDensity: "number",
  fontname: "string",
  fontsize: "number > 0",
  /** 百分制下的透明度 */
  opacity100: "number > 0",
  outline: "number",
  "outline-blur": "number >= 0",
  "outline-opacity-percentage": "0 <= number <= 100",
  shadow: "number",
  displayarea: "number",
  scrollarea: "number",
  bold: "boolean",
  showusernames: "boolean",
  saveblocked: "boolean",
  showmsgbox: "boolean",
  msgboxsize: ["number", "number"],
  msgboxpos: ["number", "number"],
  msgboxfontsize: "number",
  msgboxduration: "number",
  giftminprice: "number",
  blockmode: '("R2L" | "L2R" | "TOP" | "BOTTOM" | "SPECIAL" | "COLOR" | "REPEAT")[]',
  statmode: "string[]",
  /** 分辨率自适应 */
  resolutionResponsive: "boolean",
  /** 字体大小自适应 */
  fontSizeResponsive: "boolean",
  /** 字体大小自适应参数， */
  fontSizeResponsiveParams: fontSizeResponsiveParam.array(),
  blacklist: "string",
  filterFunction: "string",
  "blacklist-regex": "boolean",
  "line-spacing": "number",
  "top-margin": "number",
  "bottom-margin": "number",
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
