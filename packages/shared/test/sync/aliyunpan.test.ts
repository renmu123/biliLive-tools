import { describe, it, expect, vi } from "vitest";
import { AliyunPan } from "../../src/sync/aliyunpan";

describe("AliyunPan", () => {
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
});
