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
  mesioPath: string;
  danmakuFactoryPath: string;
  logPath: string;
  passKey?: string;
}

process.on("uncaughtException", function (error) {
  console.error(`${new Date().toISOString()} uncaughtException`, error);
});
process.on("unhandledRejection", function (error) {
  console.error(`${new Date().toISOString()} unhandledRejection`, error);
});

const program = new Command();
program.name("biliLive").description("biliLive-tools命令行").version(version);

program
  .command("server")
  .description("开启服务")
  .option("-c, --config <string>", "配置文件路径", "config.json")
  .option("-h, --host <string>", "host")
  .option("-p, --port <number>", "port")
  .action(async (opts: { config: string; host?: string; port?: string }) => {
    if (!fs.existsSync(opts.config)) {
      console.error("请先运行 config gen 命令生成配置文件");
      return;
    }

    const c: Config = JSON.parse(fs.readFileSync(opts.config).toString());
    if (c?.configFolder === undefined) {
      throw new Error(`${c.configFolder}参数不存在，请先重新运行 config gen 命令`);
    }

    // 下面两行顺序不能换（
    const { init } = await import("@biliLive-tools/shared");
    const { serverStart } = await import("@biliLive-tools/http");

    const globalConfig: GlobalConfig = {
      ffmpegPresetPath: path.join(c.configFolder, "ffmpeg_presets.json"),
      videoPresetPath: path.join(c.configFolder, "presets.json"),
      danmuPresetPath: path.join(c.configFolder, "danmu_presets.json"),
      configPath: path.join(c.configFolder, "appConfig.json"),
      logPath: c.logPath,
      defaultFfmpegPath: c.ffmpegPath,
      defaultFfprobePath: c.ffprobePath,
      defaultDanmakuFactoryPath: c.danmakuFactoryPath,
      defaultMesioPath: c.mesioPath,
      version: version,
      userDataPath: c.configFolder,
    };
    const container = await init(globalConfig);

    const appConfig = container.resolve("appConfig");
    const passKey = process.env.BILILIVE_TOOLS_PASSKEY || appConfig.get("passKey");
    if (!passKey) {
      console.warn("如果想使用webui，必须设置鉴权 passKey 参数，具体见文档");
    }
    await serverStart(
      {
        port: opts.port ? Number(opts.port) : c.port,
        host: opts.host ?? c.host,
        auth: true,
        passKey: passKey,
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
        console.log("配置文件已生成，请根据需求进行修改");
        generateConfig(opts.config);
      } else {
        console.error("配置文件已存在，如果想重新生成请使用 -f 参数强制覆盖");
        return;
      }
    } else {
      console.log("配置文件已生成，请根据需求进行修改");
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
    mesioPath: "mesio.exe",
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
    defaultConfig.mesioPath = "mesio";
    defaultConfig.danmakuFactoryPath = "DanmakuFactory";
  }
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  return;
}

program.parse();
