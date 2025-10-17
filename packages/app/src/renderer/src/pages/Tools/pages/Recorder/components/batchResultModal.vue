<template>
  <n-modal v-model:show="showModal" :show-icon="false" :closable="false">
    <n-card
      style="width: 800px"
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

      <n-divider />

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

      <n-divider v-if="successResults.length > 0" />

      <!-- 详细结果列表 -->
      <div class="results-list">
        <h4>详细结果</h4>
        <n-list>
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
                  {{ result.data?.owner }} - {{ result.data?.providerId }}
                </n-text>
                <n-text v-else type="error"> 解析失败 </n-text>
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
            :loading="adding"
          >
            添加录制器 ({{ successResults.length }}个)
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { CheckmarkCircleOutline, CloseCircleOutline } from "@vicons/ionicons5";
import { recoderApi } from "@renderer/apis";
import { useAppConfig } from "@renderer/stores";

const { appConfig } = storeToRefs(useAppConfig());
const notice = useNotification();

interface ParseResult {
  url: string;
  success: boolean;
  data?: {
    providerId: string;
    channelId: string;
    owner: string;
    uid?: number;
    avatar?: string;
  };
  error?: string;
}

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

    for (const result of successResults.value) {
      if (!result.data) continue;

      try {
        // 构建录制器配置，使用全局配置作为默认值
        const recorderConfig = {
          providerId: result.data.providerId as "DouYu" | "HuYa" | "Bilibili" | "DouYin",
          channelId: result.data.channelId,
          remarks: result.data.owner,
          disableAutoCheck: !batchSettings.value.autoRecord, // 注意这里是反向的
          sendToWebhook: batchSettings.value.sendToWebhook,

          // 以下参数使用全局默认值
          segment: appConfig.value.recorder.segment,
          quality: getDefaultQuality(result.data.providerId),
          disableProvideCommentsWhenRecording:
            appConfig.value.recorder.disableProvideCommentsWhenRecording,
          saveGiftDanma: appConfig.value.recorder.saveGiftDanma,
          saveSCDanma: appConfig.value.recorder.saveSCDanma,
          streamPriorities: [],
          sourcePriorities: [],
          noGlobalFollowFields: [], // 使用全局配置
          saveCover: appConfig.value.recorder.saveCover,
          extra: {
            createTimestamp: Date.now(),
            avatar: result.data.avatar,
            ...(result.data.uid && { recorderUid: result.data.uid }),
          },
          qualityRetry: appConfig.value.recorder.qualityRetry,
          formatName: getDefaultFormatName(result.data.providerId),
          useM3U8Proxy: appConfig.value.recorder.bilibili.useM3U8Proxy,
          codecName: appConfig.value.recorder.bilibili.codecName,
          titleKeywords: "",
          liveStartNotification: false,
          weight: 10,
          source: getDefaultSource(result.data.providerId),
          videoFormat: appConfig.value.recorder.videoFormat,
          recorderType: appConfig.value.recorder.recorderType,
          cookie: getDefaultCookie(result.data.providerId),
          doubleScreen: appConfig.value.recorder.douyin.doubleScreen,
          useServerTimestamp: appConfig.value.recorder.useServerTimestamp,
          handleTime: [null, null] as [string | null, string | null],
          uid:
            result.data.providerId === "Bilibili"
              ? appConfig.value.recorder.bilibili.uid
              : undefined,
          onlyAudio: false,
        };

        await recoderApi.add(recorderConfig);
        successAddCount++;
      } catch (error: any) {
        console.error(`添加录制器失败: ${result.data.owner}`, error);
        failedAddCount++;
      }
    }

    // 显示添加结果
    if (successAddCount > 0) {
      notice.success({
        title: "批量添加完成",
        content: `成功添加 ${successAddCount} 个录制器${failedAddCount > 0 ? `，失败 ${failedAddCount} 个` : ""}`,
        duration: 3000,
      });
    } else {
      notice.error({
        title: "添加失败",
        content: "没有成功添加任何录制器",
        duration: 3000,
      });
    }

    emits("completed");
    showModal.value = false;
  } finally {
    adding.value = false;
  }
};

// 根据平台获取默认画质
const getDefaultQuality = (providerId: string) => {
  switch (providerId) {
    case "Bilibili":
      return appConfig.value.recorder.bilibili.quality;
    case "DouYu":
      return appConfig.value.recorder.douyu.quality;
    case "HuYa":
      return appConfig.value.recorder.huya.quality;
    case "DouYin":
      return appConfig.value.recorder.douyin.quality;
    default:
      return appConfig.value.recorder.quality;
  }
};

// 根据平台获取默认格式
const getDefaultFormatName = (providerId: string) => {
  switch (providerId) {
    case "Bilibili":
      return appConfig.value.recorder.bilibili.formatName;
    case "DouYin":
      return appConfig.value.recorder.douyin.formatName;
    case "HuYa":
      return appConfig.value.recorder.huya.formatName;
    default:
      return "auto";
  }
};

// 根据平台获取默认线路
const getDefaultSource = (providerId: string) => {
  switch (providerId) {
    case "DouYu":
      return appConfig.value.recorder.douyu.source;
    case "HuYa":
      return appConfig.value.recorder.huya.source;
    default:
      return "auto";
  }
};

// 根据平台获取默认Cookie
const getDefaultCookie = (providerId: string) => {
  switch (providerId) {
    case "DouYin":
      return appConfig.value.recorder.douyin.cookie;
    default:
      return "";
  }
};

const cancel = () => {
  showModal.value = false;
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
  margin: 20px 0;

  h4 {
    margin-bottom: 16px;
    color: #333;
  }
}

.results-list {
  max-height: 300px;
  overflow-y: auto;

  h4 {
    margin-bottom: 16px;
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
