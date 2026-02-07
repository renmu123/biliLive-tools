import { describe, it, expect, beforeEach, vi } from "vitest";
import FileRefManager from "../src/services/webhook/fileRefManager.js";
import * as shared from "@biliLive-tools/shared/utils/index.js";

// Mock trashItem
// vi.mock("@biliLive-tools/shared/utils/index.js", async (importOriginal) => {
//   const mod = await importOriginal<typeof import("@biliLive-tools/shared/utils/index.js")>();
//   return {
//     ...mod,
//     trashItem: vi.fn().mockResolvedValue(true),
//   };
// });

const trashItemSpy = vi.spyOn(shared, "trashItem").mockResolvedValue(); // 10MB

describe("FileRefManager", () => {
  let manager: FileRefManager;

  beforeEach(() => {
    manager = new FileRefManager();
    vi.clearAllMocks();
  });

  describe("addRef", () => {
    it("应该成功添加第一个引用", () => {
      manager.addRef("/path/to/file.mp4", false);
      expect(manager.getRefCount("/path/to/file.mp4")).toBe(1);
      expect(manager.shouldDelete("/path/to/file.mp4")).toBe(false);
    });

    it("应该增加已存在文件的引用计数", () => {
      manager.addRef("/path/to/file.mp4", false);
      manager.addRef("/path/to/file.mp4", false);
      expect(manager.getRefCount("/path/to/file.mp4")).toBe(2);
    });

    it("应该正确设置 shouldDelete 标志", () => {
      manager.addRef("/path/to/file.mp4", true);
      expect(manager.shouldDelete("/path/to/file.mp4")).toBe(true);
    });

    it("如果任意引用要求删除，shouldDelete 应该为 true", () => {
      manager.addRef("/path/to/file.mp4", false);
      manager.addRef("/path/to/file.mp4", true);
      expect(manager.shouldDelete("/path/to/file.mp4")).toBe(true);
    });

    it("应该处理多个不同的文件", () => {
      manager.addRef("/path/to/file1.mp4", false);
      manager.addRef("/path/to/file2.mp4", true);
      expect(manager.getRefCount("/path/to/file1.mp4")).toBe(1);
      expect(manager.getRefCount("/path/to/file2.mp4")).toBe(1);
      expect(manager.shouldDelete("/path/to/file1.mp4")).toBe(false);
      expect(manager.shouldDelete("/path/to/file2.mp4")).toBe(true);
    });
  });

  describe("releaseRef", () => {
    it("应该减少引用计数", async () => {
      manager.addRef("/path/to/file.mp4", false);
      manager.addRef("/path/to/file.mp4", false);
      await manager.releaseRef("/path/to/file.mp4");
      expect(manager.getRefCount("/path/to/file.mp4")).toBe(1);
    });

    it("当计数归零且 shouldDelete=false 时，不应该删除文件", async () => {
      manager.addRef("/path/to/file.mp4", false);
      await manager.releaseRef("/path/to/file.mp4");
      expect(manager.getRefCount("/path/to/file.mp4")).toBe(0);
      expect(trashItemSpy).not.toHaveBeenCalled();
    });

    it("当计数归零且 shouldDelete=true 时，应该删除文件", async () => {
      manager.addRef("/path/to/file.mp4", true);
      await manager.releaseRef("/path/to/file.mp4");
      expect(manager.getRefCount("/path/to/file.mp4")).toBe(0);
      expect(trashItemSpy).toHaveBeenCalledWith("/path/to/file.mp4");
    });

    it("应该处理多个引用的删除", async () => {
      manager.addRef("/path/to/file.mp4", true);
      manager.addRef("/path/to/file.mp4", false);
      manager.addRef("/path/to/file.mp4", false);

      await manager.releaseRef("/path/to/file.mp4");
      expect(trashItemSpy).not.toHaveBeenCalled();

      await manager.releaseRef("/path/to/file.mp4");
      expect(trashItemSpy).not.toHaveBeenCalled();

      await manager.releaseRef("/path/to/file.mp4");
      expect(trashItemSpy).toHaveBeenCalledWith("/path/to/file.mp4");
    });

    it("释放不存在的文件引用应该不报错", async () => {
      await expect(manager.releaseRef("/nonexistent.mp4")).resolves.not.toThrow();
    });

    it("删除文件失败时应该捕获错误", async () => {
      vi.mocked(trashItemSpy).mockRejectedValueOnce(new Error("Delete failed"));
      manager.addRef("/path/to/file.mp4", true);
      await expect(manager.releaseRef("/path/to/file.mp4")).resolves.not.toThrow();
    });
  });

  describe("hasRef", () => {
    it("存在引用时应该返回 true", () => {
      manager.addRef("/path/to/file.mp4", false);
      expect(manager.hasRef("/path/to/file.mp4")).toBe(true);
    });

    it("不存在引用时应该返回 false", () => {
      expect(manager.hasRef("/path/to/file.mp4")).toBe(false);
    });

    it("引用计数归零后应该返回 false", async () => {
      manager.addRef("/path/to/file.mp4", false);
      await manager.releaseRef("/path/to/file.mp4");
      expect(manager.hasRef("/path/to/file.mp4")).toBe(false);
    });
  });

  describe("getAllRefs", () => {
    it("应该返回所有引用的详细信息", () => {
      manager.addRef("/path/to/file1.mp4", true);
      manager.addRef("/path/to/file2.mp4", false);
      manager.addRef("/path/to/file2.mp4", false);

      const refs = manager.getAllRefs();
      expect(refs).toHaveLength(2);
      expect(refs).toContainEqual({
        filePath: "/path/to/file1.mp4",
        count: 1,
        shouldDelete: true,
      });
      expect(refs).toContainEqual({
        filePath: "/path/to/file2.mp4",
        count: 2,
        shouldDelete: false,
      });
    });

    it("没有引用时应该返回空数组", () => {
      expect(manager.getAllRefs()).toEqual([]);
    });
  });

  describe("clear", () => {
    it("应该清空所有引用", () => {
      manager.addRef("/path/to/file1.mp4", true);
      manager.addRef("/path/to/file2.mp4", false);
      manager.clear();
      expect(manager.getAllRefs()).toEqual([]);
      expect(manager.getRefCount("/path/to/file1.mp4")).toBe(0);
    });

    it("清空后应该可以重新添加相同文件", () => {
      manager.addRef("/path/to/file.mp4", false);
      manager.clear();
      manager.addRef("/path/to/file.mp4", false);
      expect(manager.getRefCount("/path/to/file.mp4")).toBe(1);
    });
  });

  describe("复杂场景", () => {
    it("应该正确处理上传和同步的并发引用", async () => {
      const filePath = "/path/to/video.mp4";

      // 上传任务添加引用（需要删除）
      manager.addRef(filePath, true);
      // 同步任务添加引用（不需要删除）
      manager.addRef(filePath, false);

      expect(manager.getRefCount(filePath)).toBe(2);
      expect(manager.shouldDelete(filePath)).toBe(true);

      // 上传完成
      await manager.releaseRef(filePath);
      expect(trashItemSpy).not.toHaveBeenCalled();

      // 同步完成，应该删除
      await manager.releaseRef(filePath);
      expect(trashItemSpy).toHaveBeenCalledWith(filePath);
    });

    it("应该正确处理审核后删除场景", async () => {
      const filePath = "/path/to/video.mp4";

      // 上传任务添加引用
      manager.addRef(filePath, false);
      // 审核后删除添加引用
      manager.addRef(filePath, true);

      // 上传完成
      await manager.releaseRef(filePath);
      expect(trashItemSpy).not.toHaveBeenCalled();

      // 审核通过，释放引用并删除
      await manager.releaseRef(filePath);
      expect(trashItemSpy).toHaveBeenCalledWith(filePath);
    });
  });
});
