import fs from "node:fs";
import path from "node:path";
import { range } from "lodash-es";

/**
 * 从数组中按照特定算法提取一些值（允许同个索引重复提取）。
 * 算法的行为类似 flex 的 space-between。
 *
 * examples:
 * ```
 * console.log(getValuesFromArrayLikeFlexSpaceBetween([1, 2, 3, 4, 5, 6, 7], 1))
 * // [1]
 * console.log(getValuesFromArrayLikeFlexSpaceBetween([1, 2, 3, 4, 5, 6, 7], 3))
 * // [1, 4, 7]
 * console.log(getValuesFromArrayLikeFlexSpaceBetween([1, 2, 3, 4, 5, 6, 7], 4))
 * // [1, 3, 5, 7]
 * console.log(getValuesFromArrayLikeFlexSpaceBetween([1, 2, 3, 4, 5, 6, 7], 11))
 * // [1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7]
 * ```
 */
export function getValuesFromArrayLikeFlexSpaceBetween<T>(array: T[], columnCount: number): T[] {
  if (columnCount < 1) return [];
  if (columnCount === 1) return [array[0]];

  const spacingCount = columnCount - 1;
  const spacingLength = array.length / spacingCount;

  const columns = range(1, columnCount + 1);
  const columnValues = columns.map((column, idx, columns) => {
    // 首个和最后的列是特殊的，因为它们不在范围内，而是在两端
    if (idx === 0) {
      return array[0];
    } else if (idx === columns.length - 1) {
      return array[array.length - 1];
    }

    const beforeSpacingCount = column - 1;
    const colPos = beforeSpacingCount * spacingLength;

    return array[Math.floor(colPos)];
  });

  return columnValues;
}

export function ensureFolderExist(fileOrFolderPath: string): void {
  const folder = path.dirname(fileOrFolderPath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

export function assert(assertion: unknown, msg?: string): asserts assertion {
  if (!assertion) {
    throw new Error(msg);
  }
}

export function assertStringType(data: unknown, msg?: string): asserts data is string {
  assert(typeof data === "string", msg);
}

export function assertNumberType(data: unknown, msg?: string): asserts data is number {
  assert(typeof data === "number", msg);
}

export function assertObjectType(data: unknown, msg?: string): asserts data is object {
  assert(typeof data === "object", msg);
}

export function createInvalidStreamChecker(count: number = 10): (ffmpegLogLine: string) => boolean {
  let prevFrame = 0;
  let frameUnchangedCount = 0;

  return (ffmpegLogLine) => {
    const streamInfo = ffmpegLogLine.match(
      /frame=\s*(\d+) fps=.*? q=.*? size=.*? time=.*? bitrate=.*? speed=.*?/,
    );
    if (streamInfo != null) {
      const [, frameText] = streamInfo;
      const frame = Number(frameText);

      if (frame === prevFrame) {
        if (++frameUnchangedCount >= count) {
          return true;
        }
      } else {
        prevFrame = frame;
        frameUnchangedCount = 0;
      }

      return false;
    }

    return false;
  };
}

export function hasKeyword(title: string, titleKeywords: string) {
  const keywords = titleKeywords
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k);

  const hasTitleKeyword = keywords.some((keyword) =>
    title.toLowerCase().includes(keyword.toLowerCase()),
  );
  return hasTitleKeyword;
}
