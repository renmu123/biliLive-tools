import { uuid } from "@biliLive-tools/shared/utils/index.js";

export function createFileCache() {
  // 视频ID管理，用于临时访问授权
  const videoPathMap = new Map<string, { path: string; expireAt: number }>();

  // 定期清理过期的视频ID
  setInterval(
    () => {
      const now = Date.now();
      for (const [id, info] of videoPathMap.entries()) {
        if (info.expireAt < now) {
          videoPathMap.delete(id);
        }
      }
    },
    60 * 60 * 1000,
  ); // 每小时清理一次

  return {
    get: (id: string) => {
      const info = videoPathMap.get(id);
      return info;
    },
    set: (id: string, fileInfo: { path: string; expireAt: number }) => {
      videoPathMap.set(id, fileInfo);
    },
    setFile: (filePath: string) => {
      const id = uuid();
      videoPathMap.set(id, { path: filePath, expireAt: Date.now() + 24 * 60 * 60 * 1000 });
      return id;
    },
  };
}
