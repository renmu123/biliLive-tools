/**
 * 阿里云 ASR 测试示例
 *
 * 使用前请确保：
 * 1. 在 AISetting.vue 中配置了阿里云 API Key
 * 2. 准备好要识别的音频文件
 */

import { AliyunASR } from "../index.js";

// 示例 1: 识别在线音频文件
async function example1() {
  console.log("=== 示例 1: 识别在线音频文件 ===");

  const asr = new AliyunASR({
    apiKey: process.env.DASHSCOPE_API_KEY || "your-api-key",
  });

  try {
    const result = await asr.recognize(
      "https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_female2.wav",
    );

    console.log("识别结果:", result.transcripts?.[0]?.text);
  } catch (error) {
    console.error("识别失败:", error);
  }
}

// 示例 2: 识别本地音频文件（自动上传）
async function example2() {
  console.log("\n=== 示例 2: 识别本地音频文件 ===");

  const asr = new AliyunASR({
    apiKey: process.env.DASHSCOPE_API_KEY || "your-api-key",
  });

  try {
    // 替换为您的本地文件路径
    const result = await asr.recognizeLocalFile("./test-audio.mp3");

    console.log("识别结果:");
    console.log("- 音频格式:", result.properties.audio_format);
    console.log("- 采样率:", result.properties.original_sampling_rate, "Hz");
    console.log("- 时长:", result.properties.original_duration_in_milliseconds, "ms");
    console.log("- 转写文本:", result.transcripts?.[0]?.text);
  } catch (error) {
    console.error("识别失败:", error);
  }
}

// 示例 3: 说话人分离
async function example3() {
  console.log("\n=== 示例 3: 说话人分离 ===");

  const asr = new AliyunASR({
    apiKey: process.env.DASHSCOPE_API_KEY || "your-api-key",
  });

  try {
    const result = await asr.recognize(
      "https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_female2.wav",
      {
        diarizationEnabled: true,
        speakerCount: 2,
        languageHints: ["zh", "en"],
      },
    );

    console.log("识别结果（带说话人信息）:");
    const sentences = result.transcripts?.[0]?.sentences || [];
    sentences.forEach((sentence, index) => {
      console.log(`${index + 1}. [说话人${sentence.speakerId}] ${sentence.text}`);
      console.log(`   时间: ${sentence.begin_time}ms - ${sentence.end_time}ms`);
    });
  } catch (error) {
    console.error("识别失败:", error);
  }
}

// 示例 4: 手动控制流程
async function example4() {
  console.log("\n=== 示例 4: 手动控制流程 ===");

  const asr = new AliyunASR({
    apiKey: process.env.DASHSCOPE_API_KEY || "your-api-key",
  });

  try {
    // 步骤 1: 上传本地文件
    console.log("1. 上传文件...");
    const fileUrl = await asr.uploadToTmpfiles("./test-audio.mp3");
    console.log("   文件URL:", fileUrl);

    // 步骤 2: 提交识别任务
    console.log("2. 提交识别任务...");
    const taskId = await asr.submitTask({
      fileUrl: fileUrl,
      channelId: [0],
    });
    console.log("   任务ID:", taskId);

    // 步骤 3: 轮询等待任务完成
    console.log("3. 等待任务完成...");
    const result = await asr.waitForCompletion(taskId, {
      interval: 2000, // 每 2 秒查询一次
      maxWaitTime: 5 * 60 * 1000, // 最长等待 5 分钟
    });
    console.log("   任务状态:", result.taskStatus);

    // 步骤 4: 下载识别结果
    if (result.results?.[0]?.transcription_url) {
      console.log("4. 下载识别结果...");
      const detail = await asr.downloadTranscription(result.results[0].transcription_url);
      console.log("   识别文本:", detail.transcripts?.[0]?.text);
    }
  } catch (error) {
    console.error("处理失败:", error);
  }
}

// 示例 5: 循环识别多个文件
async function example5() {
  console.log("\n=== 示例 5: 循环识别多个文件 ===");

  const asr = new AliyunASR({
    apiKey: process.env.DASHSCOPE_API_KEY || "your-api-key",
  });

  const fileUrls = [
    "https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_female2.wav",
    "https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_male2.wav",
  ];

  try {
    console.log(`开始识别 ${fileUrls.length} 个文件...`);

    for (let i = 0; i < fileUrls.length; i++) {
      console.log(`\n识别文件 ${i + 1}/${fileUrls.length}:`);
      const result = await asr.recognize(fileUrls[i]);

      console.log("- 文件URL:", result.file_url);
      console.log("- 转写文本:", result.transcripts?.[0]?.text);
      console.log("- 语音时长:", result.transcripts?.[0]?.content_duration_in_milliseconds, "ms");
    }

    console.log(`\n成功识别完成 ${fileUrls.length} 个文件`);
  } catch (error) {
    console.error("识别失败:", error);
  }
}

// 运行示例
async function main() {
  console.log("阿里云 ASR 测试示例\n");

  // 取消注释要运行的示例
  // await example1();
  // await example2();
  // await example3();
  // await example4();
  // await example5();

  console.log("\n测试完成！");
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { example1, example2, example3, example4, example5 };
