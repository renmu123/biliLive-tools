import { Shazam } from "@renmu/node-shazam";

/**
 * 使用 Shazam 进行歌曲识别
 * @param file 音频
 * @returns
 */
export async function shazamRecognize(file: string) {
  const shazam = new Shazam();
  const recognise = await shazam.recognise(file, "zh-cn");
  if (!recognise) {
    return null;
  }
  return {
    trackId: recognise.track.key,
    title: recognise.track.title,
  };
}

/**
 * 使用 Shazam 查询信息
 */
export async function shazamQueryInfo(id: string) {
  const shazam = new Shazam();
  const info = await shazam.track_info("zh-cn", "CN", id);
  return info;
}

/**
 * 使用 Shazam 查询歌词
 */
export async function shazamQueryLyrics(id: string) {
  const shazam = new Shazam();
  const info = await shazam.track_info("zh-cn", "CN", id);
  return info?.sections?.find((section: any) => section.type === "LYRICS") || null;
}
