import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mesioDownloader } from "../../src/downloader/mesioDownloader.js";
import { StreamManager } from "../../src/downloader/streamManager.js";
import type { MesioRecorderOptions, Segment } from "../../src/downloader/IDownloader.js";

// Mock dependencies
vi.mock("../../src/downloader/index.js", () => ({
  getMesioPath: vi.fn(() => "mesio"),
}));

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => ({
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
    kill: vi.fn(),
  })),
}));

describe("mesioDownloader", () => {
  let mockOnEnd: ReturnType<typeof vi.fn>;
  let mockOnUpdateLiveInfo: ReturnType<typeof vi.fn>;
  let mockStreamManager: any;
  let defaultOptions: MesioRecorderOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnEnd = vi.fn();
    mockOnUpdateLiveInfo = vi.fn().mockResolvedValue({ title: "Test Title", cover: "test.jpg" });

    mockStreamManager = {
      videoFilePath: "/mock/path/video.flv",
      on: vi.fn(),
      handleVideoStarted: vi.fn(),
      handleVideoCompleted: vi.fn(),
      getExtraDataController: vi.fn(),
    };

    (StreamManager as any).mockImplementation(() => mockStreamManager);

    defaultOptions = {
      url: "https://example.com/stream.flv",
      getSavePath: vi.fn(() => "/mock/path"),
      segment: 30,
      debugLevel: "none",
      headers: { Authorization: "Bearer token" },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default values", () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);

      expect(downloader.type).toBe("mesio");
      expect(downloader.hasSegment).toBe(true);
      expect(downloader.debugLevel).toBe("none");
      expect(downloader.url).toBe(defaultOptions.url);
      expect(downloader.inputOptions).toEqual([]);
    });

    it("should set debugLevel from options", () => {
      const options = { ...defaultOptions, debugLevel: "verbose" as const };
      const downloader = new mesioDownloader(options, mockOnEnd, mockOnUpdateLiveInfo);

      expect(downloader.debugLevel).toBe("verbose");
    });

    it("should determine video format based on URL", () => {
      const m3u8Options = { ...defaultOptions, url: "https://example.com/stream.m3u8" };
      new mesioDownloader(m3u8Options, mockOnEnd, mockOnUpdateLiveInfo);

      expect(StreamManager).toHaveBeenCalledWith(
        expect.any(Function),
        true,
        false,
        "mesio",
        "ts",
        expect.objectContaining({ onUpdateLiveInfo: mockOnUpdateLiveInfo }),
      );
    });

    it("should determine video format based on formatName", () => {
      const fmp4Options = { ...defaultOptions, formatName: "fmp4" as const };
      new mesioDownloader(fmp4Options, mockOnEnd, mockOnUpdateLiveInfo);

      expect(StreamManager).toHaveBeenCalledWith(
        expect.any(Function),
        true,
        false,
        "mesio",
        "m4s",
        expect.objectContaining({ onUpdateLiveInfo: mockOnUpdateLiveInfo }),
      );
    });

    it("should setup event listeners for streamManager", () => {
      new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);

      expect(mockStreamManager.on).toHaveBeenCalledWith("videoFileCreated", expect.any(Function));
      expect(mockStreamManager.on).toHaveBeenCalledWith("videoFileCompleted", expect.any(Function));
      expect(mockStreamManager.on).toHaveBeenCalledWith("DebugLog", expect.any(Function));
    });
  });

  describe("createCommand", () => {
    it("should create command with basic input options", () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);
      const command = downloader.createCommand();

      const args = command._getArguments();
      expect(args).toContain("--fix");
      expect(args).toContain("--no-proxy");
      expect(args).toContain("-H");
      expect(args).toContain(
        "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36",
      );
    });

    it("should add verbose flag when debugLevel is verbose", () => {
      const options = { ...defaultOptions, debugLevel: "verbose" as const };
      const downloader = new mesioDownloader(options, mockOnEnd, mockOnUpdateLiveInfo);
      const command = downloader.createCommand();

      const args = command._getArguments();
      expect(args).toContain("-v");
    });

    it("should add custom headers", () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);
      const command = downloader.createCommand();

      const args = command._getArguments();
      expect(args).toContain("Authorization: Bearer token");
    });

    it("should add segment duration when segment is number", () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);
      const command = downloader.createCommand();

      const args = command._getArguments();
      expect(args).toContain("-d");
      expect(args).toContain("1800s"); // 30 * 60
    });

    it("should add segment mode when segment is string", () => {
      const options = { ...defaultOptions, segment: "auto" as Segment };
      const downloader = new mesioDownloader(options, mockOnEnd, mockOnUpdateLiveInfo);
      const command = downloader.createCommand();

      const args = command._getArguments();
      expect(args).toContain("-m");
      expect(args).toContain("auto");
    });
  });

  describe("run", () => {
    it("should call command.run()", () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);
      const runSpy = vi.spyOn(downloader["command"], "run");

      downloader.run();

      expect(runSpy).toHaveBeenCalled();
    });
  });

  describe("getArguments", () => {
    it("should return command arguments", () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);
      const getArgumentsSpy = vi.spyOn(downloader["command"], "_getArguments");

      downloader.getArguments();

      expect(getArgumentsSpy).toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    it("should kill command and handle video completion", async () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);
      const killSpy = vi.spyOn(downloader["command"], "kill");

      await downloader.stop();

      expect(killSpy).toHaveBeenCalledWith("SIGINT");
      expect(mockStreamManager.handleVideoCompleted).toHaveBeenCalled();
    });

    it("should emit DebugLog on error", async () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);
      const emitSpy = vi.spyOn(downloader, "emit");
      mockStreamManager.handleVideoCompleted.mockRejectedValue(new Error("Test error"));

      await downloader.stop();

      expect(emitSpy).toHaveBeenCalledWith("DebugLog", {
        type: "error",
        text: "Error: Test error",
      });
    });
  });

  describe("getExtraDataController", () => {
    it("should return streamManager extraDataController", () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);

      downloader.getExtraDataController();

      expect(mockStreamManager.getExtraDataController).toHaveBeenCalled();
    });
  });

  describe("videoFilePath getter", () => {
    it("should return streamManager videoFilePath", () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);

      const path = downloader.videoFilePath;

      expect(path).toBe("/mock/path/video.flv");
    });
  });

  describe("event forwarding", () => {
    it("should forward videoFileCreated event", () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);
      const emitSpy = vi.spyOn(downloader, "emit");

      const eventData = {
        filename: "test.flv",
        cover: "cover.jpg",
        rawFilename: "raw.flv",
        title: "Test",
      };
      const videoFileCreatedCallback = mockStreamManager.on.mock.calls.find(
        (call) => call[0] === "videoFileCreated",
      )[1];

      videoFileCreatedCallback(eventData);

      expect(emitSpy).toHaveBeenCalledWith("videoFileCreated", eventData);
    });

    it("should forward videoFileCompleted event", () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);
      const emitSpy = vi.spyOn(downloader, "emit");

      const eventData = { filename: "test.flv" };
      const videoFileCompletedCallback = mockStreamManager.on.mock.calls.find(
        (call) => call[0] === "videoFileCompleted",
      )[1];

      videoFileCompletedCallback(eventData);

      expect(emitSpy).toHaveBeenCalledWith("videoFileCompleted", eventData);
    });

    it("should forward DebugLog event", () => {
      const downloader = new mesioDownloader(defaultOptions, mockOnEnd, mockOnUpdateLiveInfo);
      const emitSpy = vi.spyOn(downloader, "emit");

      const eventData = { type: "info", text: "Test log" };
      const debugLogCallback = mockStreamManager.on.mock.calls.find(
        (call) => call[0] === "DebugLog",
      )[1];

      debugLogCallback(eventData);

      expect(emitSpy).toHaveBeenCalledWith("DebugLog", eventData);
    });
  });
});
