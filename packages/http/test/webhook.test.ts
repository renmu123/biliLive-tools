import fs from "fs-extra";
import { expect, describe, it, beforeEach, vi } from "vitest";
import { WebhookHandler } from "../src/services/webhook/webhook.js";
import { Live } from "../src/services/webhook/Live.js";
import { DEFAULT_BILIUP_CONFIG } from "@biliLive-tools/shared/presets/videoPreset.js";
import * as utils from "@biliLive-tools/shared/utils/index.js";
import * as syncTask from "@biliLive-tools/shared/task/sync.js";

import type { Options, Part } from "../src/types/webhook.js";

vi.mock("../src/index.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/index.js")>();
  return {
    ...mod,
    config: {
      get: vi.fn().mockReturnValue({}),
    },
  };
});

vi.mock("@biliLive-tools/shared/utils/index.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@biliLive-tools/shared/utils/index.js")>();
  return {
    ...mod,
    trashItem: vi.fn().mockResolvedValue(true),
  };
});

vi.spyOn(utils, "sleep").mockImplementation(async () => {
  return undefined;
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
    it("存在live的情况下，在event: FileClosed前先发送了event: FileOpeing", async () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData = [];
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
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
        title: "Existing Video",
      });
      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:08:00Z").getTime(),
        filePath: "/path/to/existing-video2.mp4",
        recordStatus: "recording",
        title: "Existing Video",
      });

      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileOpening",
        roomId: "123",
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
        roomId: "123",
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

    it("不存在live的情况下，在event: FileClosed前先发送了event: FileOpeing", async () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData = [];
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
        startTime: new Date("2022-01-01T00:08:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:08:00Z").getTime(),
        filePath: "/path/to/existing-video2.mp4",
        recordStatus: "recording",
        title: "Existing Video",
      });

      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileOpening",
        roomId: "123",
        platform: "bili-recorder",
        time: "2022-01-01T00:09:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video3.mp4",
        username: "test",
      };
      await webhookHandler.handleLiveData(options, 10);
      const liveData = webhookHandler.liveData;

      expect(liveData.length).toBe(1);
      expect(liveData[0].parts.length).toBe(2);
      expect(liveData[0].parts[1].recordStatus).toBe("recording");
      expect(liveData[0].parts[0].recordStatus).toBe("recording");

      const options2: Options = {
        event: "FileClosed",
        roomId: "123",
        platform: "bili-recorder",
        time: "2022-01-01T00:10:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video2.mp4",
        username: "test",
      };
      await webhookHandler.handleLiveData(options2, 10);
      const liveData2 = webhookHandler.liveData;
      expect(liveData2[0].parts[0].recordStatus).toBe("recorded");
      expect(liveData[0].parts[1].recordStatus).toBe("recording");
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
    const appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
      }),
    };
    // @ts-ignore
    webhookHandler = new WebhookHandler(appConfig);

    it("should handle the options and return if the event is 'FileOpening'", async () => {
      // Arrange
      const options: Options = {
        roomId: "123",
        event: "FileOpening",
        filePath: "/path/to/part1.mp4",
        time: "2022-01-01T00:05:00Z",
        username: "test",
        platform: "blrec",
        title: "test video",
      };
      const getConfigSpy = vi
        .spyOn(webhookHandler.configManager, "getConfig")
        // @ts-ignore
        .mockReturnValue({ open: true, title: "test" });

      // Act
      const returnVal = await webhookHandler.handle(options);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(options.roomId);
      expect(returnVal).toBeUndefined();
    });
    it("should handle the options and update rawFilePath when convert2Mp4Option is true", async () => {
      // Arrange
      const openOptions: Options = {
        roomId: "123",
        event: "FileOpening",
        filePath: "/path/to/part1.flv",
        time: "2022-01-01T00:00:00Z",
        username: "test",
        platform: "blrec",
        title: "test video",
      };
      const closeOptions: Options = {
        roomId: "123",
        event: "FileClosed",
        filePath: "/path/to/part1.flv",
        time: "2022-01-01T00:05:00Z",
        username: "test",
        platform: "blrec",
        title: "test video",
      };
      const getConfigSpy = vi
        .spyOn(webhookHandler.configManager, "getConfig")
        // @ts-ignore
        .mockReturnValue({
          open: true,
          title: "test",
          convert2Mp4Option: true,
          removeSourceAferrConvert2Mp4: true,
          minSize: 1,
          partMergeMinute: 10,
        });
      const convert2Mp4Spy = vi
        .spyOn(webhookHandler, "transcode")
        .mockResolvedValue("/path/to/part1.mp4");

      const utils = await import("@biliLive-tools/shared/utils/index.js");
      vi.spyOn(utils, "getFileSize").mockResolvedValue(10 * 1024 * 1024); // 10MB

      // Act
      await webhookHandler.handle(openOptions);
      await webhookHandler.handle(closeOptions);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(closeOptions.roomId);
      expect(convert2Mp4Spy).toHaveBeenCalledWith(
        "/path/to/part1.flv",
        {
          audioCodec: "copy",
          encoder: "copy",
        },
        {
          removeVideo: true,
        },
      );
      expect(webhookHandler.liveData[0].parts[0].filePath).toBe("/path/to/part1.mp4");
      expect(webhookHandler.liveData[0].parts[0].rawFilePath).toBe("/path/to/part1.mp4");
    });
    it("should handle the options and return if the file size is too small", async () => {
      // Arrange
      const options1: Options = {
        roomId: "123",
        event: "FileOpening",
        filePath: "/path/to/part1.mp4",
        time: "2022-01-01T00:00:00Z",
        username: "test",
        platform: "blrec",
        title: "test video",
      };
      const options: Options = {
        roomId: "123",
        event: "FileClosed",
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
      const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig");
      // @ts-ignore
      getConfigSpy.mockReturnValue({ open: true, minSize: 100, title: "test" });

      // Act
      await webhookHandler.handle(options1);
      const result = await webhookHandler.handle(options);

      // Assert
      expect(getConfigSpy).toHaveBeenCalledWith(options.roomId);
      expect(result).toBeUndefined();
      expect(webhookHandler.liveData.length).toBe(0);
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
          roomId: "123",
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
          title: "part1",
        });

        // @ts-ignore
        vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          title: "webhook-title",
          afterUploadDeletAction: "none",
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
          [
            {
              path: "/path/to/part1.mp4",
              title: "part1",
            },
          ],
          {
            ...DEFAULT_BILIUP_CONFIG,
            title: "webhook-title",
          },
          [],
          "none",
        );
      });
      it("应在webhook存在占位符时，使用webhook标题进行格式化", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: "123",
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
          title: "part1",
        });

        // @ts-ignore
        vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          title: "webhook-title-{{title}}",
          afterUploadDeletAction: "none",
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
          [
            {
              path: "/path/to/part1.mp4",
              title: "part1",
            },
          ],
          {
            ...DEFAULT_BILIUP_CONFIG,
            title: "webhook-title-live-title",
          },
          [],
          "none",
        );
      });
      it("应用live和part数据正常格式化标题", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: "123",
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
          title: "part1",
        });

        // @ts-ignore
        vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          title: "webhook-title",
          afterUploadDeletAction: "none",
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
          [
            {
              path: "/path/to/part1.mp4",
              title: "part1",
            },
          ],
          {
            ...DEFAULT_BILIUP_CONFIG,
            title: "live-title-username-2022.01.01-123",
          },
          [],
          "none",
        );
      });
    });

    describe("一般处理后的视频", () => {
      it("应在上传成功时正确设置状态", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: "123",
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
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          cover: "/path/to/cover.jpg",
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          cover: "/path/to/cover.jpg",
          title: "part3",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          afterUploadDeletAction: "delete",
          useLiveCover: true,
          title: "webhook-title",
          uploadNoDanmu: false,
        });
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockResolvedValue(undefined);
        // Act
        await webhookHandler.handleLive(live, "handled");

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(addUploadTaskSpy).toBeCalledTimes(1);
        expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
        expect(addUploadTaskSpy).toHaveBeenCalledWith(
          456,
          [
            {
              path: "/path/to/part1.mp4",
              title: "part1",
            },
            {
              path: "/path/to/part2.mp4",
              title: "part2",
            },
            {
              path: "/path/to/part3.mp4",
              title: "part3",
            },
          ],
          {
            ...DEFAULT_BILIUP_CONFIG,
            title: "webhook-title",
            cover: "/path/to/cover.jpg",
          },
          [],
          "delete",
        );
        expect(live.aid).toBe(789);
        expect(live.parts[0].uploadStatus).toBe("uploaded");
        expect(live.parts[1].uploadStatus).toBe("uploaded");
        expect(live.parts[2].uploadStatus).toBe("uploaded");
      });
      it("应在uid未设置不进行上传，且状态修改为error", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: "123",
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
          title: "part1",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: undefined,
          afterUploadDeletAction: "delete",
          useLiveCover: true,
        });
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockResolvedValue(undefined);
        // Act
        await webhookHandler.handleLive(live, "handled");

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
          roomId: "123",
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
          title: "part1",
        });
        // @ts-ignore
        vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 123,
        });
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockResolvedValue(undefined);
        // Act
        await webhookHandler.handleLive(live, "handled");

        // Assert
        expect(addUploadTaskSpy).not.toHaveBeenCalled();
        expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
      });
      it("应把正在录制中的视频及后续的视频不进行处理", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: "123",
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
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "recording",
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          title: "part3",
        });

        // @ts-ignore
        vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
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
        await webhookHandler.handleLive(live, "handled");

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
          roomId: "123",
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
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          title: "part3",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          afterUploadDeletAction: "delete",
          useLiveCover: true,
        });
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockResolvedValue(undefined);
        const addUploadTaskSpy = vi
          .spyOn(webhookHandler, "addUploadTask")
          .mockResolvedValue(undefined);

        // Act
        await webhookHandler.handleLive(live, "handled");

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(addEditMediaTaskSpy).toHaveBeenCalledWith(
          456,
          789,
          [
            {
              path: "/path/to/part2.mp4",
              title: "part2",
            },
            {
              path: "/path/to/part3.mp4",
              title: "part3",
            },
          ],
          [],
          "delete",
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
          roomId: "123",
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
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          title: "part3",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          afterUploadDeletAction: "delete",
        });
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockRejectedValue(undefined);
        const addUploadTaskSpy = vi
          .spyOn(webhookHandler, "addUploadTask")
          .mockResolvedValue(undefined);

        // Act
        await webhookHandler.handleLive(live, "handled");

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(addEditMediaTaskSpy).toHaveBeenCalledWith(
          456,
          789,
          [
            {
              path: "/path/to/part2.mp4",
              title: "part2",
            },
            {
              path: "/path/to/part3.mp4",
              title: "part3",
            },
          ],
          [],
          "delete",
        );
        expect(addUploadTaskSpy).not.toHaveBeenCalled();
        expect(live.aid).toBe(789);
        expect(live.parts[1].uploadStatus).toBe("error");
        expect(live.parts[2].uploadStatus).toBe("error");
      });
      it("应正确格式化分P标题", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: "123",
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
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          title: "part3",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          afterUploadDeletAction: "delete",
          partTitleTemplate: "{{filename}}-{{title}}-{{user}}-{{roomId}}-{{index}}",
        });
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockRejectedValue(undefined);
        // Act
        await webhookHandler.handleLive(live, "handled");

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(addEditMediaTaskSpy).toHaveBeenCalledWith(
          456,
          789,
          [
            {
              path: "/path/to/part2.mp4",
              title: "part2-part2-username-123-2",
            },
            {
              path: "/path/to/part3.mp4",
              title: "part3-part3-username-123-3",
            },
          ],
          [],
          "delete",
        );
      });
      it("应正确格式化分P标题：index", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: "123",
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
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          uploadStatus: "error",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          title: "part3",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part4.mp4",
          recordStatus: "handled",
          uploadStatus: "error",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          title: "part4",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part5.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          title: "part5",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          afterUploadDeletAction: "delete",
          partTitleTemplate: "{{filename}}-{{title}}-{{user}}-{{roomId}}-{{index}}",
        });
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockRejectedValue(undefined);
        // Act
        await webhookHandler.handleLive(live, "handled");

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(addEditMediaTaskSpy).toHaveBeenCalledWith(
          456,
          789,
          [
            {
              path: "/path/to/part3.mp4",
              title: "part3-part3-username-123-2",
            },
            {
              path: "/path/to/part5.mp4",
              title: "part5-part5-username-123-3",
            },
          ],
          [],
          "delete",
        );
      });

      // it("应仅在上传时间内处理上传操作", async () => {
      //   // Arrange
      //   const live = new Live({
      //     eventId: "123",
      //     platform: "blrec",
      //     roomId: "123",
      //     startTime: new Date("2022-01-01T00:00:00Z").getTime(),
      //     title: "Test Video",
      //     username: "username",
      //   });
      //   live.addPart({
      //     partId: "part-1",
      //     filePath: "/path/to/part1.mp4",
      //     recordStatus: "handled",
      //     endTime: new Date("2022-01-01T00:05:00Z").getTime(),
      //   });
      //   vi.useFakeTimers();
      //   vi.setSystemTime(new Date("2022-01-01T14:05:00"));
      //   // @ts-ignore
      //   const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
      //     uploadPresetId: "preset-id",
      //     uid: 456,
      //     afterUploadDeletAction: "delete",
      //     uploadHandleTime: ["10:10:00", "18:18:00"],
      //     limitUploadTime: true,
      //     title: "webhook-title",
      //   });
      //   const addEditMediaTaskSpy = vi
      //     .spyOn(webhookHandler, "addEditMediaTask")
      //     .mockRejectedValue(undefined);
      //   const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
      //   const isBetweenTimeSpy = vi.spyOn(webhookHandler, "isBetweenTime");

      //   // Act
      //   await webhookHandler.handleLive(live);

      //   // Assert
      //   expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
      //   expect(isBetweenTimeSpy).toBeCalled();
      //   expect(addEditMediaTaskSpy).not.toHaveBeenCalledWith();
      //   expect(addUploadTaskSpy).toHaveBeenCalled();
      //   expect(live.parts[0].uploadStatus).toBe("uploaded");
      // });
      // it("应不在上传时间内不处理上传操作", async () => {
      //   // Arrange
      //   const live = new Live({
      //     eventId: "123",
      //     platform: "blrec",
      //     roomId: "123",
      //     startTime: new Date("2022-01-01T00:00:00Z").getTime(),
      //     title: "Test Video",
      //     username: "username",
      //   });
      //   live.addPart({
      //     partId: "part-1",
      //     filePath: "/path/to/part1.mp4",
      //     recordStatus: "handled",
      //     endTime: new Date("2022-01-01T00:05:00Z").getTime(),
      //   });

      //   vi.useFakeTimers();
      //   vi.setSystemTime(new Date("2022-01-01T14:05:00"));
      //   // @ts-ignore
      //   const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
      //     uploadPresetId: "preset-id",
      //     uid: 456,
      //     afterUploadDeletAction: "delete",
      //     uploadHandleTime: ["10:10:00", "12:12:00"],
      //     limitUploadTime: true,
      //   });
      //   const addEditMediaTaskSpy = vi
      //     .spyOn(webhookHandler, "addEditMediaTask")
      //     .mockRejectedValue(undefined);
      //   const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
      //   const isBetweenTimeSpy = vi.spyOn(webhookHandler, "isBetweenTime");

      //   // Act
      //   await webhookHandler.handleLive(live);

      //   // Assert
      //   expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
      //   expect(isBetweenTimeSpy).toBeCalled();
      //   expect(addEditMediaTaskSpy).not.toHaveBeenCalledWith();
      //   expect(addUploadTaskSpy).not.toHaveBeenCalledWith();
      //   expect(live.parts[0].uploadStatus).toBe("pending");
      // });
    });

    describe("处理非弹幕视频", () => {
      it("应在上传成功时正确设置状态2", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: "123",
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
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          rawFilePath: "/rawPath/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          cover: "/path/to/cover.jpg",
          uploadStatus: "uploaded",
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          rawFilePath: "/rawPath/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          cover: "/path/to/cover.jpg",
          uploadStatus: "uploaded",
          title: "part3",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          afterUploadDeletAction: "delete",
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
        await webhookHandler.handleLive(live, "raw");

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(addUploadTaskSpy).toHaveBeenCalled();
        expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
        expect(addUploadTaskSpy).toHaveBeenCalledWith(
          456,
          [
            {
              path: "/rawPath/to/part1.mp4",
              title: "part1",
            },
            {
              path: "/rawPath/to/part2.mp4",
              title: "part2",
            },
            {
              path: "/rawPath/to/part3.mp4",
              title: "part3",
            },
          ],
          {
            ...DEFAULT_BILIUP_CONFIG,
            title: "preset-title",
            cover: "/path/to/cover.jpg",
          },
          [],
          "none",
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
          roomId: "123",
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
          title: "part1",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: undefined,
          afterUploadDeletAction: "delete",
          useLiveCover: true,
          uploadNoDanmu: true,
          noDanmuVideoPreset: "no-preset-id",
        });
        const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockResolvedValue(undefined);
        // Act
        await webhookHandler.handleLive(live, "raw");

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
          roomId: "123",
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
          title: "part1",
        });
        // @ts-ignore
        vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
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
        await webhookHandler.handleLive(live, "raw");

        // Assert
        expect(addUploadTaskSpy).not.toHaveBeenCalled();
        expect(addEditMediaTaskSpy).not.toHaveBeenCalled();
      });
      it("应把正在录制中的视频及后续的视频不进行处理2", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: "123",
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
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "recording",
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          title: "part3",
        });

        // @ts-ignore
        vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
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
        await webhookHandler.handleLive(live, "raw");

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
          roomId: "123",
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
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          uploadStatus: "uploaded",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          uploadStatus: "uploaded",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          title: "part3",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          afterUploadDeletAction: "delete",
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
        await webhookHandler.handleLive(live, "raw");

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(addEditMediaTaskSpy).toHaveBeenCalledWith(
          456,
          789,
          [
            {
              path: "/path/to/part2.mp4",
              title: "part2",
            },
            {
              path: "/path/to/part3.mp4",
              title: "part3",
            },
          ],
          [],
          "none",
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
          roomId: "123",
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
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          title: "part3",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          afterUploadDeletAction: "delete",
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
        await webhookHandler.handleLive(live, "raw");

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(addEditMediaTaskSpy).toHaveBeenCalledWith(
          456,
          789,
          [
            {
              path: "/path/to/part2.mp4",
              title: "part2",
            },
            {
              path: "/path/to/part3.mp4",
              title: "part3",
            },
          ],
          [],
          "none",
        );
        expect(addUploadTaskSpy).not.toHaveBeenCalled();
        expect(live.rawAid).toBe(789);
        expect(live.parts[1].rawUploadStatus).toBe("error");
        expect(live.parts[2].rawUploadStatus).toBe("error");
      });
      it("应正确格式化分P标题21", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: "123",
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          rawAid: 789,
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          uploadStatus: "uploaded",
          rawUploadStatus: "uploaded",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          title: "part3",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          uploadNoDanmu: true,
          afterUploadDeletAction: "delete",
          partTitleTemplate: "{{filename}}-{{title}}-{{user}}-{{roomId}}-{{index}}",
        });
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockRejectedValue(undefined);
        // Act
        await webhookHandler.handleLive(live, "raw");

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(addEditMediaTaskSpy).toHaveBeenCalledWith(
          456,
          789,
          [
            {
              path: "/path/to/part2.mp4",
              title: "part2-part2-username-123-2",
            },
            {
              path: "/path/to/part3.mp4",
              title: "part3-part3-username-123-3",
            },
          ],
          [],
          "none",
        );
      });
      it("应正确格式化分P标题2：index", async () => {
        // Arrange
        const live = new Live({
          eventId: "123",
          platform: "blrec",
          roomId: "123",
          startTime: new Date("2022-01-01T00:00:00Z").getTime(),
          rawAid: 789,
          title: "Test Video",
          username: "username",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/part1.mp4",
          recordStatus: "handled",
          uploadStatus: "uploaded",
          rawUploadStatus: "uploaded",
          endTime: new Date("2022-01-01T00:05:00Z").getTime(),
          title: "part1",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part2.mp4",
          recordStatus: "handled",
          uploadStatus: "error",
          rawUploadStatus: "error",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          title: "part2",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part3.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          title: "part3",
        });
        live.addPart({
          partId: "part-2",
          filePath: "/path/to/part4.mp4",
          recordStatus: "handled",
          uploadStatus: "error",
          rawUploadStatus: "error",
          endTime: new Date("2022-01-01T00:10:00Z").getTime(),
          title: "part4",
        });
        live.addPart({
          partId: "part-3",
          filePath: "/path/to/part5.mp4",
          recordStatus: "handled",
          endTime: new Date("2022-01-01T00:15:00Z").getTime(),
          title: "part5",
        });

        // @ts-ignore
        const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          uploadPresetId: "preset-id",
          uid: 456,
          afterUploadDeletAction: "delete",
          uploadNoDanmu: true,
          partTitleTemplate: "{{filename}}-{{title}}-{{user}}-{{roomId}}-{{index}}",
        });
        const addEditMediaTaskSpy = vi
          .spyOn(webhookHandler, "addEditMediaTask")
          .mockRejectedValue(undefined);
        // Act
        await webhookHandler.handleLive(live, "raw");

        // Assert
        expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
        expect(addEditMediaTaskSpy).toHaveBeenCalledWith(
          456,
          789,
          [
            {
              path: "/path/to/part3.mp4",
              title: "part3-part3-username-123-2",
            },
            {
              path: "/path/to/part5.mp4",
              title: "part5-part5-username-123-3",
            },
          ],
          [],
          "none",
        );
      });
      // it("应仅在上传时间内处理上传操作2", async () => {
      //   // Arrange
      //   const live = new Live({
      //     eventId: "123",
      //     platform: "blrec",
      //     roomId: "123",
      //     startTime: new Date("2022-01-01T00:00:00Z").getTime(),
      //     title: "Test Video",
      //     username: "username",
      //   });
      //   live.addPart({
      //     partId: "part-1",
      //     filePath: "/path/to/part1.mp4",
      //     rawFilePath: "/rawPath/to/part1.mp4",
      //     uploadStatus: "uploaded",
      //     recordStatus: "handled",
      //     endTime: new Date("2022-01-01T00:05:00Z").getTime(),
      //   });
      //   vi.useFakeTimers();
      //   vi.setSystemTime(new Date("2022-01-01T14:05:00"));
      //   // @ts-ignore
      //   const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
      //     uploadPresetId: "preset-id",
      //     uid: 456,
      //     afterUploadDeletAction: "delete",
      //     uploadHandleTime: ["10:10:00", "18:18:00"],
      //     limitUploadTime: true,
      //     title: "webhook-title",
      //     uploadNoDanmu: true,
      //     noDanmuVideoPreset: "no-preset-id",
      //   });
      //   const addEditMediaTaskSpy = vi
      //     .spyOn(webhookHandler, "addEditMediaTask")
      //     .mockRejectedValue(undefined);
      //   const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
      //   const isBetweenTimeSpy = vi.spyOn(webhookHandler, "isBetweenTime");

      //   // Act
      //   await webhookHandler.handleLive(live);

      //   // Assert
      //   expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
      //   expect(isBetweenTimeSpy).toBeCalled();
      //   expect(addEditMediaTaskSpy).not.toHaveBeenCalledWith();
      //   expect(addUploadTaskSpy).toHaveBeenCalled();
      //   expect(live.parts[0].rawUploadStatus).toBe("uploaded");
      // });
      // it("应不在上传时间内不处理上传操作2", async () => {
      //   // Arrange
      //   const live = new Live({
      //     eventId: "123",
      //     platform: "blrec",
      //     roomId: "123",
      //     startTime: new Date("2022-01-01T00:00:00Z").getTime(),
      //     title: "Test Video",
      //     username: "username",
      //   });
      //   live.addPart({
      //     partId: "part-1",
      //     filePath: "/path/to/part1.mp4",
      //     rawFilePath: "/rawPath/to/part1.mp4",
      //     uploadStatus: "uploaded",
      //     recordStatus: "handled",
      //     endTime: new Date("2022-01-01T00:05:00Z").getTime(),
      //   });

      //   vi.useFakeTimers();
      //   vi.setSystemTime(new Date("2022-01-01T14:05:00"));
      //   // @ts-ignore
      //   const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
      //     uploadPresetId: "preset-id",
      //     uid: 456,
      //     afterUploadDeletAction: "delete",
      //     uploadHandleTime: ["10:10:00", "12:12:00"],
      //     limitUploadTime: true,
      //     uploadNoDanmu: true,
      //     noDanmuVideoPreset: "no-preset-id",
      //   });
      //   const addEditMediaTaskSpy = vi
      //     .spyOn(webhookHandler, "addEditMediaTask")
      //     .mockRejectedValue(undefined);
      //   const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(789);
      //   const isBetweenTimeSpy = vi.spyOn(webhookHandler, "isBetweenTime");

      //   // Act
      //   await webhookHandler.handleLive(live);

      //   // Assert
      //   expect(getConfigSpy).toHaveBeenCalledWith(live.roomId);
      //   expect(isBetweenTimeSpy).toBeCalled();
      //   expect(addEditMediaTaskSpy).not.toHaveBeenCalledWith();
      //   expect(addUploadTaskSpy).not.toHaveBeenCalledWith();
      //   expect(live.parts[0].rawUploadStatus).toBe("pending");
      // });
    });
  });

  describe("handleCloseEvent", () => {
    const appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
      }),
    };
    let webhookHandler: WebhookHandler;

    it("should handle close event and update part endTime and recordStatus", async () => {
      // Arrange
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video.mp4",
        recordStatus: "recording",
        title: "Existing Video",
      });
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileClosed",
        roomId: "123",
        platform: "bili-recorder",
        time: "2022-01-01T00:05:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video.mp4",
        username: "test",
      };

      // Act
      const liveId = webhookHandler.handleCloseEvent(options);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(liveId).toBe(existingLive.eventId);
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

    it("should create a new live if no existing live is found", async () => {
      // Arrange
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData = [];

      const options: Options = {
        event: "FileClosed",
        roomId: "123",
        platform: "bili-recorder",
        time: "2022-01-01T00:05:00Z",
        title: "New Video",
        filePath: "/path/to/new-video.mp4",
        username: "test",
      };

      // Act
      const liveId = webhookHandler.handleCloseEvent(options);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(liveId).toBe(liveData[0].eventId);
      expect(liveData.length).toBe(1);
      expect(liveData[0].eventId).toBeDefined();
      expect(liveData[0].platform).toBe(options.platform);
      expect(liveData[0].roomId).toBe(options.roomId);
      expect(liveData[0].title).toBe(options.title);
      expect(liveData[0].parts.length).toBe(1);
      expect(liveData[0].parts[0].partId).toBeDefined();
      expect(liveData[0].parts[0].filePath).toBe(options.filePath);
      expect(liveData[0].parts[0].endTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].parts[0].recordStatus).toBe("recorded");
    });

    it("should handle close event and update part endTime and recordStatus when multiple parts exist", async () => {
      // Arrange
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id-1",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video-1.mp4",
        recordStatus: "recording",
        title: "part1",
      });
      existingLive.addPart({
        partId: "existing-part-id-2",
        startTime: new Date("2022-01-01T00:05:00Z").getTime(),
        filePath: "/path/to/existing-video-2.mp4",
        recordStatus: "recording",
        title: "part2",
      });
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileClosed",
        roomId: "123",
        platform: "bili-recorder",
        time: "2022-01-01T00:10:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video-2.mp4",
        username: "test",
      };

      // Act
      const liveId = webhookHandler.handleCloseEvent(options);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(liveId).toBe(existingLive.eventId);
      expect(liveData.length).toBe(1);
      expect(liveData[0].eventId).toBe(existingLive.eventId);
      expect(liveData[0].platform).toBe(existingLive.platform);
      expect(liveData[0].startTime).toBe(existingLive.startTime);
      expect(liveData[0].roomId).toBe(existingLive.roomId);
      expect(liveData[0].title).toBe(existingLive.title);
      expect(liveData[0].parts.length).toBe(2);
      expect(liveData[0].parts[1].partId).toBe(existingLive.parts[1].partId);
      expect(liveData[0].parts[1].startTime).toBe(existingLive.parts[1].startTime);
      expect(liveData[0].parts[1].filePath).toBe(existingLive.parts[1].filePath);
      expect(liveData[0].parts[1].endTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].parts[1].recordStatus).toBe("recorded");
    });

    it("当接手到close事件时，如果之前part还在录制中，则设置为成功", async () => {
      // Arrange
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id-1",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video-1.mp4",
        recordStatus: "recording",
        title: "part1",
      });
      existingLive.addPart({
        partId: "existing-part-id-3",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video-3.mp4",
        recordStatus: "recording",
        title: "part3",
      });
      existingLive.addPart({
        partId: "existing-part-id-2",
        startTime: new Date("2022-01-01T00:05:00Z").getTime(),
        filePath: "/path/to/existing-video-2.mp4",
        recordStatus: "recording",
        title: "part2",
      });
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileClosed",
        roomId: "123",
        platform: "bili-recorder",
        time: "2022-01-01T00:10:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video-2.mp4",
        username: "test",
      };

      // Act
      webhookHandler.handleCloseEvent(options);

      // Assert
      const liveData = webhookHandler.liveData;

      expect(liveData[0].parts[0].recordStatus).toBe("handled");
      expect(liveData[0].parts[1].recordStatus).toBe("handled");
      expect(liveData[0].parts[2].recordStatus).toBe("recorded");
    });
  });
  describe("handleOpenEvent", () => {
    const appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
      }),
    };
    let webhookHandler: WebhookHandler;

    it("should handle open event and add a new part to existing live", async () => {
      // Arrange
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video.mp4",
        recordStatus: "recorded",
        endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        title: "part1",
      });
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileOpening",
        roomId: "123",
        platform: "bili-recorder",
        time: "2022-01-01T00:09:00Z",
        title: "New Video",
        filePath: "/path/to/new-video.mp4",
        username: "test",
      };

      // Act
      webhookHandler.handleOpenEvent(options, 10);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(liveData.length).toBe(1);
      expect(liveData[0].eventId).toBe(existingLive.eventId);
      expect(liveData[0].platform).toBe(existingLive.platform);
      expect(liveData[0].startTime).toBe(existingLive.startTime);
      expect(liveData[0].roomId).toBe(existingLive.roomId);
      expect(liveData[0].title).toBe(existingLive.title);
      expect(liveData[0].parts.length).toBe(2);
      expect(liveData[0].parts[1].partId).toBeDefined();
      expect(liveData[0].parts[1].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].parts[1].filePath).toBe(options.filePath);
      expect(liveData[0].parts[1].recordStatus).toBe("recording");
    });

    it("should handle open event and add a new part to existing live when last part is recording", async () => {
      // Arrange
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
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
        title: "part1",
      });
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileOpening",
        roomId: "123",
        platform: "bili-recorder",
        time: "2022-01-01T00:09:00Z",
        title: "New Video",
        filePath: "/path/to/new-video.mp4",
        username: "test",
      };

      // Act
      webhookHandler.handleOpenEvent(options, 10);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(liveData.length).toBe(1);
      expect(liveData[0].eventId).toBe(existingLive.eventId);
      expect(liveData[0].platform).toBe(existingLive.platform);
      expect(liveData[0].startTime).toBe(existingLive.startTime);
      expect(liveData[0].roomId).toBe(existingLive.roomId);
      expect(liveData[0].title).toBe(existingLive.title);
      expect(liveData[0].parts.length).toBe(2);
      expect(liveData[0].parts[1].partId).toBeDefined();
      expect(liveData[0].parts[1].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].parts[1].filePath).toBe(options.filePath);
      expect(liveData[0].parts[1].recordStatus).toBe("recording");
    });

    it("should create a new live when live is empty", async () => {
      // Arrange
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData = [];

      const options: Options = {
        event: "FileOpening",
        roomId: "123",
        platform: "bili-recorder",
        time: "2022-01-01T00:00:00Z",
        title: "New Video",
        filePath: "/path/to/new-video.mp4",
        username: "test",
      };

      // Act
      webhookHandler.handleOpenEvent(options, 10);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(liveData.length).toBe(1);
      expect(liveData[0].eventId).toBeDefined();
      expect(liveData[0].platform).toBe(options.platform);
      expect(liveData[0].roomId).toBe(options.roomId);
      expect(liveData[0].title).toBe(options.title);
      expect(liveData[0].parts.length).toBe(1);
      expect(liveData[0].parts[0].partId).toBeDefined();
      expect(liveData[0].parts[0].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[0].parts[0].filePath).toBe(options.filePath);
      expect(liveData[0].parts[0].recordStatus).toBe("recording");
    });

    it("should handle open event and add a new part to existing live when partMergeMinute is -1", async () => {
      // Arrange
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
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
        title: "part1",
      });
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileOpening",
        roomId: "123",
        platform: "bili-recorder",
        time: "2022-01-01T00:09:00Z",
        title: "New Video",
        filePath: "/path/to/new-video.mp4",
        username: "test",
      };

      // Act
      webhookHandler.handleOpenEvent(options, -1);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(liveData.length).toBe(2);
      expect(liveData[1].eventId).toBeDefined();
      expect(liveData[1].platform).toBe(options.platform);
      expect(liveData[1].roomId).toBe(options.roomId);
      expect(liveData[1].title).toBe(options.title);
      expect(liveData[1].parts.length).toBe(1);
      expect(liveData[1].parts[0].partId).toBeDefined();
      expect(liveData[1].parts[0].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[1].parts[0].filePath).toBe(options.filePath);
      expect(liveData[1].parts[0].recordStatus).toBe("recording");
    });

    it("should handle open event and add a new roomId live when has other live data", async () => {
      // Arrange
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video.mp4",
        recordStatus: "recorded",
        endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        title: "part1",
      });
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileOpening",
        roomId: "321",
        platform: "bili-recorder",
        time: "2022-01-01T00:00:00Z",
        title: "New Video",
        filePath: "/path/to/new-video.mp4",
        username: "test",
      };

      // Act
      webhookHandler.handleOpenEvent(options, 10);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(liveData.length).toBe(2);
      expect(liveData[1].eventId).toBeDefined();
      expect(liveData[1].platform).toBe(options.platform);
      expect(liveData[1].roomId).toBe(options.roomId);
      expect(liveData[1].title).toBe(options.title);
      expect(liveData[1].parts.length).toBe(1);
      expect(liveData[1].parts[0].partId).toBeDefined();
      expect(liveData[1].parts[0].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[1].parts[0].filePath).toBe(options.filePath);
      expect(liveData[1].parts[0].recordStatus).toBe("recording");
    });
    it("should handle open event and add a new platform live when has other live data", async () => {
      // Arrange
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video.mp4",
        recordStatus: "recorded",
        endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        title: "part1",
      });
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileOpening",
        roomId: "123",
        platform: "blrec",
        time: "2022-01-01T00:00:00Z",
        title: "New Video",
        filePath: "/path/to/new-video.mp4",
        username: "test",
      };

      // Act
      webhookHandler.handleOpenEvent(options, 10);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(liveData.length).toBe(2);
      expect(liveData[1].eventId).toBeDefined();
      expect(liveData[1].platform).toBe(options.platform);
      expect(liveData[1].roomId).toBe(options.roomId);
      expect(liveData[1].title).toBe(options.title);
      expect(liveData[1].parts.length).toBe(1);
      expect(liveData[1].parts[0].partId).toBeDefined();
      expect(liveData[1].parts[0].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[1].parts[0].filePath).toBe(options.filePath);
      expect(liveData[1].parts[0].recordStatus).toBe("recording");
    });
    it("should handle open event and add a new part to existing live when interval has over partMergeMinute ", async () => {
      // Arrange
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "existing-part-id",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video.mp4",
        recordStatus: "recorded",
        endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        title: "part1",
      });
      webhookHandler.liveData.push(existingLive);

      const options: Options = {
        event: "FileOpening",
        roomId: "123",
        platform: "bili-recorder",
        time: "2022-01-01T00:09:00Z",
        title: "New Video",
        filePath: "/path/to/new-video.mp4",
        username: "test",
      };

      // Act
      webhookHandler.handleOpenEvent(options, 3);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(liveData.length).toBe(2);
      expect(liveData[0].eventId).toBe(existingLive.eventId);
      expect(liveData[0].platform).toBe(existingLive.platform);
      expect(liveData[0].startTime).toBe(existingLive.startTime);
      expect(liveData[0].roomId).toBe(existingLive.roomId);
      expect(liveData[0].title).toBe(existingLive.title);
      expect(liveData[0].parts.length).toBe(1);

      expect(liveData[1].parts[0].partId).toBeDefined();
      expect(liveData[1].parts[0].startTime).toBe(new Date(options.time).getTime());
      expect(liveData[1].parts[0].filePath).toBe(options.filePath);
      expect(liveData[1].parts[0].recordStatus).toBe("recording");
    });
  });

  describe("handleVideoSync", () => {
    // @ts-ignore
    vi.spyOn(fs, "pathExists").mockResolvedValue(true);

    it("视频：不同步不上传且删除", async () => {
      vi.spyOn(webhookHandler, "hasTypeInSync").mockResolvedValue(false);
      vi.spyOn(webhookHandler, "handleFileSync").mockResolvedValue(undefined);

      const trashSpy = vi.spyOn(utils, "trashItem").mockResolvedValue(undefined);

      await webhookHandler.handleVideoSync("123", "/path/to/video.mp4", "part1", true);
      expect(trashSpy).toHaveBeenCalledWith("/path/to/video.mp4");
    });
    it("视频：不同步不上传且不删除", async () => {
      vi.spyOn(webhookHandler, "hasTypeInSync").mockResolvedValue(false);
      vi.spyOn(webhookHandler, "handleFileSync").mockResolvedValue(undefined);

      const trashSpy = vi.spyOn(utils, "trashItem").mockResolvedValue(undefined);

      await webhookHandler.handleVideoSync("123", "/path/to/video.mp4", "part1", false);
      expect(trashSpy).not.toHaveBeenCalled();
    });
    it("视频：同步上传且删除", async () => {});
    it("视频：同步上传且不删除", async () => {
      const appConfig = {
        getAll: vi.fn().mockReturnValue({
          task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
        }),
      };
      // @ts-ignore
      const webhookHandler = new WebhookHandler(appConfig);
      const existingLive = new Live({
        eventId: "existing-event-id",
        platform: "bili-recorder",
        roomId: "123",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Existing Video",
        username: "username",
      });
      existingLive.addPart({
        partId: "part1",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/existing-video.mp4",
        recordStatus: "recorded",
        endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        title: "part1",
      });
      webhookHandler.liveData.push(existingLive);

      vi.spyOn(webhookHandler, "hasTypeInSync").mockResolvedValue(true);
      vi.spyOn(webhookHandler.configManager, "getSyncConfig").mockReturnValue({
        id: "sync1",
        targetFiles: ["source"],
        folderStructure: "",
        syncSource: "alist",
        name: "sync",
      });
      const addSyncTaskSpy = vi.spyOn(syncTask, "addSyncTask").mockResolvedValue({
        on: vi.fn(),
        cancel: vi.fn(),
        start: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
      } as any);

      const trashSpy = vi.spyOn(utils, "trashItem").mockResolvedValue(undefined);

      await webhookHandler.handleVideoSync("123", "/path/to/video.mp4", "part1", true);
      expect(trashSpy).not.toHaveBeenCalled();
      expect(addSyncTaskSpy).toBeCalled();
    });
    // it("视频：不同步上传且不删除", () => {});
    // it("视频：不同步不上传且不删除", () => {});
  });
});

