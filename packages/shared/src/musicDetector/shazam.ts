import { Shazam } from "@renmu/node-shazam";
import fs from "fs-extra";
import { sify } from "chinese-conv";
import { addExtractAudioTask, readVideoMeta } from "../task/video.js";
import { getTempPath, uuid } from "../utils/index.js";

interface TrackInfo {
  layout: string;
  type: "MUSIC" | "HIDDEN";
  key: string;
  title: string;
  subtitle: string;
  images: Images;
  share: Share;
  hub: Hub;
  sections: Section[];
  url: string;
  artists: Artist[];
  alias: string;
  genres: Genres;
  urlparams: Urlparams;
  highlightsurls: Highlightsurls;
  relatedtracksurl: string;
  albumadamid: string;
  trackadamid: string;
  releasedate: string;
  isrc: string;
}

interface Highlightsurls {}

interface Urlparams {
  "{tracktitle}": string;
  "{trackartist}": string;
}

interface Genres {
  primary: string;
}

interface Artist {
  alias: string;
  id: string;
  adamid: string;
}

interface Section {
  type: string;
  metapages?: Metapage[];
  tabname: string;
  metadata?: Metadatum[];
  url?: string;
}

interface Metadatum {
  title: string;
  text: string;
}

interface Metapage {
  image: string;
  caption: string;
}

interface Hub {
  type: string;
  image: string;
  actions: Action[];
  explicit: boolean;
  displayname: string;
  options: Option[];
}

interface Option {
  caption: string;
  actions: Action2[];
  beacondata: Beacondata;
  image: string;
  type: string;
  listcaption: string;
  overflowimage: string;
  colouroverflowimage: boolean;
  providername: string;
}

interface Beacondata {
  type: string;
  providername: string;
}

interface Action2 {
  name: string;
  type: string;
  uri: string;
}

interface Action {
  name: string;
  type: string;
  id?: string;
  uri?: string;
}

interface Share {
  subject: string;
  text: string;
  href: string;
  image: string;
  twitter: string;
  html: string;
  avatar: string;
  snapchat: string;
}

interface Images {
  background: string;
  coverart: string;
  coverarthq: string;
  joecolor: string;
}

/**
 * 使用 Shazam 进行歌曲识别
 * @param file 音频
 * @returns
 * 识别结果包含 trackId、title、appleMusicId 等字段，未识别到返回 null
 */
async function shazamRecognize(file: string) {
  const shazam = new Shazam();
  const recognise = await shazam.recognise(file, "zh-cn");
  if (!recognise) {
    return null;
  }
  const appleMusicId = recognise.track?.hub?.actions?.find(
    (opt) => opt.type === "applemusicplay",
  )?.id;
  return {
    trackId: recognise.track.key,
    title: recognise.track.title,
    subtitle: recognise?.track?.subtitle,
    appleMusicId,
    // ...recognise,
  };
}

/**
 * 使用 Shazam 查询信息
 */
async function shazamQueryInfo(trackId: string) {
  const shazam = new Shazam();
  const info = (await shazam.track_info("zh-cn", "CN", trackId)) as TrackInfo;
  if (info.type !== "MUSIC") return null;

  const appleMusicId = info?.hub?.actions?.find((opt) => opt.type === "applemusicplay")?.id;
  return { ...info, appleMusicId };
}

/**
 * 使用 Shazam 查询歌词
 */
async function shazamQueryLyrics(appleMusicId: string, title: string) {
  const url = `https://www.shazam.com/zh-cn/song/${appleMusicId}/${title}`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.text();

    let lyrics: string | null = null;
    // 使用正则提取 lyrics 对象
    const lyricsMatch = data.match(/"lyrics"\s*:\s*\{[^}]*"text"\s*:\s*"([^"]*)"/);
    if (lyricsMatch && lyricsMatch[1]) {
      // 解码转义字符（如 \n）
      lyrics = lyricsMatch[1];
    }

    return { lyrics };
  } catch (e) {
    return null;
  }
}

/**
 * 带重试的 Shazam 识别函数
 * @param file 音频文件
 * @param retries 重试次数（默认2次）
 * @returns 识别结果
 */
