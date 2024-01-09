import { exec } from "child_process";
import fs from "fs-extra";

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

// ffmpeg的subtitle参数转义
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
      } else if (value === "VBR" && options.bitrate) {
        result.push(`-b:v ${options.bitrate}k`);
      }
    } else if (key === "crf") {
      // do nothing
    } else if (key === "preset") {
      result.push(`-preset ${value}`);
    }
  });
  return result;
};

export const uuid = () => {
  return Math.random().toString(36).slice(2);
};
export const pathExists = async (path: string) => {
  return await fs.pathExists(path);
};

export async function getFileSize(filePath: string) {
  const stats = await fs.promises.stat(filePath);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

type IterationCallback = (counter: number) => Promise<boolean>;
export async function runWithMaxIterations(
  callback: IterationCallback,
  interval: number,
  maxIterations: number,
): Promise<void> {
  return new Promise<void>((resolve) => {
    let counter = 0;

    const intervalId = setInterval(async () => {
      if (counter < maxIterations) {
        if (!(await callback(counter))) {
          clearInterval(intervalId);
          resolve();
        }
        counter++;
      } else {
        clearInterval(intervalId);
        resolve();
      }
    }, interval);
  });
}

// export const groupBy = (arr, func) => {
//   const map = new Map();
//   arr.forEach((item) => {
//     const key = func(item);
//     if (!map.has(key)) {
//       map.set(key, []);
//     }
//     map.get(key).push(item);
//   });
//   return map;
// };

// const uniqBy = (arr, predicate) => {
//   const cb = typeof predicate === "function" ? predicate : (o) => o[predicate];

//   return [
//     ...arr
//       .reduce((map, item) => {
//         const key = item === null || item === undefined ? item : cb(item);

//         map.has(key) || map.set(key, item);

//         return map;
//       }, new Map())
//       .values(),
//   ];
// };
