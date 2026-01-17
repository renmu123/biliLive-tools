import fs from "fs-extra";
import { AliyunASR, TranscriptionDetail } from "../ai/index.js";

/**
 * 音乐字幕优化
 */
function optimizeMusicSubtitles(results: TranscriptionDetail): TranscriptionDetail {
  // 去除"，"、“。”等标点符号
  const transcripts = results.transcripts?.map((transcript) => {
    const optimizedSentences = transcript.sentences?.map((sentence) => {
      let optimizedText = sentence.text.replace(/[，。、“”‘’！？]/g, " ");
      return {
        ...sentence,
        text: optimizedText,
      };
    });

    return {
      ...transcript,
      sentences: optimizedSentences,
    };
  });
  return {
    ...results,
    transcripts: transcripts,
  };
}

export async function asrRecognize() {
  console.log("=== 示例 1: 识别在线音频文件 ===");

  const asr = new AliyunASR({
    apiKey: "sk-",
  });

  try {
    const results = await asr.recognize("https://tmpfiles.org/dl/20231190/22.mp3");

    console.log("识别结果:", results.transcripts?.[0]);

    const srtData = asr.convert2Srt(optimizeMusicSubtitles(results));
    await fs.writeFile("./output.srt", srtData, "utf-8");
    console.log("已将字幕保存到 output.srt 文件");
    return results;
  } catch (error) {
    console.error("识别失败:", error);
  }
}
