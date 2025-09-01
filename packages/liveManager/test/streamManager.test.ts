import fs from "fs/promises";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { StreamManager, Segment } from "../src/recorder/streamManager";

vi.mock("../src/record_extra_data_controller", () => ({
  createRecordExtraDataController: () => ({
    data: {
      meta: {
        recordStartTimestamp: Date.now(),
      },
      messages: [],
    },
    addMessage: vi.fn(),
    setMeta: vi.fn(),
    flush: vi.fn(),
  }),
}));
// vi.mock("../src/utils");

describe("StreamManager", () => {
  let getSavePathMock: any;
  let streamManager: StreamManager;

  beforeEach(() => {
    getSavePathMock = vi.fn().mockReturnValue("mocked/path");
    streamManager = new StreamManager(getSavePathMock, true, false, "ffmpeg", "ts");
    vi.spyOn(streamManager, "emit");
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
    });
  });

  it("should handle video completed with segment", async () => {
    vi.spyOn(fs, "rename").mockResolvedValue();
    const stderrLine = "Opening 'mockedFilename.ts' for writing";

    await streamManager.handleVideoStarted(stderrLine);
    await streamManager.handleVideoCompleted();
    expect(streamManager.emit).toHaveBeenCalledWith("videoFileCompleted", {
      filename: "mocked/path.ts",
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

  beforeEach(() => {
    getSavePathMock = vi.fn().mockReturnValue("mocked/path");

    segmentManager = new Segment(getSavePathMock, false, "ts");
    vi.spyOn(segmentManager, "emit");
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
    });
  });
  it("should handle segment manual end", async () => {
    const stderrLine = "'mockedFilename.ts'";
    await segmentManager.onSegmentStart(stderrLine);
    await segmentManager.onSegmentStart("'mockedFilename.ts'");
    expect(segmentManager.emit).toHaveBeenCalledWith("videoFileCompleted", {
      filename: "mocked/path.ts",
    });
  });

  it("should handle segment start", async () => {
    const stderrLine = "'mockedFilename.ts'";
    await segmentManager.onSegmentStart(stderrLine);
    expect(segmentManager.emit).toHaveBeenCalledWith("videoFileCreated", {
      filename: "mocked/path.ts",
      cover: "",
      title: "",
    });
    expect(segmentManager.init).toBe(false);
  });
});
