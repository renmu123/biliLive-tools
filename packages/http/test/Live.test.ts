import { expect, describe, it, beforeEach } from "vitest";
import { Live, Part, LiveManager } from "../src/services/webhook/Live.js";

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

      const result = live.removePart("part-1");

      expect(result).toBe(true);
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

      const result = live.removePart("non-existent-part");

      expect(result).toBe(false);
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

  describe("findPartById", () => {
    it("应该根据 ID 查找分段", () => {
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

      const part = live.findPartById("part-2");

      expect(part).toBeDefined();
      expect(part?.partId).toBe("part-2");
      expect(part?.filePath).toBe("/path/to/video2.mp4");
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

      const part = live.findPartById("non-existent");

      expect(part).toBeUndefined();
    });
  });

  describe("getRecordingParts", () => {
    it("应该返回所有正在录制的分段", () => {
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
        recordStatus: "recording",
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "recorded",
        title: "Part 2",
      });

      live.addPart({
        partId: "part-3",
        filePath: "/path/to/video3.mp4",
        recordStatus: "recording",
        title: "Part 3",
      });

      const recordingParts = live.getRecordingParts();

      expect(recordingParts.length).toBe(2);
      expect(recordingParts[0].partId).toBe("part-1");
      expect(recordingParts[1].partId).toBe("part-3");
    });

    it("如果没有正在录制的分段，应该返回空数组", () => {
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

      const recordingParts = live.getRecordingParts();

      expect(recordingParts.length).toBe(0);
    });
  });

  describe("getRecordedParts", () => {
    it("应该返回所有已录制完成的分段", () => {
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
        recordStatus: "recording",
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "recorded",
        title: "Part 2",
      });

      live.addPart({
        partId: "part-3",
        filePath: "/path/to/video3.mp4",
        recordStatus: "handled",
        title: "Part 3",
      });

      const recordedParts = live.getRecordedParts();

      expect(recordedParts.length).toBe(2);
      expect(recordedParts[0].partId).toBe("part-2");
      expect(recordedParts[1].partId).toBe("part-3");
    });

    it("应该排除错误状态的分段", () => {
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
        recordStatus: "error",
        title: "Part 2",
      });

      live.addPart({
        partId: "part-3",
        filePath: "/path/to/video3.mp4",
        recordStatus: "handled",
        title: "Part 3",
      });

      const recordedParts = live.getRecordedParts();

      expect(recordedParts.length).toBe(2);
      expect(recordedParts[0].partId).toBe("part-1");
      expect(recordedParts[1].partId).toBe("part-3");
    });
  });

  describe("getHandledParts", () => {
    it("应该返回所有已完全处理完成的分段", () => {
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
        recordStatus: "handled",
        title: "Part 2",
      });

      live.addPart({
        partId: "part-3",
        filePath: "/path/to/video3.mp4",
        recordStatus: "handled",
        title: "Part 3",
      });

      const handledParts = live.getHandledParts();

      expect(handledParts.length).toBe(2);
      expect(handledParts[0].partId).toBe("part-2");
      expect(handledParts[1].partId).toBe("part-3");
    });

    it("应该排除错误状态的分段", () => {
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
        recordStatus: "handled",
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "error",
        title: "Part 2",
      });

      live.addPart({
        partId: "part-3",
        filePath: "/path/to/video3.mp4",
        recordStatus: "handled",
        title: "Part 3",
      });

      const handledParts = live.getHandledParts();

      expect(handledParts.length).toBe(2);
      expect(handledParts[0].partId).toBe("part-1");
      expect(handledParts[1].partId).toBe("part-3");
    });
  });

  describe("hasRecordingParts", () => {
    it("如果有正在录制的分段，应该返回 true", () => {
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
        recordStatus: "recording",
        title: "Part 1",
      });

      expect(live.hasRecordingParts()).toBe(true);
    });

    it("如果没有正在录制的分段，应该返回 false", () => {
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

      expect(live.hasRecordingParts()).toBe(false);
    });
  });

  describe("areAllPartsHandled", () => {
    it("如果所有分段都已处理完成，应该返回 true", () => {
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
        recordStatus: "handled",
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "handled",
        title: "Part 2",
      });

      expect(live.areAllPartsHandled()).toBe(true);
    });

    it("如果有未处理完成的分段，应该返回 false", () => {
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
        recordStatus: "handled",
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "recorded",
        title: "Part 2",
      });

      expect(live.areAllPartsHandled()).toBe(false);
    });

    it("如果没有分段，应该返回 false", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      expect(live.areAllPartsHandled()).toBe(false);
    });

    it("如果有错误状态的分段，应该忽略它们只检查非错误分段", () => {
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
        recordStatus: "handled",
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "error",
        title: "Part 2",
      });

      live.addPart({
        partId: "part-3",
        filePath: "/path/to/video3.mp4",
        recordStatus: "handled",
        title: "Part 3",
      });

      expect(live.areAllPartsHandled()).toBe(true);
    });

    it("如果所有分段都是错误状态，应该返回 false", () => {
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
        recordStatus: "error",
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "error",
        title: "Part 2",
      });

      expect(live.areAllPartsHandled()).toBe(false);
    });
  });

  describe("getMaxEndTime", () => {
    it("应该返回结束时间最大的分段的结束时间", () => {
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
        endTime: 1640995500000,
      });

      live.addPart({
        partId: "part-2",
        filePath: "/path/to/video2.mp4",
        recordStatus: "recorded",
        title: "Part 2",
        endTime: 1640995800000,
      });

      expect(live.getMaxEndTime()).toBe(1640995800000);
    });

    it("如果没有分段，应该返回 undefined", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      expect(live.getMaxEndTime()).toBeUndefined();
    });

    it("如果分段没有结束时间，应该返回 undefined", () => {
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
        recordStatus: "recording",
        title: "Part 1",
      });

      expect(live.getMaxEndTime()).toBeUndefined();
    });
  });

  describe("toJSON", () => {
    it("应该正确序列化为 JSON 对象", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
        aid: 12345,
      });

      live.addPart({
        partId: "part-1",
        filePath: "/path/to/video1.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      const json = live.toJSON();

      expect(json.eventId).toBe("event-123");
      expect(json.platform).toBe("blrec");
      expect(json.roomId).toBe("123456");
      expect(json.title).toBe("测试直播");
      expect(json.username).toBe("测试主播");
      expect(json.startTime).toBe(1640995200000);
      expect(json.aid).toBe(12345);
      expect(json.parts.length).toBe(1);
      expect(json.parts[0].partId).toBe("part-1");
    });
  });
});

