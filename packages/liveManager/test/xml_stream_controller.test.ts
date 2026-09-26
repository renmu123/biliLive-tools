import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createRecordExtraDataController } from "../src/xml_stream_controller";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("createRecordExtraDataController", () => {
  it("should aggregate danma count and 10-second buckets from comment messages", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "xml-stream-controller-"));
    tempDirs.push(tempDir);

    const controller = createRecordExtraDataController(path.join(tempDir, "record.xml"));
    const startTimestamp = controller.data.meta.recordStartTimestamp;

    controller.addMessage({
      type: "comment",
      timestamp: startTimestamp,
      text: "first",
      sender: { name: "u1", uid: "1" },
    });
    controller.addMessage({
      type: "comment",
      timestamp: startTimestamp + 9_999,
      text: "second",
      sender: { name: "u2", uid: "2" },
    });
    controller.addMessage({
      type: "comment",
      timestamp: startTimestamp + 10_000,
      text: "third",
      sender: { name: "u1", uid: "1" },
    });
    controller.addMessage({
      type: "comment",
      timestamp: startTimestamp + 22_000,
      text: "fourth",
      sender: { name: "u3", uid: "3" },
    });

    expect(controller.getStats()).toEqual({
      danmaNum: 4,
      uniqMember: 3,
      scNum: 0,
      guardNum: 0,
      danmaStats: {
        danmaTimeline: {
          interval: 10,
          data: [2, 1, 1],
        },
      },
    });

    await controller.flush();
  });
});
