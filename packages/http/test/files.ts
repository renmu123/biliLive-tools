import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPathExists, mockStat, mockReaddir, mockTrashItem, mockGet, mockSetFile } = vi.hoisted(
  () => ({
    mockPathExists: vi.fn(),
    mockStat: vi.fn(),
    mockReaddir: vi.fn(),
    mockTrashItem: vi.fn(),
    mockGet: vi.fn(),
    mockSetFile: vi.fn(() => "download-file-id"),
  }),
);

vi.mock("@koa/router", () => {
  return {
    default: class Router {
      stack: any[] = [];
      prefix: string = "";
      constructor(options?: { prefix?: string }) {
        this.prefix = options?.prefix || "";
      }
      get(path: string, ...stack: any[]) {
        this.stack.push({ path: `${this.prefix}${path}`, methods: ["GET"], stack });
      }
      post(path: string, ...stack: any[]) {
        this.stack.push({ path: `${this.prefix}${path}`, methods: ["POST"], stack });
      }
      delete(path: string, ...stack: any[]) {
        this.stack.push({ path: `${this.prefix}${path}`, methods: ["DELETE"], stack });
      }
    },
  };
});

vi.mock("fs-extra", () => ({
  default: {
    pathExists: mockPathExists,
    stat: mockStat,
    readdir: mockReaddir,
  },
}));

vi.mock("@biliLive-tools/shared/utils/index.js", () => ({
  trashItem: mockTrashItem,
}));

vi.mock("../src/index.js", () => ({
  appConfig: {
    get: mockGet,
  },
  fileCache: {
    setFile: mockSetFile,
  },
}));

import router from "../src/routes/fileBrowser.js";

const getHandler = (routePath: string, method: "GET" | "POST" | "DELETE") => {
  const route = router.stack.find(
    (item) => item.path === routePath && item.methods.includes(method),
  );
  return route?.stack[0];
};

describe("file browser routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BILILIVE_TOOLS_DELETE_DIRS;
    mockGet.mockImplementation((key: string) => {
      if (key === "webhook") {
        return { recoderFolder: "C:/records" };
      }
      if (key === "recorder") {
        return { savePath: "C:/downloads" };
      }
      return undefined;
    });
  });

  it("列目录时只返回目录和视频弹幕文件，并为白名单文件标记可删除", async () => {
    process.env.BILILIVE_TOOLS_DELETE_DIRS = "C:/records/live";
    mockPathExists.mockResolvedValue(true);
    mockReaddir.mockResolvedValue(["live", "video.mp4", "danmu.ass", "note.txt"]);
    mockStat.mockImplementation(async (inputPath: string) => {
      if (inputPath === "C:\\records") {
        return { isDirectory: () => true, isFile: () => false, mtimeMs: 1 };
      }
      if (inputPath.endsWith("live")) {
        return { isDirectory: () => true, isFile: () => false, mtimeMs: 2 };
      }
      if (inputPath.endsWith("video.mp4")) {
        return { isDirectory: () => false, isFile: () => true, size: 100, mtimeMs: 3 };
      }
      if (inputPath.endsWith("danmu.ass")) {
        return { isDirectory: () => false, isFile: () => true, size: 50, mtimeMs: 4 };
      }
      return { isDirectory: () => false, isFile: () => true, size: 10, mtimeMs: 5 };
    });

    const ctx: any = {
      query: {},
      body: null,
      status: 200,
    };

    await getHandler("/file-browser/list", "GET")(ctx, async () => {});

    expect(ctx.status).toBe(200);
    expect(ctx.body.rootPath).toBe("C:\\records");
    expect(ctx.body.deleteEnabled).toBe(true);
    expect(ctx.body.list).toEqual([
      expect.objectContaining({ name: "live", type: "directory", canDelete: false }),
      expect.objectContaining({ name: "danmu.ass", fileKind: "danmaku", canDelete: false }),
      expect.objectContaining({ name: "video.mp4", fileKind: "video", canDelete: false }),
    ]);
  });

  it("越过录制目录时拒绝浏览", async () => {
    mockPathExists.mockResolvedValue(true);
    mockStat.mockResolvedValue({ isDirectory: () => true, isFile: () => false, mtimeMs: 1 });

    const ctx: any = {
      query: {
        path: "C:/outside",
      },
      body: null,
      status: 200,
    };

    await getHandler("/file-browser/list", "GET")(ctx, async () => {});

    expect(ctx.status).toBe(400);
    expect(ctx.body.message).toContain("录制目录范围");
  });

  it("删除白名单命中时允许删除视频文件", async () => {
    process.env.BILILIVE_TOOLS_DELETE_DIRS = "C:/records/live";
    mockPathExists.mockResolvedValue(true);
    mockStat.mockImplementation(async (inputPath: string) => {
      if (inputPath === "C:\\records") {
        return { isDirectory: () => true, isFile: () => false, mtimeMs: 1 };
      }
      if (inputPath === "C:\\records\\live") {
        return { isDirectory: () => true, isFile: () => false, mtimeMs: 2 };
      }
      return { isDirectory: () => false, isFile: () => true, size: 10, mtimeMs: 3 };
    });

    const ctx: any = {
      request: {
        body: {
          path: "C:/records/live/video.mp4",
        },
      },
      body: null,
      status: 200,
    };

    await getHandler("/file-browser/file", "DELETE")(ctx, async () => {});

    expect(mockTrashItem).toHaveBeenCalledWith("C:\\records\\live\\video.mp4");
    expect(ctx.body.message).toBe("删除成功");
  });

  it("下载时返回 file cache 生成的 id", async () => {
    mockPathExists.mockResolvedValue(true);
    mockStat.mockImplementation(async (inputPath: string) => {
      if (inputPath === "C:\\records") {
        return { isDirectory: () => true, isFile: () => false, mtimeMs: 1 };
      }
      if (inputPath === "C:\\records\\live") {
        return { isDirectory: () => true, isFile: () => false, mtimeMs: 2 };
      }
      return { isDirectory: () => false, isFile: () => true, size: 10, mtimeMs: 3 };
    });

    const ctx: any = {
      request: {
        body: {
          path: "C:/records/live/video.mp4",
        },
      },
      body: null,
      status: 200,
    };

    await getHandler("/file-browser/download", "POST")(ctx, async () => {});

    expect(mockSetFile).toHaveBeenCalledWith("C:\\records\\live\\video.mp4");
    expect(ctx.body.fileId).toBe("download-file-id");
    expect(ctx.body.fileKind).toBe("video");
  });
});
