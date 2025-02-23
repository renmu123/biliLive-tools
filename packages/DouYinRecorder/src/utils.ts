import fs from 'fs'
import path from 'path'
import * as R from 'ramda'

/**
 * 接收 fn ，返回一个和 fn 签名一致的函数 fn'。当已经有一个 fn' 在运行时，再调用
 * fn' 会直接返回运行中 fn' 的 Promise，直到 Promise 结束 pending 状态
 */
export function singleton<Fn extends (...args: any) => Promise<any>>(fn: Fn): Fn {
  let latestPromise: Promise<unknown> | null = null

  return function (...args) {
    if (latestPromise) return latestPromise

    const promise = fn.apply(this, args).finally(() => {
      if (promise === latestPromise) {
        latestPromise = null
      }
    })

    latestPromise = promise
    return promise
  } as Fn
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
  if (columnCount < 1) return []
  if (columnCount === 1) return [array[0]]

  const spacingCount = columnCount - 1
  const spacingLength = array.length / spacingCount

  const columns = R.range(1, columnCount + 1)
  const columnValues = columns.map((column, idx, columns) => {
    // 首个和最后的列是特殊的，因为它们不在范围内，而是在两端
    if (idx === 0) {
      return array[0]
    } else if (idx === columns.length - 1) {
      return array[array.length - 1]
    }

    const beforeSpacingCount = column - 1
    const colPos = beforeSpacingCount * spacingLength

    return array[Math.floor(colPos)]
  })

  return columnValues
}

export function ensureFolderExist(fileOrFolderPath: string): void {
  const folder = path.dirname(fileOrFolderPath)
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true })
  }
}

export function assert(assertion: unknown, msg?: string): asserts assertion {
  if (!assertion) {
    throw new Error(msg)
  }
}

export function assertStringType(data: unknown, msg?: string): asserts data is string {
  assert(typeof data === 'string', msg)
}

export function assertNumberType(data: unknown, msg?: string): asserts data is number {
  assert(typeof data === 'number', msg)
}

export function assertObjectType(data: unknown, msg?: string): asserts data is object {
  assert(typeof data === 'object', msg)
}

export function replaceExtName(filePath: string, newExtName: string) {
  return path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + newExtName)
}
