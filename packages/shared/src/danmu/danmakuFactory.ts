import fs from "fs-extra";
import { ChildProcess, exec } from "node:child_process";

import log from "../utils/log.js";
import { DANMU_DEAFULT_CONFIG } from "../presets/danmuPreset.js";

import type { DanmuConfig } from "@biliLive-tools/types";

export class DanmakuFactory {
  execPath: string;
  command?: string;
  child?: ChildProcess;
  constructor(execPath: string) {
    this.execPath = execPath;
  }

  genDanmuArgs = (config: DanmuConfig) => {
    const params = Object.entries(config).map(([key, value]) => {
      // 如果配置字段不在默认中，则直接返回，用于处理版本回退可能导致的问题
      if (!Object.hasOwn(DANMU_DEAFULT_CONFIG, key)) return "";

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
        ["resolutionResponsive", "customDensity", "opacity", "giftmergetolerance"].includes(key)
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

    const requiredArgs = [`-i "${input}"`, `-o "${output}"`, "--ignore-warnings"];
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
