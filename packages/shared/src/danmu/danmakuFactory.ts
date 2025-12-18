import fs from "fs-extra";
import { ChildProcess, exec } from "node:child_process";

import log from "../utils/log.js";
import { DANMU_DEAFULT_CONFIG } from "../presets/danmuPreset.js";

import type { DanmuConfig } from "@biliLive-tools/types";

export function getFontSize(heightMap: [number, number][], currentHeight: number): number {
  if (heightMap.length === 0) {
    throw new Error("heightMap is empty");
  }
  // 按高度排序，确保计算正确
  heightMap.sort((a, b) => a[0] - b[0]);

  const slope = 0.03; // 设定默认斜率

  if (currentHeight <= heightMap[0][0]) {
    // 线性外推，使用默认斜率
    const [h1, size1] = heightMap[0];
    const extrapolatedSize = size1 + (currentHeight - h1) * slope;
    return Math.ceil(extrapolatedSize);
  }

  for (let i = 0; i < heightMap.length - 1; i++) {
    const [h1, size1] = heightMap[i];
    const [h2, size2] = heightMap[i + 1];
    if (currentHeight >= h1 && currentHeight <= h2) {
      // 线性插值计算
      const interpolatedSize = size1 + (size2 - size1) * ((currentHeight - h1) / (h2 - h1));
      return Math.ceil(interpolatedSize);
    }
  }

  // 线性外推，使用默认斜率
  const [hLast, sizeLast] = heightMap[heightMap.length - 1];
  const extrapolatedSize = sizeLast + (currentHeight - hLast) * slope;
  return Math.ceil(extrapolatedSize);
}

export class DanmakuFactory {
  execPath: string;
  command?: string;
  child?: ChildProcess;
  constructor(execPath: string) {
    this.execPath = execPath;
  }

  genDanmuArgs = (config: DanmuConfig) => {
    if (config.fontSizeResponsive) {
      const fontSizeResponsiveParams = config.fontSizeResponsiveParams;
      try {
        const fontSize = getFontSize(fontSizeResponsiveParams, config.resolution[1]);
        config.fontsize = fontSize;
      } catch (e) {
        log.error("fontSizeResponsive error: ", e);
      }
    }

    const params = Object.entries(config).map(([key, value]) => {
      // 如果配置字段不在默认中，则直接返回，用于处理版本回退可能导致的问题
      if (!Object.hasOwn(DANMU_DEAFULT_CONFIG, key)) return "";
      if (key === "filterFunction") return "";

      if (["resolution", "msgboxsize", "msgboxpos"].includes(key)) {
        if (Array.isArray(value)) {
          return `--${key} ${value.join("x")}`;
        }
        return "";
      } else if (key === "blockmode") {
        if (Array.isArray(value)) {
          if (value.length === 0) return `--${key} null`;
          return `--${key} ${value.join("-")}`;
        }
        return "";
      } else if (key === "statmode") {
        if (Array.isArray(value)) {
          if (value.length === 0) return ``;
          return `--${key} ${value.join("-")}`;
        }
        return "";
      } else if (key === "fontname") {
        return `--${key} "${value}"`;
      } else if (
        [
          "resolutionResponsive",
          "customDensity",
          "opacity",
          "giftmergetolerance",
          "fontSizeResponsive",
          "fontSizeResponsiveParams",
        ].includes(key)
      ) {
        // do nothing
        return "";
      } else if (key === "blacklist") {
        if (value) return `--${key} ${value}`;
        return "";
      } else if (key === "density") {
        if (value === -2) return `--density ${config.customDensity}`;
        return `--${key} ${value}`;
      } else if (key === "opacity100") {
        const value = ((config.opacity100 / 100) * 255).toFixed(0);
        return `--opacity ${value}`;
      } else if (key === "outline-opacity-percentage") {
        const value = ((config["outline-opacity-percentage"] / 100) * 255).toFixed(0);
        return `--outline-opacity ${value}`;
      } else {
        return `--${key} ${value}`;
      }
    });

    return params.filter((item) => item !== "");
  };

  convertXml2Ass = async (input: string, output: string, argsObj: DanmuConfig) => {
    if (!(await fs.pathExists(input))) {
      throw new Error("input not exists");
    }

    const requiredArgs = [`-i "${input}"`, `-o "${output}"`, "--ignore-warnings", "--force"];
    const args = this.genDanmuArgs(argsObj);
    const command = `"${this.execPath}" ${requiredArgs.join(" ")} ${args.join(" ")}`;
    log.info("danmakufactory command: ", command);
    this.command = command;

    return new Promise((resolve, reject) => {
      const child = exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
      this.child = child;
    });
  };
}
