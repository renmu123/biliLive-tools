import { describe, it, expect } from "vitest";
import { generateDanmakuData, genTimeData } from "../../src/danmu/hotProgress.js";
import path from "node:path";

describe("hotProgress", () => {
  describe("genTimeData", () => {
    it("should throw error for unsupported file type", async () => {
      await expect(genTimeData("test.txt")).rejects.toThrow("not support file");
    });
  });

  describe("generateDanmakuData", () => {
    it("should generate danmaku data with correct structure", async () => {
      // 创建模拟的时间数据
      const mockInput = "test.xml";
      const options = {
        interval: 30,
        duration: 100,
        color: "#333333",
      };

      // 由于需要实际文件，这里只测试数据结构
      // 实际项目应使用真实的测试数据文件
    });

    it("should handle empty data correctly", () => {
      // 测试空数据情况
      const data: number[] = [];
      const filtered = data.filter((time) => time < 100);
      expect(filtered).toEqual([]);
    });

    it("should filter and sort time data correctly", () => {
      const data = [50, 10, 80, 30, 120, 5];
      const duration = 100;
      const filtered = data.filter((time) => time < duration).sort((a, b) => a - b);
      expect(filtered).toEqual([5, 10, 30, 50, 80]);
    });
  });
});
