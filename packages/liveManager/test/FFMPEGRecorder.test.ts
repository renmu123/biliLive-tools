import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FFMPEGRecorder } from "../src/recorder/FFMPEGRecorder.js";
import { createFFMPEGBuilder, StreamManager, utils } from "../src/index.js";

// Mock dependencies
vi.mock("../src/index.js", () => ({
  createFFMPEGBuilder: vi.fn(),
  StreamManager: vi.fn(),
  utils: {
    createTimeoutChecker: vi.fn(),
  },
}));

vi.mock("../src/utils.js", () => ({
  createInvalidStreamChecker: vi.fn(),
  assert: vi.fn(),
}));

describe("FFMPEGRecorder", () => {
  let mockFFMPEGBuilder: any;
  let mockStreamManager: any;
  let mockTimeoutChecker: any;
  let mockOnEnd: any;
  let mockOnUpdateLiveInfo: any;

  beforeEach(() => {
    // Mock FFMPEG builder
    mockFFMPEGBuilder = {
      input: vi.fn().mockReturnThis(),
      inputOptions: vi.fn().mockReturnThis(),
      outputOptions: vi.fn().mockReturnThis(),
      output: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      run: vi.fn(),
      kill: vi.fn(),
      _getArguments: vi.fn().mockReturnValue([]),
      ffmpegProc: {
        stdin: {
          write: vi.fn(),
        },
      },
    };

    // Mock StreamManager
    mockStreamManager = {
      videoFilePath: "/test/path/video.mp4",
      on: vi.fn(),
      handleVideoStarted: vi.fn(),
      handleVideoCompleted: vi.fn(),
      getExtraDataController: vi.fn(),
    };

    // Mock timeout checker
    mockTimeoutChecker = {
      start: vi.fn(),
      stop: vi.fn(),
      update: vi.fn(),
    };

    // Mock callbacks
    mockOnEnd = vi.fn();
    mockOnUpdateLiveInfo = vi.fn().mockResolvedValue({ title: "Test Title" });

    // Setup mocks
    vi.mocked(createFFMPEGBuilder).mockReturnValue(mockFFMPEGBuilder);
    vi.mocked(StreamManager).mockReturnValue(mockStreamManager);
    vi.mocked(utils.createTimeoutChecker).mockReturnValue(mockTimeoutChecker);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("formatName and videoFormat parameter combinations", () => {
    const baseOpts = {
      url: "https://example.com/stream",
      getSavePath: vi.fn().mockReturnValue("/test/path/video"),
      segment: 0,
      outputOptions: ["-c:v", "copy"],
    };

    describe("formatName detection from URL", () => {
      it("should detect ts format for m3u8 URLs", () => {
        const recorder = new FFMPEGRecorder(
          {
            ...baseOpts,
            url: "https://example.com/stream.m3u8",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        expect(recorder.formatName).toBe("ts");
        expect(recorder.isHls).toBe(true);
      });

      it("should default to flv format for non-m3u8 URLs", () => {
        const recorder = new FFMPEGRecorder(
          {
            ...baseOpts,
            url: "https://example.com/stream.flv",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        expect(recorder.formatName).toBe("flv");
        expect(recorder.isHls).toBe(false);
      });

      it("should use explicit formatName over URL detection", () => {
        const recorder = new FFMPEGRecorder(
          {
            ...baseOpts,
            url: "https://example.com/stream.m3u8",
            formatName: "fmp4",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        expect(recorder.formatName).toBe("fmp4");
        expect(recorder.isHls).toBe(true);
      });
    });

    describe("isHls property based on formatName", () => {
      it.each([
        ["ts", true],
        ["fmp4", true],
        ["flv", false],
      ])("should set isHls to %s when formatName is %s", (formatName, expectedIsHls) => {
        const recorder = new FFMPEGRecorder(
          {
            ...baseOpts,
            formatName: formatName as "flv" | "ts" | "fmp4",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        expect(recorder.isHls).toBe(expectedIsHls);
      });
    });
    describe("videoFormat auto detection without segment", () => {
      it("should default to mp4 for non-ts formats when hasSegment is false", () => {
        const recorder = new FFMPEGRecorder(
          {
            ...baseOpts,
            segment: 0, // hasSegment = false
            formatName: "flv",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        expect(recorder.videoFormat).toBe("mp4");
      });

      it("should use ts format when formatName is ts and hasSegment is false", () => {
        const recorder = new FFMPEGRecorder(
          {
            ...baseOpts,
            segment: 0, // hasSegment = false
            formatName: "ts",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        expect(recorder.videoFormat).toBe("ts");
      });

      it("should use ts format when formatName is fmp4 and hasSegment is false", () => {
        const recorder = new FFMPEGRecorder(
          {
            ...baseOpts,
            segment: 0, // hasSegment = false
            formatName: "fmp4",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        expect(recorder.videoFormat).toBe("mp4");
      });
    });

    describe("videoFormat auto detection with segment", () => {
      it("should default to ts when hasSegment is true", () => {
        const recorder = new FFMPEGRecorder(
          {
            ...baseOpts,
            segment: 10, // hasSegment = true
            formatName: "flv",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        expect(recorder.videoFormat).toBe("ts");
      });

      it("should use ts when hasSegment is true regardless of formatName", () => {
        const formatNames: Array<"flv" | "ts" | "fmp4"> = ["flv", "ts", "fmp4"];

        formatNames.forEach((formatName) => {
          const recorder = new FFMPEGRecorder(
            {
              ...baseOpts,
              segment: 10, // hasSegment = true
              formatName,
            },
            mockOnEnd,
            mockOnUpdateLiveInfo,
          );

          expect(recorder.videoFormat).toBe("ts");
        });
      });
    });

    describe("explicit videoFormat parameter", () => {
      it.each([["ts"], ["mkv"], ["mp4"]])(
        "should use explicit videoFormat %s over auto detection",
        (videoFormat) => {
          const recorder = new FFMPEGRecorder(
            {
              ...baseOpts,
              segment: 0, // hasSegment = false
              formatName: "flv",
              videoFormat: videoFormat as "ts" | "mkv" | "mp4",
            },
            mockOnEnd,
            mockOnUpdateLiveInfo,
          );

          expect(recorder.videoFormat).toBe(videoFormat);
        },
      );

      it("should override auto detection when videoFormat is explicitly set with segment", () => {
        const recorder = new FFMPEGRecorder(
          {
            ...baseOpts,
            segment: 10, // hasSegment = true, would normally force ts
            formatName: "flv",
            videoFormat: "mp4",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        expect(recorder.videoFormat).toBe("mp4");
      });
    });
    describe("comprehensive parameter combinations", () => {
      const testCases = [
        // Without segment (hasSegment = false)
        {
          description: "no segment, flv format, auto videoFormat",
          opts: { segment: 0, formatName: "flv" as const, videoFormat: "auto" as const },
          expected: { formatName: "flv", videoFormat: "mp4", isHls: false, hasSegment: false },
        },
        {
          description: "no segment, ts format, auto videoFormat",
          opts: { segment: 0, formatName: "ts" as const, videoFormat: "auto" as const },
          expected: { formatName: "ts", videoFormat: "ts", isHls: true, hasSegment: false },
        },
        {
          description: "no segment, fmp4 format, auto videoFormat",
          opts: { segment: 0, formatName: "fmp4" as const, videoFormat: "auto" as const },
          expected: { formatName: "fmp4", videoFormat: "mp4", isHls: true, hasSegment: false },
        },
        {
          description: "no segment, flv format, explicit mp4 videoFormat",
          opts: { segment: 0, formatName: "flv" as const, videoFormat: "mp4" as const },
          expected: { formatName: "flv", videoFormat: "mp4", isHls: false, hasSegment: false },
        },
        {
          description: "no segment, ts format, explicit mkv videoFormat",
          opts: { segment: 0, formatName: "ts" as const, videoFormat: "mkv" as const },
          expected: { formatName: "ts", videoFormat: "mkv", isHls: true, hasSegment: false },
        },

        // With segment (hasSegment = true)
        {
          description: "with segment, flv format, auto videoFormat",
          opts: { segment: 10, formatName: "flv" as const, videoFormat: "auto" as const },
          expected: { formatName: "flv", videoFormat: "ts", isHls: false, hasSegment: true },
        },
        {
          description: "with segment, ts format, auto videoFormat",
          opts: { segment: 10, formatName: "ts" as const, videoFormat: "auto" as const },
          expected: { formatName: "ts", videoFormat: "ts", isHls: true, hasSegment: true },
        },
        {
          description: "with segment, fmp4 format, auto videoFormat",
          opts: { segment: 10, formatName: "fmp4" as const, videoFormat: "auto" as const },
          expected: { formatName: "fmp4", videoFormat: "ts", isHls: true, hasSegment: true },
        },
        {
          description: "with segment, flv format, explicit mp4 videoFormat",
          opts: { segment: 10, formatName: "flv" as const, videoFormat: "mp4" as const },
          expected: { formatName: "flv", videoFormat: "mp4", isHls: false, hasSegment: true },
        },
        {
          description: "with segment, ts format, explicit mkv videoFormat",
          opts: { segment: 10, formatName: "ts" as const, videoFormat: "mkv" as const },
          expected: { formatName: "ts", videoFormat: "mkv", isHls: true, hasSegment: true },
        },
      ];

      testCases.forEach(({ description, opts, expected }) => {
        it(`should handle ${description}`, () => {
          const recorder = new FFMPEGRecorder(
            {
              ...baseOpts,
              ...opts,
            },
            mockOnEnd,
            mockOnUpdateLiveInfo,
          );

          expect(recorder.formatName).toBe(expected.formatName);
          expect(recorder.videoFormat).toBe(expected.videoFormat);
          expect(recorder.isHls).toBe(expected.isHls);
          expect(recorder.hasSegment).toBe(expected.hasSegment);
        });
      });
    });

    describe("URL-based format detection with various combinations", () => {
      const urlTestCases = [
        {
          description: "m3u8 URL with auto videoFormat and no segment",
          url: "https://example.com/playlist.m3u8",
          opts: { segment: 0, videoFormat: "auto" as const },
          expected: { formatName: "ts", videoFormat: "ts", isHls: true },
        },
        {
          description: "m3u8 URL with auto videoFormat and segment",
          url: "https://example.com/playlist.m3u8",
          opts: { segment: 10, videoFormat: "auto" as const },
          expected: { formatName: "ts", videoFormat: "ts", isHls: true },
        },
        {
          description: "m3u8 URL with explicit mp4 videoFormat",
          url: "https://example.com/playlist.m3u8",
          opts: { segment: 0, videoFormat: "mp4" as const },
          expected: { formatName: "ts", videoFormat: "mp4", isHls: true },
        },
        {
          description: "flv URL with auto videoFormat and no segment",
          url: "https://example.com/stream.flv",
          opts: { segment: 0, videoFormat: "auto" as const },
          expected: { formatName: "flv", videoFormat: "mp4", isHls: false },
        },
        {
          description: "flv URL with auto videoFormat and segment",
          url: "https://example.com/stream.flv",
          opts: { segment: 10, videoFormat: "auto" as const },
          expected: { formatName: "flv", videoFormat: "ts", isHls: false },
        },
      ];

      urlTestCases.forEach(({ description, url, opts, expected }) => {
        it(`should handle ${description}`, () => {
          const recorder = new FFMPEGRecorder(
            {
              ...baseOpts,
              url,
              ...opts,
            },
            mockOnEnd,
            mockOnUpdateLiveInfo,
          );

          expect(recorder.formatName).toBe(expected.formatName);
          expect(recorder.videoFormat).toBe(expected.videoFormat);
          expect(recorder.isHls).toBe(expected.isHls);
        });
      });
    });
  });

  describe("StreamManager initialization", () => {
    it("should pass correct videoFormat to StreamManager", () => {
      const getSavePath = vi.fn().mockReturnValue("/test/path/video");

      new FFMPEGRecorder(
        {
          url: "https://example.com/stream.flv",
          getSavePath,
          segment: 10,
          outputOptions: ["-c:v", "copy"],
          videoFormat: "mkv",
        },
        mockOnEnd,
        mockOnUpdateLiveInfo,
      );

      expect(StreamManager).toHaveBeenCalledWith(
        getSavePath,
        true, // hasSegment
        false, // disableDanma
        "ffmpeg",
        "mkv", // videoFormat
        { onUpdateLiveInfo: mockOnUpdateLiveInfo },
      );
    });

    it("should pass disableDanma option to StreamManager", () => {
      const getSavePath = vi.fn().mockReturnValue("/test/path/video");

      new FFMPEGRecorder(
        {
          url: "https://example.com/stream.flv",
          getSavePath,
          segment: 0,
          outputOptions: ["-c:v", "copy"],
          disableDanma: true,
        },
        mockOnEnd,
        mockOnUpdateLiveInfo,
      );

      expect(StreamManager).toHaveBeenCalledWith(
        getSavePath,
        false, // hasSegment
        true, // disableDanma
        "ffmpeg",
        "mp4", // videoFormat (auto-detected)
        { onUpdateLiveInfo: mockOnUpdateLiveInfo },
      );
    });
  });

  describe("FFMPEG command creation", () => {
    it("should add segment options when hasSegment is true", () => {
      new FFMPEGRecorder(
        {
          url: "https://example.com/stream.flv",
          getSavePath: vi.fn().mockReturnValue("/test/path/video"),
          segment: 15, // 15 minutes
          outputOptions: ["-c:v", "copy"],
        },
        mockOnEnd,
        mockOnUpdateLiveInfo,
      );

      expect(mockFFMPEGBuilder.outputOptions).toHaveBeenCalledWith(
        "-f",
        "segment",
        "-segment_time",
        "900", // 15 * 60 seconds
        "-reset_timestamps",
        "1",
      );
    });

    it("should not add segment options when hasSegment is false", () => {
      new FFMPEGRecorder(
        {
          url: "https://example.com/stream.flv",
          getSavePath: vi.fn().mockReturnValue("/test/path/video"),
          segment: 0,
          outputOptions: ["-c:v", "copy"],
        },
        mockOnEnd,
        mockOnUpdateLiveInfo,
      );

      // Should not call outputOptions with segment-related parameters
      const segmentCalls = vi
        .mocked(mockFFMPEGBuilder.outputOptions)
        .mock.calls.filter((call: any[]) => call.includes("-f") && call.includes("segment"));
      expect(segmentCalls).toHaveLength(0);
    });
  });

  describe("stop method behavior based on videoFormat", () => {
    it("should use SIGINT for ts files", async () => {
      mockStreamManager.videoFilePath = "/test/path/video.ts";

      const recorder = new FFMPEGRecorder(
        {
          url: "https://example.com/stream.flv",
          getSavePath: vi.fn().mockReturnValue("/test/path/video"),
          segment: 0,
          outputOptions: ["-c:v", "copy"],
          videoFormat: "ts",
        },
        mockOnEnd,
        mockOnUpdateLiveInfo,
      );

      await recorder.stop();

      expect(mockFFMPEGBuilder.kill).toHaveBeenCalledWith("SIGINT");
      expect(mockFFMPEGBuilder.ffmpegProc.stdin.write).not.toHaveBeenCalled();
    });

    it("should write 'q' for non-ts files", async () => {
      mockStreamManager.videoFilePath = "/test/path/video.mp4";

      const recorder = new FFMPEGRecorder(
        {
          url: "https://example.com/stream.flv",
          getSavePath: vi.fn().mockReturnValue("/test/path/video"),
          segment: 0,
          outputOptions: ["-c:v", "copy"],
          videoFormat: "mp4",
        },
        mockOnEnd,
        mockOnUpdateLiveInfo,
      );

      await recorder.stop();

      expect(mockFFMPEGBuilder.kill).not.toHaveBeenCalled();
      expect(mockFFMPEGBuilder.ffmpegProc.stdin.write).toHaveBeenCalledWith("q");
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle undefined videoFormat option", () => {
      const recorder = new FFMPEGRecorder(
        {
          url: "https://example.com/stream.flv",
          getSavePath: vi.fn().mockReturnValue("/test/path/video"),
          segment: 0,
          outputOptions: ["-c:v", "copy"],
          // videoFormat is undefined
        },
        mockOnEnd,
        mockOnUpdateLiveInfo,
      );

      expect(recorder.videoFormat).toBe("mp4"); // auto-detected default
    });

    it("should handle undefined formatName option", () => {
      const recorder = new FFMPEGRecorder(
        {
          url: "https://example.com/stream.flv",
          getSavePath: vi.fn().mockReturnValue("/test/path/video"),
          segment: 0,
          outputOptions: ["-c:v", "copy"],
          // formatName is undefined
        },
        mockOnEnd,
        mockOnUpdateLiveInfo,
      );

      expect(recorder.formatName).toBe("flv"); // detected from URL
    });

    it("should handle complex URLs with parameters", () => {
      const recorder = new FFMPEGRecorder(
        {
          url: "https://example.com/stream.m3u8?token=abc123&quality=high",
          getSavePath: vi.fn().mockReturnValue("/test/path/video"),
          segment: 0,
          outputOptions: ["-c:v", "copy"],
        },
        mockOnEnd,
        mockOnUpdateLiveInfo,
      );

      expect(recorder.formatName).toBe("ts"); // should still detect m3u8
      expect(recorder.isHls).toBe(true);
    });
  });
});
