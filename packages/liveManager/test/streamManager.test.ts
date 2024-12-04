import { describe, it, expect, vi, beforeEach } from "vitest";
import { StreamManager, SegmentManager } from "../src/streamManager";

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

  it("should initialize StreamManager with SegmentManager", () => {
    expect(streamManager).toBeInstanceOf(StreamManager);
    expect(streamManager.getSegmentData()).toBeDefined();
  });

  it("should handle video started with segment", async () => {
    const stderrLine = "'mockedFilename.ts'";

    await streamManager.handleVideoStarted(stderrLine);
    expect(recorderMock.emit).toHaveBeenCalledWith("videoFileCreated", {
      filename: "mocked/path.ts",
    });
  });

  it("should handle video completed with segment", async () => {
    await streamManager.handleVideoCompleted();
    expect(recorderMock.emit).toHaveBeenCalledWith("videoFileCompleted", {
      filename: "mocked/path.ts",
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
    console.log(streamManager);
    await streamManager.handleVideoStarted();
    expect(recorderMock.emit).toHaveBeenCalledWith("videoFileCreated", {
      filename: "recordSavePath.ts",
    });
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
  });
});

describe("SegmentManager", () => {
  let recorderMock: any;
  let getSavePathMock: any;
  let segmentManager: SegmentManager;

  beforeEach(() => {
    recorderMock = {
      emit: vi.fn(),
    };
    getSavePathMock = vi.fn().mockReturnValue("mocked/path");
    segmentManager = new SegmentManager(
      recorderMock,
      getSavePathMock,
      "owner",
      "title",
      "recordSavePath",
    );
  });

  it("should initialize SegmentManager", () => {
    expect(segmentManager).toBeInstanceOf(SegmentManager);
    expect(segmentManager.getSegmentData()).toBeDefined();
  });

  it("should handle segment end", async () => {
    await segmentManager.handleSegmentEnd();
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
  });
});
