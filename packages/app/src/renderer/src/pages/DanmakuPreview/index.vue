<template>
  <div class="danmaku-preview-page">
    <div>
      <n-h2 class="file-name">{{ fileName || "弹幕预览" }}</n-h2>
      <n-text depth="3" class="file-path">{{ filePath }}</n-text>
      <div v-if="metadata?.streamer || metadata?.live_title" class="metadata">
        <n-text depth="3">
          {{ [metadata.streamer, metadata.live_title].filter(Boolean).join(" · ") }}
        </n-text>
      </div>
    </div>

    <n-alert v-if="error" type="error" title="加载弹幕失败">
      <n-space align="center">
        <span>{{ error }}</span>
        <n-button size="small" @click="reloadKey++">重试</n-button>
      </n-space>
    </n-alert>

    <n-spin
      class="preview-spin"
      :show="loading"
      description="正在解析弹幕文件…"
      content-style="height: 100%; min-height: 0;"
    >
      <div class="preview-content" :aria-busy="loading">
        <n-card size="small">
          <n-space :size="24">
            <n-text>总记录：{{ items.length.toLocaleString() }}</n-text>
            <n-text v-for="type in kinds" :key="type">
              {{ danmakuLabels[type] }}：{{ counts[type].toLocaleString() }}
            </n-text>
          </n-space>
        </n-card>

        <div class="filters">
          <div class="search-controls">
            <n-select
              v-model:value="searchField"
              class="search-field"
              :options="searchFieldOptions"
              aria-label="搜索范围"
            />
            <n-input
              v-model:value="keyword"
              clearable
              placeholder="搜索弹幕内容或发送者"
              aria-label="搜索弹幕"
            />
          </div>
          <n-text v-if="!error" depth="3" aria-live="polite">
            共 {{ items.length.toLocaleString() }} 条记录，当前显示
            {{ displayList.length.toLocaleString() }} 条
          </n-text>
          <div class="time-controls">
            <n-text depth="3">时间显示</n-text>
            <n-select
              v-model:value="timeMode"
              class="time-mode"
              :options="timeOptions"
              aria-label="时间显示"
            />
          </div>
        </div>

        <n-space :size="8" aria-label="弹幕类型筛选">
          <n-button
            v-for="option in typeOptions"
            :key="option.value"
            :type="selectedType === option.value ? 'primary' : 'default'"
            :secondary="selectedType === option.value"
            :aria-pressed="selectedType === option.value"
            size="small"
            @click="selectedType = option.value"
          >
            {{ option.label }} {{ option.count.toLocaleString() }}
          </n-button>
        </n-space>

        <div v-if="!error" class="danmaku-table" role="table" aria-label="弹幕列表">
          <div class="table-header table-row" role="row">
            <div role="columnheader">{{ timeMode === "relative" ? "出现时间" : "实际时间" }}</div>
            <div role="columnheader">类型</div>
            <div role="columnheader">发送者</div>
            <div role="columnheader">内容</div>
          </div>
          <n-virtual-list
            v-if="displayList.length"
            ref="virtualList"
            class="danmaku-list"
            :items="displayList"
            :item-size="36"
            item-resizable
            role="rowgroup"
          >
            <template #default="{ item }">
              <div :key="item.key" class="table-row danmaku-row" role="row">
                <div class="time-cell" role="cell">{{ displayTime(item) }}</div>
                <div role="cell">
                  <n-tag :type="tagTypes[item.type as DanmakuKind]" size="small" :bordered="false">
                    {{ danmakuLabels[item.type as DanmakuKind] }}
                  </n-tag>
                </div>
                <div class="user-cell" role="cell">{{ item.user || "—" }}</div>
                <div class="content-cell" role="cell">{{ item.content || "—" }}</div>
              </div>
            </template>
          </n-virtual-list>
          <n-empty
            v-else
            class="empty-list"
            :description="
              loading ? '正在加载弹幕…' : items.length ? '没有匹配的记录' : '文件中没有弹幕记录'
            "
          />
        </div>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from "vue";
import { useRoute } from "vue-router";
import { refDebounced } from "@vueuse/core";
import { useThemeVars } from "naive-ui";
import type { TagProps, VirtualListInst } from "naive-ui";
import { commonApi } from "@renderer/apis";
import type { ParsedDanmu } from "@renderer/apis/common";
import { formatTime, secondsToTimemark } from "@renderer/utils";
import {
  createPreviewItems,
  danmakuLabels,
  filterPreviewItems,
  type DanmakuKind,
  type PreviewItem,
  type SearchField,
} from "./danmaku";

