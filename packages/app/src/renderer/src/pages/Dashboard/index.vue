<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">数据看板</h1>
      <n-button type="primary" @click="getTime" secondary>
        <template #icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
            />
          </svg>
        </template>
        刷新数据
      </n-button>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <n-card class="stat-card" hoverable>
        <div class="stat-content">
          <div class="stat-icon running-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">软件运行时长</div>
            <div class="stat-value">{{ formatTime(now - (statistics?.startTime || 0)) }}</div>
          </div>
        </div>
      </n-card>

      <n-card class="stat-card" hoverable>
        <div class="stat-content">
          <div class="stat-icon record-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">最近30天录制时长</div>
            <div class="stat-value">
              {{ formatTime((statistics?.videoTotalDuaration || 0) * 1000) }}
            </div>
          </div>
        </div>
      </n-card>

      <n-card class="stat-card clickable" hoverable @click="navigateToRecorder">
        <div class="stat-content">
          <div class="stat-icon streamer-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">主播总数</div>
            <div class="stat-value">{{ statistics?.recorderNum || 0 }}</div>
          </div>
        </div>
      </n-card>

      <n-card class="stat-card clickable" hoverable @click="navigateToRecorder">
        <div class="stat-content">
          <div class="stat-icon recording-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">正在录制</div>
            <div class="stat-value">{{ statistics?.recordingNum || 0 }}</div>
          </div>
        </div>
      </n-card>

      <n-card class="stat-card clickable" hoverable @click="navigateToQueue">
        <div class="stat-content">
          <div class="stat-icon task-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">正在运行的任务</div>
            <div class="stat-value">{{ runningTaskNum }}</div>
          </div>
        </div>
      </n-card>

      <n-card class="stat-card" hoverable v-if="diskSpace">
        <div class="stat-content">
          <div class="stat-icon disk-icon" :class="{ 'disk-icon-warning': diskSpace.free < 5 }">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">录制磁盘空间</div>
            <div class="stat-value" :class="{ 'text-error': diskSpace.free < 5 }">
              剩余 {{ diskSpace.free.toFixed(2) }}GB
            </div>
            <div class="stat-extra" :class="{ 'text-error': diskSpace.free < 5 }">
              已用 {{ diskSpace.usedPercentage.toFixed(1) }}%
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 操作按钮区域 -->
    <n-card title="快捷操作" class="action-card">
      <div class="action-buttons">
        <n-button type="warning" @click="whyUploadFailed" size="large">
          <template #icon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </template>
          诊断上传问题
        </n-button>
        <n-button type="error" @click="handleWebhook" size="large" style="display: none">
          <template #icon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </template>
          修复Webhook卡住
        </n-button>
      </div>
    </n-card>

    <!-- TODO: 图表区域 -->
    <!-- <div class="charts-section">
      <n-card title="录制时长趋势">
        折线图
      </n-card>
    </div> -->
  </div>

  <!-- 输入直播间号弹框 -->
  <n-modal v-model:show="roomIdModalVisible" :mask-closable="false" auto-focus>
    <n-card style="width: 500px" :bordered="false" role="dialog" aria-modal="true">
      <template #header>
        <div style="font-size: 16px; font-weight: bold">输入直播间号</div>
      </template>
      <n-input
        v-model:value="roomIdInput"
        placeholder="请输入直播间号"
        maxlength="20"
        @keyup.enter="handleRoomIdConfirm"
      />
      <template #footer>
        <div style="text-align: right">
          <n-button @click="roomIdModalVisible = false">取消</n-button>
          <n-button type="primary" style="margin-left: 10px" @click="handleRoomIdConfirm">
            确认
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>

  <!-- 结果显示弹框 -->
  <n-modal v-model:show="resultModalVisible" :mask-closable="false" auto-focus>
    <n-card style="width: 600px" :bordered="false" role="dialog" aria-modal="true">
      <template #header>
        <div style="font-size: 16px; font-weight: bold">检测结果</div>
      </template>
      <div v-if="checkResult">
        <div
          :class="checkResult.hasError ? 'result-error' : 'result-success'"
          class="result-status"
        >
          {{ checkResult.hasError ? "发现问题" : "配置正常" }}
        </div>
        <div class="result-info">
          {{ checkResult.errorInfo }}
        </div>
      </div>
      <template #footer>
        <div style="text-align: right">
          <n-button type="primary" @click="resultModalVisible = false">关闭</n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { commonApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";
import { useRouter } from "vue-router";
import { useQueueStore } from "@renderer/stores";

defineOptions({
  name: "Dashboard",
});

const router = useRouter();
const quenuStore = useQueueStore();
const runningTaskNum = computed(() => quenuStore.runningTaskNum);
const statistics = ref<{
  startTime: number | null;
  videoTotalDuaration: number | null;
  recordingNum: number;
  recorderNum: number;
}>({
  startTime: null,
  videoTotalDuaration: null,
  recordingNum: 0,
  recorderNum: 0,
});

const diskSpace = ref<{
  total: number;
  free: number;
  used: number;
  usedPercentage: number;
} | null>(null);

const getTime = async () => {
  const data = await commonApi.appStatistics();
  statistics.value = data;
  try {
    const diskData = await commonApi.getDiskSpace();
    diskSpace.value = diskData;
  } catch (error) {
    console.error("获取磁盘空间失败:", error);
    diskSpace.value = null;
  }
};

const now = ref(Date.now());

const formatTime = (time: number) => {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / 1000 / 60) % 60);
  const hours = Math.floor((time / 1000 / 60 / 60) % 24);
  const days = Math.floor(time / 1000 / 60 / 60 / 24);

  if (days > 0) {
    return `${days}天${hours}小时${minutes}分钟${seconds}秒`;
  } else {
    return `${hours}小时${minutes}分钟${seconds}秒`;
  }
};

