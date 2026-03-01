import fs from "node:fs";
import Router from "@koa/router";
import chokidar from "chokidar";
import sse from "koa-sse-stream";
import { handleListTask } from "@biliLive-tools/shared/task/task.js";
import { musicDetect } from "@biliLive-tools/shared/musicDetector/index.js";

import { config, container } from "../index.js";

import type { DetectionConfig } from "music-segment-detector";

const router = new Router({
  prefix: "/sse",
});

/**
 * 流式查询日志
 */
router.get(
  "/streamLogs",
  sse({
    maxClients: 5000,
    pingInterval: 30000,
  }),
  async (ctx) => {
    const logFilePath = config.logPath;

    // 初始化logSize为文件当前大小
    let logSize = 0;

    const sendLog = () => {
      const stream = fs.createReadStream(logFilePath, { encoding: "utf8", start: logSize });
      stream.on("data", (chunk) => {
        // @ts-ignore
        ctx.sse.send(`${chunk}`);
        logSize += chunk.length;
      });
      stream.on("end", () => {
        console.log("stream end", logSize);
      });
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        // @ts-ignore
        ctx.sse.sendEnd();
      });
    };

    sendLog();

    // 监听日志文件变化
    const watcher = chokidar.watch(logFilePath);
    watcher.on("change", (path) => {
      console.log("File", path, "has been changed");
      sendLog();
    });

    // 当客户端断开连接时停止监听
    ctx.req.on("close", () => {
      console.log("Client closed connection");
      watcher.close();
    });
  },
);

/**
 * 获取弹幕流
 */
router.get(
  "/recorder/danma",
  sse({
    maxClients: 5000,
    pingInterval: 30000,
  }),
  async (ctx) => {
    const id = ctx.query.id;

    const recorderManager = container.resolve("recorderManager");
    recorderManager.manager.on("Message", ({ recorder, message }) => {
      if (recorder.id === id) {
        // @ts-ignore
        ctx.sse.send(JSON.stringify(message));
      }
    });
  },
);

router.get(
  "/task/runningNum",
  sse({
    maxClients: 5000,
    pingInterval: 30000,
  }),
  async (ctx) => {
    const getRunningTask = () => {
      let data = handleListTask();
      const num = data.filter((item) => item.status === "running").length;
      // @ts-ignore
      ctx.sse.send(JSON.stringify({ num }));
    };
    const tasks = container.resolve("taskQueue");
    tasks.on("task-start", getRunningTask);
    tasks.on("task-update", getRunningTask);
    tasks.on("task-end", getRunningTask);
    tasks.on("task-error", getRunningTask);
    tasks.on("task-pause", getRunningTask);
    tasks.on("task-resume", getRunningTask);
    tasks.on("task-cancel", getRunningTask);

    ctx.req.on("close", () => {
      console.log("Client closed connection");
      tasks.off("task-start", getRunningTask);
      tasks.off("task-update", getRunningTask);
      tasks.off("task-end", getRunningTask);
      tasks.off("task-error", getRunningTask);
      tasks.off("task-pause", getRunningTask);
      tasks.off("task-resume", getRunningTask);
      tasks.off("task-cancel", getRunningTask);
    });
    getRunningTask();
  },
);

/**
 * 波形分析进度流
 */
router.get(
  "/analyzerWaveform",
  sse({
    maxClients: 100,
    pingInterval: 30000,
  }),
  async (ctx) => {
    const input = ctx.query.input as string;
    const configStr = ctx.query.config as string;

    if (!input) {
      // @ts-ignore
      ctx.sse.send(JSON.stringify({ type: "error", message: "input is required" }));
      // @ts-ignore
      ctx.sse.sendEnd();
      return;
    }

    let config: Partial<DetectionConfig> = {};
    if (configStr) {
      try {
        config = JSON.parse(configStr);
      } catch (e) {
        // @ts-ignore
        ctx.sse.send(JSON.stringify({ type: "error", message: "Invalid config JSON" }));
        // @ts-ignore
        ctx.sse.sendEnd();
        return;
      }
    }

    // 立即发送初始消息，确保连接已建立
    // @ts-ignore
    ctx.sse.send(
      JSON.stringify({ type: "progress", stage: "init", percentage: 0, message: "初始化..." }),
    );

    // 不使用 await，让 musicDetect 在后台运行
    // console.log("开始波形分析，文件:", input);
    musicDetect(input, config, (progressData) => {
      // console.log("发送进度:", progressData);
      // @ts-ignore
      ctx.sse.send(JSON.stringify({ type: "progress", ...progressData }));
    })
      .then((segments) => {
        // console.log("分析完成，发送结果");
        // @ts-ignore
        ctx.sse.send(JSON.stringify({ type: "complete", data: segments }));
        // @ts-ignore
        ctx.sse.sendEnd();
      })
      .catch((error) => {
        // console.error("波形分析错误:", error);
        // @ts-ignore
        ctx.sse.send(
          JSON.stringify({
            type: "error",
            message: error instanceof Error ? error.message : "分析失败",
          }),
        );
        // @ts-ignore
        ctx.sse.sendEnd();
      });

    // 监听客户端断开连接
    ctx.req.on("close", () => {
      console.log("Client closed connection - waveform analysis");
    });
  },
);

export default router;
