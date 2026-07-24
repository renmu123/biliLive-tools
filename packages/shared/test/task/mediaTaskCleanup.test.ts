import EventEmitter from "node:events";
import { describe, expect, it, vi } from "vitest";

import type ffmpeg from "@renmu/fluent-ffmpeg";

import type { DanmakuFactory } from "../../src/danmu/danmakuFactory.js";
import { DanmuTask, FFmpegTask } from "../../src/task/task.js";

function createDanmuTask(convertXml2Ass: DanmakuFactory["convertXml2Ass"]) {
  const danmu = {
    convertXml2Ass,
  } as DanmakuFactory;
  const task = new DanmuTask(danmu, {
    input: "input.xml",
    output: "output.ass",
    options: {},
    name: "弹幕转换",
  });
  return task;
}

function createFFmpegTask() {
  const command = new EventEmitter() as EventEmitter & {
    _getArguments: () => string[];
    run: () => void;
    kill: () => void;
  };
  command._getArguments = () => [];
  command.run = vi.fn();
  command.kill = vi.fn();

  const task = new FFmpegTask(
    command as unknown as ffmpeg.FfmpegCommand,
    {
      output: "output.mp4",
      name: "视频处理",
    },
    {},
  );
  return { task, command };
}

describe("媒体任务资源清理", () => {
  it("弹幕转换完成后释放 DanmakuFactory", async () => {
    const task = createDanmuTask(vi.fn().mockResolvedValue(""));

    task.exec();

    await vi.waitFor(() => expect(task.status).toBe("completed"));
    expect(task.danmu).toBeUndefined();
  });

  it("弹幕转换失败后释放 DanmakuFactory", async () => {
    const task = createDanmuTask(vi.fn().mockRejectedValue("转换失败"));

    task.exec();

    await vi.waitFor(() => expect(task.status).toBe("error"));
    expect(task.danmu).toBeUndefined();
  });

  it("FFmpeg 完成后释放 FfmpegCommand 及其监听器", () => {
    const { task, command } = createFFmpegTask();

    command.emit("end");

    expect(task.command).toBeUndefined();
    expect(task.status).toBe("completed");
    expect(command.eventNames()).toHaveLength(0);
  });

  it("FFmpeg 失败后释放 FfmpegCommand 及其监听器", () => {
    const { task, command } = createFFmpegTask();

    command.emit("error", new Error("处理失败"));

    expect(task.command).toBeUndefined();
    expect(task.status).toBe("error");
    expect(command.eventNames()).toHaveLength(0);
  });
});
