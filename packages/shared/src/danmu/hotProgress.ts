import fs from "fs-extra";
import path from "node:path";
import { compile } from "ass-compiler";
import { parseXmlFile } from "./index.js";
import { countByIntervalInSeconds } from "../utils/index.js";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import svgToPng from "./hotProgress.worker.js?modulePath";

import type { HotProgressOptions } from "@biliLive-tools/types";
import type { WorkerTask, WorkerResult } from "./hotProgress.worker.js";

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// 简单的 Worker Pool 管理器
class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: Array<{
    task: WorkerTask;
    resolve: (result: WorkerResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private workerPath: string;
  private poolSize: number;

  constructor(workerPath: string, poolSize: number = 4) {
    this.workerPath = workerPath;
    this.poolSize = poolSize;
    this.initWorkers();
  }

  private initWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerPath);
      this.workers.push(worker);
      this.availableWorkers.push(worker);

      worker.on("error", (error) => {
        console.error("Worker error:", error);
      });
    }
  }

  async run(task: WorkerTask): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processNextTask();
    });
  }

  private processNextTask() {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const worker = this.availableWorkers.shift()!;
    const { task, resolve, reject } = this.taskQueue.shift()!;

    // 为这个特定任务设置一次性消息监听器
    const messageHandler = (result: WorkerResult) => {
      worker.off("message", messageHandler);
      worker.off("error", errorHandler);
      resolve(result);
      // Worker 完成任务，将其标记为可用
      this.availableWorkers.push(worker);
      // 处理下一个任务
      this.processNextTask();
    };

    const errorHandler = (error: Error) => {
      worker.off("message", messageHandler);
      worker.off("error", errorHandler);
      reject(error);
      // 即使出错也要将 worker 放回可用列表
      this.availableWorkers.push(worker);
      // 处理下一个任务
      this.processNextTask();
    };

    worker.once("message", messageHandler);
    worker.once("error", errorHandler);

    worker.postMessage(task);
  }

  async destroy() {
    await Promise.all(this.workers.map((worker) => worker.terminate()));
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
  }
}

export const genTimeData = async (input: string): Promise<number[]> => {
  const ext = path.extname(input);
  if (ext === ".xml") {
    const { danmuku } = await parseXmlFile(input);
    return danmuku.map((item) => {
      const p = item["@_p"] as string;
      return Math.floor(Number(p.split(",")[0]));
    });
  } else if (ext === ".ass") {
    const content = await fs.readFile(input, "utf-8");
    const assData = compile(content, {});
    return assData["dialogues"].map((item) => Math.floor(item.start));
  } else {
    throw new Error("not support file");
  }
};

export const generateDanmakuData = async (
  input: string,
  options: {
    interval: number;
    duration: number;
    color: string;
  },
) => {
  const data = await genTimeData(input);
  let fData = data.filter((time) => time < options.duration).sort((a, b) => a - b);
  const countData = countByIntervalInSeconds(fData, options.interval, options.duration);
  return countData.map((item) => ({
    time: item.start,
    value: item.count,
    color: options.color,
  }));
};

// 生成高能弹幕图片
export const generateDanmakuImage = async (
  input: string,
  output: string,
  iOptions: WithRequired<HotProgressOptions, "duration">,
) => {
  const defaultOptions = {
    interval: 30,
    height: 60,
    width: 1920,
    color: "#f9f5f3",
    fillColor: "#333333",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
  };
  const options = Object.assign(defaultOptions, iOptions);

  const data = await generateDanmakuData(input, options);
  await fs.ensureDir(output);

  // 初始化 worker 线程池
  const pool = new WorkerPool(svgToPng);

  try {
    // 准备所有任务
    const tasks: WorkerTask[] = [];
    for (let i = 0; i < data.length; i++) {
      data[i].color = options.fillColor;
      const svg = generateSmoothLineChartSVG(data.slice(0, i + 1), options.width, options.height, {
        strokeWidth: options.strokeWidth,
        strokeLinecap: options.strokeLinecap,
      });

      const outputPath = path.join(output, `${String(i).padStart(4, "0")}.png`);

      tasks.push({
        svg,
        outputPath,
        width: options.width,
        height: options.height,
      });
    }
    console.log(tasks[0].svg, "\n");
    console.log(tasks[10].svg, "\n");

    // 并发执行所有任务
    const results = await Promise.all(tasks.map((task) => pool.run(task)));
    return;
    // 检查是否有失败的任务
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.warn(`${failures.length} 个图片生成失败`);
    }

    return data;
  } finally {
    // 确保清理线程池
    await pool.destroy();
  }
};

