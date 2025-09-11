import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRecorderManager, RecorderProvider, genSavePathFromRule } from "../src/manager";
import { Recorder, RecorderCreateOpts, SerializedRecorder, RecordHandle } from "../src/recorder";
import mitt, { Emitter, Handler, WildcardHandler } from "mitt";
import { Quality, ChannelId } from "../src/common";
import * as api from "../src/api";

type RecorderEvents = {
  RecordStart: RecordHandle;
  RecordSegment: RecordHandle;
  videoFileCreated: { filename: string };
  videoFileCompleted: { filename: string };
  progress: { time: string | null };
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
    uid?: number;
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
        extra: {},
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

// 创建一个测试用的 Bilibili Provider
class BilibiliTestProvider implements RecorderProvider<{}> {
  id = "Bilibili";
  name = "Bilibili Test Provider";
  siteURL = "https://live.bilibili.com";

  matchURL(channelURL: string): boolean {
    return channelURL.includes("bilibili.com");
  }

  async resolveChannelInfoFromURL(channelURL: string): Promise<{
    id: ChannelId;
    title: string;
    owner: string;
    uid?: number;
  } | null> {
    return {
      id: "12345",
      title: "Bilibili Test Channel",
      owner: "Bilibili Test Owner",
      uid: 12345,
    };
  }

  createRecorder(opts: Omit<RecorderCreateOpts<{}>, "providerId">): Recorder<{}> {
    const emitter = mitt<RecorderEvents>();
    const recorder: Recorder<{}> = {
      id: opts.id ?? "bilibili-test-recorder",
      channelId: opts.channelId,
      providerId: this.id,
      recordHandle: undefined,
      disableAutoCheck: false,
      tempStopIntervalCheck: false,
      liveInfo: undefined,
      remarks: "",
      saveCover: false,
      quality: opts.quality ?? "highest",
      streamPriorities: opts.streamPriorities ?? [],
      sourcePriorities: opts.sourcePriorities ?? [],
      extra: {},
      availableStreams: [],
      availableSources: [],
      state: "idle",
      qualityMaxRetry: 3,
      qualityRetry: 3,
      toJSON: () => ({
        id: opts.id ?? "bilibili-test-recorder",
        providerId: this.id,
        channelId: opts.channelId,
        quality: opts.quality ?? "highest",
        streamPriorities: opts.streamPriorities ?? [],
        sourcePriorities: opts.sourcePriorities ?? [],
        extra: {},
      }),
      // @ts-ignore
      on: <K extends keyof RecorderEvents>(type: K, handler: Handler<RecorderEvents[K]>) => {
        emitter.on(type, handler);
      },
      checkLiveStatusAndRecord: vi.fn(),
      getChannelURL: () => `https://live.bilibili.com/${opts.channelId}`,
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
  let bilibiliProvider: BilibiliTestProvider;

  beforeEach(() => {
    testProvider = new TestProvider();
    bilibiliProvider = new BilibiliTestProvider();
    // @ts-ignore
    manager = createRecorderManager({
      providers: [testProvider, bilibiliProvider],
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
      expect(manager.providers).toHaveLength(2);
      expect(manager.providers[0]).toBe(testProvider);
      expect(manager.providers[1]).toBe(bilibiliProvider);
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

  describe("genSavePathFromRule", () => {
    it("应该正确生成保存路径", () => {
      const manager = createRecorderManager({
        providers: [testProvider],
        savePathRule: "{platform}/{owner}/{title}",
        autoRemoveSystemReservedChars: true,
      });

      const recorder = manager.addRecorder({
        id: "test-recorder",
        providerId: "test",
        channelId: "test-channel",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      const path = genSavePathFromRule(manager, recorder, {
        owner: "Test Owner",
        title: "Test Title",
      });

      expect(path).toBe("Test Provider/Test Owner/Test Title");
    });

    it("应该处理包含系统保留字符的路径", () => {
      const manager = createRecorderManager({
        providers: [testProvider],
        savePathRule: "{platform}/{owner}/{title}",
        autoRemoveSystemReservedChars: true,
      });

      const recorder = manager.addRecorder({
        id: "test-recorder",
        providerId: "test",
        channelId: "test-channel",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      const path = genSavePathFromRule(manager, recorder, {
        owner: "Test/Owner",
        title: "Test:Title",
      });

      expect(path).toBe("Test Provider/Test_Owner/Test_Title");
    });

    it("应该支持日期时间变量", () => {
      const manager = createRecorderManager({
        providers: [testProvider],
        savePathRule: "{platform}/{year}-{month}-{date} {hour}-{min}-{sec} {title}",
        autoRemoveSystemReservedChars: true,
      });

      const recorder = manager.addRecorder({
        id: "test-recorder",
        providerId: "test",
        channelId: "test-channel",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      const now = new Date();
      const path = genSavePathFromRule(manager, recorder, {
        owner: "Test Owner",
        title: "Test Title",
        startTime: now.getTime(),
      });

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const date = String(now.getDate()).padStart(2, "0");
      const hour = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      const sec = String(now.getSeconds()).padStart(2, "0");

      expect(path).toBe(`Test Provider/${year}-${month}-${date} ${hour}-${min}-${sec} Test Title`);
    });
  });

  describe("multiThreadCheck", () => {
    let manager: ReturnType<typeof createRecorderManager<{}, RecorderProvider<{}>>>;
    let testProvider: TestProvider;
    let bilibiliProvider: BilibiliTestProvider;

    beforeEach(() => {
      testProvider = new TestProvider();
      bilibiliProvider = new BilibiliTestProvider();
      manager = createRecorderManager({
        providers: [testProvider, bilibiliProvider],
        autoCheckInterval: 1000,
        biliBatchQuery: true,
      });
    });

    afterEach(() => {
      manager.stopCheckLoop();
    });

    it("应该使用批量查询接口检查 B 站直播状态", async () => {
      // 添加 B 站录制器
      const biliRecorder = manager.addRecorder({
        id: "bili-recorder",
        providerId: "Bilibili",
        channelId: "12345",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      // 模拟批量查询接口
      const mockGetBiliStatusInfoByRoomIds = vi.fn().mockResolvedValue({
        "12345": true,
      });

      // 替换原始函数
      vi.spyOn(api, "getBiliStatusInfoByRoomIds").mockImplementation(
        mockGetBiliStatusInfoByRoomIds,
      );

      // 启动检查循环
      manager.startCheckLoop();

      // 等待检查完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 验证批量查询接口被调用
      expect(mockGetBiliStatusInfoByRoomIds).toHaveBeenCalledWith([12345]);
      expect(biliRecorder.checkLiveStatusAndRecord).toHaveBeenCalled();
    });

    it("批量查询失败时应该回退到单个查询", async () => {
      // 添加 B 站录制器
      const biliRecorder = manager.addRecorder({
        id: "bili-recorder",
        providerId: "Bilibili",
        channelId: "12345",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      // 模拟批量查询接口失败
      const mockGetBiliStatusInfoByRoomIds = vi.fn().mockRejectedValue(new Error("API Error"));

      // 替换原始函数
      vi.spyOn(api, "getBiliStatusInfoByRoomIds").mockImplementation(
        mockGetBiliStatusInfoByRoomIds,
      );

      // 启动检查循环
      manager.startCheckLoop();

      // 等待检查完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 验证批量查询接口被调用
      expect(mockGetBiliStatusInfoByRoomIds).toHaveBeenCalledWith([12345]);
      // 验证录制器仍然被检查
      expect(biliRecorder.checkLiveStatusAndRecord).toHaveBeenCalled();
    });

    it("非 B 站录制器不应该使用批量查询", async () => {
      // 添加非 B 站录制器
      const nonBiliRecorder = manager.addRecorder({
        id: "non-bili-recorder",
        providerId: "test",
        channelId: "test-channel",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      // 模拟批量查询接口
      const mockGetBiliStatusInfoByRoomIds = vi.fn();

      // 替换原始函数
      vi.spyOn(api, "getBiliStatusInfoByRoomIds").mockImplementation(
        mockGetBiliStatusInfoByRoomIds,
      );

      // 启动检查循环
      manager.startCheckLoop();

      // 等待检查完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 验证批量查询接口没有被调用
      expect(mockGetBiliStatusInfoByRoomIds).not.toHaveBeenCalled();
      // 验证录制器被正常检查
      expect(nonBiliRecorder.checkLiveStatusAndRecord).toHaveBeenCalled();
    });

    it("禁用批量查询时应该使用单个查询", async () => {
      // 禁用批量查询
      manager.biliBatchQuery = false;

      // 添加 B 站录制器
      const biliRecorder = manager.addRecorder({
        id: "bili-recorder",
        providerId: "Bilibili",
        channelId: "12345",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      // 模拟批量查询接口
      const mockGetBiliStatusInfoByRoomIds = vi.fn();

      // 替换原始函数
      vi.spyOn(api, "getBiliStatusInfoByRoomIds").mockImplementation(
        mockGetBiliStatusInfoByRoomIds,
      );

      // 启动检查循环
      manager.startCheckLoop();

      // 等待检查完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 验证批量查询接口没有被调用
      expect(mockGetBiliStatusInfoByRoomIds).not.toHaveBeenCalled();
      // 验证录制器被正常检查
      expect(biliRecorder.checkLiveStatusAndRecord).toHaveBeenCalled();
    });
  });

  describe("LiveStart 事件触发逻辑", () => {
    let manager: ReturnType<typeof createRecorderManager<{}, RecorderProvider<{}>>>;
    let bilibiliProvider: BilibiliTestProvider;

    beforeEach(() => {
      bilibiliProvider = new BilibiliTestProvider();
      manager = createRecorderManager({
        providers: [bilibiliProvider],
        autoCheckInterval: 1000,
        biliBatchQuery: true,
      });
    });

    afterEach(() => {
      manager.stopCheckLoop();
    });

    it("相同 key 的 LiveStart 事件应该只触发一次", async () => {
      // 添加 B 站录制器
      const biliRecorder = manager.addRecorder({
        id: "bili-recorder",
        providerId: "Bilibili",
        channelId: "12345",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      // 监听 LiveStart 事件
      const liveStartHandler = vi.fn();
      manager.on("RecoderLiveStart", liveStartHandler);

      // 设置 liveInfo 以便触发 RecoderLiveStart 事件
      biliRecorder.liveInfo = { liveId: "live1" } as any;

      // 模拟录制器触发 videoFileCreated 事件，这会间接触发 RecoderLiveStart 事件
      biliRecorder.emit("videoFileCreated", { filename: "test1.mp4" });
      biliRecorder.emit("videoFileCreated", { filename: "test2.mp4" }); // 相同的 liveId

      // 验证 LiveStart 事件只被触发一次
      expect(liveStartHandler).toHaveBeenCalledTimes(1);
      expect(liveStartHandler).toHaveBeenCalledWith({ recorder: biliRecorder });
    });

    it("不同 key 的 LiveStart 事件应该触发多次", async () => {
      // 添加 B 站录制器
      const biliRecorder = manager.addRecorder({
        id: "bili-recorder",
        providerId: "Bilibili",
        channelId: "12345",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      // 监听 LiveStart 事件
      const liveStartHandler = vi.fn();
      manager.on("RecoderLiveStart", liveStartHandler);

      // 设置 liveInfo 并触发第一个事件
      biliRecorder.liveInfo = { liveId: "live1" } as any;
      biliRecorder.emit("videoFileCreated", { filename: "test1.mp4" });

      // 更改 liveId 并触发第二个事件
      biliRecorder.liveInfo = { liveId: "live2" } as any;
      biliRecorder.emit("videoFileCreated", { filename: "test2.mp4" });

      // 验证 LiveStart 事件被触发了两次
      expect(liveStartHandler).toHaveBeenCalledTimes(2);
      expect(liveStartHandler).toHaveBeenCalledWith({ recorder: biliRecorder });
    });

    it("不同录制器的 LiveStart 事件应该分别触发", async () => {
      // 添加两个 B 站录制器
      const biliRecorder1 = manager.addRecorder({
        id: "bili-recorder-1",
        providerId: "Bilibili",
        channelId: "12345",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      const biliRecorder2 = manager.addRecorder({
        id: "bili-recorder-2",
        providerId: "Bilibili",
        channelId: "67890",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      // 监听 LiveStart 事件
      const liveStartHandler = vi.fn();
      manager.on("RecoderLiveStart", liveStartHandler);

      // 分别设置 liveInfo 并触发事件
      biliRecorder1.liveInfo = { liveId: "live1" } as any;
      biliRecorder2.liveInfo = { liveId: "live2" } as any;

      // 模拟两个录制器分别触发 videoFileCreated 事件
      biliRecorder1.emit("videoFileCreated", { filename: "test1.mp4" });
      biliRecorder2.emit("videoFileCreated", { filename: "test2.mp4" });

      // 验证 LiveStart 事件被触发了两次
      expect(liveStartHandler).toHaveBeenCalledTimes(2);
      expect(liveStartHandler).toHaveBeenCalledWith({ recorder: biliRecorder1 });
      expect(liveStartHandler).toHaveBeenCalledWith({ recorder: biliRecorder2 });
    });

    it("停止直播后重新开播应该使用新的 key 触发 LiveStart 事件", async () => {
      // 添加 B 站录制器
      const biliRecorder = manager.addRecorder({
        id: "bili-recorder",
        providerId: "Bilibili",
        channelId: "12345",
        quality: "highest",
        streamPriorities: [],
        sourcePriorities: [],
      });

      // 监听 LiveStart 事件
      const liveStartHandler = vi.fn();
      manager.on("RecoderLiveStart", liveStartHandler);

      // 第一次直播
      biliRecorder.liveInfo = { liveId: "live1" } as any;
      biliRecorder.emit("videoFileCreated", { filename: "test1.mp4" });

      // 停止直播
      biliRecorder.emit("RecordStop", { recordHandle: {} as RecordHandle });

      // 清除LiveStart状态缓存对象，模拟真实情况下重新开播
      // @ts-ignore - 访问私有变量
      manager["liveStartObj"] = {};

      // 重新开播，使用新的liveId
      biliRecorder.liveInfo = { liveId: "live2" } as any;
      biliRecorder.emit("videoFileCreated", { filename: "test2.mp4" });

      // 验证 LiveStart 事件被触发了两次
      expect(liveStartHandler).toHaveBeenCalledTimes(2);
      expect(liveStartHandler).toHaveBeenCalledWith({ recorder: biliRecorder });
    });
  });
});
