import { type } from "arktype";

export const danmuConfig = type({
  resolution: ["number > 0", "number > 0"],
  scrolltime: "number",
  fixtime: "number",
  density: "number",
  customDensity: "number",
  fontname: "string",
  fontsize: "number > 0",
  // /** 百分制下的透明度 */
  opacity100: "number > 0",
  outline: "number",
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
  resolutionResponsive: "boolean",
  blacklist: "string",
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
