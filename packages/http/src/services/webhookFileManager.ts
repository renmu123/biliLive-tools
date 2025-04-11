import { trashItem } from "@biliLive-tools/shared/utils/index.js";

class FileManager {
  // 记录文件状态的映射
  private fileStatusMap: Map<
    string,
    {
      pendingOperations: Set<string>; // 记录待完成的操作
      deleteAfter: "none" | "immediate" | "afterUpload" | "afterCheck"; // 删除策略
    }
  > = new Map();
  log: Console;

  constructor({ log }: { log: Console }) {
    this.log = log;
  }

  // 注册文件处理操作
  registerFile(filePath: string) {
    if (!this.fileStatusMap.has(filePath)) {
      this.fileStatusMap.set(filePath, {
        pendingOperations: new Set(),
        deleteAfter: "none",
      });
    }
  }

  // 添加待完成操作
  addPendingOperation(filePath: string, operation: string) {
    this.registerFile(filePath);
    this.fileStatusMap.get(filePath)!.pendingOperations.add(operation);
  }

  // 标记操作完成
  completeOperation(filePath: string, operation: string) {
    if (!this.fileStatusMap.has(filePath)) return;

    const fileStatus = this.fileStatusMap.get(filePath)!;
    fileStatus.pendingOperations.delete(operation);

    // 如果没有待完成操作且需要立即删除，则执行删除
    if (fileStatus.pendingOperations.size === 0 && fileStatus.deleteAfter === "immediate") {
      this.deleteFile(filePath);
    }
  }

  // 设置删除策略
  setDeleteStrategy(
    filePath: string,
    strategy: "none" | "immediate" | "afterUpload" | "afterCheck",
  ) {
    this.registerFile(filePath);
    this.fileStatusMap.get(filePath)!.deleteAfter = strategy;
  }

  // 检查文件是否可以删除
  canDelete(filePath: string): boolean {
    if (!this.fileStatusMap.has(filePath)) return false;
    return this.fileStatusMap.get(filePath)!.pendingOperations.size === 0;
  }

  // 删除文件
  async deleteFile(filePath: string) {
    if (!this.fileStatusMap.has(filePath)) return;
    if (this.canDelete(filePath)) {
      try {
        await trashItem(filePath);
        this.fileStatusMap.delete(filePath);
        this.log.info(`成功删除文件: ${filePath}`);
      } catch (error) {
        this.log.error(`删除文件失败: ${filePath}`, error);
      }
    }
  }
}

export default FileManager;
