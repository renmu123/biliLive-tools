<template>
  <div class="subtitle-view">
    <!-- 顶部片段选择器 -->
    <div class="subtitle-header">
      <n-select
        v-model:value="selectedSegmentId"
        :options="segmentOptions"
        placeholder="请选择片段"
        size="small"
        clearable
      />
    </div>

    <!-- 内容区 -->
    <div class="subtitle-content">
      <!-- 未选中片段 -->
      <div v-if="!selectedSegmentId" class="empty-state">
        <n-empty description="请先选择一个片段" />
      </div>

      <!-- 已选中，无字幕 -->
      <div v-else-if="nodes.length === 0" class="empty-state">
        <n-empty description="当前片段暂无字幕" />
      </div>

      <!-- 字幕节点列表 -->
      <div v-else class="node-list">
        <div v-for="(node, idx) in nodes" :key="idx" class="node-item">
          <div class="node-body">
            <div class="node-text">
              <n-input
                :value="node.text"
                class="text-input"
                @update:value="(v) => updateNodeField(idx, 'text', v)"
                @blur="handleBlur"
                @dblclick="seekVideo(node.startSeconds)"
              />
            </div>
            <div class="node-right">
              <div class="node-times">
                <n-input
                  :value="node.startTime"
                  size="tiny"
                  class="time-input"
                  @update:value="(v) => updateNodeField(idx, 'startTime', v)"
                  @blur="handleBlur"
                />
                <n-input
                  :value="node.endTime"
                  size="tiny"
                  class="time-input"
                  @update:value="(v) => updateNodeField(idx, 'endTime', v)"
                  @blur="handleBlur"
                />
              </div>
            </div>
            <n-button text type="error" size="small" class="delete-btn" @click="deleteNode(idx)">
              <n-icon size="16"><TrashOutline /></n-icon>
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
    <div v-if="selectedSegmentId" class="subtitle-footer">
      <n-button size="small" dashed block @click="addNode">
        <n-icon size="14"><AddOutline /></n-icon>
        添加字幕行
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrashOutline, AddOutline } from "@vicons/ionicons5";
import SrtParser from "srt-parser-2";
import { useSegmentStore, useSubtitles } from "@renderer/stores";
import { secondsToTimemark } from "@renderer/utils";

import type VideoPlayer from "./components/VideoPlayer.vue";

const videoInstance = inject("videoInstance") as Ref<InstanceType<typeof VideoPlayer>>;
const segmentStore = useSegmentStore();
const { cuts } = storeToRefs(segmentStore);
const subtitleStore = useSubtitles();

const selectedSegmentId = ref<string | null>(null);

// 下拉选项：片段名 + 时间范围
const segmentOptions = computed(() =>
  cuts.value.map((seg) => ({
    label: `${seg.name}（${secondsToTimemark(seg.start)} - ${secondsToTimemark(seg.end ?? 0)}）`,
    value: seg.id,
  })),
);

// SRT 解析器
const parser = new SrtParser();

// 当前编辑的节点列表（本地可变副本）
interface SrtNode {
  id: string;
  startTime: string;
  startSeconds: number;
  endTime: string;
  endSeconds: number;
  text: string;
}

const nodes = ref<SrtNode[]>([]);

// 当选中片段变化时重新加载字幕
watch(
  selectedSegmentId,
  (id) => {
    if (!id) {
      nodes.value = [];
      return;
    }
    loadNodes(id);
  },
  { immediate: true },
);

// 当字幕 store 变化时同步（例如外部合并操作），用 flag 防止 flushToStore 触发自身回调
let isFlushing = false;
watch(
  () => subtitleStore.items.map((i) => i.id + i.content).join("|"),
  () => {
    if (isFlushing) return;
    if (selectedSegmentId.value) {
      loadNodes(selectedSegmentId.value);
    }
  },
);

function loadNodes(segmentId: string) {
  const subtitles = subtitleStore.getBySourceId(segmentId);
  if (subtitles.length === 0) {
    nodes.value = [];
    return;
  }
  try {
    nodes.value = parser.fromSrt(subtitles[0].content) as SrtNode[];
  } catch {
    nodes.value = [];
  }
  console.log("Loaded nodes:", nodes.value);
}

