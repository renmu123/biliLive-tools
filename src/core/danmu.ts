import { executeCommand, pathExists } from "../utils/index";

import type { DanmuConfig } from "../types";

export default class Danmu {
  execPath: string;
  command?: string;
  constructor(execPath: string) {
    this.execPath = execPath;
  }

  genDanmuArgs = (config: DanmuConfig) => {
    const params = Object.entries(config).map(([key, value]) => {
      if (["resolution", "msgboxsize", "msgboxpos"].includes(key)) {
        // @ts-ignore
        return `--${key} ${value.join("x")}`;
      } else if (key === "blockmode") {
        // @ts-ignore
        if (value.length === 0) return `--${key} null`;
        // @ts-ignore
        return `--${key} ${value.join("-")}`;
      } else if (key === "statmode") {
        // @ts-ignore
        if (value.length === 0) return ``;
        // @ts-ignore
        return `--${key} ${value.join(",")}`;
      } else if (key === "fontname") {
        return `--${key} "${value}"`;
      } else {
        return `--${key} ${value}`;
      }
    });

    return params;
  };

  convertXml2Ass = async (input: string, output: string, argsObj: DanmuConfig) => {
    if (!(await pathExists(input))) {
      throw new Error("input not exists");
    }

    const requiredArgs = [`-i "${input}"`, `-o "${output}"`, "--ignore-warnings"];
    const args = this.genDanmuArgs(argsObj);
    const command = `${this.execPath} ${requiredArgs.join(" ")} ${args.join(" ")}`;
    this.command = command;

    const { stdout, stderr } = await executeCommand(command);
    return { stdout, stderr };
  };
}
