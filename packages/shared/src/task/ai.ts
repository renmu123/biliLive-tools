import fs from "fs-extra";
import { AliyunASR, TranscriptionDetail, QwenLLM } from "../ai/index.js";

const apiKey = "sk-";

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
    apiKey: apiKey,
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

// const Song = z.object({
//   name: z.string().describe("歌曲名称，如果无法判断则返回空字符串"),
// });

/**
 * 使用通义千问 LLM 示例
 */
export async function llm(message: string, systemPrompt?: string) {
  console.log("=== 示例: 使用通义千问 LLM ===");

  const llm = new QwenLLM({
    apiKey: apiKey, // 请替换为实际的 API Key
    model: "qwen-plus",
  });

  try {
    const response = await llm.sendMessage(message, systemPrompt, {
      // responseFormat: zodResponseFormat(Song, "song"),
    });

    if ("content" in response) {
      console.log("提问:", response);
      console.log("回复:", response.content);
      console.log("Token 使用:", response.usage);
      return response;
    }
  } catch (error) {
    console.error("LLM 请求失败:", error);
  }
}
