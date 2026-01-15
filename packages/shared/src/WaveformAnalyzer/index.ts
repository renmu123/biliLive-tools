// import fs from "fs/promises";
// import { readFile } from "fs/promises";
export { AudiowaveformData, AnalyzerConfig, DEFAULT_CONFIG, AudioSegment } from "./types.js";
export { BoundaryDetector } from "./detector.js";
// import JSON5 from "json5";

// AcoustID 音频识别功能
export {
  type AcoustIDConfig,
  type AcoustIDLookupParams,
  type AcoustIDResponse,
  type AcoustIDResult,
  type AcoustIDRecording,
} from "./types.js";
export { AcoustIDClient, createAcoustIDClient } from "./acoustid.js";

// /**
//  * 格式化时间（秒 -> mm:ss.ms）
//  */
// function formatTime(seconds: number): string {
//   const mins = Math.floor(seconds / 60);
//   const secs = Math.floor(seconds % 60);
//   const ms = Math.floor((seconds % 1) * 1000);
//   return `${mins.toString().padStart(2, "0")}:${secs
//     .toString()
//     .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
// }

// /**
//  * 打印片段信息
//  */
// function printSegments(segments: AudioSegment[]): void {
//   console.log("\n========== 检测到的片段 ==========\n");
//   console.log("序号 | 类型    | 起始时间  | 结束时间  | 时长(秒) | 置信度 | 平均能量");
//   console.log("-----|---------|-----------|-----------|----------|--------|----------");

//   const data: any[] = [];
//   segments.forEach((seg, idx) => {
//     const duration = (seg.endTime - seg.startTime).toFixed(2);
//     const typeStr = seg.type.padEnd(7);
//     const confidence = (seg.confidence * 100).toFixed(1) + "%";

//     if (typeStr !== "singing") return;
//     data.push({
//       start: seg.startTime,
//       end: seg.endTime,
//       name: "",
//     });
//     console.log(
//       `${(idx + 1).toString().padStart(4)} | ${typeStr} | ${formatTime(
//         seg.startTime,
//       )} | ${formatTime(seg.endTime)} | ${duration.padStart(
//         8,
//       )} | ${confidence.padStart(6)} | ${seg.avgEnergy.toFixed(2)}`,
//     );
//   });
//   fs.writeFile(
//     "segments.json",
//     JSON5.stringify(
//       {
//         version: 1,
//         mediaFileName: "【直播回放】唱歌聊天小播~ 2026年01月10日19点场.mp4",
//         cutSegments: data,
//       },
//       null,
//       2,
//     ),
//     "utf-8",
//   );
//   console.log("\n==================================\n");
// }

// /**
//  * 打印摘要统计
//  */
// function printSummary(summary: {
//   totalDuration: number;
//   singingDuration: number;
//   talkingDuration: number;
//   silenceDuration: number;
// }): void {
//   console.log("========== 摘要统计 ==========\n");
//   console.log(
//     `总时长:   ${formatTime(summary.totalDuration)} (${summary.totalDuration.toFixed(2)}秒)`,
//   );
//   console.log(
//     `唱歌时长: ${formatTime(summary.singingDuration)} (${summary.singingDuration.toFixed(2)}秒, ${(
//       (summary.singingDuration / summary.totalDuration) *
//       100
//     ).toFixed(1)}%)`,
//   );
//   console.log(
//     `说话时长: ${formatTime(summary.talkingDuration)} (${summary.talkingDuration.toFixed(2)}秒, ${(
//       (summary.talkingDuration / summary.totalDuration) *
//       100
//     ).toFixed(1)}%)`,
//   );
//   console.log(
//     `静音时长: ${formatTime(summary.silenceDuration)} (${summary.silenceDuration.toFixed(2)}秒, ${(
//       (summary.silenceDuration / summary.totalDuration) *
//       100
//     ).toFixed(1)}%)`,
//   );
//   console.log("\n=============================\n");
// }

