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
            <n-dropdown
              trigger="click"
              placement="bottom-end"
              :options="getNodeActions(idx)"
              @select="(key) => handleNodeAction(key, idx)"
            >
              <n-button text size="small" class="node-handle" aria-label="字幕行操作">
                <n-icon size="16"><EllipsisVertical /></n-icon>
              </n-button>
            </n-dropdown>
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
import { AddOutline, EllipsisVertical } from "@vicons/ionicons5";
import SrtParser from "srt-parser-2";
import { useSegmentStore, useSubtitles } from "@renderer/stores";
import { secondsToTimemark } from "@renderer/utils";

import type VideoPlayer from "./components/VideoPlayer.vue";

const videoInstance = inject("videoInstance") as Ref<InstanceType<typeof VideoPlayer>>;
const segmentStore = useSegmentStore();
const { cuts } = storeToRefs(segmentStore);
const subtitleStore = useSubtitles();

const selectedSegmentId = ref<string | null>(null);

// 下拉选项：全局字幕 + 片段名 + 时间范围
const segmentOptions = computed(() => [
  { label: "全局字幕", value: "__global__" },
  ...cuts.value.map((seg) => ({
    label: `${seg.name}（${secondsToTimemark(seg.start)} - ${secondsToTimemark(seg.end ?? 0)}）`,
    value: seg.id,
  })),
]);

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

type NodeAction = "insert-before" | "insert-after" | "merge-previous" | "merge-next" | "delete";

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
  // 处理全局字幕
  if (segmentId === "__global__") {
    const globalSubtitles = subtitleStore.getGlobal();
    if (globalSubtitles.length === 0) {
      nodes.value = [];
      return;
    }
    try {
      nodes.value = parser.fromSrt(globalSubtitles[0].content) as SrtNode[];
    } catch {
      nodes.value = [];
    }
    console.log("Loaded global nodes:", nodes.value);
    return;
  }

  // 处理片段字幕
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

function getNodeActions(idx: number) {
  return [
    { label: "之前插入行", key: "insert-before" },
    { label: "之后插入行", key: "insert-after" },
    { type: "divider", key: "insert-divider" },
    { label: "与前行合并", key: "merge-previous", disabled: idx === 0 },
    { label: "与后行合并", key: "merge-next", disabled: idx === nodes.value.length - 1 },
    { type: "divider", key: "delete-divider" },
    { label: "删除", key: "delete", props: { style: "color: var(--n-error-color)" } },
  ];
}

function handleNodeAction(key: string | number, idx: number) {
  switch (key as NodeAction) {
    case "insert-before":
      insertNode(idx, "before");
      break;
    case "insert-after":
      insertNode(idx, "after");
      break;
    case "merge-previous":
      mergeNode(idx, "previous");
      break;
    case "merge-next":
      mergeNode(idx, "next");
      break;
    case "delete":
      deleteNode(idx);
      break;
  }
}

function insertNode(idx: number, position: "before" | "after") {
  const node = nodes.value[idx];
  const start = parseTimeToSeconds(node.startTime);
  const end = parseTimeToSeconds(node.endTime);
  const middle = (start + end) / 2;
  const newNode = createNode(
    position === "before" ? start : middle,
    position === "before" ? middle : end,
  );

  if (position === "before") {
    node.startSeconds = middle;
    node.startTime = formatTime(middle);
    nodes.value.splice(idx, 0, newNode);
  } else {
    node.endSeconds = middle;
    node.endTime = formatTime(middle);
    nodes.value.splice(idx + 1, 0, newNode);
  }
  flushToStore();
}

function mergeNode(idx: number, direction: "previous" | "next") {
  const targetIdx = direction === "previous" ? idx - 1 : idx + 1;
  const target = nodes.value[targetIdx];
  const node = nodes.value[idx];
  if (!target) return;

  if (direction === "previous") {
    target.endSeconds = parseTimeToSeconds(node.endTime);
    target.endTime = node.endTime;
    target.text = [target.text, node.text].filter(Boolean).join("\n");
    nodes.value.splice(idx, 1);
  } else {
    node.endSeconds = parseTimeToSeconds(target.endTime);
    node.endTime = target.endTime;
    node.text = [node.text, target.text].filter(Boolean).join("\n");
    nodes.value.splice(targetIdx, 1);
  }
  flushToStore();
}

function createNode(start: number, end: number): SrtNode {
  return {
    id: String(nodes.value.length + 1),
    startTime: formatTime(start),
    startSeconds: start,
    endTime: formatTime(end),
    endSeconds: end,
    text: "",
  };
}

function addNode() {
  const start = videoInstance.value.currentTime ?? 0;
  const end = start + 4;

  const newNode = createNode(start, end);
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

  // 清空最后一行时也要同步到 store
  if (validNodes.length === 0) {
    isFlushing = true;
    if (selectedSegmentId.value === "__global__") {
      subtitleStore.setGlobal("");
    } else {
      subtitleStore.setForSegment(selectedSegmentId.value, "");
    }
    nextTick(() => {
      isFlushing = false;
    });
    videoInstance.value.artplayerPluginSubtitle.setContent("", "srt");
    return;
  }

  // 重新编号
  validNodes.forEach((n, i) => {
    n.id = String(i + 1);
  });

  try {
    const srtContent = parser.toSrt(validNodes as any);
    isFlushing = true;

    // 保存全局字幕或片段字幕
    if (selectedSegmentId.value === "__global__") {
      subtitleStore.setGlobal(srtContent);
    } else {
      subtitleStore.setForSegment(selectedSegmentId.value, srtContent);
    }

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
  padding-right: 0;

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
        font-size: 13px;

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

    .node-handle {
      flex-shrink: 0;
      align-self: center;
      color: var(--n-text-color-3);

      &:hover {
        color: var(--n-text-color-1);
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