describe("Live", () => {
  it("should initialize with correct values", () => {
    const live = new Live({
      eventId: "event1",
      platform: "bili-recorder",
      roomId: "123",
      startTime: 1616161616161,
      aid: 456,
      title: "Test Video",
      username: "username",
    });

    expect(live.eventId).toBe("event1");
    expect(live.platform).toBe("bili-recorder");
    expect(live.roomId).toBe("123");
    expect(live.title).toBe("Test Video");
    expect(live.startTime).toBe(1616161616161);
    expect(live.aid).toBe(456);
    expect(live.parts).toEqual([]);
  });

  it("should add a part correctly", () => {
    const live = new Live({
      eventId: "event1",
      platform: "bili-recorder",
      roomId: "123",
      title: "Test Video",
      username: "username",
      startTime: 1616161616161,
    });
    const part: Part = {
      partId: "part1",
      filePath: "/path/to/part1.mp4",
      recordStatus: "recording",
      rawFilePath: "/path/to/raw/part1.mp4",
      uploadStatus: "uploaded",
      rawUploadStatus: "uploaded",
      title: "part1",
    };

    live.addPart(part);
    console.log(live.parts[0]);
    expect(live.parts).toContainEqual(part);
  });

  it("should update part value correctly", () => {
    const live = new Live({
      eventId: "event1",
      platform: "bili-recorder",
      roomId: "123",
      title: "Test Video",
      username: "username",
      startTime: 1616161616161,
    });
    const part: Part = {
      partId: "part1",
      filePath: "/path/to/part1.mp4",
      recordStatus: "recording",
      rawFilePath: "/path/to/raw/part1.mp4",
      uploadStatus: "uploaded",
      rawUploadStatus: "uploaded",
      title: "part1",
    };

    live.addPart(part);
    live.updatePartValue("part1", "recordStatus", "recorded");

    expect(live.parts[0].recordStatus).toBe("recorded");
  });

  it("should find part by file path correctly", () => {
    const live = new Live({
      eventId: "event1",
      platform: "bili-recorder",
      roomId: "123",
      title: "Test Video",
      username: "username",
      startTime: 1616161616161,
    });
    const part1: Part = {
      partId: "part1",
      filePath: "/path/to/part1.mp4",
      recordStatus: "recording",
      rawFilePath: "/path/to/raw/part1.mp4",
      uploadStatus: "uploaded",
      rawUploadStatus: "uploaded",
      title: "part1",
    };
    const part2: Part = {
      partId: "part2",
      filePath: "/path/to/part2.mp4",
      recordStatus: "recording",
      rawFilePath: "/path/to/raw/part1.mp4",
      uploadStatus: "uploaded",
      rawUploadStatus: "uploaded",
      title: "part2",
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
      roomId: "123",
      title: "Test Video",
      username: "username",
      startTime: 1616161616161,
    });
    const part: Part = {
      partId: "part1",
      filePath: "/path/to/part1.mp4",
      recordStatus: "recording",
      rawFilePath: "/path/to/raw/part1.mp4",
      uploadStatus: "uploaded",
      rawUploadStatus: "uploaded",
      title: "part1",
    };

    live.addPart(part);

    const foundPart = live.findPartByFilePath("/path/to/nonexistent.mp4");

    expect(foundPart).toBeUndefined();
  });

  describe("findLiveByFilePath", () => {
    const appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
      }),
    };
    let webhookHandler: WebhookHandler;

    beforeEach(() => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
    });

    it("should find live by file path correctly", () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const live1 = new Live({
        eventId: "event1",
        platform: "bili-recorder",
        roomId: "123",
        title: "Test Video 1",
        username: "username1",
        startTime: 1616161616161,
      });
      live1.addPart({
        partId: "part1",
        filePath: "/path/to/part1.mp4",
        recordStatus: "recording",
        rawFilePath: "/path/to/raw/part1.mp4",
        uploadStatus: "uploaded",
        rawUploadStatus: "uploaded",
        title: "part1",
      });

      const live2 = new Live({
        eventId: "event2",
        platform: "bili-recorder",
        roomId: "456",
        title: "Test Video 2",
        username: "username2",
        startTime: 1616161616161,
      });
      live2.addPart({
        partId: "part2",
        filePath: "/path/to/part2.mp4",
        recordStatus: "recording",
        rawFilePath: "/path/to/raw/part2.mp4",
        uploadStatus: "uploaded",
        rawUploadStatus: "uploaded",
        title: "part2",
      });

      webhookHandler.liveData.push(live1, live2);

      const foundLive = webhookHandler.findLiveByFilePath("/path/to/part2.mp4");

      expect(foundLive).toBe(live2);
    });

    it("should return undefined if live is not found by file path", () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      const live = new Live({
        eventId: "event1",
        platform: "bili-recorder",
        roomId: "123",
        title: "Test Video",
        username: "username",
        startTime: 1616161616161,
      });
      live.addPart({
        partId: "part1",
        filePath: "/path/to/part1.mp4",
        recordStatus: "recording",
        rawFilePath: "/path/to/raw/part1.mp4",
        uploadStatus: "uploaded",
        rawUploadStatus: "uploaded",
        title: "part1",
      });

      webhookHandler.liveData.push(live);

      const foundLive = webhookHandler.findLiveByFilePath("/path/to/nonexistent.mp4");

      expect(foundLive).toBeUndefined();
    });
  });

  describe("重构后的私有方法测试", () => {
    const appConfig = {
      getAll: vi.fn().mockReturnValue({
        task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
      }),
    };
    let webhookHandler: WebhookHandler;

    beforeEach(() => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
    });

    describe("shouldSkipProcessing", () => {
      it("应在事件为FileOpening时返回true", () => {
        // @ts-ignore
        const result = webhookHandler.shouldSkipProcessing("FileOpening");
        expect(result).toBe(true);
      });

      it("应在事件为FileError时返回true", () => {
        // @ts-ignore
        const result = webhookHandler.shouldSkipProcessing("FileError");
        expect(result).toBe(true);
      });

      it("应在事件为FileClosed时返回false", () => {
        // @ts-ignore
        const result = webhookHandler.shouldSkipProcessing("FileClosed");
        expect(result).toBe(false);
      });
    });

    describe("getCurrentContext", () => {
      it("应在liveIndex为-1时返回null", () => {
        // @ts-ignore
        const result = webhookHandler.getCurrentContext(-1, "/path/to/file.mp4");
        expect(result).toBeNull();
      });

      it("应在找不到part时返回null", () => {
        const live = new Live({
          eventId: "test-id",
          platform: "blrec",
          roomId: "123",
          startTime: Date.now(),
          title: "Test",
          username: "user",
        });
        webhookHandler.liveData.push(live);

        // @ts-ignore
        const result = webhookHandler.getCurrentContext(0, "/nonexistent/file.mp4");
        expect(result).toBeNull();
      });

      it("应成功返回context", () => {
        const live = new Live({
          eventId: "test-id",
          platform: "blrec",
          roomId: "123",
          startTime: Date.now(),
          title: "Test",
          username: "user",
        });
        live.addPart({
          partId: "part-1",
          filePath: "/path/to/file.mp4",
          recordStatus: "recording",
          title: "Part 1",
        });
        webhookHandler.liveData.push(live);

        // @ts-ignore
        const result = webhookHandler.getCurrentContext(0, "/path/to/file.mp4");
        expect(result).not.toBeNull();
        expect(result?.live).toBe(live);
        expect(result?.part.partId).toBe("part-1");
      });
    });

    describe("prepareFiles", () => {
      it("应在文件不存在时尝试替换为mp4扩展名", async () => {
        const live = new Live({
          eventId: "test-id",
          platform: "blrec",
          roomId: "123",
          startTime: Date.now(),
          title: "Test",
          username: "user",
        });
        const part = {
          partId: "part-1",
          filePath: "/path/to/file.flv",
          recordStatus: "recording" as const,
          title: "Part 1",
        };
        live.addPart(part);

        const context = { live, part };
        const options = {
          event: "FileClosed" as const,
          roomId: "123",
          platform: "blrec" as const,
          filePath: "/path/to/file.flv",
          time: new Date().toISOString(),
          title: "Test",
          username: "user",
        };

        // @ts-ignore
        vi.spyOn(fs, "pathExists")
          // @ts-ignore
          .mockResolvedValueOnce(false) // 第一次检查flv不存在
          // @ts-ignore
          .mockResolvedValueOnce(true); // 第二次检查mp4存在

        // @ts-ignore
        await webhookHandler.prepareFiles(context, options);

        // 使用 toContain 来处理路径分隔符差异
        expect(options.filePath).toContain("file.mp4");
        expect(part.filePath).toContain("file.mp4");
      });
    });

    describe("validateFileSize", () => {
      it("应在文件大小足够时返回true", async () => {
        const live = new Live({
          eventId: "test-id",
          platform: "blrec",
          roomId: "123",
          startTime: Date.now(),
          title: "Test",
          username: "user",
        });
        const part = {
          partId: "part-1",
          filePath: "/path/to/file.mp4",
          recordStatus: "recording" as const,
          title: "Part 1",
        };
        const context = { live, part };
        const config = { minSize: 10 };
        const options = {
          event: "FileClosed" as const,
          roomId: "123",
          platform: "blrec" as const,
          filePath: "/path/to/file.mp4",
          time: new Date().toISOString(),
          title: "Test",
          username: "user",
        };

        vi.spyOn(utils, "getFileSize").mockResolvedValue(20 * 1024 * 1024); // 20MB

        // @ts-ignore
        const result = await webhookHandler.validateFileSize(context, config, options);
        expect(result).toBe(true);
      });

      it("应在文件太小时返回false并清理", async () => {
        const live = new Live({
          eventId: "test-id",
          platform: "blrec",
          roomId: "123",
          startTime: Date.now(),
          title: "Test",
          username: "user",
        });
        const part = {
          partId: "part-1",
          filePath: "/path/to/file.mp4",
          recordStatus: "recording" as const,
          title: "Part 1",
        };
        live.addPart(part);
        webhookHandler.liveData.push(live);

        const context = { live, part };
        const config = { minSize: 100, removeSmallFile: true };
        const options = {
          event: "FileClosed" as const,
          roomId: "123",
          platform: "blrec" as const,
          filePath: "/path/to/file.mp4",
          time: new Date().toISOString(),
          title: "Test",
          username: "user",
        };

        vi.spyOn(utils, "getFileSize").mockResolvedValue(5 * 1024 * 1024); // 5MB
        const trashSpy = vi.spyOn(utils, "trashItem").mockResolvedValue();

        // @ts-ignore
        const result = await webhookHandler.validateFileSize(context, config, options);

        expect(result).toBe(false);
        expect(trashSpy).toHaveBeenCalledWith(options.filePath);
        expect(webhookHandler.liveData.length).toBe(0); // live被删除
      });
    });

    describe("shouldRemoveFile", () => {
      it("应在操作成功且配置允许时返回true", () => {
        // @ts-ignore
        const result = webhookHandler.shouldRemoveFile(true, true, "warning");
        expect(result).toBe(true);
      });

      it("应在操作失败时返回false", () => {
        // @ts-ignore
        const result = webhookHandler.shouldRemoveFile(false, true, "warning");
        expect(result).toBe(false);
      });

      it("应在配置不允许删除时返回false", () => {
        // @ts-ignore
        const result = webhookHandler.shouldRemoveFile(true, false, "warning");
        expect(result).toBe(false);
      });
    });

    describe("processCover", () => {
      it("应在useLiveCover为false时直接返回", async () => {
        const context = {
          live: new Live({
            eventId: "test",
            platform: "blrec" as const,
            roomId: "123",
            startTime: Date.now(),
            title: "Test",
            username: "user",
          }),
          part: {
            partId: "part-1",
            filePath: "/path/to/file.mp4",
            recordStatus: "recording" as const,
            title: "Part 1",
          },
        };
        const options = {
          event: "FileClosed" as const,
          roomId: "123",
          platform: "blrec" as const,
          filePath: "/path/to/file.mp4",
          time: new Date().toISOString(),
          title: "Test",
          username: "user",
        };
        const config = { useLiveCover: false };

        // @ts-ignore
        await webhookHandler.processCover(context, options, config);

        // @ts-ignore
        expect(context.part.cover).toBeUndefined();
      });
    });

    describe("processMediaFiles", () => {
      beforeEach(() => {
        // @ts-ignore
        webhookHandler.danmuPreset = {
          get: vi.fn().mockResolvedValue({ config: {} }),
        };
        // @ts-ignore
        webhookHandler.ffmpegPreset = {
          get: vi.fn().mockResolvedValue({ config: {} }),
        };
      });

      it("应在danmu为true时调用processDanmuVideo", async () => {
        const context = {
          live: new Live({
            eventId: "test",
            platform: "blrec" as const,
            roomId: "123",
            startTime: Date.now(),
            title: "Test",
            username: "user",
          }),
          part: {
            partId: "part-1",
            filePath: "/path/to/file.mp4",
            recordStatus: "recording" as const,
            title: "Part 1",
          },
        };
        const options = {
          event: "FileClosed" as const,
          roomId: "123",
          platform: "blrec" as const,
          filePath: "/path/to/file.mp4",
          time: new Date().toISOString(),
          title: "Test",
          username: "user",
        };
        const config = { danmu: true };

        const processDanmuVideoSpy = vi
          // @ts-ignore
          .spyOn(webhookHandler, "processDanmuVideo")
          // @ts-ignore
          .mockResolvedValue({ conversionSuccessful: true, danmuConversionSuccessful: true });

        // @ts-ignore
        await webhookHandler.processMediaFiles(context, options, config);

        expect(processDanmuVideoSpy).toHaveBeenCalled();
      });

      it("应在danmu为false时调用processRegularVideo", async () => {
        const context = {
          live: new Live({
            eventId: "test",
            platform: "blrec" as const,
            roomId: "123",
            startTime: Date.now(),
            title: "Test",
            username: "user",
          }),
          part: {
            partId: "part-1",
            filePath: "/path/to/file.mp4",
            recordStatus: "recording" as const,
            title: "Part 1",
          },
        };
        const options = {
          event: "FileClosed" as const,
          roomId: "123",
          platform: "blrec" as const,
          filePath: "/path/to/file.mp4",
          time: new Date().toISOString(),
          title: "Test",
          username: "user",
        };
        const config = { danmu: false };

        const processRegularVideoSpy = vi
          // @ts-ignore
          .spyOn(webhookHandler, "processRegularVideo")
          // @ts-ignore
          .mockResolvedValue({ conversionSuccessful: true, danmuConversionSuccessful: true });

        // @ts-ignore
        await webhookHandler.processMediaFiles(context, options, config);

        expect(processRegularVideoSpy).toHaveBeenCalled();
      });
    });

    describe("集成测试 - 完整流程", () => {
      it("应成功处理一个完整的webhook流程", async () => {
        const options: Options = {
          event: "FileOpening",
          roomId: "123",
          platform: "blrec",
          filePath: "/path/to/file.mp4",
          time: "2022-01-01T00:00:00Z",
          title: "Test Video",
          username: "TestUser",
        };

        // @ts-ignore
        vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
          open: true,
          partMergeMinute: 10,
          minSize: 1,
          useLiveCover: false,
          convert2Mp4Option: false,
          danmu: false,
          videoPresetId: undefined,
          danmuPresetId: undefined,
          afterConvertRemoveVideo: false,
          afterConvertRemoveXml: false,
          uid: undefined,
          afterUploadDeletAction: "none",
          removeSmallFile: false,
        });

        // @ts-ignore
        vi.spyOn(fs, "pathExists").mockResolvedValue(true);
        vi.spyOn(utils, "getFileSize").mockResolvedValue(10 * 1024 * 1024); // 10MB

        // 第一步：FileOpening
        await webhookHandler.handle(options);
        expect(webhookHandler.liveData.length).toBe(1);
        expect(webhookHandler.liveData[0].parts.length).toBe(1);
        expect(webhookHandler.liveData[0].parts[0].recordStatus).toBe("recording");

        // 第二步：FileClosed
        const closeOptions: Options = {
          ...options,
          event: "FileClosed",
          time: "2022-01-01T00:10:00Z",
        };

        await webhookHandler.handle(closeOptions);
        expect(webhookHandler.liveData[0].parts[0].recordStatus).toBe("handled");
      });
    });
  });
});
