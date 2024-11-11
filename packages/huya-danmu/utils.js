import crypto from "node:crypto";

export const md5 = (str) => {
  return crypto.createHash("md5").update(str).digest("hex");
};

export function intToHexColor(int) {
  // 将整数转换为十六进制字符串，并确保其长度为 6 位
  const hex = int.toString(16).padStart(6, "0");
  return `#${hex}`;
}
