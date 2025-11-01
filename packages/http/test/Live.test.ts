import { expect, describe, it } from "vitest";
import { Live } from "../src/services/webhook/Live.js";
import type { Part } from "../src/types/webhook.js";

describe("Live", () => {
  describe("constructor", () => {
    it("应该正确创建 Live 实例", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      expect(live.eventId).toBe("event-123");
      expect(live.platform).toBe("blrec");
      expect(live.roomId).toBe("123456");
      expect(live.title).toBe("测试直播");
      expect(live.username).toBe("测试主播");
      expect(live.startTime).toBe(1640995200000);
      expect(live.parts).toEqual([]);
      expect(live.aid).toBeUndefined();
      expect(live.rawAid).toBeUndefined();
    });

    it("应该支持设置 aid 和 rawAid", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
        aid: 12345,
        rawAid: 67890,
      });

      expect(live.aid).toBe(12345);
      expect(live.rawAid).toBe(67890);
    });
  });

  describe("addPart", () => {
    it("应该正确添加分段，并设置默认值", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recording",
        title: "Part 1",
      });

      expect(live.parts.length).toBe(1);
      expect(live.parts[0].partId).toBe("part-1");
      expect(live.parts[0].filePath).toBe("/path/to/video.mp4");
      expect(live.parts[0].recordStatus).toBe("recording");
      expect(live.parts[0].uploadStatus).toBe("pending");
      expect(live.parts[0].rawUploadStatus).toBe("pending");
      expect(live.parts[0].rawFilePath).toBe("/path/to/video.mp4");
    });

    it("应该允许覆盖默认值", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        uploadStatus: "uploading",
        rawUploadStatus: "uploaded",
        rawFilePath: "/path/to/raw-video.flv",
        title: "Part 1",
      });

      expect(live.parts[0].uploadStatus).toBe("uploading");
      expect(live.parts[0].rawUploadStatus).toBe("uploaded");
      expect(live.parts[0].rawFilePath).toBe("/path/to/raw-video.flv");
    });

    it("应该支持添加多个分段", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video1.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "recording",
        title: "Part 2",
      });

      expect(live.parts.length).toBe(2);
      expect(live.parts[0].partId).toBe("part-1");
      expect(live.parts[1].partId).toBe("part-2");
    });
  });

  describe("updatePartValue", () => {
    it("应该正确更新分段的字段值", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recording",
        title: "Part 1",
      });

      live.updatePartValue("part-1", "recordStatus", "recorded");
      live.updatePartValue("part-1", "uploadStatus", "uploading");

      expect(live.parts[0].recordStatus).toBe("recorded");
      expect(live.parts[0].uploadStatus).toBe("uploading");
    });

    it("应该支持更新不同类型的字段", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recording",
        title: "Part 1",
      });

      live.updatePartValue("part-1", "endTime", 1640995500000);
      live.updatePartValue("part-1", "filePath", "/path/to/new-video.mp4");
      live.updatePartValue("part-1", "cover", "/path/to/cover.jpg");

      expect(live.parts[0].endTime).toBe(1640995500000);
      expect(live.parts[0].filePath).toBe("/path/to/new-video.mp4");
      expect(live.parts[0].cover).toBe("/path/to/cover.jpg");
    });

    it("如果分段不存在，不应该抛出错误", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      expect(() => {
        live.updatePartValue("non-existent-part", "recordStatus", "recorded");
      }).not.toThrow();
    });
  });

  describe("findPartByFilePath", () => {
    it("应该根据处理后的文件路径查找分段", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video.mp4",
        rawFilePath: "/path/to/raw-video.flv",
        recordStatus: "recorded",
        title: "Part 1",
      });

      const part = live.findPartByFilePath("/path/to/video.mp4", "handled");

      expect(part).toBeDefined();
      expect(part?.partId).toBe("part-1");
    });

    it("应该根据原始文件路径查找分段", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video.mp4",
        rawFilePath: "/path/to/raw-video.flv",
        recordStatus: "recorded",
        title: "Part 1",
      });

      const part = live.findPartByFilePath("/path/to/raw-video.flv", "raw");

      expect(part).toBeDefined();
      expect(part?.partId).toBe("part-1");
    });

    it("默认应该按照处理后的文件路径查找", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      const part = live.findPartByFilePath("/path/to/video.mp4");

      expect(part).toBeDefined();
      expect(part?.partId).toBe("part-1");
    });

    it("如果找不到分段，应该返回 undefined", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      const part = live.findPartByFilePath("/non/existent/path.mp4");

      expect(part).toBeUndefined();
    });

    it("应该在多个分段中正确查找", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video1.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "recorded",
        title: "Part 2",
      });

      const part = live.findPartByFilePath("/path/to/video2.mp4");

      expect(part).toBeDefined();
      expect(part?.partId).toBe("part-2");
    });

    it("如果提供了无效的类型，应该抛出错误", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      expect(() => {
        // @ts-expect-error: Testing invalid type
        live.findPartByFilePath("/path/to/video.mp4", "invalid");
      }).toThrow("type error");
    });
  });

  describe("removePart", () => {
    it("应该正确移除分段", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video1.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "recorded",
        title: "Part 2",
      });

      live.removePart("part-1");

      expect(live.parts.length).toBe(1);
      expect(live.parts[0].partId).toBe("part-2");
    });

    it("如果分段不存在，不应该改变 parts 数组", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      live.removePart("non-existent-part");

      expect(live.parts.length).toBe(1);
      expect(live.parts[0].partId).toBe("part-1");
    });

    it("应该能够移除所有分段", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video1.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "recorded",
        title: "Part 2",
      });

      live.removePart("part-1");
      live.removePart("part-2");

      expect(live.parts.length).toBe(0);
    });
  });
});
