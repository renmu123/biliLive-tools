import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FFmpegDownloader } from "../src/downloader/FFmpegDownloader.js";
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

describe("FFmpegDownloader", () => {
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
        const recorder = new FFmpegDownloader(
          {
            ...baseOpts,
            url: "https://example.com/stream.m3u8",
            formatName: "ts",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        expect(recorder.isHls).toBe(true);
      });

      it("should use explicit formatName over URL detection", () => {
        const recorder = new FFmpegDownloader(
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
        const recorder = new FFmpegDownloader(
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

    describe("comprehensive parameter combinations", () => {
      const testCases = [
        // Without segment (hasSegment = false)
        {
          description: "no segment, flv format, auto videoFormat",
          opts: { segment: 0, formatName: "flv" as const, videoFormat: "auto" as const },
          expected: { formatName: "flv", videoFormat: "m4s", isHls: false, hasSegment: false },
        },
        {
          description: "no segment, ts format, auto videoFormat",
          opts: { segment: 0, formatName: "ts" as const, videoFormat: "auto" as const },
          expected: { formatName: "ts", videoFormat: "ts", isHls: true, hasSegment: false },
        },
        {
          description: "no segment, fmp4 format, auto videoFormat",
          opts: { segment: 0, formatName: "fmp4" as const, videoFormat: "auto" as const },
          expected: { formatName: "fmp4", videoFormat: "m4s", isHls: true, hasSegment: false },
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
          const recorder = new FFmpegDownloader(
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
  });

  describe("StreamManager initialization", () => {
    it("should pass correct videoFormat to StreamManager", () => {
      const getSavePath = vi.fn().mockReturnValue("/test/path/video");

      new FFmpegDownloader(
        {
          url: "https://example.com/stream.flv",
          getSavePath,
          segment: 10,
          outputOptions: ["-c:v", "copy"],
          videoFormat: "mkv",
          formatName: "flv",
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

      new FFmpegDownloader(
        {
          url: "https://example.com/stream.flv",
          getSavePath,
          segment: 0,
          outputOptions: ["-c:v", "copy"],
          disableDanma: true,
          formatName: "flv",
        },
        mockOnEnd,
        mockOnUpdateLiveInfo,
      );

      expect(StreamManager).toHaveBeenCalledWith(
        getSavePath,
        false, // hasSegment
        true, // disableDanma
        "ffmpeg",
        "m4s", // videoFormat (auto-detected)
        { onUpdateLiveInfo: mockOnUpdateLiveInfo },
      );
    });
  });

  describe("stop method behavior based on videoFormat", () => {
    it("should use SIGINT for ts files", async () => {
      mockStreamManager.videoFilePath = "/test/path/video.ts";

      const recorder = new FFmpegDownloader(
        {
          url: "https://example.com/stream.flv",
          getSavePath: vi.fn().mockReturnValue("/test/path/video"),
          segment: 0,
          outputOptions: ["-c:v", "copy"],
          videoFormat: "ts",
          formatName: "ts",
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

      const recorder = new FFmpegDownloader(
        {
          url: "https://example.com/stream.flv",
          getSavePath: vi.fn().mockReturnValue("/test/path/video"),
          segment: 0,
          outputOptions: ["-c:v", "copy"],
          videoFormat: "mp4",
          formatName: "ts",
        },
        mockOnEnd,
        mockOnUpdateLiveInfo,
      );

      await recorder.stop();

      expect(mockFFMPEGBuilder.kill).not.toHaveBeenCalled();
      expect(mockFFMPEGBuilder.ffmpegProc.stdin.write).toHaveBeenCalledWith("q");
    });

    describe("buildOutputOptions method", () => {
      it("should include custom ffmpegOutputOptions", () => {
        const customOptions = ["-preset", "ultrafast", "-crf", "23"];
        const recorder = new FFmpegDownloader(
          {
            url: "https://example.com/stream.flv",
            getSavePath: vi.fn().mockReturnValue("/test/path/video"),
            segment: 0,
            outputOptions: customOptions,
            formatName: "flv",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        const options = recorder.buildOutputOptions();

        expect(options).toEqual(expect.arrayContaining(["-preset", "ultrafast", "-crf", "23"]));
      });

      it("should include base output options for all recordings", () => {
        const recorder = new FFmpegDownloader(
          {
            url: "https://example.com/stream.flv",
            getSavePath: vi.fn().mockReturnValue("/test/path/video"),
            segment: 0,
            outputOptions: [],
            formatName: "flv",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        const options = recorder.buildOutputOptions();

        expect(options).toEqual(
          expect.arrayContaining([
            "-c",
            "copy",
            "-movflags",
            "+frag_keyframe+empty_moov+separate_moof",
            "-fflags",
            "+genpts+igndts",
            "-min_frag_duration",
            "10000000",
          ]),
        );
      });

      it("should add segment options when hasSegment is true", () => {
        const recorder = new FFmpegDownloader(
          {
            url: "https://example.com/stream.flv",
            getSavePath: vi.fn().mockReturnValue("/test/path/video"),
            segment: 30, // 30 minutes
            outputOptions: [],
            formatName: "flv",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        const options = recorder.buildOutputOptions();

        expect(options).toEqual(
          expect.arrayContaining([
            "-f",
            "segment",
            "-segment_time",
            "1800", // 30 * 60 seconds
            "-reset_timestamps",
            "1",
          ]),
        );
      });

      it("should not add segment options when hasSegment is false", () => {
        const recorder = new FFmpegDownloader(
          {
            url: "https://example.com/stream.flv",
            getSavePath: vi.fn().mockReturnValue("/test/path/video"),
            segment: 0,
            outputOptions: [],
            formatName: "flv",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        const options = recorder.buildOutputOptions();
        console.log("Output Options:", options);
        expect(options).not.toContain("segment");
        expect(options).not.toContain("-segment_time");
        expect(options).not.toContain("-reset_timestamps");
      });

      it("should add mp4 format option when videoFormat is m4s", () => {
        const recorder = new FFmpegDownloader(
          {
            url: "https://example.com/stream.flv",
            getSavePath: vi.fn().mockReturnValue("/test/path/video"),
            segment: 0,
            outputOptions: [],
            videoFormat: "m4s",
            formatName: "flv",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        const options = recorder.buildOutputOptions();

        expect(options).toEqual(expect.arrayContaining(["-f", "mp4"]));
      });

      it("should not add mp4 format option when videoFormat is not m4s", () => {
        const recorder = new FFmpegDownloader(
          {
            url: "https://example.com/stream.flv",
            getSavePath: vi.fn().mockReturnValue("/test/path/video"),
            segment: 0,
            outputOptions: [],
            videoFormat: "ts",
            formatName: "flv",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        const options = recorder.buildOutputOptions();
        const mp4FormatIndex = options.findIndex(
          (opt, i) => opt === "-f" && options[i + 1] === "mp4",
        );

        expect(mp4FormatIndex).toBe(-1);
      });

      it("should combine all options in correct order", () => {
        const customOptions = ["-preset", "fast"];
        const recorder = new FFmpegDownloader(
          {
            url: "https://example.com/stream.flv",
            getSavePath: vi.fn().mockReturnValue("/test/path/video"),
            segment: 10,
            outputOptions: customOptions,
            videoFormat: "m4s",
            formatName: "flv",
          },
          mockOnEnd,
          mockOnUpdateLiveInfo,
        );

        const options = recorder.buildOutputOptions();

        // Custom options should come first
        expect(options[0]).toBe("-preset");
        expect(options[1]).toBe("fast");

        // Base options should follow
        expect(options).toContain("-c");
        expect(options).toContain("copy");

        // Segment options should be included
        expect(options).toContain("-segment_time");
        expect(options).toContain("600"); // 10 * 60

        // Format option should be included
        expect(options).toContain("-segment_format");
        expect(options).toContain("mp4");
      });
    });
  });
});