let intervalId: NodeJS.Timeout | null = null;
const createInterval = () => {
  if (intervalId) return;
  const interval = window.isWeb ? 1000 : 1000;
  intervalId = setInterval(() => {
    now.value = Date.now();
  }, interval);
};
function cleanInterval() {
  intervalId && clearInterval(intervalId);
  intervalId = null;
}

onDeactivated(() => {
  cleanInterval();
});

let eventSource: EventSource | null = null;
async function getRunningTaskNum() {
  if (eventSource && eventSource?.readyState !== 2) return;
  eventSource = await commonApi.getRunningTaskNum();

  eventSource.onmessage = function (event) {
    const data = JSON.parse(event.data || "{}");
    quenuStore.setRunningTaskNum(data.num);
  };
}

onActivated(() => {
  getTime();
  createInterval();
  getRunningTaskNum();
});

onDeactivated(() => {
  cleanInterval();
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
});

const confirm = useConfirm();
const notice = useNotice();
const handleWebhook = async () => {
  const res = await commonApi.testWebhook();
  if (res.length === 0) {
    notice.warning("没有发现问题");
    return false;
  }
  const list = res.map((item) => `${item.file}`).join("\n");

  const [status] = await confirm.warning({
    title: "以下数据存在问题，是否处理，以下数据将会被认为是错误数据，请手动处理？",
    content: `${list}`,
  });
  if (!status) return false;
  await commonApi.handleWebhook(res);
  notice.success("处理成功");
  return true;
};

// 直播间号输入相关
const roomIdModalVisible = ref(false);
const roomIdInput = ref("");
const resultModalVisible = ref(false);
const checkResult = ref<{ hasError: boolean; errorInfo: string } | null>(null);

const whyUploadFailed = () => {
  roomIdInput.value = "";
  roomIdModalVisible.value = true;
};

const handleRoomIdConfirm = async () => {
  if (!roomIdInput.value.trim()) {
    notice.warning("请输入直播间号");
    return;
  }

  roomIdModalVisible.value = false;

  try {
    const res = await commonApi.whyUploadFailed(roomIdInput.value.trim());
    checkResult.value = res;
    resultModalVisible.value = true;
  } catch (error) {
    notice.error("检测失败，请检查直播间号是否正确");
  }
};

const navigateToRecorder = () => {
  router.push({ name: "recorder" });
};

const navigateToQueue = () => {
  router.push({ name: "Queue" });
};
</script>

<style scoped lang="less">
.dashboard-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .page-title {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  transition: all 0.3s ease;

  &.clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(-6px);
    }
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px var(--shadow-color);
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.running-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    &.record-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    &.streamer-icon {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    &.recording-icon {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: white;
      animation: pulse 2s ease-in-out infinite;
    }

    &.task-icon {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }

    &.disk-icon {
      background: linear-gradient(135deg, #ff9a56 0%, #ffeaa7 100%);
      color: white;
    }

    &.disk-icon-warning {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
      animation: pulse 2s ease-in-out infinite;
    }
  }

  .stat-info {
    flex: 1;
    min-width: 0;

    .stat-label {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
      word-break: break-all;
    }

    .stat-extra {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .text-error {
      color: #ff6b6b !important;
      font-weight: 700;
    }
  }
}

.action-card {
  margin-bottom: 24px;

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.charts-section {
  margin-top: 24px;
}

.result-status {
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 12px;

  &.result-error {
    color: var(--color-error);
  }

  &.result-success {
    color: var(--color-success);
  }
}

.result-info {
  margin-top: 12px;
  white-space: pre-wrap;
  line-height: 1.5;
  color: var(--text-secondary);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card .stat-value {
    font-size: 18px;
  }
}
</style>
