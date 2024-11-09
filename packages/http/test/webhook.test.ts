import { expect, describe, it, beforeEach, vi } from "vitest";
import { WebhookHandler, Live } from "../src/services/webhook.js";
import { DEFAULT_BILIUP_CONFIG } from "@biliLive-tools/shared/presets/videoPreset.js";

import type { Options, Part } from "../src/services/webhook.js";

vi.mock("../src/index.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/index.js")>();
  return {
    ...mod,
    config: {
      get: vi.fn().mockReturnValue({}),
    },
  };
});

describe("WebhookHandler", () => {
  let webhookHandler: WebhookHandler;

  beforeEach(() => {
    const appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
      }),
    };
    // @ts-ignore
    webhookHandler = new WebhookHandler(appConfig);
  });

  describe("handleLiveData", () => {
    const appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
      }),
    };
    it("event: FileOpening, liveData的情况", async () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
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
      expect(liveData[0].title).toBe(options.title);
      expect(liveData[0].parts.length).toBe(1);
      expect(liveData[0].parts[0].partId).toBeDefined();
      expect(liveData[0].parts[0].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].parts[0].filePath).toBe(options.filePath);
      expect(liveData[0].parts[0].recordStatus).toBe("recording");
    });

    it("event: FileClosed, liveData的情况", async () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
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
      expect(liveData[0].title).toBe(options.title);
      expect(liveData[0].parts.length).toBe(1);
      expect(liveData[0].parts[0].partId).toBeDefined();
      expect(liveData[0].parts[0].filePath).toBe(options.filePath);
      expect(liveData[0].parts[0].recordStatus).toBe("recorded");
    });

    it("存在live的情况下，且roomId相同，又进来一条数据", async () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData = [];
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: 123,
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video.mp4",
        recordStatus: "recording",
        endTime: new Date("2022-01-01T00:05:00Z").getTime(),
      });
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
      expect(liveData[0].title).toBe(existingLive.title);
      expect(liveData[0].parts.length).toBe(2);
      expect(liveData[0].parts[0]).toBe(existingLive.parts[0]);
      expect(liveData[0].parts[1].partId).toBeDefined();
      expect(liveData[0].parts[1].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].parts[1].filePath).toBe(options.filePath);
      expect(liveData[0].parts[1].recordStatus).toBe("recording");
    });
    it("应在partMergeMinute为-1时，生成多个live", async () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData = [];
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: 123,
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video.mp4",
        recordStatus: "recording",
        endTime: new Date("2022-01-01T00:05:00Z").getTime(),
      });
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
      await webhookHandler.handleLiveData(options, -1);
      const liveData = webhookHandler.liveData;

      expect(liveData.length).toBe(2);
      expect(liveData[0].parts.length).toBe(1);
    });
    it("存在live的情况下，且roomId相同，又进来一条数据", async () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData = [];
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: 123,
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });

      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video.mp4",
        recordStatus: "recording",
        endTime: new Date("2022-01-01T00:05:00Z").getTime(),
      });
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
      expect(liveData[0].title).toBe(existingLive.title);
      expect(liveData[0].parts.length).toBe(1);
      expect(liveData[0].parts[0]).toBe(existingLive.parts[0]);
      expect(liveData[1].parts[0].partId).toBeDefined();
      // expect(liveData[0].parts[1].startTime).toBe(new Date(options.time).getTime());
      // expect(liveData[0].parts[1].filePath).toBe(options.filePath);
      // expect(liveData[0].parts[1].status).toBe("recording");
    });
    it("存在live的情况下，且roomId相同，在限制时间外又进来一条event: FileClosed数据", async () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData = [];
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: 123,
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video.mp4",
        recordStatus: "recording",
      });
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
      expect(liveData[0].title).toBe(existingLive.title);
      expect(liveData[0].parts.length).toBe(1);
      expect(liveData[0].parts[0].partId).toBe(existingLive.parts[0].partId);
      expect(liveData[0].parts[0].startTime).toBe(existingLive.parts[0].startTime);
      expect(liveData[0].parts[0].filePath).toBe(existingLive.parts[0].filePath);
      expect(liveData[0].parts[0].endTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].parts[0].recordStatus).toBe("recorded");
    });
    it("存在live的情况下，在event: FileClosed前先发送了event: FileOpeing", async () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData = [];
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: 123,
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id2",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video1.mp4",
        recordStatus: "recorded",
        endTime: new Date("2022-01-01T00:05:00Z").getTime(),
      });
      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:08:00Z").getTime(),
        filePath: "/path/to/existing-video2.mp4",
        recordStatus: "recording",
      });

      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileOpening",
        roomId: 123,
        platform: "bili-recorder",
        time: "2022-01-01T00:09:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video3.mp4",
        username: "test",
      };
      await webhookHandler.handleLiveData(options, 10);
      const liveData = webhookHandler.liveData;

      expect(liveData.length).toBe(1);
      expect(liveData[0].parts.length).toBe(3);
      expect(liveData[0].parts[2].recordStatus).toBe("recording");
      expect(liveData[0].parts[1].recordStatus).toBe("recording");

      const options2: Options = {
        event: "FileClosed",
        roomId: 123,
        platform: "bili-recorder",
        time: "2022-01-01T00:10:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video2.mp4",
        username: "test",
      };
      await webhookHandler.handleLiveData(options2, 10);
      const liveData2 = webhookHandler.liveData;
      expect(liveData2[0].parts[1].recordStatus).toBe("recorded");
      expect(liveData[0].parts[2].recordStatus).toBe("recording");
      console.log(liveData2[0].parts[1]);
    });
  });

  describe("canHandle", () => {
    const appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
      }),
    };
    // @ts-ignore
    const handler = new WebhookHandler(appConfig);
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

  describe("getConfig", () => {
    const appConfig = {
      getAll: vi.fn().mockReturnValue({
        webhook: {
          open: true,
          mergePart: false,
          partMergeMinute: 10,
        },
      }),
    };
    // @ts-ignore
    const webhookHandler = new WebhookHandler(appConfig);
    it("should partMergeMinute return -1 when mergePart is false", () => {
      const roomId = 123;
      const result = webhookHandler.getConfig(roomId);
      expect(result.partMergeMinute).toBe(-1);
    });
    describe("uploadNoDanmu", () => {
      it("should uploadNoDanmu return true when uploadNoDanmu is false", () => {
        const appConfig = {
          getAll: vi.fn().mockReturnValue({
            webhook: {
              open: true,
              mergePart: false,
              partMergeMinute: 10,
              uid: undefined,
              uploadNoDanmu: false,
              removeOriginAfterConvert: true,
            },
          }),
        };
        // @ts-ignore
        const webhookHandler = new WebhookHandler(appConfig);
        const roomId = 123;
        const result = webhookHandler.getConfig(roomId);
        expect(result.uploadNoDanmu).toBe(false);
      });
      it("should uploadNoDanmu return true when has uid && uploadNoDanmu && !removeOriginAfterConvert", () => {
        const appConfig = {
          getAll: vi.fn().mockReturnValue({
            webhook: {
              open: true,
              mergePart: false,
              partMergeMinute: 10,
              uid: 123,
              uploadNoDanmu: true,
              removeOriginAfterConvert: false,
            },
          }),
        };
        // @ts-ignore
        const webhookHandler = new WebhookHandler(appConfig);
        const roomId = 123;
        const result = webhookHandler.getConfig(roomId);
        expect(result.uploadNoDanmu).toBe(true);
      });
      it("should uploadNoDanmu return true when has uid && uploadNoDanmu && removeOriginAfterConvert is true", () => {
        const appConfig = {
          getAll: vi.fn().mockReturnValue({
            webhook: {
              open: true,
              mergePart: false,
              partMergeMinute: 10,
              uid: 123,
              uploadNoDanmu: true,
              removeOriginAfterConvert: true,
            },
          }),
        };
        // @ts-ignore
        const webhookHandler = new WebhookHandler(appConfig);
        const roomId = 123;
        const result = webhookHandler.getConfig(roomId);
        expect(result.uploadNoDanmu).toBe(false);
      });
      it("should uploadNoDanmu return true when not have uid && uploadNoDanmu && removeOriginAfterConvert is false", () => {
        const appConfig = {
          getAll: vi.fn().mockReturnValue({
            webhook: {
              open: true,
              mergePart: false,
              partMergeMinute: 10,
              uid: undefined,
              uploadNoDanmu: true,
              removeOriginAfterConvert: true,
            },
          }),
        };
        // @ts-ignore
        const webhookHandler = new WebhookHandler(appConfig);
        const roomId = 123;
        const result = webhookHandler.getConfig(roomId);
        expect(result.uploadNoDanmu).toBe(false);
      });
    });
  });
  describe("handle", () => {
    const appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
      }),
    };
    // @ts-ignore
    webhookHandler = new WebhookHandler(appConfig);
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
      const utils = await import("@biliLive-tools/shared/utils/index.js");
      const getSizeSpy = vi.spyOn(utils, "getFileSize");

      // Act
      await webhookHandler.handle(options);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(options.roomId);
      expect(getSizeSpy).not.toHaveBeenCalled();
    });
    it("should handle the options and update rawFilePath when convert2Mp4Option is true", async () => {
      // Arrange
      const options: Options = {
        roomId: 123,
        event: "FileClosed",
        filePath: "/path/to/part1.flv",
        time: "2022-01-01T00:05:00Z",
        username: "test",
        platform: "blrec",
        title: "test video",
      };
      const getConfigSpy = vi
        .spyOn(webhookHandler, "getConfig")
        // @ts-ignore
        .mockReturnValue({ open: true, title: "test", convert2Mp4Option: true });
      const convert2Mp4Spy = vi
        .spyOn(webhookHandler, "convert2Mp4")
        .mockResolvedValue("/path/to/part1.mp4");

      const utils = await import("@biliLive-tools/shared/utils/index.js");
      vi.spyOn(utils, "getFileSize");

      // Act
      await webhookHandler.handle(options);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(options.roomId);
      expect(convert2Mp4Spy).toHaveBeenCalledWith("/path/to/part1.flv");
      expect(webhookHandler.liveData[0].parts[0].filePath).toBe("/path/to/part1.mp4");
      expect(webhookHandler.liveData[0].parts[0].rawFilePath).toBe("/path/to/part1.mp4");
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
      vi.mock("@biliLive-tools/shared/utils/index.js", async (importOriginal) => {
        const mod = await importOriginal<typeof import("@biliLive-tools/shared/utils/index.js")>();
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
  });
  describe("handleLive", () => {
    beforeEach(() => {
      // @ts-ignore
      webhookHandler.videoPreset = {
        get: vi.fn().mockReturnValue({}),
      };
      // @ts-ignore
      webhookHandler.danmuPreset = {
        get: vi.fn().mockReturnValue({}),
      };
      // @ts-ignore
      webhookHandler.ffmpegPreset = {
        get: vi.fn().mockReturnValue({}),
      };
    });
    describe("解析标题", () => {
      it("应在webhook不存在占位符时，使用预设标题进行格式化", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "live-title",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          cover: "/path/to/cover.jpg",
        });

        // @ts-ignore
        vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          title: "webhook-title",
          removeOriginAfterUpload: false,
        });
        // @ts-ignore
        webhookHandler.videoPreset = {
          get: vi.fn().mockReturnValue({
            config: {
              title: "preset-title",
            },
          }),
        };
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(addUploadTaskSpy).toHaveBeenCalledWith(
          456,
          ["/path/to/part1.mp4"],
          {
            ...DEFAULT_BILIUP_CONFIG,
            title: "webhook-title",
          },
          false,
        );
      });
      it("应在webhook存在占位符时，使用webhook标题进行格式化", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "live-title",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          cover: "/path/to/cover.jpg",
        });

        // @ts-ignore
        vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          title: "webhook-title-{{title}}",
          removeOriginAfterUpload: false,
        });
        // @ts-ignore
        webhookHandler.videoPreset = {
          get: vi.fn().mockReturnValue({
            config: {
              title: "preset-title",
            },
          }),
        };
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(addUploadTaskSpy).toHaveBeenCalledWith(
          456,
          ["/path/to/part1.mp4"],
          {
            ...DEFAULT_BILIUP_CONFIG,
            title: "webhook-title-live-title",
          },
          false,
        );
      });
      it("应用live和part数据正常格式化标题", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "live-title",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          endTime: new Date("2023-01-01T00:05:00Z").getTime(),
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          cover: "/path/to/cover.jpg",
        });

        // @ts-ignore
        vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          title: "webhook-title",
          removeOriginAfterUpload: false,
        });

        // @ts-ignore
        webhookHandler.videoPreset = {
          get: vi.fn().mockReturnValue({
            config: {
              title: "{{title}}-{{user}}-{{now}}-{{roomId}}",
            },
          }),
        };
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(addUploadTaskSpy).toHaveBeenCalledWith(
          456,
          ["/path/to/part1.mp4"],
          {
            ...DEFAULT_BILIUP_CONFIG,
            title: "live-title-username-2022.01.01-123",
          },
          false,
        );
      });
    });

    describe("一般处理后的视频", () => {
      it("应在上传成功时正确设置状态", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          cover: "/path/to/cover.jpg",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          cover: "/path/to/cover.jpg",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          cover: "/path/to/cover.jpg",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          removeOriginAfterUpload: true,
          useLiveCover: true,
          title: "webhook-title",
          uploadNoDanmu: false,
        });
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockResolvedValue(undefined);
        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(addUploadTaskSpy).toBeCalledTimes(1);
        expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
        expect(addUploadTaskSpy).toHaveBeenCalledWith(
          456,
          ["/path/to/part1.mp4", "/path/to/part2.mp4", "/path/to/part3.mp4"],
          {
            ...DEFAULT_BILIUP_CONFIG,
            title: "webhook-title",
            cover: "/path/to/cover.jpg",
          },
          true,
        );
        expect(live.aid).toBe(789);
        expect(live.parts[0].uploadStatus).toBe("uploaded");
        expect(live.parts[1].uploadStatus).toBe("uploaded");
        expect(live.parts[2].uploadStatus).toBe("uploaded");

        expect(live.rawAid).toBeUndefined();
        expect(live.parts[0].rawUploadStatus).toBe("error");
        expect(live.parts[1].rawUploadStatus).toBe("error");
        expect(live.parts[2].rawUploadStatus).toBe("error");
      });
      it("应在uid未设置不进行上传，且状态修改为error", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          cover: "/path/to/cover.jpg",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
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
        expect(live.parts[0].uploadStatus).toBe("error");
      });
      it("应在没有满足状态的part时不进行上传", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          uploadStatus: "error",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });
        // @ts-ignore
        vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 123,
        });
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockResolvedValue(undefined);
        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(addUploadTaskSpy).not.toHaveBeenCalled();
        expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
      });
      it("应把正在录制中的视频及后续的视频不进行处理", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          uploadStatus: "error",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "recording",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });

        // @ts-ignore
        vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 123,
          title: "webhook-title",
        });
        // @ts-ignore
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockResolvedValue(undefined);
        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(addUploadTaskSpy).not.toHaveBeenCalled();
        expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
        expect(live.parts[2].uploadStatus).toBe("pending");
      });

      it("应在续传成功时正确设置状态", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          aid: 789,
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          uploadStatus: "uploaded",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
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
        expect(live.parts[1].uploadStatus).toBe("uploaded");
        expect(live.parts[2].uploadStatus).toBe("uploaded");
      });
      it("应在续传失败时正确设置状态", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          aid: 789,
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          uploadStatus: "uploaded",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          removeOriginAfterUpload: true,
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
        expect(live.parts[1].uploadStatus).toBe("error");
        expect(live.parts[2].uploadStatus).toBe("error");
      });

      it("应仅在上传时间内处理上传操作", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2022-01-01T14:05:00"));
        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          removeOriginAfterUpload: true,
          uploadHandleTime: ["10:10:00", "18:18:00"],
          limitUploadTime: true,
          title: "webhook-title",
        });
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockRejectedValue(undefined);
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const isBetweenTimeSpy = vi.spyOn(webhookHandler, "isBetweenTime");

        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(isBetweenTimeSpy).toBeCalled();
        expect(addEditMediaTaskSpy).not.toHaveBeenCalledWith();
        expect(addUploadTaskSpy).toHaveBeenCalled();
        expect(live.parts[0].uploadStatus).toBe("uploaded");
      });
      it("应不在上传时间内不处理上传操作", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2022-01-01T14:05:00"));
        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          removeOriginAfterUpload: true,
          uploadHandleTime: ["10:10:00", "12:12:00"],
          limitUploadTime: true,
        });
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockRejectedValue(undefined);
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const isBetweenTimeSpy = vi.spyOn(webhookHandler, "isBetweenTime");

        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(isBetweenTimeSpy).toBeCalled();
        expect(addEditMediaTaskSpy).not.toHaveBeenCalledWith();
        expect(addUploadTaskSpy).not.toHaveBeenCalledWith();
        expect(live.parts[0].uploadStatus).toBe("pending");
      });
    });

    describe("处理非弹幕视频", () => {
      it("应在上传成功时正确设置状态2", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          rawFilePath: "/rawPath/to/part1.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          cover: "/path/to/cover.jpg",
          uploadStatus: "uploaded",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          rawFilePath: "/rawPath/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          cover: "/path/to/cover.jpg",
          uploadStatus: "uploaded",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          rawFilePath: "/rawPath/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          cover: "/path/to/cover.jpg",
          uploadStatus: "uploaded",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          removeOriginAfterUpload: true,
          useLiveCover: true,
          title: "webhook-title",
          uploadNoDanmu: true,
          noDanmuVideoPreset: "no-preset-id",
        });
        // @ts-ignore
        webhookHandler.videoPreset = {
          get: vi.fn().mockImplementation((id: string) => {
            if (id === "no-preset-id") {
              return {
                config: {
                  title: "preset-title",
                },
              };
            }
          }),
        };
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
          ["/rawPath/to/part1.mp4", "/rawPath/to/part2.mp4", "/rawPath/to/part3.mp4"],
          {
            ...DEFAULT_BILIUP_CONFIG,
            title: "preset-title",
            cover: "/path/to/cover.jpg",
          },
          false,
        );
        expect(live.rawAid).toBe(789);
        expect(live.parts[0].rawUploadStatus).toBe("uploaded");
        expect(live.parts[1].rawUploadStatus).toBe("uploaded");
        expect(live.parts[2].rawUploadStatus).toBe("uploaded");
      });
      it("应在uid未设置不进行上传，且状态修改为error2", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          rawFilePath: "/rawPath/to/part1.mp4",
          uploadStatus: "uploaded",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          cover: "/path/to/cover.jpg",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: undefined,
          removeOriginAfterUpload: true,
          useLiveCover: true,
          uploadNoDanmu: true,
          noDanmuVideoPreset: "no-preset-id",
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
        expect(live.parts[0].rawUploadStatus).toBe("error");
      });
      it("应在没有满足状态的part时不进行上传2", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          rawFilePath: "/rawPath/to/part1.mp4",
          recordStatus: "handled",
          uploadStatus: "error",
          rawUploadStatus: "error",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });
        // @ts-ignore
        vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 123,
          uploadNoDanmu: true,
          noDanmuVideoPreset: "no-preset-id",
        });
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockResolvedValue(undefined);
        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(addUploadTaskSpy).not.toHaveBeenCalled();
        expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
      });
      it("应把正在录制中的视频及后续的视频不进行处理2", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          rawFilePath: "/rawPath/to/part1.mp4",
          recordStatus: "handled",
          uploadStatus: "error",
          rawUploadStatus: "error",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "recording",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });

        // @ts-ignore
        vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 123,
          title: "webhook-title",
          uploadNoDanmu: true,
          noDanmuVideoPreset: "preset-id",
        });
        // @ts-ignore
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockResolvedValue(undefined);
        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(addUploadTaskSpy).not.toHaveBeenCalled();
        expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
        expect(live.parts[2].rawUploadStatus).toBe("pending");
      });

      it("应在续传成功时正确设置状态2", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          rawAid: 789,
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          rawFilePath: "/rawPath/to/part1.mp4",
          recordStatus: "handled",
          uploadStatus: "uploaded",
          rawUploadStatus: "uploaded",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          uploadStatus: "uploaded",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          uploadStatus: "uploaded",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          removeOriginAfterUpload: true,
          uploadNoDanmu: true,
          noDanmuVideoPreset: "no-preset-id",
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
        expect(live.rawAid).toBe(789);
        expect(live.parts[1].rawUploadStatus).toBe("uploaded");
        expect(live.parts[2].rawUploadStatus).toBe("uploaded");
      });
      it("应在续传失败时正确设置状态2", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          rawAid: 789,
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          rawFilePath: "/rawPath/to/part1.mp4",
          recordStatus: "handled",
          uploadStatus: "uploaded",
          rawUploadStatus: "uploaded",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          removeOriginAfterUpload: true,
          uploadNoDanmu: true,
          noDanmuVideoPreset: "no-preset-id",
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
        expect(live.rawAid).toBe(789);
        expect(live.parts[1].rawUploadStatus).toBe("error");
        expect(live.parts[2].rawUploadStatus).toBe("error");
      });
      it("应仅在上传时间内处理上传操作2", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          rawFilePath: "/rawPath/to/part1.mp4",
          uploadStatus: "uploaded",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2022-01-01T14:05:00"));
        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          removeOriginAfterUpload: true,
          uploadHandleTime: ["10:10:00", "18:18:00"],
          limitUploadTime: true,
          title: "webhook-title",
          uploadNoDanmu: true,
          noDanmuVideoPreset: "no-preset-id",
        });
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockRejectedValue(undefined);
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const isBetweenTimeSpy = vi.spyOn(webhookHandler, "isBetweenTime");

        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(isBetweenTimeSpy).toBeCalled();
        expect(addEditMediaTaskSpy).not.toHaveBeenCalledWith();
        expect(addUploadTaskSpy).toHaveBeenCalled();
        expect(live.parts[0].rawUploadStatus).toBe("uploaded");
      });
      it("应不在上传时间内不处理上传操作", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: 123,
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          rawFilePath: "/rawPath/to/part1.mp4",
          uploadStatus: "uploaded",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        });

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2022-01-01T14:05:00"));
        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          removeOriginAfterUpload: true,
          uploadHandleTime: ["10:10:00", "12:12:00"],
          limitUploadTime: true,
          uploadNoDanmu: true,
          noDanmuVideoPreset: "no-preset-id",
        });
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockRejectedValue(undefined);
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const isBetweenTimeSpy = vi.spyOn(webhookHandler, "isBetweenTime");

        // Act
        await webhookHandler.handleLive(live);

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(isBetweenTimeSpy).toBeCalled();
        expect(addEditMediaTaskSpy).not.toHaveBeenCalledWith();
        expect(addUploadTaskSpy).not.toHaveBeenCalledWith();
        expect(live.parts[0].rawUploadStatus).toBe("pending");
      });
    });
  });
  describe.concurrent("isBetweenTime", () => {
    it("should return true when current time is between start and end time", () => {
      const appConfig = {
        getAll: vi.fn().mockReturnValue({
          task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
        }),
      };
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const currentTime = new Date("2022-01-01T12:00:00");
      const timeRange: [string, string] = ["10:00:00", "14:00:00"];

      const result = webhookHandler.isBetweenTime(currentTime, timeRange);

      expect(result).toBe(true);
    });

    it("should return false when current time is before start time", () => {
      const appConfig = {
        getAll: vi.fn().mockReturnValue({
          task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
        }),
      };
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const currentTime = new Date("2022-01-01T09:00:00");
      const timeRange: [string, string] = ["10:00:00", "14:00:00"];

      const result = webhookHandler.isBetweenTime(currentTime, timeRange);

      expect(result).toBe(false);
    });

    it("should return false when current time is after end time", () => {
      const appConfig = {
        getAll: vi.fn(),
      };
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const currentTime = new Date("2022-01-01T15:00:00");
      const timeRange: [string, string] = ["10:00:00", "14:00:00"];

      const result = webhookHandler.isBetweenTime(currentTime, timeRange);

      expect(result).toBe(false);
    });

    it("should return true when start and end time are not provided", () => {
      const appConfig = {
        getAll: vi.fn(),
      };
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const currentTime = new Date("2022-01-01T12:00:00");
      const timeRange: [string, string] = ["", ""];

      const result = webhookHandler.isBetweenTime(currentTime, timeRange);

      expect(result).toBe(true);
    });

    it("should return true when current time is between start and end time", () => {
      const appConfig = {
        getAll: vi.fn(),
      };
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const currentTime = new Date("2022-01-01T04:00:00");
      const timeRange: [string, string] = ["22:00:00", "06:00:00"];

      const result = webhookHandler.isBetweenTime(currentTime, timeRange);

      expect(result).toBe(true);
    });

    describe("Live", () => {
      it("should initialize with correct values", () => {
        const live = new Live({
          eventId: "event1",
          platform: "bili-recorder",
          roomId: 123,
          startTime: 1616161616161,
          aid: 456,
          title: "Test Video",
          username: "username",
        });

        expect(live.eventId).toBe("event1");
        expect(live.platform).toBe("bili-recorder");
        expect(live.roomId).toBe(123);
        expect(live.title).toBe("Test Video");
        expect(live.startTime).toBe(1616161616161);
        expect(live.aid).toBe(456);
        expect(live.parts).toEqual([]);
      });

      it("should add a part correctly", () => {
        const live = new Live({
          eventId: "event1",
          platform: "bili-recorder",
          roomId: 123,
          title: "Test Video",
          username: "username",
        });
        const part: Part = {
          partId: "part1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "recording",
          rawFilePath: "/path/to/raw/part1.mp4",
          uploadStatus: "uploaded",
          rawUploadStatus: "uploaded",
        };

        live.addPart(part);
        console.log(live.parts[0]);
        expect(live.parts).toContainEqual(part);
      });

      it("should update part value correctly", () => {
        const live = new Live({
          eventId: "event1",
          platform: "bili-recorder",
          roomId: 123,
          title: "Test Video",
          username: "username",
        });
        const part: Part = {
          partId: "part1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "recording",
          rawFilePath: "/path/to/raw/part1.mp4",
          uploadStatus: "uploaded",
          rawUploadStatus: "uploaded",
        };

        live.addPart(part);
        live.updatePartValue("part1", "recordStatus", "recorded");

        expect(live.parts[0].recordStatus).toBe("recorded");
      });

      it("should find part by file path correctly", () => {
        const live = new Live({
          eventId: "event1",
          platform: "bili-recorder",
          roomId: 123,
          title: "Test Video",
          username: "username",
        });
        const part1: Part = {
          partId: "part1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "recording",
          rawFilePath: "/path/to/raw/part1.mp4",
          uploadStatus: "uploaded",
          rawUploadStatus: "uploaded",
        };
        const part2: Part = {
          partId: "part2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "recording",
          rawFilePath: "/path/to/raw/part1.mp4",
          uploadStatus: "uploaded",
          rawUploadStatus: "uploaded",
        };

        live.addPart(part1);
        live.addPart(part2);

        const foundPart = live.findPartByFilePath("/path/to/part2.mp4");

        expect(foundPart).toStrictEqual(part2);
      });

      it("should return undefined if part is not found by file path", () => {
        const live = new Live({
          eventId: "event1",
          platform: "bili-recorder",
          roomId: 123,
          title: "Test Video",
          username: "username",
        });
        const part: Part = {
          partId: "part1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "recording",
          rawFilePath: "/path/to/raw/part1.mp4",
          uploadStatus: "uploaded",
          rawUploadStatus: "uploaded",
        };

        live.addPart(part);

        const foundPart = live.findPartByFilePath("/path/to/nonexistent.mp4");

        expect(foundPart).toBeUndefined();
      });
    });
  });
});
