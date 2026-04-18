<template>
  <div class="webhook-monitor">
    <div class="toolbar">
      <n-input
        v-model:value="filters.keyword"
        clearable
        placeholder="搜索标题、主播、房间号"
        @keydown.enter="fetchMonitorData"
        style="width: 300px"
      />
      <!-- <n-select v-model:value="filters.platform" :options="platformOptions" style="width: 140px" /> -->
      <!-- <n-select v-model:value="filters.status" :options="statusOptions" style="width: 160px" /> -->
      <!-- <n-switch v-model:value="filters.activeOnly" size="small" />
      <span class="switch-label">仅活跃</span>
      <n-switch v-model:value="filters.abnormalOnly" size="small" />
      <span class="switch-label">仅异常</span> -->
      <!-- <div class="toolbar-actions"> -->
      <n-button :loading="exporting" @click="exportRawWebhookData">导出数据</n-button>
      <n-button @click="resetFilters">重置</n-button>
      <n-button type="primary" @click="fetchMonitorData">刷新</n-button>
      <!-- </div> -->
    </div>

    <n-grid cols="1 s:2 m:3 l:6" responsive="screen" x-gap="12" y-gap="12" class="summary-grid">
      <n-gi>
        <n-card size="small">
          <n-statistic label="直播会话" :value="monitorData.summary.totalLives" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-statistic label="活跃会话" :value="monitorData.summary.activeLives" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-statistic label="录制中分段" :value="monitorData.summary.recordingParts" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-statistic label="处理中分段" :value="monitorData.summary.processingParts" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-statistic label="待上传分段" :value="monitorData.summary.pendingUploadParts" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-statistic label="异常分段" :value="monitorData.summary.errorParts" />
        </n-card>
      </n-gi>
    </n-grid>

    <div v-if="monitorData.lives.length" class="live-list">
      <n-card v-for="live in monitorData.lives" :key="live.eventId" size="small" class="live-card">
        <div class="live-header">
          <div class="live-title-block">
            <div class="live-title-row">
              <h3>{{ live.title || "未知" }}</h3>
              <!-- <n-tag size="small" :type="getLiveTagType(live.status)">{{
                liveStatusLabelMap[live.status]
              }}</n-tag> -->
              <!-- <n-tag v-if="live.isAbnormal" size="small" type="error">异常</n-tag> -->
            </div>
            <div class="live-meta">
              <span>{{ live.username || "未知" }}</span>
              <span>{{ live.platform }}</span>
              <span>房间 {{ live.roomId }}</span>
              <span>{{ formatTime(live.startTime) }}</span>
              <span>{{ formatDuration(live.durationMs) }}</span>
            </div>
          </div>
          <!-- <div class="live-actions">
            <n-button size="small" quaternary @click="openUploadReason(live)">上传诊断</n-button>
          </div> -->
        </div>

        <div class="stats-row">
          <div class="stat-chip">总分段 {{ live.stats.totalParts }}</div>
          <div class="stat-chip">录制中 {{ live.stats.recordingParts }}</div>
          <div class="stat-chip">
            处理中 {{ live.stats.recordedParts + live.stats.prehandledParts }}
          </div>
          <div class="stat-chip">待上传 {{ live.stats.pendingUploadParts }}</div>
          <div class="stat-chip">上传中 {{ live.stats.uploadingParts }}</div>
        </div>

        <n-collapse>
          <n-collapse-item :title="`分段列表 (${live.parts.length})`" :name="live.eventId">
            <div class="part-list">
              <div
                v-for="part in live.parts"
                :key="part.partId"
                :class="['part-row', { abnormal: part.isAbnormal }]"
              >
                <div class="cover-box" v-if="!isWeb">
                  <img v-if="part.cover" :src="part.cover" alt="cover" />
                  <div v-else class="cover-placeholder">无封面</div>
                </div>
                <div class="part-main" @click="openPartDetail(live, part)">
                  <div class="part-title-row">
                    <span class="part-title">{{ part.title || "未命名分段" }}</span>
                    <n-tag size="small" :type="getRecordTagType(part.recordStatus)">
                      {{ recordStatusLabelMap[part.recordStatus] }}
                    </n-tag>
                    <!-- <n-tag size="small" :type="getUploadTagType(part.uploadStatus)">
                      弹幕版 {{ uploadStatusLabelMap[part.uploadStatus] }}
                    </n-tag>
                    <n-tag size="small" :type="getUploadTagType(part.rawUploadStatus)">
                      原片 {{ uploadStatusLabelMap[part.rawUploadStatus] }}
                    </n-tag> -->
                  </div>
                  <div class="part-meta">
                    <span>{{ formatTime(part.startTime) }}</span>
                    <span>{{ formatTime(part.endTime) }}</span>
                    <span>{{ formatDuration(part.durationMs) }}</span>
                    <!-- <span v-if="part.pendingUpload || part.pendingRawUpload">等待上传</span> -->
                  </div>
                </div>
                <div class="part-actions">
                  <n-button
                    v-if="part.isAbnormal"
                    size="small"
                    type="error"
                    secondary
                    @click="markAbnormalPartHandled(part.partId)"
                  >
                    详情
                  </n-button>
                </div>
              </div>
            </div>
          </n-collapse-item>
        </n-collapse>
      </n-card>
    </div>
    <n-empty v-else description="当前没有 webhook 会话数据" />

    <n-modal
      v-model:show="detailVisible"
      preset="card"
      style="width: min(900px, 92vw)"
      title="录制详情"
    >
      <template v-if="selectedLive">
        <n-tabs type="line" animated>
          <n-tab-pane name="overview" tab="概览">
            <n-descriptions :column="2" bordered label-placement="left" size="small">
              <n-descriptions-item label="标题">{{ selectedLive.title }}</n-descriptions-item>
              <n-descriptions-item label="主播">{{ selectedLive.username }}</n-descriptions-item>
              <n-descriptions-item label="平台">{{ selectedLive.platform }}</n-descriptions-item>
              <n-descriptions-item label="软件">{{ selectedLive.software }}</n-descriptions-item>
              <n-descriptions-item label="房间号">{{ selectedLive.roomId }}</n-descriptions-item>
              <n-descriptions-item label="开始时间">{{
                formatTime(selectedLive.startTime)
              }}</n-descriptions-item>
              <n-descriptions-item label="结束时间">{{
                formatTime(selectedLive.endTime)
              }}</n-descriptions-item>
              <!-- <n-descriptions-item label="会话状态">
                <n-tag size="small" :type="getLiveTagType(selectedLive.status)">
                  {{ liveStatusLabelMap[selectedLive.status] }}
                </n-tag>
              </n-descriptions-item> -->
            </n-descriptions>
          </n-tab-pane>
          <n-tab-pane name="part" tab="分段详情">
            <template v-if="selectedPart">
              <n-descriptions :column="1" bordered label-placement="left" size="small">
                <n-descriptions-item label="分段标题">{{
                  selectedPartRaw?.title || selectedPart.title
                }}</n-descriptions-item>
                <n-descriptions-item label="录制状态">
                  {{
                    recordStatusLabelMap[selectedPartRaw?.recordStatus || selectedPart.recordStatus]
                  }}
                </n-descriptions-item>
                <n-descriptions-item label="弹幕版上传">
                  {{
                    uploadStatusLabelMap[selectedPartRaw?.uploadStatus || selectedPart.uploadStatus]
                  }}
                </n-descriptions-item>
                <n-descriptions-item label="原片上传">
                  {{
                    uploadStatusLabelMap[
                      selectedPartRaw?.rawUploadStatus || selectedPart.rawUploadStatus
                    ]
                  }}
                </n-descriptions-item>
                <n-descriptions-item label="开始时间">{{
                  formatTime(selectedPartRaw?.startTime ?? selectedPart.startTime)
                }}</n-descriptions-item>
                <n-descriptions-item label="结束时间">{{
                  formatTime(selectedPartRaw?.endTime ?? selectedPart.endTime)
                }}</n-descriptions-item>
                <n-descriptions-item label="处理后文件">{{
                  selectedPartRaw?.filePath || selectedPart.filePath || "-"
                }}</n-descriptions-item>
                <n-descriptions-item label="原始文件">{{
                  selectedPartRaw?.rawFilePath || selectedPart.rawFilePath || "-"
                }}</n-descriptions-item>
                <n-descriptions-item label="原始数据">
                  <pre class="raw-json">{{ formattedSelectedPartRaw }}</pre>
                </n-descriptions-item>
              </n-descriptions>
            </template>
            <n-empty v-else description="请选择一个分段" />
          </n-tab-pane>
          <!-- <n-tab-pane name="diagnosis" tab="诊断">
            <n-alert v-if="diagnosis" :type="diagnosis.hasError ? 'error' : 'success'" show-icon>
              {{ diagnosis.errorInfo }}
            </n-alert>
            <n-empty v-else description="没啥东西" />
          </n-tab-pane> -->
        </n-tabs>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "WebhookMonitor",
});