describe("Part", () => {
  describe("constructor", () => {
    it("应该正确创建 Part 实例", () => {
      const part = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recording",
      });

      expect(part.partId).toBe("part-1");
      expect(part.title).toBe("Part 1");
      expect(part.filePath).toBe("/path/to/video.mp4");
      expect(part.recordStatus).toBe("recording");
      expect(part.uploadStatus).toBe("pending");
      expect(part.rawFilePath).toBe("/path/to/video.mp4");
      expect(part.rawUploadStatus).toBe("pending");
    });

    it("应该支持设置可选字段", () => {
      const part = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        startTime: 1640995200000,
        endTime: 1640995500000,
        cover: "/path/to/cover.jpg",
        uploadStatus: "uploaded",
        rawFilePath: "/path/to/raw-video.flv",
        rawUploadStatus: "uploaded",
      });

      expect(part.startTime).toBe(1640995200000);
      expect(part.endTime).toBe(1640995500000);
      expect(part.cover).toBe("/path/to/cover.jpg");
      expect(part.uploadStatus).toBe("uploaded");
      expect(part.rawFilePath).toBe("/path/to/raw-video.flv");
      expect(part.rawUploadStatus).toBe("uploaded");
    });
  });

  describe("updateValue", () => {
    it("应该正确更新字段值", () => {
      const part = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recording",
      });

      part.updateValue("recordStatus", "recorded");
      part.updateValue("endTime", 1640995500000);

      expect(part.recordStatus).toBe("recorded");
      expect(part.endTime).toBe(1640995500000);
    });
  });

  describe("状态检查方法", () => {
    it("isRecording 应该正确判断是否正在录制", () => {
      const part1 = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recording",
      });

      const part2 = new Part({
        partId: "part-2",
        title: "Part 2",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
      });

      expect(part1.isRecording()).toBe(true);
      expect(part2.isRecording()).toBe(false);
    });

    it("isRecorded 应该正确判断是否已录制完成", () => {
      const part1 = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recording",
      });

      const part2 = new Part({
        partId: "part-2",
        title: "Part 2",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
      });

      const part3 = new Part({
        partId: "part-3",
        title: "Part 3",
        filePath: "/path/to/video.mp4",
        recordStatus: "handled",
      });

      expect(part1.isRecorded()).toBe(false);
      expect(part2.isRecorded()).toBe(true);
      expect(part3.isRecorded()).toBe(true);
    });

    it("isFullyHandled 应该正确判断是否已完全处理完成", () => {
      const part1 = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
      });

      const part2 = new Part({
        partId: "part-2",
        title: "Part 2",
        filePath: "/path/to/video.mp4",
        recordStatus: "handled",
      });

      expect(part1.isFullyHandled()).toBe(false);
      expect(part2.isFullyHandled()).toBe(true);
    });

    it("isUploaded 应该正确判断处理后的文件是否已上传", () => {
      const part1 = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        uploadStatus: "pending",
      });

      const part2 = new Part({
        partId: "part-2",
        title: "Part 2",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        uploadStatus: "uploaded",
      });

      expect(part1.isUploaded()).toBe(false);
      expect(part2.isUploaded()).toBe(true);
    });

    it("isRawUploaded 应该正确判断原始文件是否已上传", () => {
      const part1 = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        rawUploadStatus: "pending",
      });

      const part2 = new Part({
        partId: "part-2",
        title: "Part 2",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        rawUploadStatus: "uploaded",
      });

      expect(part1.isRawUploaded()).toBe(false);
      expect(part2.isRawUploaded()).toBe(true);
    });

    it("isError 应该正确判断是否处于错误状态", () => {
      const part1 = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recording",
      });

      const part2 = new Part({
        partId: "part-2",
        title: "Part 2",
        filePath: "/path/to/video.mp4",
        recordStatus: "error",
      });

      const part3 = new Part({
        partId: "part-3",
        title: "Part 3",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
      });

      expect(part1.isError()).toBe(false);
      expect(part2.isError()).toBe(true);
      expect(part3.isError()).toBe(false);
    });
  });

  describe("状态更新方法", () => {
    it("markAsRecorded 应该正确设置为录制完成状态", () => {
      const part = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recording",
      });

      part.markAsRecorded(1640995500000);

      expect(part.recordStatus).toBe("recorded");
      expect(part.endTime).toBe(1640995500000);
    });

    it("markAsPrehandled 应该正确设置为预处理完成状态", () => {
      const part = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
      });

      part.markAsPrehandled();

      expect(part.recordStatus).toBe("prehandled");
    });

    it("markAsHandled 应该正确设置为完全处理完成状态", () => {
      const part = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "prehandled",
      });

      part.markAsHandled();

      expect(part.recordStatus).toBe("handled");
    });

    it("updateUploadStatus 应该正确更新上传状态", () => {
      const part = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
      });

      part.updateUploadStatus("uploading");
      expect(part.uploadStatus).toBe("uploading");

      part.updateUploadStatus("uploaded", true);
      expect(part.rawUploadStatus).toBe("uploaded");
    });
  });

  describe("canBeDeleted", () => {
    it("如果已完全处理且已上传，应该返回 true", () => {
      const part = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "handled",
        uploadStatus: "uploaded",
      });

      expect(part.canBeDeleted()).toBe(true);
    });

    it("如果未完全处理，应该返回 false", () => {
      const part = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        uploadStatus: "uploaded",
      });

      expect(part.canBeDeleted()).toBe(false);
    });

    it("如果未上传，应该返回 false", () => {
      const part = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "handled",
        uploadStatus: "pending",
      });

      expect(part.canBeDeleted()).toBe(false);
    });
  });

  describe("toJSON", () => {
    it("应该正确序列化为 JSON 对象", () => {
      const part = new Part({
        partId: "part-1",
        title: "Part 1",
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        startTime: 1640995200000,
        endTime: 1640995500000,
      });

      const json = part.toJSON();

      expect(json.partId).toBe("part-1");
      expect(json.title).toBe("Part 1");
      expect(json.filePath).toBe("/path/to/video.mp4");
      expect(json.recordStatus).toBe("recorded");
      expect(json.startTime).toBe(1640995200000);
      expect(json.endTime).toBe(1640995500000);
      expect(json.uploadStatus).toBe("pending");
      expect(json.rawUploadStatus).toBe("pending");
    });
  });
});

