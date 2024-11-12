import { describe, it, expect, vi, beforeEach } from "vitest";
import { BiliCommentQueue } from "../../src/task/bili";

describe("BiliCommentQueue", () => {
  let appConfig: any;
  let queue: BiliCommentQueue;

  beforeEach(() => {
    appConfig = {
      get: () => {
        return {
          task: {
            mediaStatusCheck: ["success", "failure"],
          },
        };
      },
    };
    queue = new BiliCommentQueue({ appConfig });
  });

  it("should add a check task", () => {
    const data = { uid: 123, aid: 456 };
    queue.addCheckTask(data);
    expect(queue.list).toHaveLength(1);
    expect(queue.list[0]).toMatchObject({
      type: "checkStatus",
      uid: data.uid,
      aid: data.aid,
      status: "pending",
    });
  });

  it("should add a comment task", () => {
    const data = { uid: 123, aid: 456, content: "Test comment", top: false };
    queue.addCommentTask(data);
    expect(queue.list).toHaveLength(1);
    expect(queue.list[0]).toMatchObject({
      type: "comment",
      uid: data.uid,
      aid: data.aid,
      content: data.content,
      top: data.top,
      status: "pending",
    });
  });

  it("should not add duplicate comment tasks", () => {
    const data = { uid: 123, aid: 456, content: "Test comment", top: false };
    queue.addCommentTask(data);
    queue.addCommentTask(data);
    expect(queue.list).toHaveLength(1);
  });

  it("should filter tasks by type and status", () => {
    const checkTask = { uid: 123, aid: 456 };
    const commentTask = { uid: 123, aid: 789, content: "Test comment", top: false };
    queue.addCheckTask(checkTask);
    queue.addCommentTask(commentTask);

    const filteredCheckTasks = queue.filter("checkStatus");
    const filteredCommentTasks = queue.filter("comment");

    expect(filteredCheckTasks).toHaveLength(1);
    expect(filteredCheckTasks[0].type).toBe("checkStatus");

    expect(filteredCommentTasks).toHaveLength(1);
    expect(filteredCommentTasks[0].type).toBe("comment");
  });

  it("should handle list items correctly", async () => {
    const checkTask = { uid: 123, aid: 456 };
    queue.addCheckTask(checkTask);
    queue.list[0].startTime = Date.now() - 1000 * 60 * 60 * 25; // 25 hours ago

    await queue.handlingList();
    expect(queue.list[0].status).toBe("error");
  });

  it("should check status and update accordingly", async () => {
    const checkTask = { uid: 123, aid: 456 };
    queue.addCheckTask(checkTask);
    // @ts-ignore
    queue.mediaList = [{ Archive: { aid: 456, state: 0, title: "Test" } }];

    const sendNotifySpy = vi.spyOn(queue, "sendNotify").mockResolvedValue();

    await queue.statusCheck();
    expect(queue.list[0].status).toBe("completed");
    expect(sendNotifySpy).toHaveBeenCalledWith(
      `Test稿件审核通过`,
      `请前往B站创作中心查看详情\n稿件名：Test`,
    );
  });
  it("should check status and update accordingly", async () => {
    const checkTask = { uid: 123, aid: 456 };
    queue.addCheckTask(checkTask);
    queue.mediaList = [
      // @ts-ignore
      { Archive: { aid: 456, state: -10, title: "Test", state_desc: "审核未通过" } },
    ];

    const sendNotifySpy = vi.spyOn(queue, "sendNotify").mockResolvedValue();

    await queue.statusCheck();
    expect(queue.list[0].status).toBe("completed");
    expect(sendNotifySpy).toHaveBeenCalledWith(
      `Test稿件审核未通过`,
      `请前往B站创作中心查看详情\n稿件名：Test\n状态：审核未通过`,
    );
  });

  it("should check comments and update accordingly when audit failure", async () => {
    const commentTask = { uid: 123, aid: 456, content: "Test comment", top: false };
    queue.addCommentTask(commentTask);
    // @ts-ignore
    queue.mediaList = [{ Archive: { aid: 456 }, stat: { aid: 456 } }];

    vi.spyOn(queue, "addCommentApi").mockResolvedValue({ rpid: 789 });
    vi.spyOn(queue, "commentTopApi").mockResolvedValue({});

    await queue.commentCheck();
    expect(queue.list[0].status).toBe("completed");
  });

  it("should loop and check tasks", async () => {
    const checkTask = { uid: 123, aid: 456 };
    queue.addCheckTask(checkTask);

    vi.spyOn(queue, "check").mockResolvedValue();
    vi.useFakeTimers();

    queue.checkLoop();
    vi.advanceTimersByTime(600 * 1000); // Advance time by 600 seconds

    expect(queue.check).toHaveBeenCalled();
  });
  it("should update list item status when add duplicate check tasks", () => {
    const checkTask = { uid: 123, aid: 456 };
    queue.addCheckTask(checkTask);
    queue.addCheckTask(checkTask);
    expect(queue.list).toHaveLength(1);
  });
});
