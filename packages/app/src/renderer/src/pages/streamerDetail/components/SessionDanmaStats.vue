<template>
  <div class="session-stats">
    <div class="summary-grid">
      <div class="summary-item">
        <span>总弹幕</span>
        <strong>{{ formatNumber(session.totalDanmaNum) }}</strong>
      </div>
      <div class="summary-item" @click="$emit('toHistory', session)" style="cursor: pointer">
        <span>片段数</span>
        <strong>{{ session.clipCount }}</strong>
      </div>
      <div class="summary-item">
        <span>平均弹幕</span>
        <strong>{{ averagePerMinute }} 条/分钟</strong>
      </div>
      <div class="summary-item">
        <span>峰值</span>
        <strong>{{ peakLabel }}</strong>
      </div>
    </div>

    <template v-if="chartModel">
      <div class="chart-heading">
        <div>
          <strong>弹幕时间分布</strong>
          <span>按各录制片段的实际开始时间对齐</span>
        </div>
        <span class="chart-hint">悬停柱形查看详情</span>
      </div>

      <div class="chart-shell">
        <svg
          class="danma-chart"
          :viewBox="`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`"
          role="img"
          aria-label="本场直播各录制片段的弹幕时间分布"
        >
          <g class="grid-lines">
            <g v-for="tick in chartModel.yTicks" :key="tick.y">
              <line :x1="PLOT_LEFT" :x2="VIEW_WIDTH - PLOT_RIGHT" :y1="tick.y" :y2="tick.y" />
              <text :x="PLOT_LEFT - 8" :y="tick.y + 4" text-anchor="end">
                {{ tick.value }}
              </text>
            </g>
          </g>

          <g class="bars">
            <rect
              v-for="bar in chartModel.bars"
              :key="`${bar.clipId}-${bar.index}`"
              :x="bar.x"
              :y="bar.y"
              :width="bar.width"
              :height="bar.height"
              :fill="bar.color"
              rx="0.5"
            >
              <title>{{ bar.tooltip }}</title>
            </rect>
          </g>

          <g class="clip-track">
            <rect
              v-for="segment in chartModel.segments"
              :key="segment.id"
              :x="segment.x"
              :y="PLOT_BOTTOM + 10"
              :width="segment.width"
              height="10"
              :fill="segment.color"
              rx="3"
              opacity="0.7"
            >
              <title>{{ segment.tooltip }}</title>
            </rect>
          </g>

          <g class="x-axis">
            <g v-for="tick in chartModel.xTicks" :key="tick.timestamp">
              <line :x1="tick.x" :x2="tick.x" :y1="PLOT_BOTTOM + 22" :y2="PLOT_BOTTOM + 27" />
              <text :x="tick.x" :y="PLOT_BOTTOM + 42" text-anchor="middle">
                {{ tick.label }}
              </text>
            </g>
          </g>
        </svg>
      </div>

      <div class="clip-legend">
        <span v-for="segment in chartModel.segments" :key="segment.id">
          <i :style="{ backgroundColor: segment.color }"></i>
          {{ segment.label }} · {{ segment.timeRange }}
        </span>
      </div>
    </template>

    <n-empty v-else size="small" description="该场次暂无弹幕时间分布数据" />
  </div>
</template>

<script setup lang="ts">
import type { RecorderAPI } from "@biliLive-tools/http/types/recorder.js";

type Session = RecorderAPI["queryStreamerDetail"]["Resp"]["data"][number];

const props = defineProps<{
  session: Session;
}>();
const emits = defineEmits<{
  (e: "toHistory", session: Session): void;
}>();

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 250;
const PLOT_LEFT = 52;
const PLOT_RIGHT = 18;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 174;
const COLORS = ["#18a058", "#2080f0", "#f0a020", "#d03050", "#8a5cf5", "#00a6a6"];

const formatNumber = (value?: number | null) => Number(value || 0).toLocaleString();

const formatClock = (timestamp: number, withSeconds = false) => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return withSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
};

const averagePerMinute = computed(() => {
  if (!props.session.totalDuration) return "0";
  return ((props.session.totalDanmaNum / props.session.totalDuration) * 60).toFixed(1);
});

