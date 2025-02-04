import { describe, it, expect, vi, beforeEach } from "vitest";
import BiliCheckQueue from "../../src/task/BiliCheckQueue.js";
import biliApi from "../../src/task/bili.js";

import type { AppConfig } from "../../src/config.js";

vi.mock("./bili.js");

describe("BiliCheckQueue", () => {
  let appConfig: AppConfig;
  let queue: BiliCheckQueue;

  beforeEach(() => {
    appConfig = { data: { biliUpload: { checkInterval: 600 } } } as AppConfig;
    queue = new BiliCheckQueue({ appConfig });
  });

  it("should add a new item to the list", () => {
    queue.add({ aid: 1, uid: 123 });
    expect(queue.list).toHaveLength(1);
    expect(queue.list[0]).toMatchObject({ aid: 1, uid: 123, status: "pending" });
  });

  it("should not add duplicate items to the list", () => {
    queue.add({ aid: 1, uid: 123 });
    queue.add({ aid: 1, uid: 123 });
    expect(queue.list).toHaveLength(1);
  });

  it("should filter out items older than 24 hours", async () => {
    const oldItem = {
      aid: 1,
      uid: 123,
      startTime: Date.now() - 1000 * 60 * 60 * 25,
      status: "pending",
    } as const;
    queue.list.push(oldItem);
    await queue.check();
    expect(queue.list).toHaveLength(0);
  });

  it("should update item status to completed if state is 0", async () => {
    queue.add({ aid: 1, uid: 123 });
    const media = { Archive: { aid: 1, state: 0 }, stat: { aid: 1 } };
    // @ts-ignore
    vi.spyOn(biliApi, "getArchives").mockResolvedValue({ arc_audits: [media] });
    await queue.check();
    queue.once("update", (aid, status, data) => {
      expect(aid).toBe(1);
      expect(status).toBe("completed");
      expect(data).toBe(media);
    });
  });

  it("should update item status to error if state is negative and not -30 or -6", async () => {
    queue.add({ aid: 1, uid: 123 });
    const media = { Archive: { aid: 1, state: -1 }, stat: { aid: 1 } };
    // @ts-ignore
    vi.spyOn(biliApi, "getArchives").mockResolvedValue({ arc_audits: [media] });

    await queue.check();
    queue.once("update", (aid, status, data) => {
      expect(aid).toBe(1);
      expect(status).toBe("error");
      expect(data).toBe(media);
    });
  });

  it("should not update item status if state is -30 or -6", async () => {
    queue.add({ aid: 1, uid: 123 });
    const media = { Archive: { aid: 1, state: -30 }, stat: { aid: 1 } };
    // @ts-ignore
    vi.spyOn(biliApi, "getArchives").mockResolvedValue({ arc_audits: [media] });

    await queue.check();

    expect(queue.list[0].status).toBe("pending");
  });

  it("should remove items with pending status after check", async () => {
    queue.add({ aid: 1, uid: 123 });
    const media = { Archive: { aid: 1, state: 0 }, stat: { aid: 1 } };
    // @ts-ignore
    vi.spyOn(biliApi, "getArchives").mockResolvedValue({ arc_audits: [media] });

    await queue.check();

    expect(queue.list).toHaveLength(0);
  });

  it("should call checkLoop at specified intervals", async () => {
    const checkSpy = vi.spyOn(queue, "check");
    const setTimeoutSpy = vi.spyOn(global, "setTimeout");

    await queue.checkLoop();

    expect(checkSpy).toHaveBeenCalled();
    expect(setTimeoutSpy).toHaveBeenCalledWith(queue.checkLoop, 600 * 1000);
  });
});
