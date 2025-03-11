import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { get_sign } from "./webmssdk.js";

export function loadWebmssdk(jsFile: string): string {
  const dirPath = path.dirname(__filename);
  const jsPath = path.join(dirPath, jsFile);
  return fs.readFileSync(jsPath, "utf-8");
}

export function getUserUniqueId(): string {
  return (
    Math.floor(Math.random() * (7999999999999999999 - 7300000000000000000)) + 7300000000000000000
  ).toString();
}

export function getXMsStub(params: Record<string, string | number>): string {
  const sigParams = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
  return crypto.createHash("md5").update(sigParams).digest("hex");
}

export function getSignature(xMsStub: string): string {
  try {
    return get_sign(xMsStub);
    // const jsDom = `
    //         document = {};
    //         window = {};
    //         navigator = { userAgent: '' };
    //     `;

    // const jsEnc = loadWebmssdk("webmssdk.js");
    // const finalJs = jsDom + jsEnc;

    // const context = vm.createContext({});
    // vm.runInContext(finalJs, context);

    // if (typeof context.get_sign === "function") {
    //   return context.get_sign(xMsStub);
    // }
  } catch {
    return "00000000";
  }
  return "00000000";
}
