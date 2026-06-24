<template>
  <div class="streamer-detail-page">
    <n-spin :show="loading">
      <div class="overview-shell">
        <n-card class="hero-card" :bordered="false">
          <div class="hero-main">
            <div class="profile-block">
              <n-avatar
                round
                :size="80"
                class="profile-avatar"
                :src="avatar"
                referrerpolicy="no-referrer"
              >
              </n-avatar>

              <div class="profile-content">
                <div class="profile-heading">
                  <div>
                    <h1>{{ displayName }}</h1>
                    <div class="profile-meta">
                      <span>{{ platformLabel }}</span>
                      <span class="room-meta">
                        <span>房间号：{{ roomLabel }}</span>
                        <n-button
                          text
                          class="copy-room-button"
                          title="复制房间号"
                          @click="copyRoomId"
                        >
                          <template #icon>
                            <n-icon>
                              <Copy16Regular />
                            </n-icon>
                          </template>
                        </n-button>
                        <n-button text class="copy-room-button">
                          <template #icon>
                            <a
                              :href="channelURL"
                              target="_blank"
                              rel="noreferrer"
                              class="channel-link"
                              title="访问直播间"
                            >
                              <n-icon>
                                <LinkSquare20Regular />
                              </n-icon>
                            </a>
                          </template>
                        </n-button>
                      </span>
                    </div>
                  </div>

                  <div class="profile-tags">
                    <n-tag v-if="monitorLabel" :type="monitorTagType" round>{{
                      monitorLabel
                    }}</n-tag>
                    <n-tag v-if="stateLabel" :type="stateTagType" round>{{ stateLabel }}</n-tag>
                  </div>
                </div>
              </div>
            </div>

            <div class="hero-actions">
              <n-button type="primary" :loading="recordActionLoading" @click="toggleRecording">
                {{ isRecording ? "停止录制" : "开始录制" }}
              </n-button>
              <n-button type="warning" @click="goToHistory">录制历史</n-button>
              <n-button @click="openRecorderSetting">直播间设置</n-button>
              <n-button @click="goBack">返回</n-button>
            </div>
          </div>
        </n-card>

        <div class="stat-grid">
          <n-card
            class="stat-card"
            v-for="item in overviewCards"
            :key="item.label"
            :bordered="false"
          >
            <div class="stat-card-content" :title="item.title">
              <span class="stat-label">{{ item.label }}</span>
              <strong class="stat-value">{{ item.value }}</strong>
            </div>
          </n-card>
        </div>

        <n-card class="tab-panel" :bordered="false">
          <n-tabs v-model:value="activeTab" type="segment" animated>
            <n-tab-pane name="timeline" tab="时间线">
              <div v-if="recorderTimeline.length > 0" class="timeline-list">
                <div
                  v-for="(item, index) in recorderTimeline"
                  :key="`${item.startTime}-${index}`"
                  class="timeline-item"
                >
                  <div class="timeline-track">
                    <span class="timeline-dot"></span>
                    <span v-if="index !== recorderTimeline.length - 1" class="timeline-line"></span>
                  </div>
                  <div class="timeline-content">
                    <span class="timeline-time">
                      {{ formatTimelineRange(item.startTime, item.endTime) }}
                    </span>
                    <span class="timeline-text">{{ item.text }}</span>
                  </div>
                </div>
              </div>

              <n-empty v-else description="暂无数据" />
            </n-tab-pane>

            <n-tab-pane name="clips" tab="最近录制片段">
              <n-spin :show="recentClipLoading">
                <div v-if="recentClips.length > 0" class="clip-card-grid">
                  <div v-for="clip in recentClips" :key="clip.id" class="clip-card">
                    <Artplayer
                      style="height: 160px"
                      :option="{
                        url: commonApi.getVideo(clip.videoFileId),
                        type: clip.videoFileExt,
                      }"
                      :isLive="false"
                    ></Artplayer>

                    <div class="clip-info">
                      <div class="clip-title">{{ clip.title || "未命名片段" }}</div>
                      <div class="clip-meta-row">
                        <span>{{ formatRecentRecordTime(clip.recordStartTime) }}</span>
                        <span>{{ formatFileSize(clip.videoFileSize) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <n-empty v-else description="暂无可播放的录制片段" />
              </n-spin>
            </n-tab-pane>

            <n-tab-pane name="sessions" tab="最近场次">
              <template v-if="result.data.length > 0">
                <div class="session-table-wrap">
                  <table class="session-table">
                    <thead class="table-header">
                      <tr>
                        <th>直播标题</th>
                        <th>直播开始时间</th>
                        <th>开始时间</th>
                        <th>结束时间</th>
                        <th>录制时长</th>
                        <th>片段数</th>
                        <th>弹幕数</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(session, index) in result.data" :key="session.sessionKey">
                        <td class="title-cell">
                          <div class="session-name">{{ session.title || "-" }}</div>
                        </td>
                        <td>{{ formatTime(session.recordStartTime) }}</td>
                        <td>{{ formatTime(session.liveStartTime) }}</td>
                        <td>{{ formatTime(session.lastRecordTime) }}</td>
                        <td>{{ formatDuration(session.totalDuration, "00:00:00") }}</td>
                        <td>{{ session.clipCount }}</td>
                        <td>{{ formatNumber(session.totalDanmaNum) }}</td>
                        <td>
                          <n-tag size="small" round :type="resolveSessionStatus(index).type">
                            {{ resolveSessionStatus(index).label }}
                          </n-tag>
                        </td>
                        <td class="operation-cell">
                          <n-button
                            text
                            type="primary"
                            @click="showSessionDetailPlaceholder(session)"
                          >
                            详情
                          </n-button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div
                  class="pagination-row"
                  v-if="result.pagination.total > result.pagination.pageSize"
                >
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

              <n-empty v-else description="暂无场次数据" />
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </div>
    </n-spin>

    <AddRecorderModal
      :id="streamerInfo.recorderId"
      v-model:visible="recorderSettingVisible"
      @confirm="handleRecorderSettingConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { Copy16Regular, LinkSquare20Regular } from "@vicons/fluent";
import { recoderApi, recordHistoryApi, commonApi } from "@renderer/apis";
import { formatRecentRecordTime, formatTime, formatDuration } from "@renderer/utils";
import { useRoute, useRouter } from "vue-router";
import Artplayer from "@renderer/components/Artplayer/Index.vue";
import AddRecorderModal from "@renderer/pages/Tools/pages/Recorder/components/addModal.vue";

import type { RecorderAPI } from "@biliLive-tools/http/types/recorder.js";
import type { RecentRecordClipItem } from "@renderer/apis/recordHistory";

defineOptions({
  name: "streamerDetail",
});

const route = useRoute();
const router = useRouter();
const notice = useNotice();

const streamerInfo = reactive({
  recorderId: ((route.query.recorderId as string) || (route.query.id as string) || "") as string,
  name: (route.query.name as string) || "",
});

const queryParams = reactive<RecorderAPI["queryStreamerDetail"]["Args"]>({
  recorderId: streamerInfo.recorderId,
  page: 1,
  pageSize: 10,
  startTime: undefined,
  endTime: undefined,
});

const loading = ref(false);
const recordActionLoading = ref(false);
const recentClipLoading = ref(false);
const recorderSettingVisible = ref(false);
const activeTab = ref("timeline");
const recentClips = ref<RecentRecordClipItem[]>([]);
const result = reactive<RecorderAPI["queryStreamerDetail"]["Resp"]>({
  recorderInfo: null,
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

const displayName = computed(() => result.streamer?.name || streamerInfo.name);
const avatar = computed(
  () => result.recorderInfo?.liveInfo?.avatar || result.recorderInfo?.extra?.avatar,
);
const platformLabel = computed(
  () => result.recorderInfo?.providerId || result.streamer?.platform || "-",
);
const roomIdValue = computed(
  () => result.recorderInfo?.channelId || result.streamer?.room_id || "",
);
const roomLabel = computed(() => roomIdValue.value || "--");
const monitorLabel = computed(() => (result.recorderInfo?.disableAutoCheck ? "" : "自动监控"));
const monitorTagType = computed(() =>
  result.recorderInfo?.disableAutoCheck ? "warning" : "success",
);
const isRecording = computed(() => result.recorderInfo?.state === "recording");
const stateLabel = computed(() => (isRecording.value ? "录制中" : ""));
const stateTagType = computed(() => (isRecording.value ? "error" : "default"));
const channelURL = computed(() => result.recorderInfo?.channelURL || "");
const recorderTimeline = computed(() => [...(result.recorderInfo?.timeline || [])].reverse());

const overviewCards = computed(() => [
  {
    label: "总场次",
    value: formatNumber(result.summary.sessionCount),
  },
  {
    label: "总录制时长",
    value: formatDuration(result.summary.totalDuration, "00:00:00"),
  },
  {
    label: "总录制片段",
    value: formatNumber(result.summary.clipCount),
  },
  {
    label: "总弹幕数",
    value: formatNumber(result.summary.totalDanmaNum),
  },
  {
    label: "上次录制时间",
    value: formatRecentRecordTime(result.summary.lastRecordTime),
    title: formatTime(result.summary.lastRecordTime),
  },
]);

const applyResult = (payload: RecorderAPI["queryStreamerDetail"]["Resp"]) => {
  result.recorderInfo = payload.recorderInfo;
  result.streamer = payload.streamer;
  result.summary = payload.summary;
  result.pagination = payload.pagination;
  result.data = payload.data;
};

const queryRecentClips = async () => {
  if (!result.recorderInfo?.channelId || !result.recorderInfo?.providerId) {
    recentClips.value = [];
    return;
  }

  recentClipLoading.value = true;
  try {
    const response = await recordHistoryApi.queryRecentClips({
      room_id: result.recorderInfo.channelId,
      platform: result.recorderInfo.providerId,
    });
    recentClips.value = response.data || [];
  } catch (error: any) {
    recentClips.value = [];
    notice.error({
      title: error?.message || "查询最近录制片段失败",
    });
  } finally {
    recentClipLoading.value = false;
  }
};

const handleQuery = async () => {
  if (!queryParams.recorderId) {
    notice.error({
      title: "缺少录制器信息",
    });
    return;
  }

  loading.value = true;
  try {
    const payload = await recoderApi.queryStreamerDetail(queryParams);
    applyResult(payload);
    await queryRecentClips();
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

const goBack = () => {
  router.push({
    path: "/recorder",
  });
};

const openRecorderSetting = () => {
  if (!streamerInfo.recorderId) {
    notice.warning({
      title: "缺少录制器信息，无法打开设置",
    });
    return;
  }

  recorderSettingVisible.value = true;
};

const handleRecorderSettingConfirm = async () => {
  await handleQuery();
};

const copyRoomId = async () => {
  if (!roomIdValue.value) {
    notice.warning({
      title: "当前没有可复制的房间号",
    });
    return;
  }

  try {
    await navigator.clipboard.writeText(roomIdValue.value);
    notice.success({
      title: "复制成功",
      content: `已复制房间号 ${roomIdValue.value}`,
      duration: 1000,
    });
  } catch (_error) {
    notice.error({
      title: "复制失败",
      content: "无法访问剪贴板",
    });
  }
};

const goToHistory = () => {
  if (!result.recorderInfo?.channelId || !result.recorderInfo?.providerId) {
    notice.warning({
      title: "当前缺少房间号或平台信息，无法跳转历史记录",
    });
    return;
  }

  router.push({
    path: "/liveHistory",
    query: {
      id: streamerInfo.recorderId,
      channelId: result.recorderInfo.channelId,
      platform: result.recorderInfo.providerId,
      name: result.streamer?.name || streamerInfo.name,
    },
  });
};

const toggleRecording = async () => {
  if (!queryParams.recorderId) return;

  recordActionLoading.value = true;
  try {
    if (isRecording.value) {
      await recoderApi.stopRecord(queryParams.recorderId);
      notice.success({
        title: "已停止录制",
      });
    } else {
      await recoderApi.startRecord(queryParams.recorderId);
      notice.success({
        title: "已开始录制",
      });
    }
    setTimeout(() => {
      handleQuery();
    }, 1000);
  } catch (error: any) {
    notice.error({
      title: error?.message || "操作失败",
    });
  } finally {
    recordActionLoading.value = false;
  }
};

const resolveSessionStatus = (index: number) => {
  if (isRecording.value && queryParams.page === 1 && index === 0) {
    return {
      label: "录制中",
      type: "error" as const,
    };
  }

  return {
    label: "已完成",
    type: "success" as const,
  };
};

const showSessionDetailPlaceholder = (
  session: RecorderAPI["queryStreamerDetail"]["Resp"]["data"][number],
) => {
  if (!result.recorderInfo?.channelId || !result.recorderInfo?.providerId) {
    notice.warning({
      title: "当前缺少房间号或平台信息，无法跳转历史记录",
    });
    return;
  }
  router.push({
    path: "/liveHistory",
    query: {
      id: streamerInfo.recorderId,
      channelId: result.recorderInfo.channelId,
      platform: result.recorderInfo.providerId,
      name: result.streamer?.name || streamerInfo.name,
      liveId: session.liveId,
    },
  });
};

const formatNumber = (value?: number | null) => {
  return Number(value || 0);
};

const formatTimelineRange = (startTime?: number, endTime?: number) => {
  const normalizedStartTime = startTime ?? null;
  const startLabel = formatTime(normalizedStartTime);
  if (!endTime || normalizedStartTime == null || endTime <= normalizedStartTime) {
    return `${startLabel}`;
  }

  return `${startLabel} - ${formatTime(endTime)}`;
};

const formatFileSize = (fileSize?: number) => {
  if (!fileSize || fileSize <= 0) return "--";

  const mb = fileSize / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
};

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="less">
.streamer-detail-page {
  padding: 0 20px 24px;
  min-height: 100%;
}

.overview-shell {
  display: grid;
  gap: 18px;

  :deep(.n-tabs-nav) {
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

.hero-card,
.stat-card,
.tab-panel {
  border-radius: 24px;
  border: 1px solid rgba(215, 223, 235, 0.6);
  box-shadow: 0 18px 40px rgba(57, 74, 103, 0.08);

  [data-theme="dark"] & {
    border-color: rgba(255, 255, 255, 0.06);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
  }
}

.hero-card {
  background: linear-gradient(135deg, rgba(255, 253, 247, 0.98), rgba(242, 247, 255, 0.96));

  [data-theme="dark"] & {
    background: linear-gradient(135deg, rgba(36, 40, 48, 0.98), rgba(25, 29, 36, 0.96));
  }
}

.hero-main {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.profile-block {
  display: flex;
  gap: 18px;
  min-width: 0;
  flex: 1;
}

.profile-avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #b8d6ff, #f4f8ff);
  color: #355a9b;
  font-size: 32px;
  font-weight: 700;
}

.profile-content {
  min-width: 0;
  display: grid;
  gap: 16px;
  flex: 1;
}

.profile-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;

  h1 {
    margin: 0;
    font-size: 34px;
    line-height: 1.18;
  }
}

.profile-meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: #667085;
  font-size: 14px;

  [data-theme="dark"] & {
    color: rgba(255, 255, 255, 0.62);
  }
}

.room-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.copy-room-button {
  padding: 0;
  min-width: auto;
  color: inherit;
}

.channel-link {
  color: inherit;
  text-decoration: none;
}

.profile-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(max-content, 1fr));
  gap: 14px;
}

.stat-card-content {
  display: grid;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: #7b8699;

  [data-theme="dark"] & {
    color: rgba(255, 255, 255, 0.58);
  }
}

.stat-value {
  font-size: 24px;
  line-height: 1.15;
}

.tab-panel {
  background: rgba(255, 255, 255, 0.94);

  [data-theme="dark"] & {
    background: rgba(255, 255, 255, 0.03);
  }
}

.timeline-list {
  display: grid;
  gap: 10px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
}

.timeline-track {
  position: relative;
  display: flex;
  justify-content: center;
  min-height: 100%;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 6px;
  background: linear-gradient(135deg, #ff7a59, #ffb347);
  box-shadow: 0 0 0 4px rgba(255, 122, 89, 0.12);
}

.timeline-line {
  position: absolute;
  top: 22px;
  bottom: -14px;
  width: 2px;
  background: rgba(255, 122, 89, 0.2);
}

.timeline-content {
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(250, 251, 255, 0.88);
  border: 1px solid rgba(215, 223, 235, 0.8);

  [data-theme="dark"] & {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.timeline-text {
  font-size: 15px;
  color: #1b2437;
  word-break: break-word;
  margin-left: 20px;

  [data-theme="dark"] & {
    color: rgba(255, 255, 255, 0.92);
  }
}

.timeline-time {
  margin-top: 6px;
  font-size: 13px;
  color: #667085;
}

.clip-card-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.clip-card {
  padding: 0;
  border: none;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 20px;
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(57, 74, 103, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  [data-theme="dark"] & {
    background: rgba(255, 255, 255, 0.04);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.2);

    &:hover {
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
    }
  }
}

.clip-info {
  padding: 12px 14px 14px;
  display: grid;
  gap: 8px;
}

.clip-title {
  font-size: 15px;
  line-height: 1.4;
  color: #111827;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  [data-theme="dark"] & {
    color: rgba(255, 255, 255, 0.92);
  }
}

.clip-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;

  [data-theme="dark"] & {
    color: rgba(255, 255, 255, 0.58);
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 6px;

  h2 {
    margin: 0 0 8px;
    font-size: 18px;
    color: #1b2437;

    [data-theme="dark"] & {
      color: rgba(255, 255, 255, 0.94);
    }
  }
}

.section-header-inline {
  justify-content: flex-end;
  margin-bottom: 14px;
}

.session-table-wrap {
  overflow-x: auto;
}

.session-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;

  .table-header {
    background-color: #f8f9fa;
    [data-theme="dark"] & {
      color: rgba(38, 38, 42, 1);
    }
  }

  th,
  td {
    text-align: left;
    font-size: 14px;
  }

  td {
    padding: 12px 14px;
  }

  th {
    padding: 8px 14px;
    font-weight: normal;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
}

.session-name {
  font-weight: normal;
}

.operation-cell {
  white-space: nowrap;
}

.pagination-row {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1400px) {
  .clip-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .clip-card-grid,
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .clip-card-grid,
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
