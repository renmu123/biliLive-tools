import { exec } from "child_process";
import type { FfmpegOptions } from "../types";

export const executeCommand = (command: string): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    exec(command, {}, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

export const escaped = (s: string) => {
  s = s.replaceAll("\\", "/");
  s = s.replaceAll(":", "\\\\:");
  return s;
};

export const genFfmpegParams = (options: FfmpegOptions) => {
  const result: string[] = [];
  Object.entries(options).forEach(([key, value]) => {
    if (key === "encoder") {
      result.push(`-c:v ${value}`);
    } else if (key === "bitrateControl") {
      if (value === "CRF" && options.crf) {
        result.push(`-crf ${options.crf}`);
      }
    } else if (key === "crf") {
      // do nothing
    } else if (key === "preset") {
      result.push(`-preset ${value}`);
    }
  });
  return result;
};