// /**
//  * 主函数
//  */
// async function main() {
//   try {
//     console.log("=== Audiowaveform 数据分析器 ===\n");

//     // 1. 读取数据文件
//     console.log("正在加载 data.json...");
//     const dataPath = "data2.json";
//     const fileContent = await readFile(dataPath, "utf-8");
//     const data: AudiowaveformData = JSON.parse(fileContent);

//     console.log(`✓ 数据加载成功`);
//     console.log(`  - 采样率: ${data.sample_rate} Hz`);
//     console.log(`  - 通道数: ${data.channels}`);
//     console.log(`  - 每像素采样数: ${data.samples_per_pixel}`);
//     console.log(`  - 数据数组长度: ${data.data.length} (成对 [max, min])`);
//     // data 是 [max, min] 成对的，所以实际点数是 length / 2
//     const actualDataPoints = data.data.length / 2;
//     const actualDuration = (actualDataPoints * data.samples_per_pixel) / data.sample_rate;
//     console.log(`  - 音频时长: ${formatTime(actualDuration)} (${actualDuration.toFixed(2)}秒)\n`);

//     // 2. 使用默认配置创建检测器
//     const config: AnalyzerConfig = {
//       ...DEFAULT_CONFIG,
//       // 可以在这里调整参数
//       windowSize: 3.0, // 窗口大小（秒）- 增大让分析更平滑
//       singingEnergyThreshold: 1.1, // 唱歌能量阈值倍数 - 降低以减少漏检
//       talkingEnergyThreshold: 0.7, // 说话能量阈值倍数
//       minSegmentDuration: 10.0, // 最小片段时长（秒）- 增大过滤短片段
//       mergeGap: 20.0, // 合并间隔（秒）- 增大合并相邻片段
//       silenceThreshold: 30, // 静音阈值
//     };

//     console.log("配置参数:");
//     console.log(`  - 窗口大小: ${config.windowSize}秒`);
//     console.log(`  - 窗口重叠: ${config.windowOverlap * 100}%`);
//     console.log(`  - 唱歌阈值倍数: ${config.singingEnergyThreshold}x`);
//     console.log(`  - 说话阈值倍数: ${config.talkingEnergyThreshold}x`);
//     console.log(`  - 最小片段时长: ${config.minSegmentDuration}秒`);
//     console.log(`  - 合并间隔: ${config.mergeGap}秒\n`);

//     // 3. 创建检测器并分析
//     console.log("正在分析波形数据...\n");
//     const detector = new BoundaryDetector(data, config);
//     const segments = detector.detectSegments();

//     // 4. 显示结果
//     printSegments(segments);

//     // 5. 显示摘要
//     const summary = detector.getSummary(segments);
//     printSummary(summary);

//     // 6. 输出 JSON 格式结果
//     console.log("========== JSON 输出 ==========\n");
//     // console.log(JSON.stringify(segments, null, 2));
//     console.log("\n===============================\n");

//     console.log("✓ 分析完成！");
//   } catch (error) {
//     console.error("❌ 错误:", error);
//     process.exit(1);
//   }
// }

// export async function index(videoPath: string) {
//   const fileContent = await readFile(dataPath, "utf-8");
//   const data: AudiowaveformData = JSON.parse(fileContent);
//   const config: AnalyzerConfig = {
//     ...DEFAULT_CONFIG,
//     // 可以在这里调整参数
//     windowSize: 3.0, // 窗口大小（秒）- 增大让分析更平滑
//     singingEnergyThreshold: 1.1, // 唱歌能量阈值倍数 - 降低以减少漏检
//     talkingEnergyThreshold: 0.7, // 说话能量阈值倍数
//     minSegmentDuration: 10.0, // 最小片段时长（秒）- 增大过滤短片段
//     mergeGap: 20.0, // 合并间隔（秒）- 增大合并相邻片段
//     silenceThreshold: 30, // 静音阈值
//   };
//   const detector = new BoundaryDetector(data, config);
//   const segments = detector.detectSegments();
// }

// 运行主函数
// main();
