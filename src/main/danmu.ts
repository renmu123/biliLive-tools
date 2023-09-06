import { join } from "path";
import fs from "fs";

import { shell, type IpcMainInvokeEvent } from "electron";
import type { DanmuConfig, File, DanmuOptions } from "../types";

import Config from "./config";
import { executeCommand } from "./utils";

const DANMUKUFACTORY_PATH = join(__dirname, "../../bin/DanmakuFactory.exe");

export const DANMU_DEAFULT_CONFIG = {
  resolution: [1920, 1080],
  scrolltime: 12.0,
  fixtime: 5.0,
  density: 0,
  fontname: "Microsoft YaHei",
  fontsize: 54,
  opacity: 255,
  outline: 0.0,
  shadow: 1.0,
  displayarea: 1.0,
  scrollarea: 1.0,
  bold: false,
  showusernames: false,
  showmsgbox: true,
  msgboxsize: [500, 1080],
  msgboxpos: [20, 0],
  msgboxfontsize: 38,
  msgboxduration: 10.0,
  giftminprice: 0.0,
  giftmergetolerance: 0.0,
  blockmode: [],
  statmode: [],
};

const getConfig = () => {
  const config = new Config("DanmakuFactoryConfig.json");
  return config;
};

export const saveDanmuConfig = (_event: IpcMainInvokeEvent, newConfig: DanmuConfig) => {
  const config = getConfig();
  config.setAll(newConfig);
};
export const getDanmuConfig = () => {
  const config = getConfig();
  return { ...DANMU_DEAFULT_CONFIG, ...config.data };
};

const genDanmuParams = () => {
  const config = getDanmuConfig();
  console.log(config);
  const params = Object.entries(config).map(([key, value]) => {
    if (["resolution", "msgboxsize", "msgboxpos"].includes(key)) {
      // @ts-ignore
      return `--${key} ${value.join("x")}`;
    } else if (key === "blockmode" || key === "statmode") {
      // @ts-ignore
      if (value.length === 0) return `--${key} null`;
      // @ts-ignore
      return `--${key} ${value.join("-")}`;
    } else if (key === "fontname") {
      return `--${key} "${value}"`;
    } else {
      return `--${key} ${value}`;
    }
  });

  return params;
};

export const convertDanmu2Ass = async (
  _event: IpcMainInvokeEvent,
  files: File[],
  options: DanmuOptions = {
    saveRadio: 1,
    saveOriginPath: true,
    savePath: "",

    override: false,
    removeOrigin: false,
  },
) => {
  const result: {
    status: "success" | "error";
    text: string;
    input: string;
    output?: string;
    meta?: any;
  }[] = [];

  for (const file of files) {
    const { dir, name, path } = file;

    const input = path;
    let output = join(dir, `${name}.ass`);
    if (options.saveRadio === 2 && options.savePath) {
      output = join(options.savePath, `${name}.ass`);
    }

    if (!fs.existsSync(input)) {
      result.push({ status: "error", text: "文件不存在", input: input });
      continue;
    }
    if (!options.override && fs.existsSync(output)) {
      result.push({
        status: "success",
        text: "跳过",
        input: input,
        output: output,
      });
      continue;
    }
    // DanmakuFactory.exe -o "%BASENAME%.ass" -i "%BASENAME%.xml" --ignore-warnings --showmsgbox true -S 54 -O 255 --msgboxpos 20 -60
    const params = [`-i "${input}"`, `-o "${output}"`, "--ignore-warnings"];
    const otherParams = genDanmuParams();
    console.log(otherParams);

    const command = `${DANMUKUFACTORY_PATH} ${params.join(" ")} ${otherParams.join(" ")}`;

    console.log(command);

    try {
      const { stdout, stderr } = await executeCommand(command);
      console.log("stdout", stdout);
      console.log("stderr", stderr);

      if (stderr) {
        result.push({
          status: "error",
          text: stdout,
          input: input,
          meta: {
            stdout,
            stderr,
          },
        });
      } else {
        result.push({
          status: "success",
          text: stdout,
          input: input,
          output: output,
          meta: {
            stdout,
            stderr,
          },
        });
      }

      if (options.removeOrigin && fs.existsSync(input)) {
        await shell.trashItem(input);
      }
    } catch (err) {
      result.push({ status: "error", text: String(err), input: input, meta: { err } });
    }
  }

  return result;
};
