/**
 * 上传/下载速度计算器
 * 使用时间窗口平滑算法计算传输速度
 */
export class SpeedCalculator {
  private progressHistory: Array<{ loaded: number; timestamp: number }> = [];
  private readonly speedWindowMs: number;

  /**
   * @param speedWindowMs 时间窗口大小（毫秒），默认 3000ms
   */
  constructor(speedWindowMs: number = 3000) {
    this.speedWindowMs = speedWindowMs;
  }

  /**
   * 重置速度计算器
   */
  reset(): void {
    this.progressHistory = [];
  }

  /**
   * 初始化速度计算器
   * @param startTimestamp 开始时间戳
   */
  init(startTimestamp: number): void {
    this.progressHistory = [{ loaded: 0, timestamp: startTimestamp }];
  }

  /**
   * 清理超出时间窗口的历史记录
   * @param currentTime 当前时间戳
   */
  private cleanupProgressHistory(currentTime: number): void {
    const windowStartTime = currentTime - this.speedWindowMs;
    this.progressHistory = this.progressHistory.filter(
      (progress) => progress.timestamp >= windowStartTime,
    );
  }

  /**
   * 计算速度（使用时间窗口平滑）
   * @param currentLoaded 当前已传输字节数
   * @param currentTime 当前时间戳
   * @returns 格式化的速度字符串（MB/s）
   */
  calculateSpeed(currentLoaded: number, currentTime: number): string {
    // 添加当前进度到历史记录
    this.progressHistory.push({ loaded: currentLoaded, timestamp: currentTime });

    // 清理超出时间窗口的旧数据
    this.cleanupProgressHistory(currentTime);

    // 如果历史记录不足，返回默认值
    if (this.progressHistory.length < 2) {
      return "0.00 MB/s";
    }

    // 使用时间窗口内的第一个和最后一个数据点计算平均速度
    const oldest = this.progressHistory[0];
    const newest = this.progressHistory[this.progressHistory.length - 1];

    const timeDiff = (newest.timestamp - oldest.timestamp) / 1000; // 转换为秒
    const dataDiff = newest.loaded - oldest.loaded; // 字节差

    if (timeDiff <= 0 || dataDiff <= 0) {
      return "0.00 MB/s";
    }

    const speedMBps = dataDiff / (1024 * 1024) / timeDiff; // MB/s
    return `${speedMBps.toFixed(2)} MB/s`;
  }
}
