export function buildRoomLink(platform: string, roomId: string): string | null {
  const platformLower = platform.toLowerCase();
  const platformRoomLinkMap: Record<string, (roomId: string) => string> = {
    bilibili: (id: string) => `https://live.bilibili.com/${id}`,
    huya: (id: string) => `https://www.huya.com/${id}`,
    douyu: (id: string) => `https://www.douyu.com/${id}`,
    douyin: (id: string) => `https://live.douyin.com/${id}`,
  };
  const link = platformRoomLinkMap[platformLower]?.(roomId);
  return link ?? null;
}
