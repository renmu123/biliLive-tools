import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzip } from "node:zlib";

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
  } catch {
    return "00000000";
  }
  return "00000000";
}

export function decompressGzip(buffer: Buffer) {
  return new Promise((resolve, reject) => {
    gunzip(buffer, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
