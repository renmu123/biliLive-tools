import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRecorderManager, RecorderProvider } from "../src/manager";
import { Recorder, RecorderCreateOpts, SerializedRecorder, RecordHandle } from "../src/recorder";
import mitt, { Emitter, Handler, WildcardHandler } from "mitt";
import { Quality, ChannelId } from "../src/common";

type RecorderEvents = {
  RecordStart: RecordHandle;
  RecordSegment: RecordHandle;
  videoFileCreated: { filename: string };
  videoFileCompleted: { filename: string };
  progress: { time: string | null };
  LiveStart: { liveId: string };
  RecordStop: { recordHandle: RecordHandle; reason?: string };
  Updated: void;
  Message: string[];
  DebugLog: { type: string | "common" | "ffmpeg"; text: string };
};

// 创建一个简单的测试 Provider
class TestProvider implements RecorderProvider<{}> {
  id = "test";
  name = "Test Provider";
  siteURL = "https://test.com";

  matchURL(channelURL: string): boolean {
    return channelURL.includes("test.com");
  }

  async resolveChannelInfoFromURL(channelURL: string): Promise<{
    id: ChannelId;
    title: string;
    owner: string;
    uid: number;
  } | null> {
    return {
      id: "test-channel",
      title: "Test Channel",
      owner: "Test Owner",
      uid: 12345,
    };
  }

  createRecorder(opts: Omit<RecorderCreateOpts<{}>, "providerId">): Recorder<{}> {
    const emitter = mitt<RecorderEvents>();
    const recorder: Recorder<{}> = {
      id: opts.id ?? "test-recorder",
      channelId: "test-channel",
      providerId: this.id,
      recordHandle: undefined,
      disableAutoCheck: false,
      tempStopIntervalCheck: false,
      liveInfo: undefined,
      remarks: "",
      saveCover: false,
      quality: "highest",
      streamPriorities: [],
      sourcePriorities: [],
      extra: {},
      availableStreams: [],
      availableSources: [],
      state: "idle",
      qualityMaxRetry: 3,
      qualityRetry: 3,
      toJSON: () => ({
        id: opts.id ?? "test-recorder",
        providerId: this.id,
        channelId: "test-channel",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      }),
      // @ts-ignore
      on: <K extends keyof RecorderEvents>(type: K, handler: Handler<RecorderEvents[K]>) => {
        emitter.on(type, handler);
      },
      checkLiveStatusAndRecord: vi.fn(),
      getChannelURL: () => "https://test.com/live/test-channel",
      // @ts-ignore
      emit: <K extends keyof RecorderEvents>(type: K, event: RecorderEvents[K]) => {
        emitter.emit(type, event);
      },
      // @ts-ignore
      off: <K extends keyof RecorderEvents>(type: K, handler: Handler<RecorderEvents[K]>) => {
        emitter.off(type, handler);
      },
      getLiveInfo: vi.fn(),
      getStream: vi.fn(),
      // @ts-ignore
      all: emitter.all,
    };
    return recorder;
  }

  fromJSON<T extends SerializedRecorder<{}>>(json: T): Recorder<{}> {
    return this.createRecorder(json);
  }

  setFFMPEGOutputArgs(args: string[]) {}
}

describe("RecorderManager", () => {
  let manager: ReturnType<typeof createRecorderManager>;
  let testProvider: TestProvider;

  beforeEach(() => {
    testProvider = new TestProvider();
    // @ts-ignore
    manager = createRecorderManager({
      providers: [testProvider],
      autoCheckInterval: 1000,
      savePathRule: "{platform}/{owner}/{title}",
      autoRemoveSystemReservedChars: true,
      ffmpegOutputArgs: "-c copy",
      biliBatchQuery: false,
    });
  });

  afterEach(() => {
    manager.stopCheckLoop();
  });

  describe("创建和基本属性", () => {
    it("应该正确创建 RecorderManager", () => {
      expect(manager).toBeDefined();
      expect(manager.providers).toHaveLength(1);
      expect(manager.providers[0]).toBe(testProvider);
      expect(manager.recorders).toHaveLength(0);
      expect(manager.autoCheckInterval).toBe(1000);
      expect(manager.savePathRule).toBe("{platform}/{owner}/{title}");
      expect(manager.autoRemoveSystemReservedChars).toBe(true);
      expect(manager.ffmpegOutputArgs).toBe("-c copy");
      expect(manager.biliBatchQuery).toBe(false);
    });

    it("应该正确匹配 URL 到 Provider", () => {
      const matchedProviders =
        manager.getChannelURLMatchedRecorderProviders("https://test.com/live");
      expect(matchedProviders).toHaveLength(1);
      expect(matchedProviders[0]).toBe(testProvider);

      const unmatchedProviders =
        manager.getChannelURLMatchedRecorderProviders("https://other.com/live");
      expect(unmatchedProviders).toHaveLength(0);
    });
  });

  describe("录制器管理", () => {
    it("应该能够添加和移除录制器", () => {
      const recorder = manager.addRecorder({
        id: "test-recorder",
        providerId: "test",
        channelId: "test-channel",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      expect(manager.recorders).toHaveLength(1);
      expect(manager.recorders[0]).toBe(recorder);

      manager.removeRecorder(recorder);
      expect(manager.recorders).toHaveLength(0);
    });

    it("应该能够开始和停止录制", async () => {
      const recorder = manager.addRecorder({
        id: "test-recorder",
        providerId: "test",
        channelId: "test-channel",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      const startedRecorder = await manager.startRecord("test-recorder");
      expect(startedRecorder).toBe(recorder);
      expect(recorder.checkLiveStatusAndRecord).toHaveBeenCalled();

      const stoppedRecorder = await manager.stopRecord("test-recorder");
      // expect(stoppedRecorder).toBe(recorder);
    });
  });

  describe("自动检查循环", () => {
    it("应该能够启动和停止检查循环", () => {
      expect(manager.isCheckLoopRunning).toBe(false);

      manager.startCheckLoop();
      expect(manager.isCheckLoopRunning).toBe(true);

      manager.stopCheckLoop();
      expect(manager.isCheckLoopRunning).toBe(false);
    });
  });

  describe("事件系统", () => {
    it("应该能够触发和监听事件", () => {
      const recorder = manager.addRecorder({
        id: "test-recorder",
        providerId: "test",
        channelId: "test-channel",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      const eventHandlers = {
        RecorderAdded: vi.fn(),
        RecorderRemoved: vi.fn(),
        RecordStart: vi.fn(),
        RecordStop: vi.fn(),
        Message: vi.fn(),
        RecorderUpdated: vi.fn(),
        RecorderDebugLog: vi.fn(),
        RecorderProgress: vi.fn(),
        RecoderLiveStart: vi.fn(),
        error: vi.fn(),
        Updated: vi.fn(),
      };

      Object.entries(eventHandlers).forEach(([event, handler]) => {
        manager.on(event as any, handler);
      });

      // 触发一些事件
      manager.emit("RecorderAdded", recorder);
      expect(eventHandlers.RecorderAdded).toHaveBeenCalledWith(recorder);

      manager.emit("error", { source: "test", err: new Error("test error") });
      expect(eventHandlers.error).toHaveBeenCalledWith({ source: "test", err: expect.any(Error) });
    });
  });
});
