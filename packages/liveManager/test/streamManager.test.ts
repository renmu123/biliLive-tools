import { describe, it, expect, vi, beforeEach } from "vitest";
import { StreamManager, Segment } from "../src/streamManager";

vi.mock("fs-extra");
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
vi.mock("../src/utils");

describe("StreamManager", () => {
  let recorderMock: any;
  let getSavePathMock: any;
  let streamManager: StreamManager;

  beforeEach(() => {
    recorderMock = {
      emit: vi.fn(),
    };
    getSavePathMock = vi.fn().mockReturnValue("mocked/path");
    streamManager = new StreamManager(
      recorderMock,
      getSavePathMock,
      "owner",
      "title",
      "recordSavePath",
      true,
    );
  });

  it("should initialize StreamManager with Segment", () => {
    expect(streamManager).toBeInstanceOf(StreamManager);
    // @ts-ignore
    expect(streamManager.segmentManager).toBeDefined();
  });

  it("should handle video started with segment", async () => {
    const stderrLine = "'mockedFilename.ts'";

    await streamManager.handleVideoStarted(stderrLine);
    expect(recorderMock.emit).toHaveBeenCalledWith("videoFileCreated", {
      filename: "mocked/path.ts",
    });
  });

  it("should handle video completed with segment", async () => {
    const stderrLine = "'mockedFilename.ts'";

    await streamManager.handleVideoStarted(stderrLine);
    await streamManager.handleVideoCompleted();
    expect(recorderMock.emit).toHaveBeenCalledWith("videoFileCompleted", {
      filename: "mocked/path.ts",
    });
    expect(streamManager.getExtraDataController()?.setMeta).toHaveBeenCalledWith({
      recordStopTimestamp: expect.any(Number),
    });
  });

  it("should handle video started without segment", async () => {
    streamManager = new StreamManager(
      recorderMock,
      getSavePathMock,
      "owner",
      "title",
      "recordSavePath",
      false,
    );
    await streamManager.handleVideoStarted();
    expect(recorderMock.emit).toHaveBeenCalledWith("videoFileCreated", {
      filename: "recordSavePath.ts",
    });
    expect(streamManager.getExtraDataController()?.setMeta).toHaveBeenCalledWith({
      title: "title",
      user_name: "owner",
    });
    expect(streamManager.getExtraDataController()?.data.meta.recordStartTimestamp).toBeDefined();
  });

  it("should handle video completed without segment", async () => {
    streamManager = new StreamManager(
      recorderMock,
      getSavePathMock,
      "owner",
      "title",
      "recordSavePath",
      false,
    );
    await streamManager.handleVideoCompleted();
    expect(recorderMock.emit).toHaveBeenCalledWith("videoFileCompleted", {
      filename: "recordSavePath.ts",
    });
    expect(streamManager.getExtraDataController()?.setMeta).toHaveBeenCalledWith({
      recordStopTimestamp: expect.any(Number),
    });
  });
});

describe("Segment", () => {
  let recorderMock: any;
  let segmentManager: Segment;
  let getSavePathMock: any;

  beforeEach(() => {
    recorderMock = {
      emit: vi.fn(),
    };
    getSavePathMock = vi.fn().mockReturnValue("mocked/path");

    segmentManager = new Segment(recorderMock, getSavePathMock, "owner", "title");
  });

  it("should initialize Segment", () => {
    expect(segmentManager).toBeInstanceOf(Segment);
    // expect(segmentManager.getSegmentData()).toBeDefined();
  });

  it("should handle segment end", async () => {
    const stderrLine = "'mockedFilename.ts'";
    await segmentManager.onSegmentStart(stderrLine);
    await segmentManager.handleSegmentEnd();
    expect(recorderMock.emit).toHaveBeenCalledWith("videoFileCompleted", {
      filename: "mocked/path.ts",
    });
  });
  it("should handle segment manual end", async () => {
    const stderrLine = "'mockedFilename.ts'";
    await segmentManager.onSegmentStart(stderrLine);
    await segmentManager.onSegmentStart("'mockedFilename.ts'");
    expect(recorderMock.emit).toHaveBeenCalledWith("videoFileCompleted", {
      filename: "mocked/path.ts",
    });
  });

  it("should handle segment start", async () => {
    const stderrLine = "'mockedFilename.ts'";
    await segmentManager.onSegmentStart(stderrLine);
    expect(recorderMock.emit).toHaveBeenCalledWith("videoFileCreated", {
      filename: "mocked/path.ts",
    });
    expect(segmentManager.init).toBe(false);
  });
});