const chartModel = computed(() => {
  const clips = [...props.session.clips].sort(
    (left, right) => left.record_start_time - right.record_start_time,
  );
  if (!clips.some((clip) => clip.danmaTimeline)) return null;

  const segmentRanges = clips.map((clip, index) => {
    const timeline = clip.danmaTimeline;
    const timelineDuration = timeline ? timeline.data.length * timeline.interval : 0;
    const duration = Math.max(clip.video_duration || 0, timelineDuration, 1);
    return {
      clip,
      index,
      start: clip.record_start_time,
      end: Math.max(clip.record_end_time || 0, clip.record_start_time + duration * 1000),
    };
  });
  const start = Math.min(...segmentRanges.map((item) => item.start));
  const end = Math.max(...segmentRanges.map((item) => item.end));
  const range = Math.max(end - start, 1);
  const plotWidth = VIEW_WIDTH - PLOT_LEFT - PLOT_RIGHT;
  const plotHeight = PLOT_BOTTOM - PLOT_TOP;
  const toX = (timestamp: number) => PLOT_LEFT + ((timestamp - start) / range) * plotWidth;

  const rawBars = segmentRanges.flatMap(({ clip, index: clipIndex }) => {
    const timeline = clip.danmaTimeline;
    if (!timeline) return [];
    return timeline.data.map((count, index) => ({
      clip,
      clipIndex,
      index,
      count,
      timestamp: clip.record_start_time + index * timeline.interval * 1000,
      interval: timeline.interval,
    }));
  });
  const maxCount = Math.max(...rawBars.map((item) => item.count), 1);

  const bars = rawBars
    .filter((item) => item.count > 0)
    .map((item) => {
      const naturalWidth = (item.interval * 1000 * plotWidth) / range;
      const height = Math.max((item.count / maxCount) * plotHeight, 1);
      return {
        clipId: item.clip.id,
        index: item.index,
        x: toX(item.timestamp),
        y: PLOT_BOTTOM - height,
        width: Math.max(naturalWidth, 0.8),
        height,
        color: COLORS[item.clipIndex % COLORS.length],
        tooltip: `${formatClock(item.timestamp, true)}－${formatClock(
          item.timestamp + item.interval * 1000,
          true,
        )}：${item.count} 条弹幕（片段 ${item.clipIndex + 1}）`,
      };
    });

  const segments = segmentRanges.map(({ clip, index, start: clipStart, end: clipEnd }) => ({
    id: clip.id,
    label: `片段 ${index + 1}`,
    x: toX(clipStart),
    width: Math.max(toX(clipEnd) - toX(clipStart), 2),
    color: clip.danmaTimeline ? COLORS[index % COLORS.length] : "#aab2c0",
    timeRange: `${formatClock(clipStart, true)}–${formatClock(clipEnd, true)}`,
    tooltip: clip.danmaTimeline
      ? `片段 ${index + 1}：${formatClock(clipStart, true)}–${formatClock(
          clipEnd,
          true,
        )}，${formatNumber(clip.danma_num)} 条弹幕`
      : `片段 ${index + 1}：${formatClock(clipStart, true)}–${formatClock(
          clipEnd,
          true,
        )}，暂无时间分布数据`,
  }));

  const xTicks = Array.from({ length: 6 }, (_, index) => {
    const timestamp = start + (range * index) / 5;
    return {
      timestamp,
      x: toX(timestamp),
      label: formatClock(timestamp),
    };
  });
  const yTickCount = Math.min(maxCount, 4);
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, index) => {
    const value = Math.round((maxCount * index) / yTickCount);
    return {
      value,
      y: PLOT_BOTTOM - (plotHeight * value) / maxCount,
    };
  });
  const peak = rawBars.reduce<(typeof rawBars)[number] | null>(
    (current, item) => (!current || item.count > current.count ? item : current),
    null,
  );

  return { bars, segments, xTicks, yTicks, peak };
});

const peakLabel = computed(() => {
  const peak = chartModel.value?.peak;
  if (!peak || peak.count <= 0) return "--";
  return `${peak.count} 条/${peak.interval}秒 · ${formatClock(peak.timestamp, true)}`;
});
</script>

<style scoped lang="less">
.session-stats {
  padding: 18px;
  border-radius: 16px;
  background: rgba(248, 250, 253, 0.92);
  border: 1px solid rgba(215, 223, 235, 0.8);

  [data-theme="dark"] & {
    background: rgba(255, 255, 255, 0.035);
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.summary-item {
  display: grid;
  gap: 5px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);

  [data-theme="dark"] & {
    background: rgba(255, 255, 255, 0.05);
  }

  span {
    color: #7b8699;
    font-size: 12px;
  }

  strong {
    font-size: 17px;
  }
}

.chart-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 8px;

  div {
    display: grid;
    gap: 3px;
  }

  span {
    color: #7b8699;
    font-size: 12px;
  }
}

.chart-shell {
  width: 100%;
  overflow-x: auto;
}

.danma-chart {
  display: block;
  width: 100%;
  min-width: 720px;
  height: auto;
  color: #768196;

  text {
    fill: currentColor;
    font-size: 11px;
  }

  .grid-lines line {
    stroke: rgba(118, 129, 150, 0.2);
    stroke-width: 1;
  }

  .x-axis line {
    stroke: currentColor;
    stroke-width: 1;
  }
}

.clip-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: #667085;
  font-size: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
}

@media (max-width: 720px) {
  .session-stats {
    padding: 12px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-hint {
    display: none;
  }
}
</style>