// 生成平滑折线图的 SVG
function generateSmoothLineChartSVG(
  data: Array<{ time: number; value: number; color: string }>,
  width: number,
  height: number,
  options: { strokeWidth?: number; strokeLinecap?: string } = {},
): string {
  const { strokeWidth = 2, strokeLinecap = "round" } = options;
  const length = data.length;
  const maxValue = Math.max(...data.map((item) => item.value));
  const xRation = width / (length - 1);
  const yRatio = height / (maxValue || 1); // 避免除以 0

  const points: Array<{ x: number; y: number; color: string }> = [];

  // 计算数据点的坐标
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const x = i * xRation;
    const y = height - item.value * yRatio;
    points.push({
      x: x,
      y: y,
      color: item.color ?? "#333333",
    });
  }

  const len = points.length;
  if (len < 2) {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"></svg>`;
  }

  // 找到颜色变化的分界点
  let colorChangeIndex = -1;
  for (let i = 1; i < len; i++) {
    if (points[i].color !== points[0].color) {
      colorChangeIndex = i;
      break;
    }
  }

  let paths = "";

  // 如果所有点都是同一颜色，生成一条完整的 path
  if (colorChangeIndex === -1) {
    let lastX = points[0].x;
    let lastY = points[0].y;
    let pathD = `M ${lastX} ${lastY}`;

    for (let i = 1; i < len - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      pathD += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
      lastX = xc;
      lastY = yc;
    }

    if (len === 2) {
      pathD += ` L ${points[1].x} ${points[1].y}`;
    }

    paths = `  <path d="${pathD}" fill="none" stroke="${points[0].color}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}"/>`;
  } else {
    // 生成前段 path（第一种颜色）
    let lastX = points[0].x;
    let lastY = points[0].y;
    let pathD1 = `M ${lastX} ${lastY}`;

    for (let i = 1; i < colorChangeIndex && i < len - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      pathD1 += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
      lastX = xc;
      lastY = yc;
    }

    paths += `  <path d="${pathD1}" fill="none" stroke="${points[0].color}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}"/>\n`;

    // 生成后段 path（第二种颜色）
    let pathD2 = `M ${lastX} ${lastY}`;

    for (let i = colorChangeIndex; i < len - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      pathD2 += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
      lastX = xc;
      lastY = yc;
    }

    if (colorChangeIndex === len - 1) {
      pathD2 += ` L ${points[len - 1].x} ${points[len - 1].y}`;
    }

    paths += `  <path d="${pathD2}" fill="none" stroke="${points[colorChangeIndex].color}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}"/>`;
  }

  // 构造完整的 SVG 字符串
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
${paths}
</svg>`;
}

// 期待使用drawvg滤镜重构的一天
// // # 设定线宽
// setlinewidth 2
// setlinecap round

// // # 定义一个随时间移动的线性渐变
// // # 渐变从左侧 0 延伸到右侧 w (视频宽度)
// // # 我们让渐变的截止位置根据时间 t 变化：(t / 60) 表示在 60s 内从 0 变到 1
// lineargrad 0 0 w 0
//   // # 在进度 (t/60) 之前的部分设为红色
//   colorstop (t / 60) red

//   // # 在进度 (t/60) 之后的部分设为深灰色 #333333
//   // # 增加一个极小的偏移量 (0.001) 让颜色切换处显得锋利
//   colorstop (t / 60 + 0.001) #333333

// // # 绘制贝塞尔曲线
// // M 50 (h/2)
// M 0 100 Q 69.1891891891892 16.551724137931032 103.78378378378379 13.44827586206896 Q 138.3783783783784 10.34482758620689 172.97297297297297 18.62068965517241 Q 207.56756756756758 26.89655172413793 242.1621621621622 28.96551724137931 Q 276.7567567567568 31.034482758620687 311.35135135135135 15.51724137931034 Q 345.94594594594594 -7.105427357601002e-15 380.5405405405405 10.344827586206893 Q 415.13513513513516 20.689655172413794 449.7297297297298 27.93103448275862 Q 484.3243243243244 35.172413793103445 518.918918918919 40.34482758620689 Q 553.5135135135135 45.51724137931034 588.1081081081081 44.48275862068965 Q 622.7027027027027 43.44827586206897 657.2972972972973 45.51724137931035 Q 691.8918918918919 47.58620689655172 726.4864864864865 44.48275862068965 Q 761.0810810810812 41.37931034482759 795.6756756756757 41.37931034482759 Q 830.2702702702703 41.37931034482759 864.8648648648649 39.310344827586206 Q 899.4594594594595 37.241379310344826 934.0540540540542 40.3448275862069 Q 968.6486486486488 43.44827586206897 1003.2432432432433 44.48275862068965 Q 1037.837837837838 45.51724137931034 1072.4324324324325 46.55172413793103 Q 1107.027027027027 47.58620689655172 1141.6216216216217 45.51724137931035 Q 1176.2162162162163 43.44827586206897 1210.8108108108108 43.44827586206897 Q 1245.4054054054054 43.44827586206897 1280 46.55172413793103 Q 1314.5945945945946 49.6551724137931 1349.1891891891892 49.6551724137931 Q 1383.7837837837837 49.6551724137931 1418.3783783783783 39.310344827586206 Q 1452.9729729729731 28.96551724137931 1487.5675675675677 28.96551724137931 Q 1522.1621621621623 28.96551724137931 1556.7567567567569 33.103448275862064 Q 1591.3513513513515 37.241379310344826 1625.945945945946 41.37931034482759 Q 1660.5405405405406 45.51724137931034 1695.1351351351352 39.310344827586206 Q 1729.7297297297298 33.103448275862064 1764.3243243243244 35.172413793103445 Q 1798.918918918919 37.241379310344826 1833.5135135135135 41.37931034482759 Q 1868.1081081081081 45.51724137931034 1902.702702702703 44.48275862068965 Q 1937.2972972972975 43.44827586206897 1971.891891891892 38.275862068965516 Q 2006.4864864864867 33.103448275862064 2041.0810810810813 33.103448275862064 Q 2075.675675675676 33.103448275862064 2110.2702702702704 44.48275862068965 Q 2144.864864864865 55.86206896551724 2179.4594594594596 52.758620689655174 Q 2214.054054054054 49.6551724137931 2248.6486486486488 47.58620689655172 Q 2283.2432432432433 45.51724137931034 2317.837837837838 37.241379310344826 Q 2352.4324324324325 28.96551724137931 2387.027027027027 34.13793103448276 Q 2421.6216216216217 39.310344827586206 2456.2162162162163 46.55172413793103 Q 2490.810810810811 53.79310344827586 2525.4054054054054 56.89655172413793
// // # 使用上面定义的渐变色进行描边
// stroke
