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

// 检测是否有运行中的 ffmpeg 进程
export async function checkFFmpegRunning(): Promise<boolean> {
  const processes = await getAllFFmpegProcesses();
  return processes.length > 0;
}

// 获取所有所有ffmpeg进程
export async function getAllFFmpegProcesses(): Promise<{ name: string; pid: number }[]> {
  const processes = await getAllProcesses();
  return processes.filter((process) => process.name === "ffmpeg.exe");
}

// 获取所有进程名称以及 PID
export function getAllProcesses(): Promise<{ name: string; pid: number }[]> {
  return new Promise((resolve, reject) => {
    exec("tasklist /fo csv /nh", (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }

      // 解析 stdout 中的进程信息
      const processes = stdout
        .split("\r\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const [name, pid] = line.split(",").map((str) => str.replace(/"/g, ""));
          return { name, pid: parseInt(pid) };
        });

      resolve(processes);
    });
  });
}

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
