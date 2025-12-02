// 文件锁类型定义
type FileLock = {
  timestamp: number;
  type: "upload" | "sync" | "deleteAfterCheck";
};

// 文件锁管理器
class FileLockManager {
  private locks: Map<string, Set<FileLock>> = new Map();
  private readonly LOCK_TIMEOUT = 48 * 60 * 60 * 1000; // 24小时超时

  // 获取文件锁
  acquireLock(filePath: string, type: FileLock["type"]): boolean {
    const now = Date.now();
    const fileLocks = this.locks.get(filePath) || new Set<FileLock>();

    // 检查是否已存在相同类型的锁
    for (const lock of fileLocks) {
      if (lock.type === type) {
        if (now - lock.timestamp < this.LOCK_TIMEOUT) {
          return false; // 已存在未过期的相同类型锁
        } else {
          fileLocks.delete(lock); // 删除过期的锁
        }
      }
    }

    // 添加新锁
    fileLocks.add({
      timestamp: now,
      type,
    });
    this.locks.set(filePath, fileLocks);
    return true;
  }

  // 释放文件锁
  releaseLock(filePath: string, type: FileLock["type"]): boolean {
    const fileLocks = this.locks.get(filePath);
    if (!fileLocks) return false;

    let released = false;
    for (const lock of fileLocks) {
      if (lock.type === type) {
        fileLocks.delete(lock);
        released = true;
      }
    }

    if (fileLocks.size === 0) {
      this.locks.delete(filePath);
    }

    return released;
  }

  // 检查文件是否被特定类型的锁锁定
  isLocked(filePath: string, type?: FileLock["type"]): boolean {
    const fileLocks = this.locks.get(filePath);
    if (!fileLocks) return false;

    const now = Date.now();
    let hasValidLock = false;

    // 清理过期的锁
    for (const lock of fileLocks) {
      if (now - lock.timestamp >= this.LOCK_TIMEOUT) {
        fileLocks.delete(lock);
      } else if (!type || lock.type === type) {
        hasValidLock = true;
      }
    }

    if (fileLocks.size === 0) {
      this.locks.delete(filePath);
    }

    return hasValidLock;
  }

  // 清理过期的锁
  cleanup(): void {
    const now = Date.now();
    for (const [filePath, fileLocks] of this.locks.entries()) {
      for (const lock of fileLocks) {
        if (now - lock.timestamp >= this.LOCK_TIMEOUT) {
          fileLocks.delete(lock);
        }
      }
      if (fileLocks.size === 0) {
        this.locks.delete(filePath);
      }
    }
  }
}

export default FileLockManager;