import { commonApi, webhookApi } from "@renderer/apis";
import { saveAs } from "file-saver";

import type {
  WebhookLiveStatus,
  WebhookMonitorLive,
  WebhookMonitorPart,
  WebhookMonitorResponse,
} from "@renderer/apis/webhook";

interface UploadDiagnosis {
  hasError: boolean;
  errorInfo: string;
}

const isWeb = window.isWeb;
const message = useMessage();

const emptyMonitorData = (): WebhookMonitorResponse => ({
  summary: {
    totalLives: 0,
    activeLives: 0,
    abnormalLives: 0,
    recordingParts: 0,
    processingParts: 0,
    pendingUploadParts: 0,
    uploadingParts: 0,
    errorParts: 0,
  },
  lives: [],
});

const monitorData = ref<WebhookMonitorResponse>(emptyMonitorData());
const loading = ref(false);
const exporting = ref(false);
const detailVisible = ref(false);
const diagnosis = ref<UploadDiagnosis | null>(null);
const selectedLive = ref<WebhookMonitorLive | null>(null);
const selectedPart = ref<WebhookMonitorPart | null>(null);
const filters = reactive<{
  keyword: string;
  platform: string;
  status: WebhookLiveStatus | "all";
  activeOnly: boolean;
  abnormalOnly: boolean;
}>({
  keyword: "",
  platform: "all",
  status: "all",
  activeOnly: true,
  abnormalOnly: false,
});