const route = useRoute();
const theme = useThemeVars();
const filePath = computed(() => (typeof route.query.path === "string" ? route.query.path : ""));
const fileName = computed(() => filePath.value.split(/[\\/]/).pop());
const kinds: DanmakuKind[] = ["text", "gift", "sc", "guard"];
const items = shallowRef<PreviewItem[]>([]);
const metadata = shallowRef<ParsedDanmu["metadata"]>();
const loading = ref(false);
const error = ref("");
const reloadKey = ref(0);
const virtualList = ref<VirtualListInst>();
const keyword = ref("");
const debouncedKeyword = refDebounced(keyword, 300);
const searchField = ref<SearchField>("all");
const selectedType = ref<DanmakuKind | "all">("all");
const timeMode = ref<"relative" | "absolute">("relative");
const searchFieldOptions = [
  { label: "内容 / 用户名", value: "all" },
  { label: "内容", value: "content" },
  { label: "用户名", value: "user" },
];
const timeOptions = [
  { label: "相对时间", value: "relative" },
  { label: "实际时间", value: "absolute" },
];
const tagTypes: Record<DanmakuKind, TagProps["type"]> = {
  text: "success",
  gift: "info",
  sc: "warning",
  guard: "error",
};
const counts = computed(() => {
  const counts: Record<DanmakuKind, number> = { text: 0, gift: 0, sc: 0, guard: 0 };
  for (const item of items.value) counts[item.type]++;
  return counts;
});
const typeOptions = computed(() => [
  { label: "全部", value: "all" as const, count: items.value.length },
  ...kinds.map((type) => ({ label: danmakuLabels[type], value: type, count: counts.value[type] })),
]);
const displayList = computed(() =>
  filterPreviewItems(items.value, selectedType.value, debouncedKeyword.value, searchField.value),
);

const displayTime = (item: PreviewItem) => {
  if (timeMode.value === "absolute") {
    return item.timestamp === undefined ? "—" : formatTime(item.timestamp * 1000);
  }
  return Number.isFinite(item.ts) && item.ts >= 0 ? secondsToTimemark(item.ts) : "—";
};

watch(
  [filePath, reloadKey],
  async ([path], _oldValue, onCleanup) => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    items.value = [];
    metadata.value = undefined;
    error.value = "";
    loading.value = false;
    keyword.value = "";
    selectedType.value = "all";
    if (!path) {
      error.value = "缺少弹幕文件路径";
      return;
    }
    if (!path.toLowerCase().endsWith(".xml")) {
      error.value = "仅支持预览 XML 弹幕文件";
      return;
    }
    loading.value = true;
    try {
      const data = await commonApi.parseDanmu(path, controller.signal);
      if (controller.signal.aborted) return;
      items.value = createPreviewItems(data);
      metadata.value = data.metadata;
    } catch (cause: any) {
      if (!controller.signal.aborted)
        error.value = cause?.message || String(cause || "解析文件失败");
    } finally {
      if (!controller.signal.aborted) loading.value = false;
    }
  },
  { immediate: true },
);

watch(displayList, async () => {
  await nextTick();
  virtualList.value?.scrollTo({ top: 0 });
});
</script>

<style scoped lang="less">
.danmaku-preview-page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  padding: 20px;

  > :not(.preview-spin) {
    flex: none;
  }
}
.preview-spin {
  flex: 1;
  min-height: 0;
}
.file-name {
  margin: 0 0 4px;
  overflow-wrap: anywhere;
}
.file-path {
  overflow-wrap: anywhere;
}
.metadata {
  margin-top: 4px;
}
.preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;

  > :not(.danmaku-table) {
    flex: none;
  }
}
.filters,
.search-controls,
.time-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filters {
  flex-wrap: wrap;
  justify-content: flex-start;
}
.search-controls {
  flex: 1 1 360px;
  max-width: 600px;
  min-width: 0;
}
.search-field {
  width: 150px;
  flex: none;
}
.time-controls {
  flex: none;
  margin-left: auto;
}
.time-mode {
  width: 130px;
}
.table-row {
  display: grid;
  grid-template-columns: 160px 90px minmax(100px, 160px) minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
}
.table-header {
  flex: none;
  background: v-bind("theme.tableHeaderColor");
  font-weight: 500;
}
.danmaku-table {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.danmaku-list {
  flex: 1;
  height: 0;
  min-height: 0;
}
.danmaku-row {
  box-sizing: border-box;
  min-height: 36px;
  padding: 6px 12px;
  border-bottom: 1px solid v-bind("theme.dividerColor");
  &:hover {
    background: v-bind("theme.hoverColor");
  }
}
.time-cell {
  color: v-bind("theme.textColor3");
  font-variant-numeric: tabular-nums;
}
.user-cell,
.content-cell {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.empty-list {
  padding: 70px 12px;
}
@media (max-width: 768px) {
  .table-row {
    grid-template-columns: 105px 80px minmax(80px, 110px) minmax(0, 1fr);
    gap: 8px;
  }
}
@media (max-width: 520px) {
  .danmaku-preview-page {
    padding: 12px;
  }
  .table-header {
    display: none;
  }
  .table-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .user-cell,
  .content-cell {
    grid-column: 1 / -1;
  }
  .user-cell {
    color: v-bind("theme.textColor3");
  }
  .search-controls {
    flex-wrap: wrap;
  }
}
</style>
