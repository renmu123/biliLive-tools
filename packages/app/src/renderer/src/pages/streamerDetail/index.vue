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
              <n-button @click="goToRecorder">设置</n-button>
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
            <div class="stat-card-content">
              <span class="stat-label">{{ item.label }}</span>
              <strong class="stat-value">{{ item.value }}</strong>
            </div>
          </n-card>
        </div>

        <n-card class="clips-panel" :bordered="false">
          <div class="section-header clips-header">
            <div>
              <h2>最近录制片段</h2>
            </div>
          </div>

          <n-spin :show="recentClipLoading">
            <div v-if="recentClips.length > 0" class="clip-card-grid">
              <div v-for="clip in recentClips" :key="clip.id" class="clip-card">
                <Artplayer
                  style="height: 160px"
                  :option="{ url: commonApi.getVideo(clip.videoFileId), type: clip.videoFileExt }"
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
        </n-card>

        <n-card class="session-panel" :bordered="false">
          <div class="section-header">
            <div>
              <h2>最近场次</h2>
            </div>
            <n-button text type="primary" @click="goToHistory">查看录制历史 ></n-button>
          </div>

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
                      <n-button text type="primary" @click="showSessionDetailPlaceholder(session)">
                        详情
                      </n-button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

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

          <n-empty v-else description="暂无场次数据" />
        </n-card>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { Copy16Regular, LinkSquare20Regular, PlayCircle24Regular } from "@vicons/fluent";
import { recoderApi, recordHistoryApi, commonApi } from "@renderer/apis";
import { formatRecentRecordTime, formatTime, formatDuration } from "@renderer/utils";
import { toVideoPlayerPage } from "@renderer/utils/pages";
import { useRoute, useRouter } from "vue-router";
import Artplayer from "@renderer/components/Artplayer/Index.vue";

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

const overviewCards = computed(() => [
  {
    label: "总场次",
    value: formatNumber(result.summary.sessionCount),
    hint: result.pagination.total > 0 ? `当前展示第 ${queryParams.page} 页` : "暂无历史场次",
  },
  {
    label: "总录制时长",
    value: formatDuration(result.summary.totalDuration, "00:00:00"),
    hint: `${formatNumber(Math.round((result.summary.totalDuration / 3600) * 10) / 10)} 小时`,
  },
  {
    label: "总录制片段",
    value: formatNumber(result.summary.clipCount),
    hint: "按已保存片段累计",
  },
  {
    label: "总弹幕数",
    value: formatNumber(result.summary.totalDanmaNum),
    hint: "主播历史录制累计",
  },
  {
    label: "上次录制时间",
    value: formatRecentRecordTime(result.summary.lastRecordTime),
    hint: roomLabel.value === "--" ? "暂无房间信息" : `房间号 ${roomLabel.value}`,
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

const goToRecorder = () => {
  router.push({
    path: "/recorder",
  });
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

const playRecentClip = async (clip: RecentRecordClipItem) => {
  try {
    await toVideoPlayerPage({
      videoId: clip.videoFileId,
      videoType: clip.videoFileExt,
    });
  } catch (error: any) {
    notice.error({
      title: error?.message || "打开播放器失败",
    });
  }
};

const formatNumber = (value?: number | null) => {
  return Number(value || 0);
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
}

.hero-card,
.stat-card,
.clips-panel,
.session-panel {
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

.clips-panel,
.session-panel {
  background: rgba(255, 255, 255, 0.94);

  [data-theme="dark"] & {
    background: rgba(255, 255, 255, 0.03);
  }
}

.clips-header {
  margin-bottom: 14px;
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

.clip-preview {
  position: relative;
  aspect-ratio: 16 / 9;
  background:
    linear-gradient(135deg, rgba(18, 24, 38, 0.82), rgba(52, 64, 84, 0.48)),
    radial-gradient(circle at top left, rgba(79, 70, 229, 0.28), transparent 42%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.2), transparent 38%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.clip-duration {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.72);
  color: #fff;
  font-size: 12px;
  line-height: 1;
}

.clip-play-indicator {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(17, 24, 39, 0.38);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
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

.clip-size-row {
  justify-content: flex-start;
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

.title-cell {
  // min-width: 220px;
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
