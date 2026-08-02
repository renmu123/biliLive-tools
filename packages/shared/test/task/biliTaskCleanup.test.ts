import EventEmitter from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BiliupConfig } from "@biliLive-tools/types";
import type { WebVideoUploader } from "@renmu/bili-api";

const mocks = vi.hoisted(() => ({
  addMediaApi: vi.fn(),
  editMediaApi: vi.fn(),
  removeByCids: vi.fn(),
  addOrUpdateStatistics: vi.fn(),
}));

vi.mock("../../src/task/bili.js", () => ({
  addMediaApi: mocks.addMediaApi,
  editMediaApi: mocks.editMediaApi,
}));

vi.mock("../../src/config.js", () => ({
  appConfig: {
    get: vi.fn(() => ({
      minUploadInterval: 0,
      useUploadPartPersistence: false,
    })),
    getAll: vi.fn(() => ({
      biliUpload: {
        minUploadInterval: 0,
      },
    })),
  },
}));

vi.mock("../../src/db/index.js", () => ({
  uploadPartService: {
    addOrUpdate: vi.fn(),
    findValidPartByHash: vi.fn(),
    removeByCids: mocks.removeByCids,
  },
  statisticsService: {
    query: vi.fn(),
    addOrUpdate: mocks.addOrUpdateStatistics,
  },
}));

import { BiliAddVideoTask, BiliEditVideoTask, BiliPartVideoTask } from "../../src/task/task.js";

const mediaOptions = {} as BiliupConfig;

function createCompletedPartTask() {
  const emitter = new EventEmitter();
  const command = {
    emitter,
    filePath: "C:/videos/part.mp4",
    title: "part",
  } as unknown as WebVideoUploader;
  const task = new BiliPartVideoTask(
    command,
    {
      name: "上传视频：part",
      pid: "parent-task",
      limitTime: [],
      uid: 1,
    },
    {},
  );
  task.status = "completed";
  task.completedPart = {
    cid: 100,
    filename: "uploaded-part",
    title: "part",
    filePath: command.filePath,
  };
  return { task, emitter };
}

describe("B站投稿任务资源清理", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.addMediaApi.mockResolvedValue({ aid: 1, bvid: "BV1" });
    mocks.editMediaApi.mockResolvedValue({ aid: 1, bvid: "BV1" });
  });

  it("新增投稿结束后保留分片任务历史并释放上传器", async () => {
    const { task: partTask, emitter } = createCompletedPartTask();
    const task = new BiliAddVideoTask(
      {
        name: "新增投稿",
        uid: 1,
        mediaOptions,
      },
      {},
    );
    task.taskList.push(partTask);

    await task.submit();

    expect(task.taskList).toHaveLength(0);
    expect(partTask.command).toBeUndefined();
    expect(partTask.status).toBe("completed");
    expect(partTask.completedPart?.cid).toBe(100);
    expect(emitter.eventNames()).toHaveLength(0);
  });

  it("分片上传完成后立即释放上传器", () => {
    const { task, emitter } = createCompletedPartTask();

    emitter.emit("completed", {
      cid: 101,
      filename: "uploaded-part",
      title: "part",
    });

    expect(task.command).toBeUndefined();
    expect(task.status).toBe("completed");
    expect(task.completedPart?.cid).toBe(101);
    expect(emitter.eventNames()).toHaveLength(0);
  });

  it("编辑投稿结束后保留分片任务历史并释放上传器", async () => {
    const { task: partTask } = createCompletedPartTask();
    const task = new BiliEditVideoTask(
      {
        name: "编辑投稿",
        uid: 1,
        aid: 1,
        mediaOptions,
      },
      {},
    );
    task.taskList.push(partTask);

    await task.submit();

    expect(task.taskList).toHaveLength(0);
    expect(partTask.command).toBeUndefined();
    expect(partTask.status).toBe("completed");
    expect(partTask.completedPart?.cid).toBe(100);
  });
});
