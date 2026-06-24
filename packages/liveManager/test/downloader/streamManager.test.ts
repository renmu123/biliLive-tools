import fs from "fs/promises";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StreamManager, Segment } from "../../src/downloader/streamManager";

vi.mock("../../src/xml_stream_controller", () => ({
  createRecordExtraDataController: () => ({
    data: {
      meta: {
        recordStartTimestamp: Date.now(),
      },
      pendingMessages: [],
    },
    addMessage: vi.fn(),
    setMeta: vi.fn(),
    flush: vi.fn(),
    getStats: vi.fn().mockReturnValue({
      danmaNum: 3,
      uniqMember: 2,
      scNum: 1,
      guardNum: 0,
    }),
  }),
}));
// vi.mock("../src/utils");

describe("StreamManager", () => {
  let getSavePathMock: any;
  let streamManager: StreamManager;
  let dateNowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getSavePathMock = vi.fn().mockReturnValue("mocked/path");
    streamManager = new StreamManager(getSavePathMock, true, false, "ffmpeg", "ts");
    vi.spyOn(streamManager, "emit");
    dateNowSpy = vi.spyOn(Date, "now");
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it("should initialize StreamManager with Segment", () => {
    expect(streamManager).toBeInstanceOf(StreamManager);
    // @ts-ignore
    expect(streamManager.segment).toBeDefined();
  });

  it("should handle video started with segment", async () => {
    const stderrLine = "Opening 'mockedFilename.ts' for writing";

    await streamManager.handleVideoStarted(stderrLine);
    expect(streamManager.emit).toHaveBeenCalledWith("videoFileCreated", {
      filename: "mocked/path.ts",
      cover: "",
      title: "",
      rawFilename: "mockedFilename.ts",
    });
  });

  it("should keep the initial timestamp for the first segment", async () => {
    dateNowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(2000);
    getSavePathMock = vi.fn(({ startTime, extraMs }) =>
      extraMs ? `mocked/path-${startTime}-extra` : `mocked/path-${startTime}`,
    );
    streamManager = new StreamManager(getSavePathMock, true, false, "ffmpeg", "ts");
    vi.spyOn(streamManager, "emit");

    await streamManager.handleVideoStarted("Opening 'mockedFilename.ts' for writing");

    expect(getSavePathMock).toHaveBeenNthCalledWith(1, { startTime: 1000 });
    expect(getSavePathMock).toHaveBeenNthCalledWith(2, {
      startTime: 1000,
      title: undefined,
    });
    expect(streamManager.emit).toHaveBeenCalledWith("videoFileCreated", {
      filename: "mocked/path-1000.ts",
      cover: "",
      title: "",
      rawFilename: "mockedFilename.ts",
    });
  });

  it("should handle video completed with segment", async () => {
    vi.spyOn(fs, "rename").mockResolvedValue();
    const stderrLine = "Opening 'mockedFilename.ts' for writing";

    await streamManager.handleVideoStarted(stderrLine);
    await streamManager.handleVideoCompleted();
    expect(streamManager.emit).toHaveBeenCalledWith("videoFileCompleted", {
      filename: "mocked/path.ts",
      stats: {
        danmaNum: 3,
        uniqMember: 2,
        scNum: 1,
        guardNum: 0,
      },
    });
  });

  it("should handle video started without segment", async () => {
    streamManager = new StreamManager(getSavePathMock, false, false, "ffmpeg", "ts");
    vi.spyOn(streamManager, "emit");

    await streamManager.handleVideoStarted("frame=200  fps=100");
    expect(streamManager.emit).toHaveBeenCalledWith("videoFileCreated", {
      filename: "mocked/path.ts",
    });
  });

  it("should handle video completed without segment", async () => {
    streamManager = new StreamManager(getSavePathMock, false, false, "ffmpeg", "ts");
    vi.spyOn(streamManager, "emit");

    await streamManager.handleVideoCompleted();
    expect(streamManager.emit).not.toHaveBeenCalledWith("videoFileCompleted", {
      filename: "mocked/path.ts",
    });
  });
});

describe("Segment", () => {
  let segmentManager: Segment;
  let getSavePathMock: any;
  let dateNowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getSavePathMock = vi.fn().mockReturnValue("mocked/path");

    segmentManager = new Segment(getSavePathMock, false, "ts");
    vi.spyOn(segmentManager, "emit");
    dateNowSpy = vi.spyOn(Date, "now");
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it("should initialize Segment", () => {
    expect(segmentManager).toBeInstanceOf(Segment);
    // expect(segmentManager.getSegmentData()).toBeDefined();
  });

  it("should handle segment end", async () => {
    const stderrLine = "'mockedFilename.ts'";
    await segmentManager.onSegmentStart(stderrLine);
    await segmentManager.handleSegmentEnd();
    expect(segmentManager.emit).toHaveBeenCalledWith("videoFileCompleted", {
      filename: "mocked/path.ts",
      stats: {
        danmaNum: 3,
        uniqMember: 2,
        scNum: 1,
        guardNum: 0,
      },
    });
  });
  it("should handle segment manual end", async () => {
    const stderrLine = "'mockedFilename.ts'";
    await segmentManager.onSegmentStart(stderrLine);
    await segmentManager.onSegmentStart("'mockedFilename.ts'");
    expect(segmentManager.emit).toHaveBeenCalledWith("videoFileCompleted", {
      filename: "mocked/path.ts",
      stats: {
        danmaNum: 3,
        uniqMember: 2,
        scNum: 1,
        guardNum: 0,
      },
    });
  });

  it("should handle segment start", async () => {
    const stderrLine = "'mockedFilename.ts'";
    await segmentManager.onSegmentStart(stderrLine);
    expect(segmentManager.emit).toHaveBeenCalledWith("videoFileCreated", {
      filename: "mocked/path.ts",
      cover: "",
      title: "",
      rawFilename: "mockedFilename.ts",
    });
    expect(segmentManager.init).toBe(false);
  });

  it("should use provided firstStartTime for the first segment only", async () => {
    dateNowSpy.mockReturnValueOnce(3000).mockReturnValueOnce(4000);
    getSavePathMock = vi.fn(({ startTime }) => `mocked/path-${startTime}`);
    segmentManager = new Segment(getSavePathMock, false, "ts", { firstStartTime: 1000 });
    vi.spyOn(segmentManager, "emit");

    await segmentManager.onSegmentStart("'first.ts'");
    await segmentManager.onSegmentStart("'second.ts'");

    expect(getSavePathMock).toHaveBeenNthCalledWith(1, {
      startTime: 1000,
      title: undefined,
    });
    expect(getSavePathMock).toHaveBeenNthCalledWith(2, {
      startTime: 4000,
      title: undefined,
    });
  });
});
