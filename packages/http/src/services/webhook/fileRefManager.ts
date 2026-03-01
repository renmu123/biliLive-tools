import { trashItem } from "@biliLive-tools/shared/utils/index.js";
import log from "@biliLive-tools/shared/utils/log.js";

/**
 * 文件引用计数管理器
 * 用于管理文件的引用计数，当计数归零且标记为需要删除时自动删除文件
 */
class FileRefManager {
  private refs: Map<
    string,
    {
      count: number;
      shouldDelete: boolean;
    }
  > = new Map();

  /**
   * 添加文件引用
   * @param filePath 文件路径
   * @param shouldDeleteOnZero 当引用计数归零时是否删除文件
   */
  addRef(filePath: string, shouldDeleteOnZero: boolean = false): void {
    const ref = this.refs.get(filePath);
    if (ref) {
      ref.count++;
      // 如果任意一个引用要求删除，则标记为需要删除
      ref.shouldDelete = ref.shouldDelete || shouldDeleteOnZero;
      log.debug(`文件 ${filePath} 引用计数增加: ${ref.count} (shouldDelete: ${ref.shouldDelete})`);
    } else {
      this.refs.set(filePath, {
        count: 1,
        shouldDelete: shouldDeleteOnZero,
      });
      log.debug(`文件 ${filePath} 添加引用: count=1 (shouldDelete: ${shouldDeleteOnZero})`);
    }
  }

  /**
   * 释放文件引用
   * 当引用计数归零且标记为需要删除时，自动删除文件
   * @param filePath 文件路径
   * @returns Promise<void>
   */
  async releaseRef(filePath: string): Promise<void> {
    const ref = this.refs.get(filePath);
    if (!ref) {
      // log.warn(`尝试释放不存在的文件引用: ${filePath}`);
      return;
    }

    ref.count--;
    log.debug(`文件 ${filePath} 引用计数减少: ${ref.count} (shouldDelete: ${ref.shouldDelete})`);

    if (ref.count === 0) {
      this.refs.delete(filePath);

      if (ref.shouldDelete) {
        // log.info(`文件 ${filePath} 引用计数归零，执行删除操作`);
        try {
          await trashItem(filePath);
        } catch (error) {
          log.error(`删除文件失败: ${filePath}`, error);
        }
      } else {
        // log.debug(`文件 ${filePath} 引用计数归零，但不需要删除`);
      }
    }
  }

  /**
   * 获取文件的引用计数
   * @param filePath 文件路径
   * @returns 引用计数（不存在返回0）
   */
  getRefCount(filePath: string): number {
    return this.refs.get(filePath)?.count ?? 0;
  }

  /**
   * 检查文件是否有引用
   * @param filePath 文件路径
   * @returns 是否有引用
   */
  hasRef(filePath: string): boolean {
    return this.refs.has(filePath);
  }

  /**
   * 获取文件的删除标志
   * @param filePath 文件路径
   * @returns 是否标记为需要删除
   */
  shouldDelete(filePath: string): boolean {
    return this.refs.get(filePath)?.shouldDelete ?? false;
  }

  /**
   * 获取所有有引用的文件列表（用于调试）
   * @returns 文件路径数组
   */
  getAllRefs(): Array<{ filePath: string; count: number; shouldDelete: boolean }> {
    return Array.from(this.refs.entries()).map(([filePath, ref]) => ({
      filePath,
      count: ref.count,
      shouldDelete: ref.shouldDelete,
    }));
  }

  /**
   * 清空所有引用（用于测试）
   */
  clear(): void {
    this.refs.clear();
  }
}

export default FileRefManager;