const liveStatusLabelMap: Record<WebhookLiveStatus, string> = {
  recording: "录制中",
  processing: "处理中",
  pendingUpload: "待上传",
  uploading: "上传中",
  completed: "已完成",
  error: "异常",
};

const recordStatusLabelMap: Record<WebhookMonitorPart["recordStatus"], string> = {
  recording: "录制中",
  recorded: "已录制",
  prehandled: "预处理完成",
  handled: "已处理",
  error: "错误",
};

const uploadStatusLabelMap: Record<WebhookMonitorPart["uploadStatus"], string> = {
  pending: "待处理",
  uploading: "上传中",
  uploaded: "已上传",
  error: "错误",
};

// const statusOptions = [
//   { label: "全部状态", value: "all" },
//   { label: "录制中", value: "recording" },
//   { label: "处理中", value: "processing" },
//   { label: "待上传", value: "pendingUpload" },
//   { label: "上传中", value: "uploading" },
//   { label: "已完成", value: "completed" },
//   { label: "异常", value: "error" },
// ];

// const platformOptions = computed(() => {
//   const platforms = new Set(monitorData.value.lives.map((live) => live.platform).filter(Boolean));
//   return [
//     { label: "全部平台", value: "all" },
//     ...Array.from(platforms).map((platform) => ({ label: platform, value: platform })),
//   ];
// });

const fetchMonitorData = async () => {
  loading.value = true;
  try {
    monitorData.value = await webhookApi.getMonitorData({
      keyword: filters.keyword || undefined,
      platform: filters.platform,
      status: filters.status,
      activeOnly: filters.activeOnly,
      abnormalOnly: filters.abnormalOnly,
    });

    if (selectedLive.value) {
      const nextLive = monitorData.value.lives.find(
        (live) => live.eventId === selectedLive.value?.eventId,
      );
      selectedLive.value = nextLive ?? null;
      if (selectedPart.value && nextLive) {
        selectedPart.value =
          nextLive.parts.find((part) => part.partId === selectedPart.value?.partId) ?? null;
      }
      if (!nextLive) {
        selectedPart.value = null;
        diagnosis.value = null;
      }
    }
  } catch (error) {
    message.error(String(error));
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.keyword = "";
  filters.platform = "all";
  filters.status = "all";
  filters.activeOnly = true;
  filters.abnormalOnly = false;
  fetchMonitorData();
};

const exportRawWebhookData = async () => {
  if (exporting.value) return;

  exporting.value = true;
  try {
    const blob = await commonApi.exportWebhookRaw();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    saveAs(blob, `webhook-raw-${timestamp}.json`);
  } catch (error) {
    message.error(String(error));
  } finally {
    exporting.value = false;
  }
};

const openPartDetail = (live: WebhookMonitorLive, part: WebhookMonitorPart) => {
  selectedLive.value = live;
  selectedPart.value = part;
  detailVisible.value = true;
};

const selectedPartRaw = computed(() => selectedPart.value?.raw ?? null);

const formattedSelectedPartRaw = computed(() => {
  if (!selectedPartRaw.value) return "-";
  return JSON.stringify(selectedPartRaw.value, null, 2);
});

const openUploadReason = async (live: WebhookMonitorLive) => {
  try {
    diagnosis.value = await commonApi.whyUploadFailed(live.roomId);
    selectedLive.value = live;
    if (!selectedPart.value) {
      selectedPart.value = live.parts[0] ?? null;
    }
    detailVisible.value = true;
  } catch (error) {
    message.error(String(error));
  }
};

const markAbnormalPartHandled = async (partId: string) => {
  try {
    await commonApi.handleWebhook([{ id: partId }]);
    message.success("已标记异常分段");
    await fetchMonitorData();
  } catch (error) {
    message.error(String(error));
  }
};

const getLiveTagType = (status: WebhookLiveStatus) => {
  if (status === "error") return "error";
  if (status === "recording" || status === "uploading") return "success";
  if (status === "pendingUpload") return "warning";
  return "default";
};

const getRecordTagType = (status: WebhookMonitorPart["recordStatus"]) => {
  if (status === "error") return "error";
  if (status === "recording") return "success";
  if (status === "recorded" || status === "prehandled") return "warning";
  return "default";
};

// const getUploadTagType = (status: WebhookMonitorPart["uploadStatus"]) => {
//   if (status === "error") return "error";
//   if (status === "uploading") return "warning";
//   if (status === "uploaded") return "success";
//   return "default";
// };

const formatTime = (value: number | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const formatDuration = (durationMs: number | null) => {
  if (durationMs === null) return "-";
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, "0")).join(":");
};

