import fs from "fs-extra";
import { describe, it, expect, vi, afterEach } from "vitest";
import { AliyunPan } from "../../src/sync/aliyunpan";

describe("AliyunPan", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    AliyunPan.clearCaches();
  });

  describe("parseDriveId", () => {
    it("应该正确解析资源库的 driveId", () => {
      const aliyunPan = new AliyunPan();
      const output = `
        # 序号 网盘ID 网盘名称
        1 1234567890123456 备份盘
        2 2234567890123456 资源库
        输入要切换的网盘 # 值 >
      `;

      expect(aliyunPan["parseDriveId"](output, "resource")).toBe("2234567890123456");
    });

    it("应该兼容文件网盘作为备份盘名称并解析 driveId", () => {
      const aliyunPan = new AliyunPan();
      const output = `
        # 序号 网盘名称 网盘ID
        1 文件网盘 1234567890123456
        2 资源库 2234567890123456
        输入要切换的网盘 # 值 >
      `;

      expect(aliyunPan["parseDriveId"](output, "backup")).toBe("1234567890123456");
    });

    it("应该忽略没有 driveId 的旧格式输出", () => {
      const aliyunPan = new AliyunPan();
      const output = `
        # 网盘名称
        1 备份盘
        2 资源库
        输入要切换的网盘 # 值 >
      `;

      expect(aliyunPan["parseDriveId"](output, "backup")).toBeNull();
    });
  });

  describe("parseProgress", () => {
    it("应该正确解析MB单位的进度信息", () => {
      const aliyunPan = new AliyunPan();
      const mockEmit = vi.fn();
      aliyunPan.emit = mockEmit;

      const progressOutput = "14.31MB/210.56MB(6.80%) 1.07MB/s";
      aliyunPan["parseProgress"](progressOutput);

      expect(mockEmit).toHaveBeenCalledWith("progress", {
        uploaded: "14.31MB",
        total: "210.56MB",
        percentage: 6.8,
        speed: "1.07MB/s",
      });
    });

    it("应该正确解析GB单位的进度信息", () => {
      const aliyunPan = new AliyunPan();
      const mockEmit = vi.fn();
      aliyunPan.emit = mockEmit;

      const progressOutput = "1.5GB/2.0GB(75.00%) 50.0MB/s";
      aliyunPan["parseProgress"](progressOutput);

      expect(mockEmit).toHaveBeenCalledWith("progress", {
        uploaded: "1.5GB",
        total: "2.0GB",
        percentage: 75.0,
        speed: "50.0MB/s",
      });
    });

    it("应该正确解析KB单位的进度信息", () => {
      const aliyunPan = new AliyunPan();
      const mockEmit = vi.fn();
      aliyunPan.emit = mockEmit;

      const progressOutput = "500KB/1000KB(50.00%) 100KB/s";
      aliyunPan["parseProgress"](progressOutput);

      expect(mockEmit).toHaveBeenCalledWith("progress", {
        uploaded: "500KB",
        total: "1000KB",
        percentage: 50.0,
        speed: "100KB/s",
      });
    });

    it("应该忽略不匹配的进度信息", () => {
      const aliyunPan = new AliyunPan();
      const mockEmit = vi.fn();
      aliyunPan.emit = mockEmit;

      const invalidOutput = "Some random text";
      aliyunPan["parseProgress"](invalidOutput);

      expect(mockEmit).not.toHaveBeenCalled();
    });
  });

  describe("uploadFile", () => {
    it("应该为 upload 命令附带 driveId", async () => {
      const aliyunPan = new AliyunPan({
        remotePath: "/录播",
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        } as never,
      });
      // @ts-expect-error
      vi.spyOn(fs, "pathExists").mockResolvedValue(true);

      const resolveDriveId = vi
        .spyOn(aliyunPan as never, "resolveDriveId")
        .mockResolvedValue("2234567890123456");
      const ensureRemoteDir = vi
        .spyOn(aliyunPan as never, "ensureRemoteDir")
        .mockResolvedValue(undefined);
      const executeCommand = vi.spyOn(aliyunPan as never, "executeCommand").mockResolvedValue("");

      await aliyunPan.uploadFile("/tmp/test.mp4", "直播/主播", {
        retry: 2,
        policy: "skip",
      });

      expect(resolveDriveId).toHaveBeenCalledTimes(1);
      expect(ensureRemoteDir).toHaveBeenCalledWith("/录播/直播/主播", "2234567890123456");
      expect(executeCommand).toHaveBeenCalledWith([
        "upload",
        "/tmp/test.mp4",
        "/录播/直播/主播",
        "--norapid",
        "--driveId",
        "2234567890123456",
        "--skip",
        "--retry",
        "2",
      ]);
    });
  });
});
