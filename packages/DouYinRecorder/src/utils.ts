import fs from "node:fs";
import path from "node:path";

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

export function replaceExtName(filePath: string, newExtName: string) {
  return path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath)) + newExtName,
  );
}
