<template>
  <div class="streamer-detail-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <n-date-picker
          v-model:value="queryParams.startTime"
          type="date"
          clearable
          :actions="['clear', 'confirm']"
          placeholder="开始时间"
          style="width: 150px"
        />
        <n-date-picker
          v-model:value="queryParams.endTime"
          type="date"
          clearable
          :actions="['clear', 'confirm']"
          placeholder="结束时间"
          style="width: 150px"
        />
        <n-button type="primary" @click="handleQuery">查询</n-button>
        <n-button @click="router.back()">返回</n-button>
      </div>
    </div>

    <div class="hero-grid">
      <n-card class="hero-card hero-card-main" :bordered="false">
        <div class="hero-title-row">
          <div>
            <h1>{{ displayName }}</h1>
          </div>
          <div class="hero-tags">
            <n-tag>{{ streamerInfo.platform || "未知平台" }}</n-tag>
            <n-tag type="success">房间号 {{ streamerInfo.room_id || "-" }}</n-tag>
          </div>
        </div>
        <div class="hero-summary">
          <div class="summary-item">
            <span class="label">场次数</span>
            <strong>{{ result.summary.sessionCount }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">片段数</span>
            <strong>{{ result.summary.clipCount }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">总时长</span>
            <strong>{{ formatDuration(result.summary.totalDuration) }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">总弹幕</span>
            <strong>{{ result.summary.totalDanmaNum }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">总互动</span>
            <strong>{{ result.summary.totalInteractNum }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">最近录制</span>
            <strong>{{ formatTime(result.summary.lastRecordTime) }}</strong>
          </div>
        </div>
      </n-card>
    </div>

    <n-spin :show="loading">
      <template v-if="result.data.length > 0">
        <n-collapse v-model:expanded-names="expandedNames" accordion class="session-collapse">
          <n-collapse-item
            v-for="session in result.data"
            :key="session.sessionKey"
            :name="session.sessionKey"
            class="session-collapse-item"
          >
            <template #header>
              <div class="session-card-header">
                <div class="session-card-heading">
                  <div class="session-title">{{ session.title }}</div>
                  <div class="session-meta">
                    <span>live_id: {{ session.displayLiveId }}</span>
                    <span>开播: {{ formatTime(session.liveStartTime) }}</span>
                    <span>最近录制: {{ formatTime(session.lastRecordTime) }}</span>
                  </div>
                </div>
                <div class="session-metrics">
                  <div class="metric-pill">
                    <span>片段</span>
                    <strong>{{ session.clipCount }}</strong>
                  </div>
                  <div class="metric-pill">
                    <span>时长</span>
                    <strong>{{ formatDuration(session.totalDuration) }}</strong>
                  </div>
                  <div class="metric-pill">
                    <span>弹幕</span>
                    <strong>{{ session.totalDanmaNum }}</strong>
                  </div>
                  <div class="metric-pill">
                    <span>互动</span>
                    <strong>{{ session.totalInteractNum }}</strong>
                  </div>
                </div>
              </div>
            </template>

            <div class="session-card-body">
              <n-card
                v-for="clip in session.clips"
                :key="clip.id"
                class="clip-card"
                size="small"
                :bordered="false"
              >
                <div class="clip-card-top">
                  <div>
                    <div class="clip-title">{{ clip.title }}</div>
                    <div class="clip-meta">
                      <span>开始: {{ formatTime(clip.record_start_time) }}</span>
                      <span>结束: {{ formatTime(clip.record_end_time) }}</span>
                      <span>时长: {{ formatDuration(resolveClipDuration(clip)) }}</span>
                    </div>
                  </div>
                  <div class="clip-actions">
                    <n-button
                      v-if="!isWeb && clip.video_file"
                      size="small"
                      tertiary
                      @click.stop="openFolder(clip.video_file)"
                    >
                      打开文件夹
                    </n-button>
                    <n-button
                      v-if="!isWeb && clip.video_file"
                      size="small"
                      quaternary
                      @click.stop="openFile(clip.video_file)"
                    >
                      打开文件
                    </n-button>
                  </div>
                </div>
                <div class="clip-stat-row">
                  <n-tag size="small">弹幕 {{ clip.danma_num || 0 }}</n-tag>
                  <n-tag size="small" type="warning">互动 {{ clip.interact_num || 0 }}</n-tag>
                  <n-tag size="small" type="success">
                    文件 {{ clip.video_filename || fileNameFromPath(clip.video_file) || "未命名" }}
                  </n-tag>
                </div>
              </n-card>
            </div>
          </n-collapse-item>
        </n-collapse>

        <div class="pagination-row" v-if="result.pagination.total > result.pagination.pageSize">
          <n-pagination
            v-model:page="queryParams.page"
            :page-size="queryParams.pageSize"
            :item-count="result.pagination.total"
            show-size-picker
            :page-sizes="[5, 10, 20, 30]"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </div>
      </template>

      <n-empty v-else-if="!loading" description="暂无场次数据" />
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { streamerDetailApi } from "@renderer/apis";
import { useRoute, useRouter } from "vue-router";

import type { StreamerDetailAPI } from "@biliLive-tools/http/types/streamerDetail.js";

defineOptions({
  name: "streamerDetail",
});

const route = useRoute();
const router = useRouter();
const notice = useNotice();
const isWeb = window.isWeb;

const streamerInfo = reactive({
  room_id: (route.query.channelId as string) || "",
  platform: (route.query.platform as string) || "",
  name: (route.query.name as string) || "",
});

const queryParams = reactive<StreamerDetailAPI["query"]["Args"]>({
  room_id: streamerInfo.room_id,
  platform: streamerInfo.platform,
  page: 1,
  pageSize: 10,
  startTime: undefined,
  endTime: undefined,
});

const loading = ref(false);
const expandedNames = ref<string[]>([]);
const result = reactive<StreamerDetailAPI["query"]["Resp"]>({
  streamer: null,
  summary: {
    sessionCount: 0,
    clipCount: 0,
    totalDuration: 0,
    totalDanmaNum: 0,
    totalInteractNum: 0,
    lastRecordTime: null,
  },
  pagination: {
    total: 0,
    page: 1,
    pageSize: 10,
  },
  data: [],
});

const displayName = computed(() => result.streamer?.name || streamerInfo.name || "未命名主播");

const applyResult = (payload: StreamerDetailAPI["query"]["Resp"]) => {
  result.streamer = payload.streamer;
  result.summary = payload.summary;
  result.pagination = payload.pagination;
  result.data = payload.data;
  expandedNames.value = payload.data[0] ? [payload.data[0].sessionKey] : [];
};

const handleQuery = async () => {
  if (!queryParams.room_id || !queryParams.platform) {
    notice.error({
      title: "缺少房间号或平台信息",
    });
    return;
  }

  loading.value = true;
  try {
    const payload = await streamerDetailApi.query(queryParams);
    applyResult(payload);
  } catch (error: any) {
    notice.error({
      title: error?.message || "查询主播详情失败",
    });
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  queryParams.page = page;
  handleQuery();
};

const handlePageSizeChange = (pageSize: number) => {
  queryParams.page = 1;
  queryParams.pageSize = pageSize;
  handleQuery();
};

const formatTime = (timestamp?: number | null) => {
  if (!timestamp) return "--";
  const value = timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(value)
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-");
};

const formatDuration = (duration?: number | null) => {
  if (!duration || duration <= 0) return "--";
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const resolveClipDuration = (
  clip: StreamerDetailAPI["query"]["Resp"]["data"][number]["clips"][number],
) => {
  if (clip.video_duration && clip.video_duration > 0) {
    return clip.video_duration;
  }

  if (clip.record_end_time && clip.record_end_time > clip.record_start_time) {
    return (clip.record_end_time - clip.record_start_time) / 1000;
  }

  return 0;
};

const fileNameFromPath = (filePath?: string) => {
  if (!filePath) return "";
  const segments = filePath.split(/[/\\]/);
  return segments[segments.length - 1] || "";
};

const openFolder = (filePath: string) => {
  window.api.common.showItemInFolder(filePath);
};

const openFile = (filePath: string) => {
  window.api.openPath(filePath);
};

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="less">
.streamer-detail-page {
  padding: 20px;
  min-height: 100%;
  // background:
  //   radial-gradient(circle at top left, rgba(255, 225, 170, 0.28), transparent 30%),
  //   radial-gradient(circle at top right, rgba(145, 214, 255, 0.22), transparent 34%),
  //   linear-gradient(180deg, #fffdf7 0%, #f6f8fb 100%);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.hero-grid {
  margin-bottom: 20px;
}

.hero-card {
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 252, 240, 0.98), rgba(245, 249, 255, 0.96));
  box-shadow: 0 14px 40px rgba(79, 92, 120, 0.12);
}

.hero-title-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;

  h1 {
    margin: 6px 0 0;
    font-size: 30px;
    line-height: 1.2;
  }
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #a67c2a;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-summary {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.summary-item {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  display: flex;
  flex-direction: column;
  gap: 6px;

  .label {
    font-size: 12px;
    color: #7b8190;
  }

  strong {
    font-size: 20px;
    color: #1d2a44;
  }
}

.session-collapse {
  background: transparent;
}

.session-collapse-item {
  margin-bottom: 16px;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 18px 44px rgba(63, 78, 104, 0.1);
}

:deep(.session-collapse-item .n-collapse-item__header) {
  padding: 0;
}

:deep(.session-collapse-item .n-collapse-item__content-wrapper) {
  border-top: 1px solid rgba(130, 142, 163, 0.16);
}

.session-card-header {
  width: 100%;
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  // background: linear-gradient(135deg, rgba(255, 248, 232, 0.9), rgba(235, 244, 255, 0.88));
}

.session-card-heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-title {
  font-size: 20px;
  font-weight: 700;
  color: #1d2a44;
}

.session-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: #687388;
  font-size: 13px;
}

.session-metrics {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.metric-pill {
  min-width: 92px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    font-size: 12px;
    color: #7b8190;
  }

  strong {
    font-size: 15px;
    color: #263553;
  }
}

.session-card-body {
  padding: 18px;
  display: grid;
  gap: 12px;
}

.clip-card {
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 254, 0.94));
}

.clip-card-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.clip-title {
  font-size: 16px;
  font-weight: 600;
  color: #23324d;
  margin-bottom: 8px;
}

.clip-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 13px;
  color: #6b7380;
}

.clip-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.clip-stat-row {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-row {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .session-card-header,
  .clip-card-top,
  .hero-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .session-metrics {
    justify-content: flex-start;
  }
}
</style>
