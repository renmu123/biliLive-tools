/**
 * ASR 测试示例
 *
 * 使用前请确保：
 * 1. 在 AISetting.vue 中配置了相应的 API Key
 * 2. 准备好要识别的音频文件
 */

import { AliyunASR, OpenAIWhisperASR, createASRProvider } from "../index.js";

// 示例 1: 识别在线音频文件（阿里云）
async function example1() {
  console.log("=== 示例 1: 识别在线音频文件（阿里云）===");

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

// 示例 2: 识别本地音频文件（阿里云，自动上传）
async function example2() {
  console.log("\n=== 示例 2: 识别本地音频文件（阿里云）===");

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

// 示例 3: 使用 OpenAI Whisper 识别本地文件
async function example3() {
  console.log("\n=== 示例 3: 使用 OpenAI Whisper 识别 ===");

  const asr = new OpenAIWhisperASR({
    apiKey: process.env.OPENAI_API_KEY || "your-api-key",
    baseURL: "https://api.openai.com/v1", // 可选，支持 Azure OpenAI 或其他兼容端点
    model: "whisper-1",
  });

  try {
    const result = await asr.recognizeLocalFile("./test-audio.mp3", {
      language: "zh", // 指定语言可以提高准确度
      prompt: "这是一段关于技术的讨论", // 可选的提示文本
    });

    console.log("识别结果:");
    console.log("- 语言:", result.language);
    console.log("- 时长:", result.duration, "秒");
    console.log("- 转写文本:", result.text);
    console.log("- 分段数量:", result.segments.length);

    // 显示前3个分段
    result.segments.slice(0, 3).forEach((seg, i) => {
      console.log(
        `  段落 ${i + 1}: [${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s] ${seg.text}`,
      );
    });
  } catch (error) {
    console.error("识别失败:", error);
  }
}

// 示例 4: 使用适配器（推荐方式）- 根据 modelId 自动选择提供商
async function example4() {
  console.log("\n=== 示例 4: 使用适配器（推荐）===");

  try {
    // 假设在配置中设置了 modelId
    // 工厂函数会自动根据 modelId 查找对应的 vendor 和 provider
    const modelId = "116497be-e650-4b21-8769-536859cb16dc"; // 阿里云 fun-asr
    // const modelId = "a1b2c3d4-5678-90ab-cdef-1234567890ab"; // OpenAI whisper-1

    const asr = createASRProvider(modelId);

    const result = await asr.recognizeLocalFile("./test-audio.mp3");

    console.log("标准格式识别结果:");
    console.log("- 完整文本:", result.text);
    console.log("- 时长:", result.duration, "秒");
    console.log("- 语言:", result.language || "未知");
    console.log("- 分段数量:", result.segments.length);

    // 显示分段信息
    result.segments.slice(0, 3).forEach((seg) => {
      console.log(`  [${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s] ${seg.text}`);
      if (seg.speaker) {
        console.log(`    说话人: ${seg.speaker}`);
      }
    });

    // 词级别信息（如果有）
    if (result.words && result.words.length > 0) {
      console.log("- 词级别时间戳数量:", result.words.length);
      console.log("  示例:", result.words.slice(0, 3));
    }
  } catch (error) {
    console.error("识别失败:", error);
  }
}

// 示例 5: 说话人分离（阿里云）
async function example5() {
  console.log("\n=== 示例 5: 说话人分离（阿里云）===");

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

// 示例 6: 手动控制流程（阿里云）
async function example6() {
  console.log("\n=== 示例 6: 手动控制流程（阿里云）===");

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

// 示例 7: 循环识别多个文件
async function example7() {
  console.log("\n=== 示例 7: 循环识别多个文件 ===");

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
  console.log("ASR 测试示例\n");

  // 取消注释要运行的示例
  // await example1(); // 阿里云在线文件
  // await example2(); // 阿里云本地文件
  // await example3(); // OpenAI Whisper
  // await example4(); // 使用适配器（推荐）
  // await example5(); // 说话人分离
  // await example6(); // 手动控制流程
  // await example7(); // 批量识别

  console.log("\n测试完成！");
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { example1, example2, example3, example4, example5, example6, example7 };
