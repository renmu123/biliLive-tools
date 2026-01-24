import { describe, it, expect, beforeEach, vi } from "vitest";
import FileLockManager from "../src/services/webhook/fileLockManager.js";

describe("FileLockManager", () => {
  let fileLockManager: FileLockManager;

  beforeEach(() => {
    fileLockManager = new FileLockManager();
  });

  describe("acquireLock", () => {
    it("应该成功获取新锁", () => {
      const result = fileLockManager.acquireLock("/test/file.txt", "upload");
      expect(result).toBe(true);
      expect(fileLockManager.isLocked("/test/file.txt", "upload")).toBe(true);
    });

    it("不应该获取已存在的同类型锁", () => {
      fileLockManager.acquireLock("/test/file.txt", "upload");
      const result = fileLockManager.acquireLock("/test/file.txt", "upload");
      expect(result).toBe(false);
    });

    it("应该允许获取不同类型的锁", () => {
      fileLockManager.acquireLock("/test/file.txt", "upload");
      const result = fileLockManager.acquireLock("/test/file.txt", "sync");
      expect(result).toBe(true);
      expect(fileLockManager.isLocked("/test/file.txt", "upload")).toBe(true);
      expect(fileLockManager.isLocked("/test/file.txt", "sync")).toBe(true);
    });
  });

  describe("releaseLock", () => {
    it("应该成功释放锁", () => {
      fileLockManager.acquireLock("/test/file.txt", "upload");
      const result = fileLockManager.releaseLock("/test/file.txt", "upload");
      expect(result).toBe(true);
      expect(fileLockManager.isLocked("/test/file.txt", "upload")).toBe(false);
    });

    it("释放不存在的锁应该返回false", () => {
      const result = fileLockManager.releaseLock("/test/file.txt", "upload");
      expect(result).toBe(false);
    });

    it("应该只释放指定类型的锁", () => {
      fileLockManager.acquireLock("/test/file.txt", "upload");
      fileLockManager.acquireLock("/test/file.txt", "sync");
      fileLockManager.releaseLock("/test/file.txt", "upload");
      expect(fileLockManager.isLocked("/test/file.txt", "upload")).toBe(false);
      expect(fileLockManager.isLocked("/test/file.txt", "sync")).toBe(true);
    });
  });

  describe("isLocked", () => {
    it("应该正确检查特定类型的锁", () => {
      fileLockManager.acquireLock("/test/file.txt", "upload");
      expect(fileLockManager.isLocked("/test/file.txt", "upload")).toBe(true);
      expect(fileLockManager.isLocked("/test/file.txt", "sync")).toBe(false);
    });

    it("应该检查任何类型的锁", () => {
      fileLockManager.acquireLock("/test/file.txt", "upload");
      expect(fileLockManager.isLocked("/test/file.txt")).toBe(true);
    });

    it("应该自动清理过期的锁", () => {
      const now = Date.now();
      vi.spyOn(Date, "now").mockImplementation(() => now);
      fileLockManager.acquireLock("/test/file.txt", "upload");

      // 模拟时间过去超过超时时间
      vi.spyOn(Date, "now").mockImplementation(() => now + 49 * 60 * 60 * 1000);
      expect(fileLockManager.isLocked("/test/file.txt", "upload")).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("应该清理所有过期的锁", () => {
      const now = Date.now();
      vi.spyOn(Date, "now").mockImplementation(() => now);

      fileLockManager.acquireLock("/test/file1.txt", "upload");
      fileLockManager.acquireLock("/test/file2.txt", "sync");

      // 模拟时间过去超过超时时间
      vi.spyOn(Date, "now").mockImplementation(() => now + 49 * 60 * 60 * 1000);

      fileLockManager.cleanup();

      expect(fileLockManager.isLocked("/test/file1.txt")).toBe(false);
      expect(fileLockManager.isLocked("/test/file2.txt")).toBe(false);
    });
  });
});
