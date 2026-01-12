export type Status = "pending" | "running" | "paused" | "completed" | "error" | "canceled";

export interface DanmaOptions {
  // 1：保存到原始文件夹，2：保存到特定文件夹
  saveRadio: 1 | 2;
  savePath: string;
  // 完成后移除源文件
  removeOrigin?: boolean;
  // 生成到临时文件夹
  temp?: boolean;
  // 覆盖已存在的文件
  override?: boolean;
}
