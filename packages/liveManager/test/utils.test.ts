import { afterEach, describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

import {
  replaceExtName,
  singleton,
  getValuesFromArrayLikeFlexSpaceBetween,
  ensureFolderExist,
  assert,
  assertStringType,
  assertNumberType,
  assertObjectType,
  formatDate,
  removeSystemReservedChars,
  formatTemplate,
  sortByKeyOrder,
  parseSizeToBytes,
} from "../src/utils.js";

// 导入私有函数进行测试
// 由于 hasBlockedTitleKeywords 是私有函数，我们需要从导出的函数中测试它
import utils from "../src/utils.js";

describe("utils", () => {
  // describe("asyncThrottle", () => {
  //   it("should throttle async function calls", async () => {
  //     const fn = vi.fn().mockResolvedValue(undefined);
  //     const throttledFn = asyncThrottle(fn, 100);

  //     throttledFn();
  //     throttledFn();
  //     throttledFn();

  //     expect(fn).toHaveBeenCalledTimes(1);
  //   });
  // });

  describe("replaceExtName", () => {
    it("should replace the file extension", () => {
      const result = replaceExtName("/path/to/file.txt", ".md");
      expect(result).toBe(path.join("/", "path", "to", "file.md"));
    });
  });

  describe("singleton", () => {
    it("should ensure only one instance of the function runs at a time", async () => {
      const fn = vi.fn().mockResolvedValue(undefined);
      const singletonFn = singleton(fn);

      const promise1 = singletonFn();
      const promise2 = singletonFn();

      expect(promise1).toBe(promise2);
      expect(fn).toHaveBeenCalledTimes(1);

      await promise1;
    });
  });

  describe("getValuesFromArrayLikeFlexSpaceBetween", () => {
    it("should return values spaced like flex space-between", () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      expect(getValuesFromArrayLikeFlexSpaceBetween(array, 1)).toEqual([1]);
      expect(getValuesFromArrayLikeFlexSpaceBetween(array, 3)).toEqual([1, 4, 7]);
      expect(getValuesFromArrayLikeFlexSpaceBetween(array, 4)).toEqual([1, 3, 5, 7]);
      expect(getValuesFromArrayLikeFlexSpaceBetween(array, 11)).toEqual([
        1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7,
      ]);
    });
  });

  describe("ensureFolderExist", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should create folder if it does not exist", () => {
      const folderPath = "/path/to/folder";
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      // @ts-ignore
      const mkdirSyncSpy = vi.spyOn(fs, "mkdirSync").mockImplementation(() => {});

      ensureFolderExist(folderPath);

      expect(mkdirSyncSpy).toHaveBeenCalledWith(path.dirname(folderPath), { recursive: true });
    });

    it("should not create folder if it exists", () => {
      const folderPath = "/path/to/folder";
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      // @ts-ignore
      const mkdirSyncSpy = vi.spyOn(fs, "mkdirSync").mockImplementation(() => {});

      ensureFolderExist(folderPath);

      expect(mkdirSyncSpy).not.toHaveBeenCalled();
    });
  });

  describe("assert", () => {
    it("should throw an error if assertion is false", () => {
      expect(() => assert(false, "error message")).toThrow("error message");
    });

    it("should not throw an error if assertion is true", () => {
      expect(() => assert(true, "error message")).not.toThrow();
    });
  });

  describe("assertStringType", () => {
    it("should throw an error if data is not a string", () => {
      expect(() => assertStringType(123, "Not a string")).toThrow("Not a string");
    });

    it("should not throw an error if data is a string", () => {
      expect(() => assertStringType("test", "Not a string")).not.toThrow();
    });
  });

  describe("assertNumberType", () => {
    it("should throw an error if data is not a number", () => {
      expect(() => assertNumberType("test", "Not a number")).toThrow("Not a number");
    });

    it("should not throw an error if data is a number", () => {
      expect(() => assertNumberType(123, "Not a number")).not.toThrow();
    });
  });

  describe("assertObjectType", () => {
    it("should throw an error if data is not an object", () => {
      expect(() => assertObjectType("test", "Not an object")).toThrow("Not an object");
    });

    it("should not throw an error if data is an object", () => {
      expect(() => assertObjectType({}, "Not an object")).not.toThrow();
    });
  });
  describe("formatDate", () => {
    it("should format date correctly with yyyy-MM-dd HH:mm:ss", () => {
      const date = new Date(2023, 0, 1, 12, 30, 45); // January 1, 2023 12:30:45
      const format = "yyyy-MM-dd HH:mm:ss";
      const result = formatDate(date, format);
      expect(result).toBe("2023-01-01 12:30:45");
    });

    it("should format date correctly with dd/MM/yyyy", () => {
      const date = new Date(2023, 0, 1, 12, 30, 45); // January 1, 2023 12:30:45
      const format = "dd/MM/yyyy";
      const result = formatDate(date, format);
      expect(result).toBe("01/01/2023");
    });

    it("should format date correctly with HH:mm:ss", () => {
      const date = new Date(2023, 0, 1, 12, 30, 45); // January 1, 2023 12:30:45
      const format = "HH:mm:ss";
      const result = formatDate(date, format);
      expect(result).toBe("12:30:45");
    });

    it("should format date correctly with custom format", () => {
      const date = new Date(2023, 0, 1, 12, 30, 45); // January 1, 2023 12:30:45
      const format = "yyyy/MM/dd HH-mm";
      const result = formatDate(date, format);
      expect(result).toBe("2023/01/01 12-30");
    });

    it("should handle single digit month and day correctly", () => {
      const date = new Date(2023, 8, 9, 12, 30, 45); // September 9, 2023 12:30:45
      const format = "yyyy-MM-dd";
      const result = formatDate(date, format);
      expect(result).toBe("2023-09-09");
    });

    describe("removeSystemReservedChars", () => {
      it("should replace system reserved characters with underscores", () => {
        const filename = "file:name*with?reserved|chars";
        const result = removeSystemReservedChars(filename);
        expect(result).toBe("file_name_with_reserved_chars");
      });

      it("should not modify filename if there are no reserved characters", () => {
        const filename = "filename_without_reserved_chars";
        const result = removeSystemReservedChars(filename);
        expect(result).toBe("filename_without_reserved_chars");
      });

      it("should handle empty filename", () => {
        const filename = "";
        const result = removeSystemReservedChars(filename);
        expect(result).toBe("_");
      });

      it("should handle filename with only reserved characters", () => {
        const filename = ":*?|";
        const result = removeSystemReservedChars(filename);
        expect(result).toBe("_");
      });
    });
  });

  describe("formatTemplate", () => {
    it("should replace placeholders with corresponding values", () => {
      const template = "Hello, {0}!";
      const result = formatTemplate(template, "world");
      expect(result).toBe("Hello, world!");
    });

    it("should replace multiple placeholders with corresponding values", () => {
      const template = "{0} is {1} years old.";
      const result = formatTemplate(template, "Alice", 30);
      expect(result).toBe("Alice is 30 years old.");
    });

    it("should replace placeholders with object properties", () => {
      const template = "Hello, {name}!";
      const result = formatTemplate(template, { name: "Alice" });
      expect(result).toBe("Hello, Alice!");
    });

    it("should handle missing placeholders gracefully", () => {
      const template = "Hello, {0} {1}!";
      const result = formatTemplate(template, "Alice");
      expect(result).toBe("Hello, Alice !");
    });

    it("should handle escaped placeholders", () => {
      const template = "Hello, {{0}}!";
      const result = formatTemplate(template, "world");
      expect(result).toBe("Hello, {0}!");
    });
  });

  describe("sortByKeyOrder", () => {
    it("should sort objects by specified key order", () => {
      const objects = [
        { id: 3, name: "Charlie" },
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];
      const order = [2, 3, 1];
      const result = sortByKeyOrder(objects, order, "id");
      expect(result).toEqual([
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
        { id: 1, name: "Alice" },
      ]);
    });

    it("should sort objjects by string key order", () => {
      const objects = [
        { id: "c", name: "Charlie" },
        { id: "a", name: "Alice" },
        { id: "b", name: "Bob" },
      ];
      const order = ["b", "c", "a"];
      const result = sortByKeyOrder(objects, order, "id");
      expect(result).toEqual([
        { id: "b", name: "Bob" },
        { id: "c", name: "Charlie" },
        { id: "a", name: "Alice" },
      ]);
    });

    it("should place objects with keys not in order at the end", () => {
      const objects = [
        { id: 3, name: "Charlie" },
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 4, name: "Dave" },
      ];
      const order = [2, 3];
      const result = sortByKeyOrder(objects, order, "id");
      expect(result).toEqual([
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
        { id: 1, name: "Alice" },
        { id: 4, name: "Dave" },
      ]);
    });

    it("should handle empty objects array", () => {
      const objects: { id: number; name: string }[] = [];
      const order = [2, 3, 1];
      const result = sortByKeyOrder(objects, order, "id");
      expect(result).toEqual([]);
    });

    it("should handle empty order array", () => {
      const objects = [
        { id: 3, name: "Charlie" },
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];
      const order: number[] = [];
      const result = sortByKeyOrder(objects, order, "id");
      expect(result).toEqual(objects);
    });

    it("should handle objects with missing keys", () => {
      const objects = [{ id: 3, name: "Charlie" }, { id: 1, name: "Alice" }, { name: "Bob" }];
      const order = [2, 3, 1];
      const result = sortByKeyOrder(objects, order, "id");
      expect(result).toEqual([
        { id: 3, name: "Charlie" },
        { id: 1, name: "Alice" },
        { name: "Bob" },
      ]);
    });
  });
  describe("parseSizeToBytes", () => {
    it("should return 0 for empty string", () => {
      expect(parseSizeToBytes("")).toBe(0);
    });

    it("should return number for numeric string", () => {
      expect(parseSizeToBytes("123")).toBe(123);
      expect(parseSizeToBytes("0")).toBe(0);
      expect(parseSizeToBytes("456.789")).toBe(456.789);
    });

    it("should convert B units correctly", () => {
      expect(parseSizeToBytes("100B")).toBe("100");
      expect(parseSizeToBytes("1B")).toBe("1");
      expect(parseSizeToBytes("0B")).toBe("0");
    });

    it("should convert KB units correctly", () => {
      expect(parseSizeToBytes("1KB")).toBe("1024");
      expect(parseSizeToBytes("2KB")).toBe("2048");
      expect(parseSizeToBytes("1.5KB")).toBe("1536");
    });

    it("should convert MB units correctly", () => {
      expect(parseSizeToBytes("1MB")).toBe("1048576");
      expect(parseSizeToBytes("2MB")).toBe("2097152");
      expect(parseSizeToBytes("1.5MB")).toBe("1572864");
    });

    it("should convert GB units correctly", () => {
      expect(parseSizeToBytes("1GB")).toBe("1073741824");
      expect(parseSizeToBytes("2GB")).toBe("2147483648");
      expect(parseSizeToBytes("1.5GB")).toBe("1610612736");
    });

    it("should be case insensitive", () => {
      expect(parseSizeToBytes("1kb")).toBe("1024");
      expect(parseSizeToBytes("1Mb")).toBe("1048576");
      expect(parseSizeToBytes("1gb")).toBe("1073741824");
      expect(parseSizeToBytes("1b")).toBe("1");
    });

    it("should handle whitespace", () => {
      expect(parseSizeToBytes(" 1KB ")).toBe("1024");
      expect(parseSizeToBytes("  2MB  ")).toBe("2097152");
    });

    it("should return 0 for invalid format", () => {
      expect(parseSizeToBytes("invalid")).toBe(0);
      expect(parseSizeToBytes("1TB")).toBe(0);
      expect(parseSizeToBytes("ABCKB")).toBe(0);
      expect(parseSizeToBytes("1.2.3KB")).toBe(0);
    });

    it("should handle decimal numbers", () => {
      expect(parseSizeToBytes("2.5KB")).toBe("2560");
      expect(parseSizeToBytes("0.5MB")).toBe("524288");
      expect(parseSizeToBytes("1.25GB")).toBe("1342177280");
    });
  });

  describe("hasBlockedTitleKeywords", () => {
    describe("普通关键词匹配（逗号分隔）", () => {
      it("should return false when titleKeywords is undefined", () => {
        expect(utils.hasBlockedTitleKeywords("测试直播间", undefined)).toBe(false);
      });

      it("should return false when titleKeywords is empty string", () => {
        expect(utils.hasBlockedTitleKeywords("测试直播间", "")).toBe(false);
        expect(utils.hasBlockedTitleKeywords("测试直播间", "   ")).toBe(false);
      });

      it("should match single keyword (case insensitive)", () => {
        expect(utils.hasBlockedTitleKeywords("这是回放", "回放")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("这是回放", "录播")).toBe(false);
      });

      it("should match multiple keywords separated by comma", () => {
        expect(utils.hasBlockedTitleKeywords("这是回放", "回放,录播,重播")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("这是录播", "回放,录播,重播")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("这是重播", "回放,录播,重播")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("正常直播", "回放,录播,重播")).toBe(false);
      });

      it("should handle keywords with whitespace", () => {
        expect(utils.hasBlockedTitleKeywords("这是回放", " 回放 , 录播 , 重播 ")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("这是录播", "回放,  录播  ,重播")).toBe(true);
      });

      it("should be case insensitive for normal keywords", () => {
        expect(utils.hasBlockedTitleKeywords("这是REPLAY", "replay")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("这是Replay", "REPLAY")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("REPLAY测试", "replay")).toBe(true);
      });

      it("should match partial strings", () => {
        expect(utils.hasBlockedTitleKeywords("这是录播回放", "回放")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("回放测试", "回放")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("测试回放测试", "回放")).toBe(true);
      });
    });

    describe("正则表达式匹配", () => {
      it("should match basic regex pattern", () => {
        expect(utils.hasBlockedTitleKeywords("这是回放", "/回放/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("这是录播", "/回放/")).toBe(false);
      });

      it("should support regex alternation (OR)", () => {
        expect(utils.hasBlockedTitleKeywords("这是回放", "/回放|录播|重播/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("这是录播", "/回放|录播|重播/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("这是重播", "/回放|录播|重播/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("正常直播", "/回放|录播|重播/")).toBe(false);
      });

      it("should support case-insensitive flag", () => {
        expect(utils.hasBlockedTitleKeywords("这是REPLAY", "/replay/i")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("这是Replay", "/REPLAY/i")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("这是replay", "/REPLAY/i")).toBe(true);
      });

      it("should be case sensitive without i flag", () => {
        expect(utils.hasBlockedTitleKeywords("这是REPLAY", "/replay/")).toBe(false);
        expect(utils.hasBlockedTitleKeywords("这是replay", "/REPLAY/")).toBe(false);
        expect(utils.hasBlockedTitleKeywords("这是replay", "/replay/")).toBe(true);
      });

      it("should support complex regex patterns", () => {
        // 匹配以数字开头的标题
        expect(utils.hasBlockedTitleKeywords("123测试", "/^\\d+/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("测试123", "/^\\d+/")).toBe(false);

        // 匹配包含特定格式的时间
        expect(utils.hasBlockedTitleKeywords("2024-01-01回放", "/\\d{4}-\\d{2}-\\d{2}/")).toBe(
          true,
        );
        expect(utils.hasBlockedTitleKeywords("回放测试", "/\\d{4}-\\d{2}-\\d{2}/")).toBe(false);
      });

      it("should support word boundary", () => {
        // 注意：\b 在中文等非 ASCII 字符中可能不按预期工作
        // 这里使用英文测试 word boundary
        expect(utils.hasBlockedTitleKeywords("replay test", "/\\breplay\\b/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("replay", "/\\breplay\\b/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("test replay", "/\\breplay\\b/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("replaytest", "/\\breplay\\b/")).toBe(false);
      });

      it("should handle invalid regex by falling back to normal matching", () => {
        // 无效的正则表达式应该降级为普通匹配
        const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // 无效的正则表达式格式
        expect(utils.hasBlockedTitleKeywords("测试[回放", "/[/")).toBe(false);
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it("should support multiline flag", () => {
        const title = "第一行\n回放内容\n第三行";
        // 使用 m 标志使 ^ 可以匹配行首
        expect(utils.hasBlockedTitleKeywords(title, "/^回放/m")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("回放内容", "/^回放/")).toBe(true);
      });

      it("should support global flag (though not necessary for test)", () => {
        expect(utils.hasBlockedTitleKeywords("回放回放回放", "/回放/g")).toBe(true);
      });

      it("should handle regex with special characters", () => {
        expect(utils.hasBlockedTitleKeywords("测试.回放", "/测试\\.回放/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("【回放】", "/【回放】/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("(回放)", "/\\(回放\\)/")).toBe(true);
      });
    });

    describe("边界情况", () => {
      it("should handle empty title", () => {
        expect(utils.hasBlockedTitleKeywords("", "回放")).toBe(false);
        expect(utils.hasBlockedTitleKeywords("", "/回放/")).toBe(false);
      });

      it("should handle title with only whitespace", () => {
        expect(utils.hasBlockedTitleKeywords("   ", "回放")).toBe(false);
        expect(utils.hasBlockedTitleKeywords("   ", "/回放/")).toBe(false);
      });

      it("should handle keywords with empty items", () => {
        expect(utils.hasBlockedTitleKeywords("回放测试", "回放,,录播")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("录播测试", "回放,,录播")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("正常", "回放,,录播")).toBe(false);
      });

      it("should handle unicode characters", () => {
        expect(utils.hasBlockedTitleKeywords("🎮回放🎮", "回放")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("🎮回放🎮", "/回放/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("🎮测试🎮", "/🎮/")).toBe(true);
      });

      it("should handle very long titles", () => {
        const longTitle = "测试".repeat(1000) + "回放";
        expect(utils.hasBlockedTitleKeywords(longTitle, "回放")).toBe(true);
        expect(utils.hasBlockedTitleKeywords(longTitle, "/回放/")).toBe(true);
      });

      it("should handle very long keyword lists", () => {
        const keywords = Array.from({ length: 100 }, (_, i) => `keyword${i}`).join(",");
        expect(utils.hasBlockedTitleKeywords("keyword50测试", keywords)).toBe(true);
        expect(utils.hasBlockedTitleKeywords("测试", keywords)).toBe(false);
      });
    });

    describe("实际使用场景", () => {
      it("should block replay streams", () => {
        expect(utils.hasBlockedTitleKeywords("【回放】昨天的精彩内容", "回放,录播")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("录播：上次直播", "回放,录播")).toBe(true);
      });

      it("should allow normal live streams", () => {
        expect(utils.hasBlockedTitleKeywords("正常直播中", "回放,录播")).toBe(false);
        expect(utils.hasBlockedTitleKeywords("今天玩游戏", "回放,录播")).toBe(false);
      });

      it("should use regex for complex filtering", () => {
        // 过滤包含日期的标题（可能是录播）
        expect(
          utils.hasBlockedTitleKeywords("2024年1月1日 游戏直播", "/\\d{4}年\\d{1,2}月\\d{1,2}日/"),
        ).toBe(true);

        // 过滤包含特定前缀的标题
        expect(utils.hasBlockedTitleKeywords("【录播】游戏", "/^【录播】/")).toBe(true);
        expect(utils.hasBlockedTitleKeywords("游戏【录播】", "/^【录播】/")).toBe(false);
      });

      it("should combine regex with case-insensitive matching", () => {
        expect(
          utils.hasBlockedTitleKeywords("REPLAY: Gaming Session", "/replay|rerun|rebroadcast/i"),
        ).toBe(true);
        expect(
          utils.hasBlockedTitleKeywords("Rerun: Yesterday's Stream", "/replay|rerun|rebroadcast/i"),
        ).toBe(true);
        expect(utils.hasBlockedTitleKeywords("Live Gaming", "/replay|rerun|rebroadcast/i")).toBe(
          false,
        );
      });
    });
  });
});
