import { join } from "path";

import type { IpcMainInvokeEvent } from "electron";
import type { DanmuConfig, File } from "../types";

import Config from "./config";
import { formatFile, executeCommand } from "./utils";

const DANMUKUFACTORY_PATH = join(__dirname, "../../bin/DanmakuFactory.exe");

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
  displayArea: 1.0,
  scrollArea: 1.0,
  bold: false,
  showUsernames: false,
  showMsgbox: true,
  msgboxSize: [500, 1080],
  msgboxPos: [20, 0],
  msgboxFontsize: 54,
  msgboxDuration: 0.0,
  giftMinPrice: 0.0,
  giftMergeTolerance: 0.0,
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

export const convertDanmu2Ass = async (_event: IpcMainInvokeEvent, files: File[]) => {
  const formatFiles = files.map((file) => formatFile(file));
  console.log(formatFiles);

  const { dir, name, path } = formatFiles[0];
  const output = join(dir, `${name}.ass`);
  // DanmakuFactory.exe -o "%BASENAME%.ass" -i "%BASENAME%.xml" --ignore-warnings --showmsgbox true -S 54 -O 255 --msgboxpos 20 -60
  const params = [`-i ${path}`, `-o ${output}`, "--ignore-warnings"];
  const command = `${DANMUKUFACTORY_PATH} ${params.join(" ")}`;
  console.log(command);

  const result: any[] = [];
  try {
    const { stdout, stderr } = await executeCommand(command);
    console.log("stdout", stdout);
    console.log("stderr", stderr);
    result.push({
      stdout,
      stderr,
    });
  } catch (err) {
    result.push({ err });
  }

  return result;
};
