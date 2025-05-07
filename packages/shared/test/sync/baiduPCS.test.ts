import { describe, it, expect, vi } from "vitest";
import { BaiduPCS } from "../../src/sync/baiduPCS";

describe("BaiduPCS", () => {
  describe("parseProgress", () => {
    it("应该正确解析带索引的进度信息", () => {
      const baiduPCS = new BaiduPCS();
      const mockEmit = vi.fn();
      baiduPCS.emit = mockEmit;

      const progressOutput = "[1] ↑ 305.06MB/1.01GB 2.15MB/s in 33s";
      baiduPCS["parseProgress"](progressOutput);

      expect(mockEmit).toHaveBeenCalledWith("progress", {
        index: 1,
        uploaded: "305.06MB",
        total: "1.01GB",
        speed: "2.15MB/s",
        elapsed: "33s",
        percentage: expect.any(Number),
      });
    });

    it("应该正确解析不带索引的进度信息", () => {
      const baiduPCS = new BaiduPCS();
      const mockEmit = vi.fn();
      baiduPCS.emit = mockEmit;

      const progressOutput = "↑ 500KB/1MB 100KB/s in 5s";
      baiduPCS["parseProgress"](progressOutput);

      expect(mockEmit).not.toHaveBeenCalled();
    });

    it("应该忽略不匹配的进度信息", () => {
      const baiduPCS = new BaiduPCS();
      const mockEmit = vi.fn();
      baiduPCS.emit = mockEmit;

      const invalidOutput = "Some random text";
      baiduPCS["parseProgress"](invalidOutput);

      expect(mockEmit).not.toHaveBeenCalled();
    });

    it("应该正确计算百分比", () => {
      const baiduPCS = new BaiduPCS();
      const mockEmit = vi.fn();
      baiduPCS.emit = mockEmit;

      const progressOutput = "[1] ↑ 512MB/1GB 2MB/s in 10s";
      baiduPCS["parseProgress"](progressOutput);

      expect(mockEmit).toHaveBeenCalledWith("progress", {
        index: 1,
        uploaded: "512MB",
        total: "1GB",
        speed: "2MB/s",
        elapsed: "10s",
        percentage: 50,
      });
    });
  });
});
