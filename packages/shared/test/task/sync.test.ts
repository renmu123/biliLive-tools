import { describe, expect, it, vi } from "vitest";
import { TypedEmitter } from "tiny-typed-emitter";

import { SyncTask } from "../../src/task/task";
import { TaskQueue } from "../../src/task/core/TaskQueue";

import type { SyncClient } from "../../src/sync";

class MockSyncClient extends TypedEmitter<any> {
  uploadFile = vi.fn(async () => {});
  cancelUpload = vi.fn();
  isLoggedIn = vi.fn(() => true);
}

describe("SyncTask", () => {
  it("passes the configured remote directory to the sync client", async () => {
    const client = new MockSyncClient();
    const task = new SyncTask(client as unknown as SyncClient, {
      input: "/tmp/source.mp4",
      output: "/录播/主播",
      options: {
        retry: 2,
        policy: "skip",
      },
      name: "同步任务: source.mp4",
    });

    task.exec();
    await vi.waitFor(() => expect(task.status).toBe("completed"));

    expect(client.uploadFile).toHaveBeenCalledWith("/tmp/source.mp4", "/录播/主播", {
      retry: 2,
      policy: "skip",
    });
  });

  it("records sync lifecycle logs and exposes them through task queue serialization", async () => {
    const client = new MockSyncClient();
    const task = new SyncTask(client as unknown as SyncClient, {
      input: "/tmp/source.mp4",
      output: "/录播/主播",
      name: "同步任务: source.mp4",
    });
    const queue = new TaskQueue({
      getAll: () => ({ task: { syncMaxNum: -1 } }),
    } as never);

    queue.addTask(task);
    client.emit("progress", {
      percentage: 50,
      speed: "1MB/s",
    });
    await vi.waitFor(() => expect(task.status).toBe("completed"));

    const [serialized] = queue.stringify([task]);
    expect(serialized.logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ level: "info", message: "同步任务开始" }),
        expect.objectContaining({ level: "info", message: "同步进度 50%" }),
        expect.objectContaining({ level: "info", message: "同步任务完成" }),
      ]),
    );
    expect(serialized.extra).toMatchObject({
      input: "/tmp/source.mp4",
      output: "/录播/主播",
    });
  });
});
