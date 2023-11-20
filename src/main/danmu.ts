import { join } from "path";

import { type IpcMainInvokeEvent } from "electron";

import Config from "./utils/config";
import { pathExists, trashItem } from "./utils/index";
import log from "./utils/log";
import { Danmu } from "../core/index";

import type { DanmuConfig, File, DanmuOptions } from "../types";

const DANMUKUFACTORY_PATH = join(__dirname, "../../resources/bin/DanmakuFactory.exe").replace(
  "app.asar",
  "app.asar.unpacked",
);
log.info(`DANMUKUFACTORY_PATH: ${DANMUKUFACTORY_PATH}`);

export const DANMU_DEAFULT_CONFIG = {
  resolution: [1920, 1080],
  scrolltime: 12.0,
  fixtime: 5.0,
  density: 0,
  fontname: "Microsoft YaHei",
  fontsize: 38,
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
  giftminprice: 10.0,
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
  const danmu = new Danmu(DANMUKUFACTORY_PATH);

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

    if (!(await pathExists(input))) {
      log.error("danmufactory input file not exist", input);
      result.push({ status: "error", text: "文件不存在", input: input });
      continue;
    }

    if (await pathExists(output)) {
      if (options.override) {
        log.info(
          "danmufactory",
          JSON.stringify({
            status: "success",
            text: "文件已存在，移除进入回收站",
            input: input,
            output: output,
          }),
        );
        await trashItem(output);
      } else {
        log.info(
          "danmufactory",
          JSON.stringify({
            status: "success",
            text: "文件已存在，跳过",
            input: input,
            output: output,
          }),
        );
        result.push({
          status: "success",
          text: "跳过",
          input: input,
          output: output,
        });
        continue;
      }
    }

    const argsObj = getDanmuConfig();

    try {
      const { stdout, stderr } = await danmu.convertXml2Ass(input, output, argsObj);
      log.info(`danmukufactory command: ${danmu.command}`);

      log.debug("stdout", stdout);
      if (stderr) {
        log.error("stderr", stderr);
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
        log.info(
          "danmufactory",
          JSON.stringify({
            status: "success",
            text: stdout,
            input: input,
            output: output,
            meta: {
              stdout,
              stderr,
            },
          }),
        );
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

      if (options.removeOrigin && (await pathExists(input))) {
        await trashItem(input);
      }
    } catch (err) {
      log.error("danmufactory exec error:", err);
      result.push({ status: "error", text: String(err), input: input, meta: { err } });
    }
  }

  return result;
};
