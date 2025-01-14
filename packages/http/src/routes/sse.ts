import fs from "node:fs";
import Router from "koa-router";
import chokidar from "chokidar";
import sse from "koa-sse-stream";
import { createRecorderManager } from "@biliLive-tools/shared";
import { handleListTask, taskQueue } from "@biliLive-tools/shared/task/task.js";

import { config, container } from "../index.js";

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

type createRecorderManagerType = Awaited<ReturnType<typeof createRecorderManager>>;
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

    const recorderManager = container.resolve<createRecorderManagerType>("recorderManager");
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
      console.log("running task num", num);
      // @ts-ignore
      ctx.sse.send(JSON.stringify({ num }));
    };
    const tasks = container.resolve<typeof taskQueue>("taskQueue");
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

export default router;
