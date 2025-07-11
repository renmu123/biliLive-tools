<template>
  <div>
    <div class="header">
      <h1>已运行{{ formatTime(now - appStartTime) }}</h1>
      <div>
        <n-button type="primary" @click="handleWebhook">Webhook卡住不能上传？点我试试</n-button>
      </div>
      <div>
        <n-button type="primary" @click="whyUploadFailed">为什么webhook里的xx不能上传？</n-button>
      </div>
    </div>
    <div class="content">
      <!-- TODO:总主播数量，监控数量，正在录制数量 -->
      <!-- 录制时长-折线图，总时长，周同比 -->
    </div>
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
        <div :style="{ color: checkResult.hasError ? '#f56565' : '#48bb78' }">
          {{ checkResult.hasError ? "发现问题" : "配置正常" }}
        </div>
        <div style="margin-top: 12px; white-space: pre-wrap; line-height: 1.5">
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

defineOptions({
  name: "Dashboard",
});
const appStartTime = ref(0);

const getTime = async () => {
  const time = await commonApi.appStartTime();
  appStartTime.value = time;
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

onActivated(() => {
  getTime();
  createInterval();
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
</script>

<style scoped lang="less">
.center {
  text-align: center;
}
.header {
  display: flex;
  align-items: center;
  gap: 20px;
  // padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}
</style>
