<template>
  <n-modal v-model:show="showModal" :show-icon="false" :closable="false">
    <n-card
      style="width: 700px"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <div class="result-summary">
        <n-statistic label="解析成功" :value="successCount" class="success-stat">
          <template #suffix>
            <span style="color: #52c41a">个</span>
          </template>
        </n-statistic>
        <n-statistic label="解析失败" :value="failedCount" class="failed-stat">
          <template #suffix>
            <span style="color: #ff4d4f">个</span>
          </template>
        </n-statistic>
      </div>

      <!-- 批量设置区域 -->
      <div v-if="successResults.length > 0" class="batch-settings">
        <h4>批量设置（应用到所有成功解析的直播间）</h4>
        <n-form label-placement="left" :label-width="120">
          <n-form-item>
            <template #label>
              <span class="inline-flex">自动录制</span>
            </template>
            <n-switch
              v-model:value="batchSettings.autoRecord"
              :checked-value="true"
              :unchecked-value="false"
            />
          </n-form-item>
          <n-form-item>
            <template #label>
              <span class="inline-flex">发送到webhook</span>
            </template>
            <n-switch v-model:value="batchSettings.sendToWebhook" />
          </n-form-item>
        </n-form>
      </div>

      <!-- <n-divider v-if="successResults.length > 0" /> -->

      <!-- 详细结果列表 -->
      <div class="results-list">
        <div class="results-header">
          <h4>详细结果</h4>
          <n-button
            v-if="failedResults.length > 0"
            size="small"
            @click="copyFailedUrls"
            type="warning"
          >
            复制失败链接
          </n-button>
        </div>
        <n-list class="results-list-content">
          <n-list-item v-for="(result, index) in results" :key="index">
            <template #prefix>
              <n-icon
                :component="result.success ? CheckmarkCircleOutline : CloseCircleOutline"
                :color="result.success ? '#52c41a' : '#ff4d4f'"
                size="18"
              />
            </template>
            <n-thing>
              <template #header>
                <n-text v-if="result.success" type="success">
                  {{ result.data?.remarks }} - {{ result.data?.providerId }}
                </n-text>
              </template>
              <template #description>
                <div class="result-url">{{ result.url }}</div>
                <div v-if="!result.success" class="error-message">错误：{{ result.error }}</div>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
      </div>

      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="cancel">取消</n-button>
          <n-button
            v-if="successResults.length > 0"
            type="primary"
            class="btn"
            @click="addRecorders"
          >
            添加 ({{ successResults.length }}个)
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { CheckmarkCircleOutline, CloseCircleOutline } from "@vicons/ionicons5";
import { recoderApi } from "@renderer/apis";

import type { BatchResolveChannelResult } from "@biliLive-tools/http/types/recorder.js";

const notice = useNotification();

type ParseResult = BatchResolveChannelResult;

interface Props {
  results: ParseResult[];
}

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const props = defineProps<Props>();
const emits = defineEmits<{
  (event: "completed"): void;
}>();

const adding = ref(false);

const batchSettings = ref({
  autoRecord: true, // 自动录制开关，true表示开启自动录制（disableAutoCheck=false）
  sendToWebhook: false,
});

const successResults = computed(() => props.results.filter((result) => result.success));

const failedResults = computed(() => props.results.filter((result) => !result.success));

const successCount = computed(() => successResults.value.length);
const failedCount = computed(() => failedResults.value.length);

const addRecorders = async () => {
  if (successResults.value.length === 0) return;

  adding.value = true;

  try {
    let successAddCount = 0;
    let failedAddCount = 0;
    const errorResults: string[] = [];

    for (const result of successResults.value) {
      if (!result.data) continue;

      try {
        // 应用批量设置
        result.data.disableAutoCheck = !batchSettings.value.autoRecord;
        result.data.sendToWebhook = batchSettings.value.sendToWebhook;
        await recoderApi.add(result.data);
        successAddCount++;
      } catch (error: any) {
        errorResults.push(`添加失败: ${result.data.remarks}，${error.message || error}`);
        failedAddCount++;
      }
    }

    if (errorResults.length > 0) {
      notice.error({
        title: "直播间添加失败",
        content: errorResults.join("\n"),
        duration: 10000,
      });
    } else {
      notice.success({
        title: "批量添加完成",
        content: `成功添加 ${successAddCount} 个直播间`,
        duration: 3000,
      });
    }
    emits("completed");
    showModal.value = false;
  } finally {
    adding.value = false;
  }
};

const cancel = () => {
  showModal.value = false;
};

const copyFailedUrls = async () => {
  const urls = failedResults.value.map((result) => result.url).join("\n");
  try {
    await navigator.clipboard.writeText(urls);
    notice.success({
      title: "复制成功",
      content: `已复制 ${failedResults.value.length} 个失败的链接`,
      duration: 1000,
    });
  } catch (error) {
    notice.error({
      title: "复制失败",
      content: "无法访问剪贴板",
      duration: 3000,
    });
  }
};

// 当弹窗打开时重置设置
watch(showModal, (val) => {
  if (val) {
    batchSettings.value = {
      autoRecord: true,
      sendToWebhook: false,
    };
  }
});
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}

.result-summary {
  display: flex;
  gap: 40px;
  justify-content: center;

  .success-stat {
    :deep(.n-statistic-value__content) {
      color: #52c41a;
    }
  }

  .failed-stat {
    :deep(.n-statistic-value__content) {
      color: #ff4d4f;
    }
  }
}

.batch-settings {
  // margin: 20px 0;

  h4 {
    margin: 10px 0;
    color: #333;
  }
}

.results-list {
  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .results-list-content {
    // max-height: 300px;
    max-height: calc(100vh - 300px);
    overflow-y: auto;
  }

  h4 {
    margin: 10px 0;
    color: #333;
  }
}

.result-url {
  font-size: 12px;
  color: #666;
  word-break: break-all;
  margin-bottom: 4px;
}

.error-message {
  font-size: 12px;
  color: #ff4d4f;
}
</style>
