import type Artplayer from "artplayer";

type DanmaKu = number[];

interface Options {
  sampling?: number;
  height?: number;
  color?: string;
  fillColor?: string;
}

/**
 * 根据时间间隔统计有序时间数组的计数（起始时间默认为 0）
 * @param times 时间数组（以秒为单位）
 * @param interval 时间间隔（秒）
 * @param maxTime 最大时间（秒），超过此时间的时间点将被丢弃
 * @returns 一个数组，每个元素表示该时间间隔内的计数
 */
export function countByIntervalInSeconds(
  times: number[],
  interval: number,
  maxTime: number,
): { start: number; count: number }[] {
  const result: { start: number; count: number }[] = [];
  let currentIntervalStart = 0; // 当前分组的起始时间固定为 0
  let count = 0;

  for (const time of times) {
    if (time >= maxTime) break; // 超过最大时间，停止计数

    while (time >= currentIntervalStart + interval) {
      // 时间超出当前分组范围，保存当前分组并移动到下一个分组
      result.push({ start: currentIntervalStart, count });
      currentIntervalStart += interval;
      count = 0; // 重置计数
    }
    count++; // 当前时间点计入当前分组
  }

  result.push({ start: currentIntervalStart, count });

  // 按间隔补齐到 maxTime
  while (currentIntervalStart + interval <= maxTime) {
    currentIntervalStart += interval;
    result.push({ start: currentIntervalStart, count: 0 });
  }

  return result;
}

/**
 * 将点集归一化到指定的宽度和高度
 */
export function normalizePoints(points: { x: number; y: number }[], width: number, height: number) {
  const xMin = Math.min(...points.map((p) => p.x));
  const xMax = Math.max(...points.map((p) => p.x));
  const yMin = Math.min(...points.map((p) => p.y));
  const yMax = Math.max(...points.map((p) => p.y));

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  if (xRange === 0 || yRange === 0) {
    return points.map(() => ({
      x: 0,
      y: 0,
    }));
  }

  return points.map((p) => ({
    x: ((p.x - xMin) / xRange) * width,
    y: ((p.y - yMin) / yRange) * height,
  }));
}

export default function artplayerPluginHeatmap(danmuku: DanmaKu = [], options: Options = {}) {
  return (art: Artplayer) => {
    const requiredOptions = Object.assign(
      {
        sampling: 10,
        height: 20,
        fillColor: "#f9f5f3",
        color: "#333333",
      },
      options,
    );
    heatmap(art, danmuku, requiredOptions);

    return {
      name: "artplayerPluginHeatmap",
      setData(data: DanmaKu) {
        // @ts-ignore
        art.emit("artplayerPluginHeatmap:setPoints", data);
      },
      setOptions(options: Options) {
        // @ts-ignore
        art.emit("artplayerPluginHeatmap:setOptions", options);
      },
      show() {
        // @ts-ignore
        art.emit("artplayerPluginHeatmap:show");
      },
      hide() {
        // @ts-ignore
        art.emit("artplayerPluginHeatmap:hide");
      },
    };
  };
}

function heatmap(art: Artplayer, danmuku: DanmaKu, options: Required<Options>) {
  art.controls.add({
    name: "heatmap",
    position: "top",
    html: "",
    style: {
      position: "absolute",
      top: `-${options.height}px`,
      left: "0px",
      right: "0px",
      height: `${options.height}px`,
      width: "100%",
      pointerEvents: "none",
    },
    mounted($heatmap) {
      let ininData = danmuku;

      let danmaPoints: {
        x: number;
        y: number;
      }[] = [];

      /**
       * 生成高能弹幕进度条所需参数
       */
      const draw = async (options: {
        width: number;
        height: number;
        sampling: number;
        duration: number;
      }) => {
        if (options.sampling <= 0) {
          console.error("Sampling interval must be greater than 0");
          return;
        }
        let fData = ininData.sort((a, b) => a - b);
        const countData = countByIntervalInSeconds(fData, options.sampling, art.duration);
        danmaPoints = normalizePoints(
          countData.map((item) => ({ x: item.start, y: item.count })),
          options.width,
          options.height,
        );

        const canvas = $heatmap.getElementsByTagName("canvas")[0];
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = options.width;
        canvas.height = options.height;

        ctx.scale(1, -1);
        ctx.translate(0, -options.height);
        drawSmoothCurve(canvas, ctx, 0);
      };

      /**
       * 绘制平滑曲线
       * @param points 点集
       * @param ctx 画布上下文
       */
      function drawSmoothCurve(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        width: number,
      ) {
        if (danmaPoints.length === 0) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制红色部分
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, canvas.height); // 红色区域的剪辑
        ctx.clip();
        drawEntireLine(ctx, options.color, danmaPoints);
        ctx.restore();

        // 绘制蓝色部分
        ctx.save();
        ctx.beginPath();
        ctx.rect(width, 0, canvas.width - width, canvas.height); // 蓝色区域的剪辑
        ctx.clip();
        drawEntireLine(ctx, options.fillColor, danmaPoints);
        ctx.restore();
      }

      function drawEntireLine(
        ctx: CanvasRenderingContext2D,
        color: string,
        points: { x: number; y: number }[],
      ) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y); // 起点

        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];

          const xc = (p1.x + p2.x) / 2;
          const yc = (p1.y + p2.y) / 2;

          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      function init() {
        $heatmap.innerHTML = `<canvas></canvas>`;

        if (!art.duration || art.option.isLive) return;
        draw({
          width: $heatmap.offsetWidth,
          height: options.height,
          sampling: options.sampling,
          duration: art.duration,
        });
      }

      function update(width: number) {
        const canvas = $heatmap.getElementsByTagName("canvas")[0];
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        drawSmoothCurve(canvas, ctx, width);
      }

      art.on("video:timeupdate", () => {
        update(art.played * $heatmap.offsetWidth);
      });

      art.on("setBar", (type, percentage) => {
        if (type === "played") {
          update(percentage * $heatmap.offsetWidth);
        }
      });

      art.on("ready", () => {
        ininData = danmuku;
        init();
      });
      art.on("resize", () => {
        init();
      });

      // @ts-ignore
      art.on("artplayerPluginHeatmap:setPoints", (points: DanmaKu) => {
        ininData = points;
        init();
      });

      // @ts-ignore
      art.on("artplayerPluginHeatmap:setOptions", (newOptions: Options) => {
        Object.assign(options, newOptions);
        $heatmap.style.top = `-${options.height}px`;
        $heatmap.style.height = `${options.height}px`;

        init();
        const width = art.played * $heatmap.offsetWidth;
        update(width);
      });

      // @ts-ignore
      art.on("artplayerPluginHeatmap:show", () => {
        $heatmap.style.display = "block";
      });
      // @ts-ignore
      art.on("artplayerPluginHeatmap:hide", () => {
        $heatmap.style.display = "none";
      });
    },
  });
}
