import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

import {
  // asyncThrottle,
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
} from "../src/utils.js";

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
          expect(result).toBe("");
        });

        it("should handle filename with only reserved characters", () => {
          const filename = ":*?|";
          const result = removeSystemReservedChars(filename);
          expect(result).toBe("_");
        });
      });
    });
  });
});
