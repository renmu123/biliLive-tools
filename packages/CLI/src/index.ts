#!/usr/bin/env node
import { Command } from "commander";
import { version } from "../package.json";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { GlobalConfig } from "@biliLive-tools/types";

interface Config {
  port: number;
  host: string;
  configFolder: string;
  ffmpegPath: string;
  ffprobePath: string;
  danmakuFactoryPath: string;
  logPath: string;
}

const program = new Command();
program.name("biliLive").description("biliLive-tools命令行").version(version);

program
  .command("server")
  .description("开启webhook服务")
  .option("-c, --config <string>", "配置文件路径", "config.json")
  .action(async (opts: { config: string }) => {
    if (!fs.existsSync(opts.config)) {
      console.error("请先运行 config gen 命令生成配置文件");
      return;
    }

    const c: Config = JSON.parse(fs.readFileSync(opts.config).toString());
    if (c?.configFolder === undefined) {
      throw new Error(`${c.configFolder}参数不存在，请先重新运行 config gen 命令`);
    }
    if (!fs.existsSync(path.join(c.configFolder, "appConfig.json"))) {
      throw new Error(`${c.configFolder}文件夹中的 appConfig.json 文件不存在`);
    }
    if (!fs.existsSync(path.join(c.configFolder, "ffmpeg_presets.json"))) {
      console.warn(`${c.configFolder}文件夹中的 ffmpeg_presets.json 文件不存在`);
    }
    if (!fs.existsSync(path.join(c.configFolder, "presets.json"))) {
      console.warn(`${c.configFolder}文件夹中的 presets.json 文件不存在`);
    }
    if (!fs.existsSync(path.join(c.configFolder, "danmu_presets.json"))) {
      console.warn(`${c.configFolder}文件夹中的 danmu_presets.json 文件不存在`);
    }

    const { serverStart } = await import("@biliLive-tools/http");
    const { init } = await import("@biliLive-tools/shared");

    const globalConfig: GlobalConfig = {
      ffmpegPresetPath: path.join(c.configFolder, "ffmpeg_presets.json"),
      videoPresetPath: path.join(c.configFolder, "presets.json"),
      danmuPresetPath: path.join(c.configFolder, "danmu_presets.json"),
      configPath: path.join(c.configFolder, "appConfig.json"),
      logPath: c.logPath,
      defaultFfmpegPath: c.ffmpegPath,
      defaultFfprobePath: c.ffprobePath,
      defaultDanmakuFactoryPath: c.danmakuFactoryPath,
    };
    const container = init(globalConfig);
    serverStart(
      {
        port: c.port,
        host: c.host,
      },
      container,
    );
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
        console.error("配置文件已生成");
        generateConfig(opts.config);
      } else {
        console.error("配置文件已存在，如果想重新生成请使用 -f 参数强制覆盖");
        return;
      }
    } else {
      console.error("配置文件已生成");
      generateConfig(opts.config);
    }
  });

configCommand
  .command("print")
  .description("打印配置文件")
  .option("-c, --config <string>", "配置文件路径", "config.json")
  .action((opts: { config: string }) => {
    if (!fs.existsSync(opts.config)) {
      console.error("配置文件不存在，请先运行 config gen 命令生成配置文件");
      return;
    }
    const c = JSON.parse(fs.readFileSync(opts.config).toString());
    console.table(c);
  });

function generateConfig(configPath: string) {
  const defaultConfig: Config = {
    port: 18010,
    host: "127.0.0.1",
    configFolder: "",
    ffmpegPath: "ffmpeg.exe",
    ffprobePath: "ffprobe.exe",
    danmakuFactoryPath: "DanmakuFactory.exe",
    logPath: "main.log",
  };
  if (process.platform === "win32") {
    const homedir = os.homedir();
    const configFolder = path.join(homedir, "AppData", "Roaming", "biliLive-tools");

    if (fs.existsSync(configFolder)) {
      defaultConfig.configFolder = configFolder;
    }
  } else if (process.platform === "linux") {
    defaultConfig.ffmpegPath = "ffmpeg";
    defaultConfig.ffprobePath = "ffprobe";
    defaultConfig.danmakuFactoryPath = "DanmakuFactory";
  }
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  return;
}

program.parse();
