import { TaskQueue, AbstractTask } from "../../src/task/task.js";
import { TaskType } from "../../src/enum.js";
import { sleep } from "../../src/utils/index.js";
import { expect, describe, it, beforeEach, vi } from "vitest";

describe("TaskQueue", () => {
  class TestTask extends AbstractTask {
    type: "test";
    exec = vi.fn();
    pause = vi.fn();
    resume = vi.fn();
    kill = vi.fn();
  }

  let taskQueue: TaskQueue;

  beforeEach(() => {
    const appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
      }),
    };
    // @ts-ignore
    taskQueue = new TaskQueue(appConfig);
  });

  it("should add a task to the queue", () => {
    const task = new TestTask();
    taskQueue.addTask(task);
    expect(taskQueue.list()).toContain(task);
  });

  it("should start a pending task", () => {
    const task = new TestTask();
    taskQueue.addTask(task, false);
    expect(task.exec).not.toHaveBeenCalled();

    taskQueue.start(task.taskId);
    expect(task.exec).toHaveBeenCalled();
  });

  it("should remove a task from the queue", () => {
    const task = new TestTask();
    taskQueue.addTask(task);
    taskQueue.remove(task.taskId);
    expect(taskQueue.list()).not.toContain(task);
  });

  it("should return a list of tasks", () => {
    const task1 = new TestTask();
    const task2 = new TestTask();
    taskQueue.addTask(task1);
    taskQueue.addTask(task2);
    const tasks = taskQueue.list();
    expect(tasks).toContain(task1);
    expect(tasks).toContain(task2);
  });

  it("should emit task events", async () => {
    // @ts-ignore
    taskQueue.appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: 2, biliUploadMaxNum: -1 },
      }),
    };
    const callback = vi.fn();
    taskQueue.on("task-end", callback);

    class TestTask extends AbstractTask {
      type: string;
      exec = vi.fn().mockImplementation(() => {
        this.emitter.emit("task-end", { taskId: this.taskId });
        this.status = "completed";
      });
      pause = vi.fn();
      resume = vi.fn();
      kill = vi.fn();
    }
    const task = new TestTask();

    taskQueue.addTask(task, true);
    expect(task.exec).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith({ taskId: task.taskId });
    expect(task.status).toBe("completed");
  });
  it("should emit task-removed-queue event", async () => {
    // @ts-ignore
    taskQueue.appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: 2, biliUploadMaxNum: -1 },
      }),
    };
    const callback = vi.fn();

    class TestTask extends AbstractTask {
      type: string;
      constructor() {
        super();
        this.on("task-removed-queue", callback);
      }
      exec = vi.fn();
      pause = vi.fn();
      resume = vi.fn();
      kill = vi.fn();
    }
    const task = new TestTask();

    taskQueue.addTask(task, true);
    taskQueue.remove(task.taskId);

    // expect(task.exec).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith({ taskId: task.taskId });
    // expect(task.status).toBe("completed");
  });
  describe("addTaskForLimit", () => {
    beforeEach(() => {
      const appConfig = {
        getAll: vi.fn().mockReturnValue({
          task: { ffmpegMaxNum: 2, douyuDownloadMaxNum: 2, biliUploadMaxNum: 2 },
        }),
      };
      // @ts-ignore
      taskQueue = new TaskQueue(appConfig);
    });
    describe("FFmpegTask", () => {
      class FFmpegTask extends AbstractTask {
        type: string = TaskType.ffmpeg;
        exec = vi.fn().mockImplementation(async () => {
          this.emitter.emit("task-start", { taskId: this.taskId });
          this.status = "running";
          await sleep(50);
          this.status = "completed";
          this.emitter.emit("task-end", { taskId: this.taskId });
        });
        pause = vi.fn();
        resume = vi.fn();
        kill = vi.fn();
      }

      it("should add with limit", async () => {
        const task1 = new FFmpegTask();
        const task2 = new FFmpegTask();
        const task3 = new FFmpegTask();
        const task4 = new FFmpegTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        taskQueue.addTask(task4, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        // expect(task3.exec).not.toHaveBeenCalled();
        expect(task4.exec).not.toHaveBeenCalled();
      });
      it("should add with no limit", async () => {
        // @ts-ignore
        taskQueue.appConfig = {
          getAll: vi.fn().mockReturnValue({
            task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
          }),
        };

        const task1 = new FFmpegTask();
        const task2 = new FFmpegTask();
        const task3 = new FFmpegTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).toHaveBeenCalled();
      });
      it("should auto start after task-end event", async () => {
        const task1 = new FFmpegTask();
        const task2 = new FFmpegTask();
        const task3 = new FFmpegTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        await sleep(10);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
        await sleep(100);
        expect(task3.exec).toHaveBeenCalled();
        expect(task1.status).toBe("completed");
        expect(task2.status).toBe("completed");
        expect(task3.status).toBe("running");

        await sleep(50);
        expect(task3.status).toBe("completed");
      });
      it("should auto start after task-error event", async () => {
        class FFmpegTask extends AbstractTask {
          type: string = TaskType.ffmpeg;
          exec = vi.fn().mockImplementation(async () => {
            this.status = "running";
            await sleep(50);
            this.emitter.emit("task-error", { taskId: this.taskId, error: "test" });
            this.status = "error";
          });
          pause = vi.fn();
          resume = vi.fn();
          kill = vi.fn();
        }

        const task1 = new FFmpegTask();
        const task2 = new FFmpegTask();
        const task3 = new FFmpegTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
        await sleep(70);
        expect(task3.exec).toHaveBeenCalled();

        expect(task1.status).toBe("error");
        expect(task2.status).toBe("error");
        expect(task3.status).toBe("running");

        await sleep(50);
        expect(task3.status).toBe("error");
      });

      it("should auto start after task-pause event", async () => {
        class FFmpegTask extends AbstractTask {
          type: string = TaskType.ffmpeg;
          exec = vi.fn().mockImplementation(async () => {
            this.status = "running";
            await sleep(50);
          });
          pause = vi.fn().mockImplementation(() => {
            this.status = "paused";
            this.emitter.emit("task-pause", { taskId: this.taskId });
          });
          resume = vi.fn();
          kill = vi.fn();
        }

        const task1 = new FFmpegTask();
        const task2 = new FFmpegTask();
        const task3 = new FFmpegTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
        task1.pause();
        await sleep(60);
        expect(task3.exec).toHaveBeenCalled();
      });
    });
    describe("DouyuDownloadTask", () => {
      class DouyuDownloadTask extends AbstractTask {
        type: string = TaskType.douyuDownload;
        exec = vi.fn().mockImplementation(async () => {
          this.emitter.emit("task-start", { taskId: this.taskId });
          this.status = "running";
          await sleep(50);
          this.status = "completed";
          this.emitter.emit("task-end", { taskId: this.taskId });
        });
        pause = vi.fn();
        resume = vi.fn();
        kill = vi.fn();
      }

      it("should add with limit", async () => {
        const task1 = new DouyuDownloadTask();
        const task2 = new DouyuDownloadTask();
        const task3 = new DouyuDownloadTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
      });
      it("should add with no limit", async () => {
        // @ts-ignore
        taskQueue.appConfig = {
          getAll: vi.fn().mockReturnValue({
            task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
          }),
        };

        const task1 = new DouyuDownloadTask();
        const task2 = new DouyuDownloadTask();
        const task3 = new DouyuDownloadTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).toHaveBeenCalled();
      });
      it("should auto start after task-end event", async () => {
        const task1 = new DouyuDownloadTask();
        const task2 = new DouyuDownloadTask();
        const task3 = new DouyuDownloadTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        await sleep(10);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
        await sleep(100);
        expect(task3.exec).toHaveBeenCalled();
        expect(task1.status).toBe("completed");
        expect(task2.status).toBe("completed");
        expect(task3.status).toBe("running");

        await sleep(50);
        expect(task3.status).toBe("completed");
      });
      it("should auto start after task-error event", async () => {
        class DouyuDownloadTask extends AbstractTask {
          type: string = TaskType.douyuDownload;
          exec = vi.fn().mockImplementation(async () => {
            this.status = "running";
            await sleep(50);
            this.emitter.emit("task-error", { taskId: this.taskId, error: "test" });
            this.status = "error";
          });
          pause = vi.fn();
          resume = vi.fn();
          kill = vi.fn();
        }
        const task1 = new DouyuDownloadTask();
        const task2 = new DouyuDownloadTask();
        const task3 = new DouyuDownloadTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
        await sleep(70);
        expect(task3.exec).toHaveBeenCalled();

        expect(task1.status).toBe("error");
        expect(task2.status).toBe("error");
        expect(task3.status).toBe("running");

        await sleep(50);
        expect(task3.status).toBe("error");
      });

      it("should auto start after task-pause event", async () => {
        class DouyuDownloadTask extends AbstractTask {
          type: string = TaskType.douyuDownload;
          exec = vi.fn().mockImplementation(async () => {
            this.status = "running";
            await sleep(50);
          });
          pause = vi.fn().mockImplementation(() => {
            this.status = "paused";
            this.emitter.emit("task-pause", { taskId: this.taskId });
          });
          resume = vi.fn();
          kill = vi.fn();
        }

        const task1 = new DouyuDownloadTask();
        const task2 = new DouyuDownloadTask();
        const task3 = new DouyuDownloadTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
        task1.pause();
        await sleep(69);
        expect(task3.exec).toHaveBeenCalled();
      });
      it("should auto start after task-cancel event", async () => {
        class DouyuDownloadTask extends AbstractTask {
          type: string = TaskType.douyuDownload;
          exec = vi.fn().mockImplementation(async () => {
            this.status = "running";
            await sleep(50);
          });
          pause = vi.fn().mockImplementation(() => {
            this.status = "paused";
            this.emitter.emit("task-pause", { taskId: this.taskId });
          });
          resume = vi.fn();
          kill = vi.fn();
          cancel = vi.fn().mockImplementation(() => {
            this.status = "canceled";
            this.emitter.emit("task-cancel", { taskId: this.taskId, autoStart: true });
          });
        }

        const task1 = new DouyuDownloadTask();
        const task2 = new DouyuDownloadTask();
        const task3 = new DouyuDownloadTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
        task1.cancel();
        expect(task3.exec).toHaveBeenCalled();
      });
    });
    describe("BiliPartVideoTask", () => {
      class BiliPartVideoTask extends AbstractTask {
        type: string = TaskType.biliUpload;
        exec = vi.fn().mockImplementation(async () => {
          this.emitter.emit("task-start", { taskId: this.taskId });
          this.status = "running";
          await sleep(50);
          this.status = "completed";
          this.emitter.emit("task-end", { taskId: this.taskId });
        });
        pause = vi.fn();
        resume = vi.fn();
        kill = vi.fn();
      }

      it("should add with limit", async () => {
        const task1 = new BiliPartVideoTask();
        const task2 = new BiliPartVideoTask();
        const task3 = new BiliPartVideoTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
      });
      it("should add with no limit", async () => {
        // @ts-ignore
        taskQueue.appConfig = {
          getAll: vi.fn().mockReturnValue({
            task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
          }),
        };

        const task1 = new BiliPartVideoTask();
        const task2 = new BiliPartVideoTask();
        const task3 = new BiliPartVideoTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).toHaveBeenCalled();
      });
      it("should auto start after task-end event", async () => {
        const task1 = new BiliPartVideoTask();
        const task2 = new BiliPartVideoTask();
        const task3 = new BiliPartVideoTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        await sleep(10);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
        await sleep(100);
        expect(task3.exec).toHaveBeenCalled();
        expect(task1.status).toBe("completed");
        expect(task2.status).toBe("completed");
        expect(task3.status).toBe("running");

        await sleep(50);
        expect(task3.status).toBe("completed");
      });
      it("should auto start after task-error event", async () => {
        class BiliPartVideoTask extends AbstractTask {
          type: string = TaskType.biliUpload;
          exec = vi.fn().mockImplementation(async () => {
            this.status = "running";
            await sleep(50);
            this.emitter.emit("task-error", { taskId: this.taskId, error: "test" });
            this.status = "error";
          });
          pause = vi.fn();
          resume = vi.fn();
          kill = vi.fn();
        }
        const task1 = new BiliPartVideoTask();
        const task2 = new BiliPartVideoTask();
        const task3 = new BiliPartVideoTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
        await sleep(70);
        expect(task3.exec).toHaveBeenCalled();

        expect(task1.status).toBe("error");
        expect(task2.status).toBe("error");
        expect(task3.status).toBe("running");

        await sleep(200);
        expect(task3.status).toBe("error");
      });

      it("should auto start after task-pause event", async () => {
        class BiliPartVideoTask extends AbstractTask {
          type: string = TaskType.biliUpload;
          exec = vi.fn().mockImplementation(async () => {
            this.status = "running";
            await sleep(50);
          });
          pause = vi.fn().mockImplementation(() => {
            this.status = "paused";
            this.emitter.emit("task-pause", { taskId: this.taskId });
          });
          resume = vi.fn();
          kill = vi.fn();
        }

        const task1 = new BiliPartVideoTask();
        const task2 = new BiliPartVideoTask();
        const task3 = new BiliPartVideoTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
        task1.pause();
        await sleep(60);
        expect(task3.exec).toHaveBeenCalled();
      });
      it("should auto start after task-cancel event", async () => {
        class BiliPartVideoTask extends AbstractTask {
          type: string = TaskType.biliUpload;
          exec = vi.fn().mockImplementation(async () => {
            this.status = "running";
            await sleep(50);
          });
          pause = vi.fn().mockImplementation(() => {
            this.status = "paused";
            this.emitter.emit("task-pause", { taskId: this.taskId });
          });
          resume = vi.fn();
          kill = vi.fn();
          cancel = vi.fn().mockImplementation(() => {
            this.status = "canceled";
            this.emitter.emit("task-cancel", { taskId: this.taskId, autoStart: true });
          });
        }

        const task1 = new BiliPartVideoTask();
        const task2 = new BiliPartVideoTask();
        const task3 = new BiliPartVideoTask();
        taskQueue.addTask(task1, false);
        taskQueue.addTask(task2, false);
        taskQueue.addTask(task3, false);
        expect(task1.exec).toHaveBeenCalled();
        expect(task2.exec).toHaveBeenCalled();
        expect(task3.exec).not.toHaveBeenCalled();
        task1.cancel();
        expect(task3.exec).toHaveBeenCalled();
      });
    });
  });
});
