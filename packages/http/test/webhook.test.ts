import fs from "fs-extra";
import { expect, describe, it, beforeEach, vi } from "vitest";
import { WebhookHandler } from "../src/services/webhook/webhook.js";
import { Live, Part } from "../src/services/webhook/Live.js";
import { DEFAULT_BILIUP_CONFIG } from "@biliLive-tools/shared/presets/videoPreset.js";
import * as utils from "@biliLive-tools/shared/utils/index.js";
import * as syncTask from "@biliLive-tools/shared/task/sync.js";

import type { Options } from "../src/types/webhook.js";

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
        software: "bili-recorder",
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
        software: "bili-recorder",
        time: "2022-01-01T00:09:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video3.mp4",
        username: "test",
      };
      // @ts-ignore
      await webhookHandler.handleLiveData(options, {
        partMergeMinute: 10,
      });
      const liveData = webhookHandler.liveData;

      expect(liveData.length).toBe(1);
      expect(liveData[0].parts.length).toBe(3);
      expect(liveData[0].parts[2].recordStatus).toBe("recording");
      expect(liveData[0].parts[1].recordStatus).toBe("recording");

      const options2: Options = {
        event: "FileClosed",
        roomId: "123",
        platform: "bili-recorder",
        software: "bili-recorder",
        time: "2022-01-01T00:10:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video2.mp4",
        username: "test",
      };
      // @ts-ignore
      await webhookHandler.handleLiveData(options2, {
        partMergeMinute: 10,
      });
      const liveData2 = webhookHandler.liveData;
      expect(liveData2[0].parts[1].recordStatus).toBe("recorded");
      expect(liveData[0].parts[2].recordStatus).toBe("recording");
    });

    it("不存在live的情况下，在event: FileClosed前先发送了event: FileOpeing", async () => {
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      webhookHandler.liveData = [];

      vi.spyOn(utils, "getFileSize").mockResolvedValue(20 * 1024 * 1024); // 10MB
      const options: Options = {
        event: "FileOpening",
        roomId: "123",
        platform: "bili-recorder",
        software: "bili-recorder",
        time: "2022-01-01T00:09:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video3.mp4",
        username: "test",
      };
      await webhookHandler.handle(
        options,
        // @ts-ignore
        {
          partMergeMinute: 10,
        },
      );
      const liveData = webhookHandler.liveData;

      expect(liveData.length).toBe(0);
      expect(webhookHandler.eventBufferManager.getBufferStatus()).toBe(1);

      const options2: Options = {
        event: "FileClosed",
        roomId: "123",
        platform: "bili-recorder",
        software: "bili-recorder",
        time: "2022-01-01T00:10:00Z",
        title: "Existing Video",
        filePath: "/path/to/existing-video3.mp4",
        username: "test",
      };

      await webhookHandler.handle(
        options2,
        // @ts-ignore
        {
          partMergeMinute: 10,
        },
      );
      const liveData2 = webhookHandler.liveData;
      await utils.sleep(100); // 等待异步处理完成
      expect(liveData2.length).toBe(1);
      expect(liveData2[0].parts[0].recordStatus).toBe("recorded");
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
        software: "bili-recorder",
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
      const appConfig = {
        getAll: vi.fn().mockReturnValue({
          task: { ffmpegMaxNum: -1, douyuDownloadMaxNum: -1, biliUploadMaxNum: -1 },
        }),
      };
      // @ts-ignore
      webhookHandler = new WebhookHandler(appConfig);
      // Arrange
      const openOptions: Options = {
        roomId: "123",
        event: "FileOpening",
        filePath: "/path/to/part1.flv",
        time: "2022-01-01T00:00:00Z",
        username: "test",
        platform: "blrec",
        title: "test video",
        software: "bili-recorder",
      };
      const closeOptions: Options = {
        roomId: "123",
        event: "FileClosed",
        filePath: "/path/to/part1.flv",
        time: "2022-01-01T00:05:00Z",
        username: "test",
        platform: "blrec",
        title: "test video",
        software: "bili-recorder",
      };
      vi.spyOn(webhookHandler.configManager, "getConfig")
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
      vi.spyOn(utils, "getFileSize").mockResolvedValue(20 * 1024 * 1024); // 20MB

      // Act
      await webhookHandler.handle(openOptions);
      await webhookHandler.handle(closeOptions);
      // await utils.sleep(1000);
      await new Promise((resolve) => setTimeout(resolve, 100)); // 等待异步处理完成

      // Assert
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
      expect(webhookHandler.liveManager.liveData[0].parts[0].filePath).toBe("/path/to/part1.mp4");
      expect(webhookHandler.liveManager.liveData[0].parts[0].rawFilePath).toBe(
        "/path/to/part1.mp4",
      );
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
        software: "bili-recorder",
      };
      const options: Options = {
        roomId: "123",
        event: "FileClosed",
        filePath: "/path/to/part1.mp4",
        time: "2022-01-01T00:05:00Z",
        username: "test",
        platform: "blrec",
        title: "test video",
        software: "bili-recorder",
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
        software: "bili-recorder",
      };

      // Act
      const partId = await webhookHandler.handleCloseEvent(options);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(partId).toBe(existingLive.parts[0].partId);
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
        software: "bili-recorder",
      };

      // Act
      const partId = await webhookHandler.handleCloseEvent(options);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(partId).toBe(liveData[0].parts[0].partId);
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
        software: "bili-recorder",
      };

      // Act
      const partId = await webhookHandler.handleCloseEvent(options);

      // Assert
      const liveData = webhookHandler.liveData;
      expect(partId).toBe("existing-part-id-2");
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

    // it("当接手到close事件时，如果之前part还在录制中，则设置为成功", async () => {
    //   // Arrange
    //   const existingLive = new Live({
    //     eventId: "existing-event-id",
    //     platform: "bili-recorder",
    //     roomId: 123,
    //     startTime: new Date("2022-01-01T00:00:00Z").getTime(),
    //     title: "Existing Video",
    //     username: "username",
    //   });
    //   existingLive.addPart({
    //     partId: "existing-part-id-1",
    //     startTime: new Date("2022-01-01T00:00:00Z").getTime(),
    //     filePath: "/path/to/existing-video-1.mp4",
    //     recordStatus: "recording",
    //     title: "part1",
    //   });
    //   existingLive.addPart({
    //     partId: "existing-part-id-3",
    //     startTime: new Date("2022-01-01T00:00:00Z").getTime(),
    //     filePath: "/path/to/existing-video-3.mp4",
    //     recordStatus: "recording",
    //     title: "part3",
    //   });
    //   existingLive.addPart({
    //     partId: "existing-part-id-2",
    //     startTime: new Date("2022-01-01T00:05:00Z").getTime(),
    //     filePath: "/path/to/existing-video-2.mp4",
    //     recordStatus: "recording",
    //     title: "part2",
    //   });
    //   // @ts-ignore
    //   webhookHandler = new WebhookHandler(appConfig);
    //   webhookHandler.liveData.push(existingLive);

    //   const options: Options = {
    //     event: "FileClosed",
    //     roomId: 123,
    //     platform: "bili-recorder",
    //     time: "2022-01-01T00:10:00Z",
    //     title: "Existing Video",
    //     filePath: "/path/to/existing-video-2.mp4",
    //     username: "test",
    //   };

    //   // Act
    //   webhookHandler.handleCloseEvent(options);

    //   // Assert
    //   const liveData = webhookHandler.liveData;

    //   expect(liveData[0].parts[0].recordStatus).toBe("handled");
    //   expect(liveData[0].parts[1].recordStatus).toBe("recorded");
    //   expect(liveData[0].parts[2].recordStatus).toBe("recorded");
    // });
  });

  describe("handleErrorEvent", () => {
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

    it("应该将错误的part设置为error状态", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Test Video",
        username: "test-user",
      });

      live.addPart({
        partId: "part-1",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/video1.mp4",
        recordStatus: "recording",
        title: "Part 1",
      });

      webhookHandler.liveData.push(live);

      const options: Options = {
        event: "FileError",
        roomId: "123456",
        platform: "blrec",
        time: "2022-01-01T00:05:00Z",
        title: "Test Video",
        filePath: "/path/to/video1.mp4",
        username: "test-user",
        software: "bili-recorder",
      };

      webhookHandler.handleErrorEvent(options);

      expect(live.parts[0].recordStatus).toBe("error");
      expect(live.parts.length).toBe(1); // part不应该被删除
      expect(webhookHandler.liveData.length).toBe(1); // live不应该被删除
    });

    it("应该处理找不到part的情况", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Test Video",
        username: "test-user",
      });

      webhookHandler.liveData.push(live);

      const options: Options = {
        event: "FileError",
        roomId: "123456",
        platform: "blrec",
        time: "2022-01-01T00:05:00Z",
        title: "Test Video",
        filePath: "/path/to/nonexistent.mp4",
        username: "test-user",
        software: "bili-recorder",
      };

      // 不应该抛出错误
      expect(() => webhookHandler.handleErrorEvent(options)).not.toThrow();
    });

    it("应该处理多个part中的error", () => {
      const live = new Live({
        eventId: "event-123",
        platform: "blrec",
        roomId: "123456",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        title: "Test Video",
        username: "test-user",
      });

      live.addPart({
        partId: "part-1",
        startTime: new Date("2022-01-01T00:00:00Z").getTime(),
        filePath: "/path/to/video1.mp4",
        recordStatus: "recorded",
        endTime: new Date("2022-01-01T00:05:00Z").getTime(),
        title: "Part 1",
      });

      live.addPart({
        partId: "part-2",
        startTime: new Date("2022-01-01T00:05:00Z").getTime(),
        filePath: "/path/to/video2.mp4",
        recordStatus: "recording",
        title: "Part 2",
      });

      webhookHandler.liveData.push(live);

      const options: Options = {
        event: "FileError",
        roomId: "123456",
        platform: "blrec",
        time: "2022-01-01T00:10:00Z",
        title: "Test Video",
        filePath: "/path/to/video2.mp4",
        username: "test-user",
        software: "bili-recorder",
      };

      webhookHandler.handleErrorEvent(options);

      expect(live.parts[0].recordStatus).toBe("recorded"); // 第一个part不受影响
      expect(live.parts[1].recordStatus).toBe("error"); // 第二个part被设置为error
      expect(live.parts.length).toBe(2); // 两个part都保留
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
        software: "bili-recorder",
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
        software: "bili-recorder",
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
        software: "bili-recorder",
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
        software: "bili-recorder",
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
        software: "bili-recorder",
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
        software: "bili-recorder",
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
        software: "bili-recorder",
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
        software: "bili-recorder",
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
        software: "bili-recorder",
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
    vi.spyOn(fs, "pathExistsSync").mockReturnValue(true);
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
    const part = {
      partId: "part1",
      filePath: "/path/to/part1.mp4",
      recordStatus: "recording" as const,
      rawFilePath: "/path/to/raw/part1.mp4",
      uploadStatus: "uploaded" as const,
      rawUploadStatus: "uploaded" as const,
      title: "part1",
    };

    live.addPart(part);
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
    const part = {
      partId: "part1",
      filePath: "/path/to/part1.mp4",
      recordStatus: "recording" as const,
      rawFilePath: "/path/to/raw/part1.mp4",
      uploadStatus: "uploaded" as const,
      rawUploadStatus: "uploaded" as const,
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

    live.addPart({
      partId: "part1",
      filePath: "/path/to/part1.mp4",
      recordStatus: "recording",
      rawFilePath: "/path/to/raw/part1.mp4",
      uploadStatus: "uploaded",
      rawUploadStatus: "uploaded",
      title: "part1",
    });

    live.addPart({
      partId: "part2",
      filePath: "/path/to/part2.mp4",
      recordStatus: "recording",
      rawFilePath: "/path/to/raw/part1.mp4",
      uploadStatus: "uploaded",
      rawUploadStatus: "uploaded",
      title: "part2",
    });

    const foundPart = live.findPartByFilePath("/path/to/part2.mp4");

    expect(foundPart).toBeDefined();
    expect(foundPart?.partId).toBe("part2");
    expect(foundPart?.filePath).toBe("/path/to/part2.mp4");
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
    const part = {
      partId: "part1",
      filePath: "/path/to/part1.mp4",
      recordStatus: "recording" as const,
      rawFilePath: "/path/to/raw/part1.mp4",
      uploadStatus: "uploaded" as const,
      rawUploadStatus: "uploaded" as const,
      title: "part1",
    };

    live.addPart(part);

    const foundPart = live.findPartByFilePath("/path/to/nonexistent.mp4");

    expect(foundPart).toBeUndefined();
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
        const result = await webhookHandler.validateFileSize(config, options);
        expect(result).toBe(true);
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

    describe("handlePostProcessing - 封面处理", () => {
      it("应在useLiveCover为false时不处理封面", async () => {
        const live = new Live({
          eventId: "test",
          platform: "blrec" as const,
          roomId: "123",
          startTime: Date.now(),
          title: "Test",
          username: "user",
        });

        live.addPart({
          partId: "part-1",
          filePath: "/path/to/file.mp4",
          recordStatus: "prehandled" as const,
          title: "Part 1",
        });

        const options = {
          event: "FileClosed" as const,
          roomId: "123",
          platform: "blrec" as const,
          filePath: "/path/to/file.mp4",
          coverPath: "/path/to/cover.jpg",
          time: new Date().toISOString(),
          title: "Test",
          username: "user",
        };
        const config = {
          useLiveCover: false,
          afterConvertRemoveVideo: false,
          afterConvertRemoveXml: false,
        };

        // @ts-ignore
        vi.spyOn(fs, "pathExists").mockResolvedValue(true);

        // 将 live 注册到 handler，以便 handleCloseEvent 能找到
        // @ts-ignore
        webhookHandler.liveData.push(live);

        // @ts-ignore
        webhookHandler.configManager.getConfig = () => config;

        // 调用 close 事件处理（会在内部处理封面）
        await webhookHandler.handleCloseEvent(options as any);

        const part = live.parts[0];
        expect(part.cover).toBe("/path/to/cover.jpg");
      });

      it("应在useLiveCover为true时处理封面", async () => {
        const live = new Live({
          eventId: "test",
          platform: "blrec" as const,
          roomId: "123",
          startTime: Date.now(),
          title: "Test",
          username: "user",
        });

        live.addPart({
          partId: "part-1",
          filePath: "/path/to/file.mp4",
          recordStatus: "prehandled" as const,
          title: "Part 1",
        });

        const options = {
          event: "FileClosed" as const,
          roomId: "123",
          platform: "blrec" as const,
          filePath: "/path/to/file.mp4",
          coverPath: "/path/to/cover.jpg",
          time: new Date().toISOString(),
          title: "Test",
          username: "user",
        };
        const config = {
          useLiveCover: true,
          afterConvertRemoveVideo: false,
          afterConvertRemoveXml: false,
        };

        // @ts-ignore
        vi.spyOn(fs, "pathExistsSync").mockReturnValue(true);

        // 将 live 注册到 handler，以便 handleCloseEvent 能找到
        // @ts-ignore
        webhookHandler.liveData.push(live);

        // @ts-ignore
        webhookHandler.configManager.getConfig = () => config;

        // 调用 close 事件处理（会在内部处理封面）
        await webhookHandler.handleCloseEvent(options as any);

        const part = live.parts[0];
        expect(part.cover).toBe("/path/to/cover.jpg");
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
          software: "bili-recorder",
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
        expect(webhookHandler.liveData.length).toBe(0);

        // 第二步：FileClosed
        const closeOptions: Options = {
          ...options,
          event: "FileClosed",
          time: "2022-01-01T00:10:00Z",
        };

        await webhookHandler.handle(closeOptions);
        await new Promise((r) => setTimeout(r, 100)); // 等待异步处理完成
        expect(webhookHandler.liveData[0].parts[0].recordStatus).toBe("handled");
      });
    });

    describe("handleLive 拆分后的私有方法测试", () => {
      beforeEach(() => {
        // @ts-ignore
        webhookHandler.videoPreset = {
          get: vi.fn().mockReturnValue({ config: {} }),
        };
      });

      describe("buildUploadFileList", () => {
        it("应正确构建上传文件列表", () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Test Video",
            username: "TestUser",
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            recordStatus: "handled",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Part 1",
          });

          live.addPart({
            partId: "part-2",
            filePath: "/path/to/part2.mp4",
            recordStatus: "handled",
            startTime: new Date("2022-01-01T00:05:00Z").getTime(),
            cover: "/path/to/cover.jpg",
            title: "Part 2",
          });

          const uploadableParts = [live.parts[0], live.parts[1]];
          const config = {
            partTitleTemplate: "{{filename}}",
          } as any;

          // @ts-ignore
          const result = webhookHandler.buildUploadFileList(
            live,
            uploadableParts,
            "handled",
            config,
          );

          expect(result.filePaths.length).toBe(2);
          expect(result.filePaths[0].part.partId).toBe("part-1");
          expect(result.filePaths[0].title).toBe("part1");
          expect(result.filePaths[1].part.partId).toBe("part-2");
          expect(result.filePaths[1].title).toBe("part2");
          expect(result.cover).toBe("/path/to/cover.jpg");
        });

        it("应根据已上传数量正确计算索引", () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Test Video",
            username: "TestUser",
          });

          // 添加已上传的分段
          live.addPart({
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            recordStatus: "handled",
            uploadStatus: "uploaded",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Part 1",
          });

          // 添加待上传的分段
          live.addPart({
            partId: "part-2",
            filePath: "/path/to/part2.mp4",
            recordStatus: "handled",
            uploadStatus: "pending",
            startTime: new Date("2022-01-01T00:05:00Z").getTime(),
            title: "Part 2",
          });

          const uploadableParts = [live.parts[1]];
          const config = {
            partTitleTemplate: "P{{index}} {{filename}}",
          } as any;

          // @ts-ignore
          const result = webhookHandler.buildUploadFileList(
            live,
            uploadableParts,
            "handled",
            config,
          );

          expect(result.filePaths[0].title).toBe("P2 part2");
        });
      });

      describe("validateUploadConfig", () => {
        it("应在uid未配置时返回false并设置错误状态", () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Test Video",
            username: "TestUser",
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            recordStatus: "handled",
            title: "Part 1",
          });

          const filePaths = [{ part: live.parts[0], path: "/path/to/part1.mp4", title: "Part 1" }];
          const config = { uid: undefined } as any;

          // @ts-ignore
          const result = webhookHandler.validateUploadConfig(live, filePaths, "handled", config);

          expect(result).toBe(false);
          expect(live.parts[0].uploadStatus).toBe("error");
        });

        it("应在raw类型且不允许上传无弹幕视频时返回false", () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Test Video",
            username: "TestUser",
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            recordStatus: "handled",
            title: "Part 1",
          });

          const filePaths = [{ part: live.parts[0], path: "/path/to/part1.mp4", title: "Part 1" }];
          const config = { uid: 123, uploadNoDanmu: false } as any;

          // @ts-ignore
          const result = webhookHandler.validateUploadConfig(live, filePaths, "raw", config);

          expect(result).toBe(false);
          expect(live.parts[0].rawUploadStatus).toBe("error");
        });

        it("应在配置正确时返回true", () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Test Video",
            username: "TestUser",
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            recordStatus: "handled",
            title: "Part 1",
          });

          const filePaths = [{ part: live.parts[0], path: "/path/to/part1.mp4", title: "Part 1" }];
          const config = { uid: 123, uploadNoDanmu: true } as any;

          // @ts-ignore
          const result = webhookHandler.validateUploadConfig(live, filePaths, "handled", config);

          expect(result).toBe(true);
        });
      });

      describe("prepareUploadPreset", () => {
        it("应正确准备handled类型的上传预设", async () => {
          const config = {
            uploadPresetId: "preset-1",
            useLiveCover: true,
          } as any;
          const live = {
            platform: "bilibili",
            roomId: "123456",
          };
          // @ts-ignore
          webhookHandler.videoPreset.get = vi.fn().mockResolvedValue({
            config: { title: "Custom Title" },
          });

          // @ts-ignore
          const result = await webhookHandler.prepareUploadPreset(
            "handled",
            config,
            live as any,
            "/path/to/cover.jpg",
          );

          expect(webhookHandler.videoPreset.get).toHaveBeenCalledWith("preset-1");
          expect(result.title).toBe("Custom Title");
          expect(result.cover).toBe("/path/to/cover.jpg");
        });

        it("应正确准备raw类型的上传预设", async () => {
          const config = {
            noDanmuVideoPreset: "raw-preset",
            useLiveCover: false,
          } as any;

          // @ts-ignore
          webhookHandler.videoPreset.get = vi.fn().mockResolvedValue({
            config: { title: "Raw Title" },
          });

          // @ts-ignore
          const result = await webhookHandler.prepareUploadPreset("raw", config);

          expect(webhookHandler.videoPreset.get).toHaveBeenCalledWith("raw-preset");
          expect(result.title).toBe("Raw Title");
          // 注意：DEFAULT_BILIUP_CONFIG 可能包含空字符串的 cover
          expect(result.cover).toBeDefined();
        });

        describe("prepareUploadPreset - 转载来源自动生成", () => {
          beforeEach(() => {
            // @ts-ignore
            webhookHandler.videoPreset = {
              get: vi.fn().mockReturnValue({
                config: {
                  title: "Test Title",
                  copyright: 2, // 转载类型
                  source: "", // 转载来源为空
                },
              }),
            };
          });

          it("应在转载类型且来源为空时生成直播间链接", async () => {
            const live = {
              platform: "bilibili",
              roomId: "123456",
            };
            const config = { uploadPresetId: "test-preset" };

            // @ts-ignore
            const result = await webhookHandler.prepareUploadPreset("handled", config, live);

            expect(result.source).toBe("https://live.bilibili.com/123456");
          });

          it("应在无法生成链接时使用房间号作为转载来源", async () => {
            const live = {
              platform: "unknown",
              roomId: "123456",
            };
            const config = { uploadPresetId: "test-preset" };

            // @ts-ignore
            const result = await webhookHandler.prepareUploadPreset("handled", config, live);

            expect(result.source).toBe("123456");
          });

          it("应在转载来源已设置时不覆盖现有来源", async () => {
            const live = {
              platform: "bilibili",
              roomId: "123456",
            };
            const config = { uploadPresetId: "test-preset" };

            // @ts-ignore
            webhookHandler.videoPreset = {
              get: vi.fn().mockReturnValue({
                config: {
                  title: "Test Title",
                  copyright: 2, // 转载类型
                  source: "https://example.com", // 已设置转载来源
                },
              }),
            };

            // @ts-ignore
            const result = await webhookHandler.prepareUploadPreset("handled", config, live);

            expect(result.source).toBe("https://example.com");
          });

          it("应在自制类型时不设置转载来源", async () => {
            const live = {
              platform: "bilibili",
              roomId: "123456",
            };
            const config = { uploadPresetId: "test-preset" };

            // @ts-ignore
            webhookHandler.videoPreset = {
              get: vi.fn().mockReturnValue({
                config: {
                  title: "Test Title",
                  copyright: 1, // 自制类型
                  source: "",
                },
              }),
            };

            // @ts-ignore
            const result = await webhookHandler.prepareUploadPreset("handled", config, live);

            expect(result.source).toBe("");
          });

          it("应在转载来源为空字符串时生成链接", async () => {
            const live = {
              platform: "bilibili",
              roomId: "123456",
            };
            const config = { uploadPresetId: "test-preset" };

            // @ts-ignore
            webhookHandler.videoPreset = {
              get: vi.fn().mockReturnValue({
                config: {
                  title: "Test Title",
                  copyright: 2, // 转载类型
                  source: "   ", // 只有空格的字符串
                },
              }),
            };

            // @ts-ignore
            const result = await webhookHandler.prepareUploadPreset("handled", config, live);

            expect(result.source).toBe("https://live.bilibili.com/123456");
          });
        });
      });

      describe("formatUploadTitle", () => {
        it("应正确格式化handled类型的标题（使用预设占位符）", () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "room123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Live Title",
            username: "TestUser",
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/video.mp4",
            recordStatus: "handled",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Part Title",
          });

          const uploadPreset = { title: "{{title}} by {{user}}" } as any;
          const config = { title: "Webhook Title" } as any;

          // @ts-ignore
          const result = webhookHandler.formatUploadTitle(
            live,
            live.parts[0],
            "handled",
            uploadPreset,
            config,
          );

          expect(result).toBe("Live Title by TestUser");
        });

        it("应正确格式化handled类型的标题（使用webhook配置）", () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "room123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Live Title",
            username: "TestUser",
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/video.mp4",
            recordStatus: "handled",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Part Title",
          });

          const uploadPreset = { title: "Plain Title" } as any;
          const config = { title: "Webhook {{user}}" } as any;

          // @ts-ignore
          const result = webhookHandler.formatUploadTitle(
            live,
            live.parts[0],
            "handled",
            uploadPreset,
            config,
          );

          expect(result).toBe("Webhook TestUser");
        });

        it("应正确格式化raw类型的标题", () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "room123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Live Title",
            username: "TestUser",
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/video.mp4",
            recordStatus: "handled",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Part Title",
          });

          const uploadPreset = { title: "{{title}} - Raw" } as any;
          const config = {} as any;

          // @ts-ignore
          const result = webhookHandler.formatUploadTitle(
            live,
            live.parts[0],
            "raw",
            uploadPreset,
            config,
          );

          expect(result).toBe("Live Title - Raw");
        });
      });

      describe("uploadVideoByType - 集成测试", () => {
        it("应跳过有正在上传分段的情况", async () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Test Video",
            username: "TestUser",
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            recordStatus: "handled",
            uploadStatus: "uploading",
            title: "Part 1",
          });

          const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig");

          // @ts-ignore
          await webhookHandler.uploadVideoByType(live, "handled");

          expect(getConfigSpy).not.toHaveBeenCalled();
        });

        it("应跳过没有可上传分段的情况", async () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Test Video",
            username: "TestUser",
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            recordStatus: "recording",
            title: "Part 1",
          });

          const getConfigSpy = vi.spyOn(webhookHandler.configManager, "getConfig");

          // @ts-ignore
          await webhookHandler.uploadVideoByType(live, "handled");

          expect(getConfigSpy).not.toHaveBeenCalled();
        });

        it("应成功执行新上传流程", async () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Test Video",
            username: "TestUser",
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            recordStatus: "handled",
            uploadStatus: "pending",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Part 1",
          });

          // @ts-ignore
          vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
            uid: 123,
            uploadPresetId: "preset-1",
            useLiveCover: false,
            limitUploadTime: false,
            uploadHandleTime: ["00:00:00", "23:59:59"],
            partTitleTemplate: "{{filename}}",
            afterUploadDeletAction: "none",
            title: "Test Video {{user}}", // 添加 title 字段
          });

          // @ts-ignore
          webhookHandler.videoPreset.get = vi.fn().mockResolvedValue({
            config: { title: "Preset {{title}}" },
          });

          const addUploadTaskSpy = vi.spyOn(webhookHandler, "addUploadTask").mockResolvedValue(456);

          // @ts-ignore
          await webhookHandler.uploadVideoByType(live, "handled");

          expect(addUploadTaskSpy).toHaveBeenCalled();
          expect(live.aid).toBe(456);
          expect(live.parts[0].uploadStatus).toBe("uploaded");
        });

        it("应成功执行续传流程", async () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Test Video",
            username: "TestUser",
            aid: 789,
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            recordStatus: "handled",
            uploadStatus: "pending",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Part 1",
          });

          // @ts-ignore
          vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
            uid: 123,
            uploadPresetId: "preset-1",
            useLiveCover: false,
            limitUploadTime: false,
            uploadHandleTime: ["00:00:00", "23:59:59"],
            partTitleTemplate: "{{filename}}",
            afterUploadDeletAction: "none",
          });

          const addEditMediaTaskSpy = vi
            .spyOn(webhookHandler, "addEditMediaTask")
            .mockResolvedValue(undefined);

          // @ts-ignore
          await webhookHandler.uploadVideoByType(live, "handled");

          expect(addEditMediaTaskSpy).toHaveBeenCalledWith(
            123,
            789,
            expect.any(Array),
            expect.any(Array),
            "none",
          );
          expect(live.parts[0].uploadStatus).toBe("uploaded");
        });

        it("应在上传失败时设置错误状态", async () => {
          const live = new Live({
            eventId: "123",
            platform: "blrec",
            roomId: "123",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Test Video",
            username: "TestUser",
          });

          live.addPart({
            partId: "part-1",
            filePath: "/path/to/part1.mp4",
            recordStatus: "handled",
            uploadStatus: "pending",
            startTime: new Date("2022-01-01T00:00:00Z").getTime(),
            title: "Part 1",
          });

          // @ts-ignore
          vi.spyOn(webhookHandler.configManager, "getConfig").mockReturnValue({
            uid: 123,
            uploadPresetId: "preset-1",
            useLiveCover: false,
            limitUploadTime: false,
            uploadHandleTime: ["00:00:00", "23:59:59"],
            partTitleTemplate: "{{filename}}",
            afterUploadDeletAction: "none",
            title: "Test Video {{user}}", // 添加 title 字段
          });

          // @ts-ignore
          webhookHandler.videoPreset.get = vi.fn().mockResolvedValue({
            config: { title: "Preset {{title}}" },
          });

          vi.spyOn(webhookHandler, "addUploadTask").mockRejectedValue(new Error("Upload failed"));

          // @ts-ignore
          await webhookHandler.uploadVideoByType(live, "handled");

          expect(live.parts[0].uploadStatus).toBe("error");
        });
      });
    });
  });
});