async function shazamRecognizeWithRetry(
  file: string,
  retries: number = 2,
): Promise<Awaited<ReturnType<typeof shazamRecognize>>> {
  let lastError: any = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await shazamRecognize(file);
      return result;
    } catch (error) {
      lastError = error;
      if (i < retries) {
        console.log(`Shazam 识别失败，进行第 ${i + 1} 次重试...`);
        // 等待一小段时间再重试
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
  // 所有重试都失败后，返回 null 而不是抛出错误
  console.error("Shazam 识别失败，已达到最大重试次数", lastError);
  return null;
}

/**
 * 智能分段采样识别歌曲
 * 渐进式识别：先识别中段，再识别尾段，最后识别开头
 * 只要识别出内容就立即返回，如果全部返回null则认为不是歌曲
 * @param file 音频或视频文件
 * @returns 识别结果
 */
async function shazamRecognizeWithSampling(file: string) {
  // 获取文件时长
  const meta = await readVideoMeta(file);
  const duration = Number(meta.format.duration || 0);

  if (duration < 10) {
    // 如果文件时长小于10秒，直接识别
    return shazamRecognizeWithRetry(file);
  }

  const segmentDuration = 10; // 每段10秒
  const cachePath = getTempPath();

  // 计算四个采样点的开始时间
  // 第一个：0秒开始
  // 第二个：10秒开始
  // 第三个：中段
  // 第四个：尾段（倒数30秒处，避开结尾淡出）
  const startTimes = [
    0, // 第一段：从0秒开始
    10, // 第二段：从10秒开始
    Math.max(0, (duration - segmentDuration) / 2), // 第三段：中段
    Math.max(0, duration - 30), // 第四段：倒数30秒开始，避开结尾
  ];

  // 渐进式识别顺序：0 -> 1 -> 2 -> 3
  const recognitionOrder = [2, 3, 0, 1];

  // 辅助函数：提取单个片段
  const extractSegment = async (segmentIndex: number): Promise<string> => {
    const startTime = startTimes[segmentIndex];
    const endTime = Math.min(startTime + segmentDuration, duration);
    const fileName = `${uuid()}_segment_${segmentIndex}.wav`;

    // 人声增强滤镜
    // highpass=f=300: 去除低于300Hz的噪音
    // lowpass=f=3400: 去除高于3400Hz的噪音
    // equalizer=f=1000:width_type=h:width=500:g=3: 增强1000Hz附近的人声主频
    // equalizer=f=2000:width_type=h:width=1000:g=2: 增强2000Hz附近的人声谐波
    const audioFilter = [
      "highpass=f=300",
      "lowpass=f=3400",
      "equalizer=f=1000:width_type=h:width=500:g=3",
      "equalizer=f=2000:width_type=h:width=1000:g=2",
      "loudnorm=I=-16:TP=-1.5:LRA=11",
    ].join(",");

    const task = await addExtractAudioTask(file, fileName, {
      startTime: startTime,
      endTime: endTime,
      saveType: 2,
      savePath: cachePath,
      autoRun: true,
      addQueue: false,
      format: "pcm_s16le",
      audioFilter: audioFilter,
    });

    return new Promise((resolve, reject) => {
      task.on("task-end", () => {
        resolve(task.output as string);
      });
      task.on("task-error", (err) => {
        reject(err);
      });
    });
  };

  // 渐进式识别
  for (const segmentIndex of recognitionOrder) {
    let tempFile: string | null = null;
    try {
      // 提取片段
      tempFile = await extractSegment(segmentIndex);

      // 识别片段
      const result = await shazamRecognizeWithRetry(tempFile);

      if (result) {
        console.log(`Shazam 第 ${segmentIndex + 1} 段识别成功：`, JSON.stringify(result, null, 2));
        return result;
      }
    } finally {
      // 清理当前片段的临时文件
      if (tempFile) {
        try {
          await fs.remove(tempFile);
        } catch (error) {
          // 忽略删除错误
        }
      }
    }
  }

  // 所有段都识别失败
  console.log("Shazam 所有段都识别失败");
  return null;
}

/**
 * 使用 Shazam 识别歌曲，查询详细信息，查询歌词，简繁转化
 * @param file 输入音频文件
 * @param lyricOptimize 是否进行歌词优化，为false直接不用请求歌词接口
 * @returns
 */
export async function recognize(file: string, lyricOptimize: boolean) {
  const result = await shazamRecognizeWithSampling(file);
  // console.log("Shazam 识别结果：", JSON.stringify(result, null, 2));
  if (!result) return null;
  const info = await shazamQueryInfo(result.trackId);

  const appleMusicId = result.appleMusicId || info?.appleMusicId;
  const title = info?.title || result.title;
  const subtitle = info?.subtitle || "";
  let lyrics: string | null = null;
  if (lyricOptimize) {
    if (appleMusicId) {
      // TODO：歌词要简繁转换
      const webData = await shazamQueryLyrics(appleMusicId, title);
      lyrics = sify(webData?.lyrics || "");
    }
  }

  return { name: title, lyrics, subtitle: subtitle, appleMusicId: appleMusicId };
}
