import crypto from "node:crypto";

export const md5 = (str) => {
  return crypto.createHash("md5").update(str).digest("hex");
};
