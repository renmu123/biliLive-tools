#!/usr/bin/env node
import { Command } from "commander";
// import { version } from "../package.json";
import { serverStart } from "@biliLive-tools/http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// declare global {
//   var logger: Logger;
// }
// global.logger = logger;
// process.on("uncaughtException", (err) => {
//   logger.error(err);
// });

interface Config {
  port: number;
  host: string;
  configFolder: string;
  binFolder: string;
  ffmpegPath: string;
  ffprobePath: string;
  danmakuFactoryPath: string;
  logPath: string;
}

const program = new Command();
program.name("biliLive").description("biliLive-tools命令行").version("1.0.0-alpha.1");

program
  .command("server")
  .description("开启webhook服务")
  .option("-c, --config <string>", "配置文件路径", "config.json")
  .action(async (opts: { config: string }) => {
    if (!fs.existsSync(opts.config)) {
      console.error("请先运行 biliLive config gen 命令生成配置文件");
      return;
    }
    const c = JSON.parse(fs.readFileSync(opts.config).toString());

    // ffmpegPresetPath: FFMPEG_PRESET_PATH,
    // videoPresetPath: VIDEO_PRESET_PATH,
    // danmuPresetPath: DANMU_PRESET_PATH,
    // taskQueue: taskQueue,
    c.ffmpegPresetPath = path.join(c.configFolder, "ffmpeg_presets.json");
    c.videoPresetPath = path.join(c.configFolder, "presets.json");
    c.danmuPresetPath = path.join(c.configFolder, "danmu_presets.json");
    c.configPath = path.join(c.configFolder, "appConfig.json");
    serverStart(c);
  });

const configCommand = program.command("config").description("配置相关");

configCommand
  .command("gen")
  .description("生成配置文件")
  .option("-c, --config <string>", "配置文件路径", "config.json")
  .option("-f, --force", "强制覆盖已有配置文件", false)
  .action(async (opts: { config: string; force: boolean }) => {
    if (fs.existsSync(opts.config)) {
      if (opts.force) {
        generateConfig(opts.config);
      } else {
        console.error("配置文件已存在，如果想重新生成请使用 -f 参数强制覆盖");
        return;
      }
    } else {
      generateConfig(opts.config);
    }
  });

function generateConfig(configPath: string) {
  const defaultConfig: Config = {
    port: 18010,
    host: "127.0.0.1",
    configFolder: "",
    binFolder: "",
    ffmpegPath: "ffmpeg.exe",
    ffprobePath: "ffprobe.exe",
    danmakuFactoryPath: "DanmakuFactory.exe",
    logPath: "main.log",
  };
  if (process.platform === "win32") {
    const homedir = os.homedir();
    const binFolder = path.join(
      homedir,
      "AppData",
      "Local",
      "Programs",
      "biliLive-tools",
      "resources",
      "app.asar.unpacked",
      "resources",
      "bin",
    );

    const configFolder = path.join(homedir, "AppData", "Roaming", "biliLive-tools");

    if (fs.existsSync(binFolder)) {
      defaultConfig.binFolder = binFolder;
    }
    if (fs.existsSync(configFolder)) {
      defaultConfig.configFolder = configFolder;
    }
  } else if (process.platform === "linux") {
    defaultConfig.ffmpegPath = "ffmpeg";
    defaultConfig.ffprobePath = "ffprobe";
    defaultConfig.danmakuFactoryPath = "DanmakuFactory";
  }
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
}

program.parse();