describe("LiveManager", () => {
  let liveManager: LiveManager;

  beforeEach(() => {
    liveManager = new LiveManager();
  });

  describe("constructor", () => {
    it("应该初始化为空的 LiveManager", () => {
      expect(liveManager.getCount()).toBe(0);
      expect(liveManager.getAllLives()).toEqual([]);
    });
  });

  describe("addLive 和 getAllLives", () => {
    it("应该能够添加 Live 实例", () => {
      const live = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      liveManager.addLive(live);

      expect(liveManager.getCount()).toBe(1);
      expect(liveManager.getAllLives()).toContain(live);
    });

    it("应该能够添加多个 Live 实例", () => {
      const live1 = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播1",
        username: "测试主播",
        startTime: 1640995200000,
      });

      const live2 = new Live({
        platform: "blrec",
        roomId: "456",
        title: "测试直播2",
        username: "测试主播",
        startTime: 1640995300000,
      });

      liveManager.addLive(live1);
      liveManager.addLive(live2);

      expect(liveManager.getCount()).toBe(2);
      expect(liveManager.getAllLives()).toEqual([live1, live2]);
    });
  });

  describe("liveData getter/setter", () => {
    it("应该能够通过 liveData 属性获取和设置 Lives", () => {
      const live1 = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播1",
        username: "测试主播",
        startTime: 1640995200000,
      });

      const live2 = new Live({
        platform: "blrec",
        roomId: "456",
        title: "测试直播2",
        username: "测试主播",
        startTime: 1640995300000,
      });

      liveManager.liveData = [live1, live2];

      expect(liveManager.liveData).toEqual([live1, live2]);
      expect(liveManager.getCount()).toBe(2);
    });
  });

  describe("findLiveByEventId", () => {
    it("应该能够通过 eventId 查找 Live", () => {
      const live = new Live({
        eventId: "test-event-id",
        platform: "blrec",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      liveManager.addLive(live);

      const found = liveManager.findLiveByEventId("test-event-id");
      expect(found).toBe(live);
    });

    it("如果找不到应该返回 undefined", () => {
      const found = liveManager.findLiveByEventId("non-existent");
      expect(found).toBeUndefined();
    });
  });

  describe("findLiveIndexByEventId", () => {
    it("应该能够通过 eventId 查找 Live 的索引", () => {
      const live1 = new Live({
        eventId: "event-1",
        platform: "blrec",
        roomId: "123",
        title: "测试直播1",
        username: "测试主播",
        startTime: 1640995200000,
      });

      const live2 = new Live({
        eventId: "event-2",
        platform: "blrec",
        roomId: "456",
        title: "测试直播2",
        username: "测试主播",
        startTime: 1640995300000,
      });

      liveManager.addLive(live1);
      liveManager.addLive(live2);

      expect(liveManager.findLiveIndexByEventId("event-1")).toBe(0);
      expect(liveManager.findLiveIndexByEventId("event-2")).toBe(1);
    });

    it("如果找不到应该返回 -1", () => {
      expect(liveManager.findLiveIndexByEventId("non-existent")).toBe(-1);
    });
  });

  describe("findLiveByFilePath", () => {
    it("应该能够通过文件路径查找 Live", () => {
      const live = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      const part = live.addPart({
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      liveManager.addLive(live);

      const found = liveManager.findLiveByFilePath("/path/to/video.mp4");
      expect(found).toStrictEqual({ live, part });
    });

    it("如果找不到应该返回 null", () => {
      const found = liveManager.findLiveByFilePath("/non/existent/path.mp4");
      expect(found).toBeNull();
    });
  });

  describe("findLive 和 findLiveLast", () => {
    it("findLive 应该找到第一个匹配的 Live", () => {
      const live1 = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      const live2 = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995300000,
      });

      liveManager.addLive(live1);
      liveManager.addLive(live2);

      const found = liveManager.findLive((live) => live.roomId === "123");
      expect(found).toBe(live1);
    });

    it("findLiveLast 应该找到最后一个匹配的 Live", () => {
      const live1 = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      const live2 = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995300000,
      });

      liveManager.addLive(live1);
      liveManager.addLive(live2);

      const found = liveManager.findLiveLast((live) => live.roomId === "123");
      expect(found).toBe(live2);
    });
  });

  describe("removeLiveByEventId", () => {
    it("应该能够通过 eventId 删除 Live", () => {
      const live = new Live({
        eventId: "test-event-id",
        platform: "blrec",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      liveManager.addLive(live);
      expect(liveManager.getCount()).toBe(1);

      const removed = liveManager.removeLiveByEventId("test-event-id");
      expect(removed).toBe(true);
      expect(liveManager.getCount()).toBe(0);
    });

    it("如果 Live 不存在应该返回 false", () => {
      const removed = liveManager.removeLiveByEventId("non-existent");
      expect(removed).toBe(false);
    });
  });

  describe("removeLiveByIndex", () => {
    it("应该能够通过索引删除 Live", () => {
      const live1 = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播1",
        username: "测试主播",
        startTime: 1640995200000,
      });

      const live2 = new Live({
        platform: "blrec",
        roomId: "456",
        title: "测试直播2",
        username: "测试主播",
        startTime: 1640995300000,
      });

      liveManager.addLive(live1);
      liveManager.addLive(live2);

      const removed = liveManager.removeLiveByIndex(0);
      expect(removed).toBe(true);
      expect(liveManager.getCount()).toBe(1);
      expect(liveManager.getAllLives()[0]).toBe(live2);
    });

    it("如果索引无效应该返回 false", () => {
      expect(liveManager.removeLiveByIndex(0)).toBe(false);
      expect(liveManager.removeLiveByIndex(-1)).toBe(false);
    });
  });

  describe("removeLive", () => {
    it("应该能够删除指定的 Live 实例", () => {
      const live = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      liveManager.addLive(live);
      expect(liveManager.getCount()).toBe(1);

      const removed = liveManager.removeLive(live);
      expect(removed).toBe(true);
      expect(liveManager.getCount()).toBe(0);
    });

    it("如果 Live 不在列表中应该返回 false", () => {
      const live = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      const removed = liveManager.removeLive(live);
      expect(removed).toBe(false);
    });
  });

  describe("getLiveByIndex", () => {
    it("应该能够通过索引获取 Live", () => {
      const live = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      liveManager.addLive(live);

      expect(liveManager.getLiveByIndex(0)).toBe(live);
    });

    it("如果索引无效应该返回 undefined", () => {
      expect(liveManager.getLiveByIndex(0)).toBeUndefined();
      expect(liveManager.getLiveByIndex(-1)).toBeUndefined();
      expect(liveManager.getLiveByIndex(10)).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("应该能够清空所有 Live", () => {
      const live1 = new Live({
        platform: "blrec",
        roomId: "123",
        title: "测试直播1",
        username: "测试主播",
        startTime: 1640995200000,
      });

      const live2 = new Live({
        platform: "blrec",
        roomId: "456",
        title: "测试直播2",
        username: "测试主播",
        startTime: 1640995300000,
      });

      liveManager.addLive(live1);
      liveManager.addLive(live2);
      expect(liveManager.getCount()).toBe(2);

      liveManager.clear();
      expect(liveManager.getCount()).toBe(0);
      expect(liveManager.getAllLives()).toEqual([]);
    });
  });

  describe("findRecentLive", () => {
    it("应该找到最近的 Live（在时间范围内）", () => {
      const live = new Live({
        platform: "blrec",
        software: "blrec-software",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        startTime: 1640995200000,
        endTime: 1640995500000, // 5分钟后
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      liveManager.addLive(live);

      const currentTime = 1640995500000 + 3 * 60 * 1000; // 3分钟后
      const found = liveManager.findRecentLive("123", "blrec-software", 10, currentTime);

      expect(found).toBe(live);
    });

    it("如果时间超出范围应该返回 undefined", () => {
      const live = new Live({
        platform: "blrec",
        software: "blrec-software",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        startTime: 1640995200000,
        endTime: 1640995500000,
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      liveManager.addLive(live);

      const currentTime = 1640995500000 + 15 * 60 * 1000; // 15分钟后
      const found = liveManager.findRecentLive("123", "blrec-software", 10, currentTime);

      expect(found).toBeUndefined();
    });

    it("如果房间ID或软件不匹配应该返回 undefined", () => {
      const live = new Live({
        platform: "blrec",
        software: "blrec-software",
        roomId: "123",
        title: "测试直播",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live.addPart({
        startTime: 1640995200000,
        endTime: 1640995500000,
        filePath: "/path/to/video.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      liveManager.addLive(live);

      const currentTime = 1640995500000 + 3 * 60 * 1000;

      // 房间ID不匹配
      expect(liveManager.findRecentLive("456", "blrec-software", 10, currentTime)).toBeUndefined();

      // 软件不匹配
      expect(liveManager.findRecentLive("123", "other-software", 10, currentTime)).toBeUndefined();
    });
    it("如果存在多个匹配的 Live，应该返回最新的一个", () => {
      const live1 = new Live({
        platform: "blrec",
        software: "blrec-software",
        roomId: "123",
        title: "测试直播1",
        username: "测试主播",
        startTime: 1640995200000,
      });
      live1.addPart({
        startTime: 1640995200000,
        endTime: 1640995500000,
        filePath: "/path/to/video1.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });
      const live2 = new Live({
        platform: "blrec",
        software: "blrec-software",
        roomId: "123",
        title: "测试直播2",
        username: "测试主播",
        startTime: 1640995300000,
      });
      live2.addPart({
        startTime: 1640995300000,
        endTime: 1640995600000,
        filePath: "/path/to/video2.mp4",
        recordStatus: "recorded",
        title: "Part 2",
      });
      liveManager.addLive(live1);
      liveManager.addLive(live2);

      const currentTime = 1640995600000 + 3 * 60 * 1000;
      const found = liveManager.findRecentLive("123", "blrec-software", 10, currentTime);

      expect(found).toBe(live2);
    });
  });

  describe("findLastLiveByRoomAndPlatform", () => {
    it("应该找到最后一个匹配房间和软件的 Live（没有 endTime）", () => {
      const live1 = new Live({
        platform: "blrec",
        software: "blrec-software",
        roomId: "123",
        title: "测试直播1",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live1.addPart({
        startTime: 1640995200000,
        filePath: "/path/to/video1.mp4",
        recordStatus: "recording",
        title: "Part 1",
      });

      const live2 = new Live({
        platform: "blrec",
        software: "blrec-software",
        roomId: "123",
        title: "测试直播2",
        username: "测试主播",
        startTime: 1640995300000,
      });

      live2.addPart({
        startTime: 1640995300000,
        filePath: "/path/to/video2.mp4",
        recordStatus: "recording",
        title: "Part 2",
      });

      liveManager.addLive(live1);
      liveManager.addLive(live2);

      const found = liveManager.findLastLiveByRoomAndPlatform("123", "blrec-software");
      expect(found).toBe(live2);
    });

    it("如果 Live 有 endTime 应该被跳过", () => {
      const live1 = new Live({
        platform: "blrec",
        software: "blrec-software",
        roomId: "123",
        title: "测试直播1",
        username: "测试主播",
        startTime: 1640995200000,
      });

      live1.addPart({
        startTime: 1640995200000,
        endTime: 1640995500000,
        filePath: "/path/to/video1.mp4",
        recordStatus: "recorded",
        title: "Part 1",
      });

      liveManager.addLive(live1);

      const found = liveManager.findLastLiveByRoomAndPlatform("123", "blrec-software");
      expect(found).toBeUndefined();
    });
  });

  describe("toJSON", () => {
    it("应该正确序列化为 JSON 对象数组", () => {
      const live1 = new Live({
        eventId: "event-1",
        platform: "blrec",
        roomId: "123",
        title: "测试直播1",
        username: "测试主播",
        startTime: 1640995200000,
      });

      const live2 = new Live({
        eventId: "event-2",
        platform: "blrec",
        roomId: "456",
        title: "测试直播2",
        username: "测试主播",
        startTime: 1640995300000,
      });

      liveManager.addLive(live1);
      liveManager.addLive(live2);

      const json = liveManager.toJSON();

      expect(json).toEqual([live1.toJSON(), live2.toJSON()]);
    });
  });
});