let isDirty = false;

function updateNodeField(idx: number, field: keyof SrtNode, value: string) {
  isDirty = true;
  (nodes.value[idx] as any)[field] = value;
}

function deleteNode(idx: number) {
  nodes.value.splice(idx, 1);
  flushToStore();
}

function addNode() {
  const start = videoInstance.value.currentTime ?? 0;
  const end = start + 4;

  const newNode: SrtNode = {
    id: String(nodes.value.length + 1),
    startTime: formatTime(start),
    startSeconds: start,
    endTime: formatTime(end),
    endSeconds: end,
    text: "",
  };
  nodes.value.push(newNode);
  flushToStore();
}

const handleBlur = () => {
  if (!isDirty) return;
  isDirty = false;
  flushToStore();
};

/** 将当前 nodes 写回 subtitleStore */
function flushToStore() {
  if (!selectedSegmentId.value) return;

  // 重新计算 startSeconds / endSeconds（从 startTime/endTime 字符串解析）
  const validNodes = nodes.value
    .map((n) => ({
      ...n,
      startSeconds: parseTimeToSeconds(n.startTime),
      endSeconds: parseTimeToSeconds(n.endTime),
    }))
    .filter((n) => n.startSeconds < n.endSeconds);

  if (validNodes.length === 0) {
    isFlushing = true;
    subtitleStore.removeBySourceId(selectedSegmentId.value);
    nextTick(() => {
      isFlushing = false;
    });
    return;
  }

  // 重新编号
  validNodes.forEach((n, i) => {
    n.id = String(i + 1);
  });

  try {
    const srtContent = parser.toSrt(validNodes as any);
    isFlushing = true;
    subtitleStore.setForSegment(selectedSegmentId.value, srtContent);
    nextTick(() => {
      isFlushing = false;
    });

    const combinedLyrics = segmentStore.getCombinedLyrics();
    videoInstance.value.artplayerPluginSubtitle.setContent(combinedLyrics, "srt");
  } catch (e) {
    isFlushing = false;
    console.error("生成 SRT 失败:", e);
  }
}

const seekVideo = (seconds: number) => {
  videoInstance.value.seek = seconds + 0.01;
};

/** 秒数 → SRT 时间字符串 HH:MM:SS,mmm */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

/** SRT 时间字符串 → 秒数 */
function parseTimeToSeconds(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!match) return 0;
  return (
    parseInt(match[1]) * 3600 +
    parseInt(match[2]) * 60 +
    parseInt(match[3]) +
    parseInt(match[4]) / 1000
  );
}
</script>

<style scoped lang="less">
.subtitle-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.subtitle-header {
  padding: 8px;
  border-bottom: 1px solid var(--n-border-color, #e0e0e0);
  flex-shrink: 0;
}

.subtitle-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background-color: rgba(255, 255, 255, 0.2);
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.node-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  // padding: 3px 4px;
  // border: 1px solid var(--n-border-color, #e0e0e0);
  border-radius: 4px;

  .node-index {
    font-size: 11px;
    color: #888;
  }

  .node-body {
    display: flex;
    gap: 6px;
    align-items: stretch;
    position: relative;

    .node-text {
      flex: 1;
      min-width: 0;
      .text-input {
        width: 100%;
        height: 100%;

        :deep(.n-input__input-el) {
          height: 100%;
        }
      }
    }

    .node-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
      position: relative;

      .node-times {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;

        .time-input {
          width: 100px;
          font-size: 11px;
        }

        .arrow {
          font-size: 11px;
          color: #888;
        }
      }
    }

    .delete-btn {
      position: absolute;
      top: -6px;
      right: -6px;
      display: none;
    }
    &:hover {
      .delete-btn {
        display: block;
      }
    }
  }
}

.subtitle-footer {
  padding: 6px 8px;
  border-top: 1px solid var(--n-border-color, #e0e0e0);
  flex-shrink: 0;
}
</style>
