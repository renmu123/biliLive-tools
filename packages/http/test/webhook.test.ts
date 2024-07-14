import { expect, describe, it, beforeEach, vi } from "vitest";
import { WebhookHandler } from "../src/services/webhook.js";
import { DEFAULT_BILIUP_CONFIG } from "@biliLive-tools/shared/lib/presets/videoPreset.js";

import { type Options, type Live } from "../src/services/webhook.js";

describe("WebhookHandler", () => {
  let webhookHandler: WebhookHandler;

  beforeEach(() => {
    webhookHandler = new WebhookHandler();
  });

  describe("handleLiveData", () => {
    webhookHandler = new WebhookHandler();

    it("event: FileOpening, liveData的情况", async () => {
      webhookHandler.liveData = [];
      const options: Options = {
        event: "FileOpening",
        roomId: 123,
        platform: "bili-recorder",
        time: "2022-01-01T00:00:00Z",
        title: "Test Video",
        filePath: "/path/to/video.mp4",
        username: "test",
      };

      await webhookHandler.handleLiveData(options, 10);
      const liveData = webhookHandler.liveData;
      expect(liveData.length).toBe(1);
      expect(liveData[0].eventId).toBeDefined();
      expect(liveData[0].platform).toBe(options.platform);
      expect(liveData[0].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].roomId).toBe(options.roomId);
      expect(liveData[0].videoName).toBe(options.title);
      expect(liveData[0].parts.length).toBe(1);
      expect(liveData[0].parts[0].partId).toBeDefined();
      expect(liveData[0].parts[0].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].parts[0].filePath).toBe(options.filePath);
      expect(liveData[0].parts[0].status).toBe("recording");
    });

    it("event: FileClosed, liveData的情况", async () => {
      webhookHandler.liveData = [];
      const options: Options = {
        event: "FileClosed",
        roomId: 123,
        platform: "bili-recorder",
        time: "2022-01-01T00:00:00Z",
        title: "Test Video",
        filePath: "/path/to/video.mp4",
        username: "test",
      };

      await webhookHandler.handleLiveData(options, 10);
      const liveData = webhookHandler.liveData;

      expect(liveData.length).toBe(1);
      expect(liveData[0].eventId).toBeDefined();
      expect(liveData[0].platform).toBe(options.platform);
      expect(liveData[0].roomId).toBe(options.roomId);
      expect(liveData[0].videoName).toBe(options.title);
      expect(liveData[0].parts.length).toBe(1);
      expect(liveData[0].parts[0].partId).toBeDefined();
      expect(liveData[0].parts[0].filePath).toBe(options.filePath);
      expect(liveData[0].parts[0].status).toBe("recorded");
    });

    it("存在live的情况下，且roomId相同，在限制时间内又进来一条数据", async () => {
      webhookHandler.liveData = [];
      const existingLive: Live = {
        eventId: "existing-event-id",
        platform: "bili-recorder",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        roomId: 123,
        videoName: "Existing Video",
        parts: [
          {
            partId: "existing-part-id",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            filePath: "/path/to/existing-video.mp4",
            status: "recording",
            endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          },
        ],
      };
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "VideoFileCreatedEvent",
        roomId: 123,
        platform: "bili-recorder",
        time: "2022-01-01T00:09:00Z",
        title: "New Video",
        filePath: "/path/to/new-video.mp4",
        username: "test",
      };
      await webhookHandler.handleLiveData(options, 10);
      const liveData = webhookHandler.liveData;

      expect(liveData.length).toBe(1);
      expect(liveData[0].eventId).toBe(existingLive.eventId);
      expect(liveData[0].platform).toBe(existingLive.platform);
      expect(liveData[0].startTime).toBe(existingLive.startTime);
      expect(liveData[0].roomId).toBe(existingLive.roomId);
      expect(liveData[0].videoName).toBe(existingLive.videoName);
      expect(liveData[0].parts.length).toBe(2);
      expect(liveData[0].parts[0]).toBe(existingLive.parts[0]);
      expect(liveData[0].parts[1].partId).toBeDefined();
      expect(liveData[0].parts[1].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].parts[1].filePath).toBe(options.filePath);
      expect(liveData[0].parts[1].status).toBe("recording");
    });
    it("存在live的情况下，且roomId相同，在限制时间外又进来一条数据", async () => {
      webhookHandler.liveData = [];
      const existingLive: Live = {
        eventId: "existing-event-id",
        platform: "bili-recorder",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        roomId: 123,
        videoName: "Existing Video",
        parts: [
          {
            partId: "existing-part-id",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            filePath: "/path/to/existing-video.mp4",
            status: "recording",
            endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          },
        ],
      };
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "VideoFileCreatedEvent",
        roomId: 123,
        platform: "bili-recorder",
        time: "2022-01-01T00:16:00Z",
        title: "New Video",
        filePath: "/path/to/new-video.mp4",
        username: "test",
      };
      await webhookHandler.handleLiveData(options, 10);
      const liveData = webhookHandler.liveData;
      // console.log("liveData", liveData, liveData.length);

      expect(liveData.length).toBe(2);
      expect(liveData[0].eventId).toBe(existingLive.eventId);
      expect(liveData[0].platform).toBe(existingLive.platform);
      expect(liveData[0].startTime).toBe(existingLive.startTime);
      expect(liveData[0].roomId).toBe(existingLive.roomId);
      expect(liveData[0].videoName).toBe(existingLive.videoName);
      expect(liveData[0].parts.length).toBe(1);
      expect(liveData[0].parts[0]).toBe(existingLive.parts[0]);
      expect(liveData[1].parts[0].partId).toBeDefined();
      // expect(liveData[0].parts[1].startTime).toBe(new Date(options.time).getTime());
      // expect(liveData[0].parts[1].filePath).toBe(options.filePath);
      // expect(liveData[0].parts[1].status).toBe("recording");
    });
    it("存在live的情况下，且roomId相同，在限制时间外又进来一条event: FileClosed数据", async () => {
      webhookHandler.liveData = [];
      const existingLive: Live = {
        eventId: "existing-event-id",
        platform: "bili-recorder",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        roomId: 123,
        videoName: "Existing Video",
        parts: [
          {
            partId: "existing-part-id",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            filePath: "/path/to/existing-video.mp4",
            status: "recording",
          },
        ],
      };
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileClosed",
        roomId: 123,
        platform: "bili-recorder",
        time: "2022-01-01T00:05:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video.mp4",
        username: "test",
      };

      await webhookHandler.handleLiveData(options, 10);
      const liveData = webhookHandler.liveData;

      expect(liveData.length).toBe(1);
      expect(liveData[0].eventId).toBe(existingLive.eventId);
      expect(liveData[0].platform).toBe(existingLive.platform);
      expect(liveData[0].startTime).toBe(existingLive.startTime);
      expect(liveData[0].roomId).toBe(existingLive.roomId);
      expect(liveData[0].videoName).toBe(existingLive.videoName);
      expect(liveData[0].parts.length).toBe(1);
      expect(liveData[0].parts[0].partId).toBe(existingLive.parts[0].partId);
      expect(liveData[0].parts[0].startTime).toBe(existingLive.parts[0].startTime);
      expect(liveData[0].parts[0].filePath).toBe(existingLive.parts[0].filePath);
      expect(liveData[0].parts[0].endTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].parts[0].status).toBe("recorded");
    });
    it("存在live的情况下，且最后一个part的结束时间并非最新，又进来一条event: FileClosed数据", async () => {
      webhookHandler.liveData = [];
      const existingLive: Live = {
        eventId: "existing-event-id",
        platform: "bili-recorder",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        roomId: 123,
        videoName: "Existing Video",
        parts: [
          {
            partId: "existing-part-id2",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            filePath: "/path/to/existing-video.mp4",
            status: "recorded",
            endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          },
          {
            partId: "existing-part-id",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            filePath: "/path/to/existing-video.mp4",
            status: "recording",
          },
        ],
      };
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileOpening",
        roomId: 123,
        platform: "bili-recorder",
        time: "2022-01-01T00:09:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video.mp4",
        username: "test",
      };

      await webhookHandler.handleLiveData(options, 10);
      const liveData = webhookHandler.liveData;

      expect(liveData.length).toBe(1);
      expect(liveData[0].eventId).toBe(existingLive.eventId);
      expect(liveData[0].platform).toBe(existingLive.platform);
      expect(liveData[0].startTime).toBe(existingLive.startTime);
      expect(liveData[0].roomId).toBe(existingLive.roomId);
      expect(liveData[0].videoName).toBe(existingLive.videoName);
      expect(liveData[0].parts.length).toBe(3);
      // expect(liveData[0].parts[0].partId).toBe(existingLive.parts[0].partId);
      // expect(liveData[0].parts[0].startTime).toBe(existingLive.parts[0].startTime);
      // expect(liveData[0].parts[0].filePath).toBe(existingLive.parts[0].filePath);
      // expect(liveData[0].parts[0].endTime).toBe(new Date(options.time).getTime());
      // expect(liveData[0].parts[0].status).toBe("recorded");
    });
  });

  describe.concurrent("formatTime", () => {
    it("should format the time correctly", () => {
      const time = "2022-01-01T12:34:56.789Z";
      const result = WebhookHandler.formatTime(time);
      expect(result).toEqual({
        year: "2022",
        month: "01",
        day: "01",
        hours: "20",
        minutes: "34",
        now: "2022.01.01",
        seconds: "56",
      });
    });
  });

  describe.concurrent("foramtTitle", () => {
    const handler = new WebhookHandler();

    it("should format the title correctly", () => {
      process.env.TZ = "Europe/London";
      const options = {
        title: "My Title",
        username: "Jo",
        time: "2022-01-01T12:34:56.789Z",
      };
      const template =
        "Title:{{title}},User:{{user}},Date:{{now}},yyyy:{{yyyy}},MM:{{MM}},dd:{{dd}},hours:{{HH}},m:{{mm}},s:{{ss}}";
      const result = handler.foramtTitle(options, template);
      expect(result).toBe(
        "Title:My Title,User:Jo,Date:2022.01.01,yyyy:2022,MM:01,dd:01,hours:20,m:34,s:56",
      );
    });

    it("should trim the title to 80 characters", () => {
      process.env.TZ = "Europe/London";
      const options = {
        title: "This is a very long title that exceeds 80 characters",
        username: "John Doe",
        time: "2022-01-01T12:34:56.789Z",
      };
      const template = "Title: {{title}}, User: {{user}}, Date: {{now}}";
      const result = handler.foramtTitle(options, template);
      expect(result.length).toBe(80);
    });
  });

  describe("canHandle", () => {
    const handler = new WebhookHandler();
    it("should return true when roomSetting is open", () => {
      const roomSetting = { open: true };
      const result = handler.canRoomOpen(roomSetting, "", 123);
      expect(result).toBe(true);
    });

    it("should return false when roomSetting is open and blacklist is provided", () => {
      const roomSetting = { open: true };
      const result = handler.canRoomOpen(roomSetting, "*", 123);
      expect(result).toBe(true);
    });

    it("should return false when roomSetting is closed", () => {
      const roomSetting = { open: false };
      const result = handler.canRoomOpen(roomSetting, "", 123);
      expect(result).toBe(false);
    });

    it("should return false when roomSetting is closed and blacklist is provided", () => {
      const roomSetting = { open: false };
      const result = handler.canRoomOpen(roomSetting, "*", 123);
      expect(result).toBe(false);
    });

    it("should return true when roomSetting is not provided and roomId is not in the blacklist", () => {
      const roomSetting = undefined;
      const roomId = 123;
      const result = handler.canRoomOpen(roomSetting, "", roomId);
      expect(result).toBe(true);
    });

    it("should return true when roomSetting is not provided and roomId is not in the blacklist", () => {
      const roomSetting = undefined;
      const roomId = 123;
      const result = handler.canRoomOpen(roomSetting, "456", roomId);
      expect(result).toBe(true);
    });

    it("should return false when roomSetting is not provided and roomId is in the blacklist", () => {
      const roomSetting = undefined;
      const roomId = 123;
      const result = handler.canRoomOpen(roomSetting, "123,456", roomId);
      expect(result).toBe(false);
    });

    it("should return false when roomSetting is not provided and the blacklist contains '*'", () => {
      const roomSetting = undefined;
      const roomId = 123;
      const result = handler.canRoomOpen(roomSetting, "*", roomId);
      expect(result).toBe(false);
    });
  });

  describe.concurrent("getRoomSetting", () => {
    /**
     * 获取房间配置项
     */
    function getRoomSetting(key: string, roomSetting: any, appConfig?: any) {
      if (roomSetting) {
        if (roomSetting.noGlobal?.includes(key)) return roomSetting[key];

        return appConfig?.webhook[key];
      } else {
        return appConfig?.webhook[key];
      }
    }

    it("should return the value from roomSetting if it exists and noGlobal does not include the key", () => {
      const roomSetting = {
        noGlobal: ["key2"],
        key1: "value1",
        key2: "value2",
      };
      const key = "key1";

      const result = getRoomSetting(key, roomSetting);

      expect(result).toBe(undefined);
    });

    it("should return the value from appConfig.webhook if roomSetting does not exist", () => {
      const appConfig = {
        webhook: {
          key1: "value1",
          key2: "value2",
        },
      };
      const key = "key1";

      const result = getRoomSetting(key, undefined, appConfig);

      expect(result).toBe(appConfig.webhook[key]);
    });

    it("should return the value from appConfig.webhook if roomSetting exists but noGlobal includes the key", () => {
      const roomSetting = {
        noGlobal: ["key2"],
        key1: "value1",
        key2: "value2",
      };
      const appConfig = {
        webhook: {
          key1: "value3",
          key2: "value4",
        },
      };
      const key = "key2";

      const result = getRoomSetting(key, roomSetting, appConfig);

      expect(result).toBe(roomSetting[key]);
    });

    it("should return the value from appConfig.webhook if roomSetting exists but noGlobal not includes the key", () => {
      const roomSetting = {
        noGlobal: [],
        key1: "value1",
        key2: "value2",
      };
      const appConfig = {
        webhook: {
          key1: "value3",
          key2: "value4",
        },
      };
      const key = "key2";

      const result = getRoomSetting(key, roomSetting, appConfig);

      expect(result).toBe(appConfig.webhook[key]);
    });

    it("should return the value from appConfig.webhook if roomSetting exists but noGlobal not includes the key", () => {
      const roomSetting = {
        noGlobal: undefined,
        key1: "value1",
        key2: "value2",
      };
      const appConfig = {
        webhook: {
          key1: "value3",
          key2: "value4",
        },
      };
      const key = "key2";

      const result = getRoomSetting(key, roomSetting, appConfig);

      expect(result).toBe(appConfig.webhook[key]);
    });
  });

  describe("handle", () => {
    const webhookHandler = new WebhookHandler();
    it("应在房间不为open时停止操作", async () => {
      // Arrange
      const options = {
        roomId: 123,
        event: "FileOpening",
      };
      // @ts-ignore
      const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({ open: false });
      const handleLiveDataSpy = vi.spyOn(webhookHandler, "handleLiveData");

      // Act
      console.log(webhookHandler.getConfig(options.roomId));
      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(options.roomId);
      expect(handleLiveDataSpy).not.toHaveBeenCalled();
    });

    it("should handle the options and return if the event is 'FileOpening' or 'VideoFileCreatedEvent'", async () => {
      // Arrange
      const options: Options = {
        roomId: 123,
        event: "FileOpening",
        filePath: "/path/to/part1.mp4",
        time: "2022-01-01T00:05:00Z",
        username: "test",
        platform: "blrec",
        title: "test video",
      };
      const getConfigSpy = vi
        .spyOn(webhookHandler, "getConfig")
        // @ts-ignore
        .mockReturnValue({ open: true, title: "test" });
      vi.mock("@biliLive-tools/shared", async (importOriginal) => {
        const mod = await importOriginal<typeof import("@biliLive-tools/shared")>();
        return {
          ...mod,
          videoPreset: {
            get: vi.fn().mockReturnValue({}),
          },
          // 替换一些导出
          namedExport: vi.fn(),
        };
      });

      // Act
      const result = await webhookHandler.handle(options);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(options.roomId);
      expect(result).toBeUndefined();
    });

    it("should handle the options and return if the file size is too small", async () => {
      // Arrange
      const options: Options = {
        roomId: 123,
        event: "VideoFileCompletedEvent",
        filePath: "/path/to/part1.mp4",
        time: "2022-01-01T00:05:00Z",
        username: "test",
        platform: "blrec",
        title: "test video",
      };
      vi.mock("@biliLive-tools/shared/lib/utils/index.js", async (importOriginal) => {
        const mod =
          await importOriginal<typeof import("@biliLive-tools/shared/lib/utils/index.js")>();
        return {
          ...mod,
          getFileSize: vi.fn().mockResolvedValue(50),
          // 替换一些导出
          namedExport: vi.fn(),
        };
      });
      const getConfigSpy = vi.spyOn(webhookHandler, "getConfig");
      // @ts-ignore
      getConfigSpy.mockReturnValue({ open: true, minSize: 100, title: "test" });

      // Act
      const result = await webhookHandler.handle(options);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(options.roomId);
      expect(result).toBeUndefined();
      expect(webhookHandler.liveData.length).toBe(1);
      expect(webhookHandler.liveData[0].parts.length).toBe(0);
    });

    // it("should handle the options and return if the current part is not found", async () => {
    //   // Arrange
    //   const options: Options = {
    //     roomId: 123,
    //     event: "VideoFileCompletedEvent",
    //     filePath: "/path/to/part1.mp4",
    //     time: "2022-01-01T00:05:00Z",
    //     username: "test",
    //     platform: "blrec",
    //     title: "test video",
    //   };
    //   vi.mock("@biliLive-tools/shared/lib/utils/index.js", async (importOriginal) => {
    //     const mod =
    //       await importOriginal<typeof import("@biliLive-tools/shared/lib/utils/index.js")>();
    //     return {
    //       ...mod,
    //       getFileSize: vi.fn().mockResolvedValue(150),
    //       // 替换一些导出
    //       namedExport: vi.fn(),
    //     };
    //   });
    //   const getConfigSpy = vi.spyOn(webhookHandler, "getConfig");
    //   // @ts-ignore
    //   getConfigSpy.mockReturnValue({ open: true, minSize: 100, title: "test" });
    //   const handleLiveDataSpy = vi.spyOn(webhookHandler, "handleLiveData");
    //   handleLiveDataSpy.mockResolvedValue(0);

    //   // Act
    //   const result = await webhookHandler.handle(options);

    //   // Assert
    //   expect(getConfigSpy).toHaveBeenCalledWith(options.roomId);
    //   expect(handleLiveDataSpy).toHaveBeenCalledWith(options, expect.any(Number));
    //   expect(result).toBeUndefined();
    // });

    // Add more test cases for different scenarios
  });
  describe("handleLive", () => {
    it("应在上传成功时正确设置状态", async () => {
      // Arrange
      const live: Live = {
        eventId: "123",
        platform: "blrec",
        roomId: 123,
        videoName: "Test Video",
        parts: [
          {
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            status: "handled",
            endTime: new Date("2022-01-01T00:05:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
          {
            partId: "part-2",
            filePath: "/path/to/part2.mp4",
            status: "handled",
            endTime: new Date("2022-01-01T00:10:00Z").getTime(),
            cover: "/path/to/cover2.jpg",
          },
          {
            partId: "part-3",
            filePath: "/path/to/part3.mp4",
            status: "handled",
            endTime: new Date("2022-01-01T00:15:00Z").getTime(),
            cover: "/path/to/cover3.jpg",
          },
        ],
      };
      vi.mock("@biliLive-tools/shared", async (importOriginal) => {
        const mod = await importOriginal<typeof import("@biliLive-tools/shared")>();
        return {
          ...mod,
          videoPreset: {
            get: vi.fn().mockReturnValue({}),
          },
          // 替换一些导出
          namedExport: vi.fn(),
        };
      });
      // @ts-ignore
      const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
        mergePart: true,
        uploadPresetId: "preset-id",
        uid: 456,
        removeOriginAfterUpload: true,
        useLiveCover: true,
      });
      const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
      const addEditMediaTaskSpy = vi
        .spyOn(webhookHandler, "addEditMediaTask")
        .mockResolvedValue(undefined);
      // Act
      await webhookHandler.handleLive(live);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
      expect(addUploadTaskSpy).toHaveBeenCalled();
      expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
      expect(addUploadTaskSpy).toHaveBeenCalledWith(
        456,
        ["/path/to/part1.mp4", "/path/to/part2.mp4", "/path/to/part3.mp4"],
        {
          ...DEFAULT_BILIUP_CONFIG,
          title: "Test Video",
          cover: "/path/to/cover.jpg",
        },
        true,
      );
      expect(live.aid).toBe(789);
      expect(live.parts[0].status).toBe("uploaded");
      expect(live.parts[1].status).toBe("uploaded");
      expect(live.parts[2].status).toBe("uploaded");
    });
    it("应在断播续传未开启不进行上传", async () => {
      // Arrange
      const live: Live = {
        eventId: "123",
        platform: "blrec",
        roomId: 123,
        videoName: "Test Video",
        parts: [
          {
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            status: "handled",
            endTime: new Date("2022-01-01T00:05:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
        ],
      };
      vi.mock("@biliLive-tools/shared", async (importOriginal) => {
        const mod = await importOriginal<typeof import("@biliLive-tools/shared")>();
        return {
          ...mod,
          videoPreset: {
            get: vi.fn().mockReturnValue({}),
          },
          // 替换一些导出
          namedExport: vi.fn(),
        };
      });
      // @ts-ignore
      const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
        mergePart: false,
        uploadPresetId: "preset-id",
        uid: 456,
        removeOriginAfterUpload: true,
        useLiveCover: true,
      });
      const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
      const addEditMediaTaskSpy = vi
        .spyOn(webhookHandler, "addEditMediaTask")
        .mockResolvedValue(undefined);
      // Act
      await webhookHandler.handleLive(live);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
      expect(addUploadTaskSpy).not.toHaveBeenCalled();
      expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
    });
    it("应在uid未设置不进行上传", async () => {
      // Arrange
      const live: Live = {
        eventId: "123",
        platform: "blrec",
        roomId: 123,
        videoName: "Test Video",
        parts: [
          {
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            status: "handled",
            endTime: new Date("2022-01-01T00:05:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
        ],
      };
      vi.mock("@biliLive-tools/shared", async (importOriginal) => {
        const mod = await importOriginal<typeof import("@biliLive-tools/shared")>();
        return {
          ...mod,
          videoPreset: {
            get: vi.fn().mockReturnValue({}),
          },
          // 替换一些导出
          namedExport: vi.fn(),
        };
      });
      // @ts-ignore
      const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
        mergePart: true,
        uploadPresetId: "preset-id",
        uid: undefined,
        removeOriginAfterUpload: true,
        useLiveCover: true,
      });
      const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
      const addEditMediaTaskSpy = vi
        .spyOn(webhookHandler, "addEditMediaTask")
        .mockResolvedValue(undefined);
      // Act
      await webhookHandler.handleLive(live);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
      expect(addUploadTaskSpy).not.toHaveBeenCalled();
      expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
    });
    it("应在没有满足状态的part时不进行上传", async () => {
      // Arrange
      const live: Live = {
        eventId: "123",
        platform: "blrec",
        roomId: 123,
        videoName: "Test Video",
        parts: [
          {
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            status: "error",
            endTime: new Date("2022-01-01T00:05:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
        ],
      };
      vi.mock("@biliLive-tools/shared", async (importOriginal) => {
        const mod = await importOriginal<typeof import("@biliLive-tools/shared")>();
        return {
          ...mod,
          videoPreset: {
            get: vi.fn().mockReturnValue({}),
          },
          // 替换一些导出
          namedExport: vi.fn(),
        };
      });
      // @ts-ignore
      const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
        mergePart: true,
        uploadPresetId: "preset-id",
        uid: 123,
        removeOriginAfterUpload: true,
        useLiveCover: true,
      });
      const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
      const addEditMediaTaskSpy = vi
        .spyOn(webhookHandler, "addEditMediaTask")
        .mockResolvedValue(undefined);
      // Act
      await webhookHandler.handleLive(live);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
      expect(addUploadTaskSpy).not.toHaveBeenCalled();
      expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
    });
    it("应在上传时跳过不符合状态的part", async () => {
      // Arrange
      const live: Live = {
        eventId: "123",
        platform: "blrec",
        roomId: 123,
        videoName: "Test Video",
        parts: [
          {
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            status: "error",
            endTime: new Date("2022-01-01T00:05:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
          {
            partId: "part-2",
            filePath: "/path/to/part2.mp4",
            status: "handled",
            cover: "/path/to/cover.jpg",
          },
          {
            partId: "part-3",
            filePath: "/path/to/part3.mp4",
            status: "handled",
            endTime: new Date("2022-01-01T00:05:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
        ],
      };
      vi.mock("@biliLive-tools/shared", async (importOriginal) => {
        const mod = await importOriginal<typeof import("@biliLive-tools/shared")>();
        return {
          ...mod,
          videoPreset: {
            get: vi.fn().mockReturnValue({}),
          },
          // 替换一些导出
          namedExport: vi.fn(),
        };
      });
      // @ts-ignore
      const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
        mergePart: true,
        uploadPresetId: "preset-id",
        uid: 123,
        removeOriginAfterUpload: true,
        useLiveCover: true,
      });
      const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
      const addEditMediaTaskSpy = vi
        .spyOn(webhookHandler, "addEditMediaTask")
        .mockResolvedValue(undefined);
      // Act
      await webhookHandler.handleLive(live);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
      expect(addUploadTaskSpy).not.toHaveBeenCalled();
      expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
      expect(live.parts[2].status).toBe("handled");
    });

    it("应在续传成功时正确设置状态", async () => {
      // Arrange
      const live: Live = {
        roomId: 123,
        eventId: "123",
        platform: "blrec",
        videoName: "Test Video",
        aid: 789,
        parts: [
          {
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            status: "uploaded",
            endTime: new Date("2022-01-01T00:05:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
          {
            partId: "part-2",
            filePath: "/path/to/part2.mp4",
            status: "handled",
            endTime: new Date("2022-01-01T00:10:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
          {
            partId: "part-3",
            filePath: "/path/to/part3.mp4",
            status: "handled",
            endTime: new Date("2022-01-01T00:15:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
        ],
      };
      // @ts-ignore
      const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
        mergePart: true,
        uploadPresetId: "preset-id",
        uid: 456,
        removeOriginAfterUpload: true,
        useLiveCover: true,
      });
      const addEditMediaTaskSpy = vi
        .spyOn(webhookHandler, "addEditMediaTask")
        .mockResolvedValue(undefined);
      const addUploadTaskSpy = vi
        .spyOn(webhookHandler, "addUploadTask")
        .mockResolvedValue(undefined);

      // Act
      await webhookHandler.handleLive(live);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
      expect(addEditMediaTaskSpy).toHaveBeenCalledWith(
        456,
        789,
        ["/path/to/part2.mp4", "/path/to/part3.mp4"],
        true,
      );
      expect(addUploadTaskSpy).not.toHaveBeenCalled();
      expect(live.aid).toBe(789);
      expect(live.parts[1].status).toBe("uploaded");
      expect(live.parts[2].status).toBe("uploaded");
    });
    it("应在续传失败时正确设置状态", async () => {
      // Arrange
      const live: Live = {
        roomId: 123,
        eventId: "123",
        platform: "blrec",
        videoName: "Test Video",
        aid: 789,
        parts: [
          {
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            status: "uploaded",
            endTime: new Date("2022-01-01T00:05:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
          {
            partId: "part-2",
            filePath: "/path/to/part2.mp4",
            status: "handled",
            endTime: new Date("2022-01-01T00:10:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
          {
            partId: "part-3",
            filePath: "/path/to/part3.mp4",
            status: "handled",
            endTime: new Date("2022-01-01T00:15:00Z").getTime(),
            cover: "/path/to/cover.jpg",
          },
        ],
      };
      // @ts-ignore
      const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
        mergePart: true,
        uploadPresetId: "preset-id",
        uid: 456,
        removeOriginAfterUpload: true,
        useLiveCover: true,
      });
      const addEditMediaTaskSpy = vi
        .spyOn(webhookHandler, "addEditMediaTask")
        .mockRejectedValue(undefined);
      const addUploadTaskSpy = vi
        .spyOn(webhookHandler, "addUploadTask")
        .mockResolvedValue(undefined);

      // Act
      await webhookHandler.handleLive(live);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
      expect(addEditMediaTaskSpy).toHaveBeenCalledWith(
        456,
        789,
        ["/path/to/part2.mp4", "/path/to/part3.mp4"],
        true,
      );
      expect(addUploadTaskSpy).not.toHaveBeenCalled();
      expect(live.aid).toBe(789);
      expect(live.parts[1].status).toBe("error");
      expect(live.parts[2].status).toBe("error");
    });
  });
});
