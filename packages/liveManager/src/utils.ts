import fs from "node:fs";
import path from "node:path";
import { DebouncedFunc, throttle, range } from "lodash-es";
import filenamify from "filenamify";

export type AnyObject = Record<string, any>;
export type UnknownObject = Record<string, unknown>;
export type PickRequired<T, K extends keyof T> = T & Pick<Required<T>, K>;

export function asyncThrottle(
  fn: () => Promise<void>,
  time: number,
  opts: {
    immediateRunWhenEndOfDefer?: boolean;
  } = {},
): DebouncedFunc<() => void> {
  let savingPromise: Promise<void> | null = null;
  let hasDeferred = false;

  const wrappedWithAllowDefer = () => {
    if (savingPromise != null) {
      hasDeferred = true;
      return;
    }

    savingPromise = fn().finally(() => {
      savingPromise = null;
      if (hasDeferred) {
        hasDeferred = false;
        if (opts.immediateRunWhenEndOfDefer) {
          wrappedWithAllowDefer();
        } else {
          throttled();
        }
      }
    });
  };

  const throttled = throttle(wrappedWithAllowDefer, time);

  return throttled;
}

export function replaceExtName(filePath: string, newExtName: string) {
  return path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath)) + newExtName,
  );
}

/**
 * 接收 fn ，返回一个和 fn 签名一致的函数 fn'。当已经有一个 fn' 在运行时，再调用
 * fn' 会直接返回运行中 fn' 的 Promise，直到 Promise 结束 pending 状态
 */
export function singleton<Fn extends (...args: any) => Promise<any>>(fn: Fn): Fn {
  let latestPromise: Promise<unknown> | null = null;

  return function (...args) {
    if (latestPromise) return latestPromise;
    // @ts-ignore
    const promise = fn.apply(this, args).finally(() => {
      if (promise === latestPromise) {
        latestPromise = null;
      }
    });

    latestPromise = promise;
    return promise;
  } as Fn;
}

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

export function formatDate(date: Date, format: string): string {
  const map: { [key: string]: string } = {
    yyyy: date.getFullYear().toString(),
    MM: (date.getMonth() + 1).toString().padStart(2, "0"),
    dd: date.getDate().toString().padStart(2, "0"),
    HH: date.getHours().toString().padStart(2, "0"),
    mm: date.getMinutes().toString().padStart(2, "0"),
    ss: date.getSeconds().toString().padStart(2, "0"),
  };

  return format.replace(/yyyy|MM|dd|HH|mm|ss/g, (matched) => map[matched]);
}

export function removeSystemReservedChars(filename: string) {
  return filenamify(filename, { replacement: "_" });
}

export function isFfmpegStartSegment(line: string) {
  return line.includes("Opening ") && line.includes("for writing");
}

export const formatTemplate = function template(string: string, ...args: any[]) {
  const nargs = /\{([0-9a-zA-Z_]+)\}/g;

  let params;

  if (args.length === 1 && typeof args[0] === "object") {
    params = args[0];
  } else {
    params = args;
  }

  if (!params || !params.hasOwnProperty) {
    params = {};
  }

  return string.replace(nargs, function replaceArg(match, i, index) {
    let result;

    if (string[index - 1] === "{" && string[index + match.length] === "}") {
      return i;
    } else {
      result = Object.hasOwn(params, i) ? params[i] : null;
      if (result === null || result === undefined) {
        return "";
      }

      return result;
    }
  });
};

export default {
  replaceExtName,
  singleton,
  getValuesFromArrayLikeFlexSpaceBetween,
  ensureFolderExist,
  assert,
  assertStringType,
  assertNumberType,
  assertObjectType,
  asyncThrottle,
  isFfmpegStartSegment,
};