fetchMonitorData();

// const toPreviewUrl = (coverPath: string) => {
//   const encodedPath = encodeURIComponent(coverPath);
//   return `${request.defaults.baseURL}/common/file?path=${encodedPath}`;
// };

// let intervalId: NodeJS.Timeout | null = null;
// const createInterval = () => {
//   if (intervalId || document.hidden) return;
//   const interval = window.isWeb ? 4000 : 2000;
//   intervalId = setInterval(() => {
//     fetchMonitorData();
//   }, interval);
// };

// const cleanInterval = () => {
//   if (!intervalId) return;
//   clearInterval(intervalId);
//   intervalId = null;
// };

// const handleVisibilityChange = () => {
//   if (document.hidden) {
//     cleanInterval();
//   } else {
//     fetchMonitorData();
//     createInterval();
//   }
// };

// onActivated(() => {
//   fetchMonitorData();
//   createInterval();
// });

// onDeactivated(() => {
//   cleanInterval();
// });

// onMounted(() => {
//   document.addEventListener("visibilitychange", handleVisibilityChange);
// });

// onBeforeUnmount(() => {
//   cleanInterval();
//   document.removeEventListener("visibilitychange", handleVisibilityChange);
// });

// if (import.meta.hot) {
//   import.meta.hot.dispose(() => {
//     cleanInterval();
//     document.removeEventListener("visibilitychange", handleVisibilityChange);
//   });
// }
</script>

<style scoped lang="less">
.webhook-monitor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.toolbar :deep(.n-input),
.toolbar :deep(.n-base-selection) {
  min-width: 140px;
}

.switch-label {
  margin-left: -4px;
  font-size: 12px;
  color: var(--text-color-2);
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.summary-grid {
  margin-bottom: 4px;
}

.live-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.live-card {
  border-radius: 12px;
}

.live-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.live-title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.live-title-row h3 {
  margin: 0;
  font-size: 16px;
}

.live-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  color: var(--text-color-2);
  font-size: 12px;
}

.live-actions {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(127, 127, 127, 0.1);
  font-size: 12px;
}

.part-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.part-row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border: 1px solid rgba(127, 127, 127, 0.15);
  border-radius: 10px;
}

.part-row.abnormal {
  border-color: rgba(208, 48, 80, 0.45);
  background: rgba(208, 48, 80, 0.04);
}

.cover-box {
  width: 88px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(127, 127, 127, 0.08);
}

.cover-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  color: var(--text-color-3);
}

.part-main {
  min-width: 0;
  cursor: pointer;
}

.part-title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.part-title {
  font-weight: 600;
}

.part-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-color-2);
}

.part-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.raw-json {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.5;
  max-height: 240px;
  overflow: auto;
}

@media (max-width: 768px) {
  .toolbar-actions,
  .live-actions,
  .part-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .live-header,
  .part-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .cover-box {
    width: 100%;
    max-width: 180px;
    height: 96px;
  }
}
</style>
