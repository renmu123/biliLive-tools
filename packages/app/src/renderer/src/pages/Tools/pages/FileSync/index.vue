<template>
  <div class="tool-workbench">
    <header class="page-header">
      <div>
        <h2>文件同步</h2>
        <p>将本地文件批量上传到网盘</p>
      </div>
      <n-button text type="primary" @click="openQueue">查看任务队列</n-button>
    </header>

    <div class="workspace-grid">
      <n-card class="workspace-card file-card" :bordered="false">
        <template #header>
          <div class="card-heading"><span class="step-number">1</span>输入文件</div>
        </template>
        <template #header-extra>
          <div class="file-actions">
            <n-text depth="3">已选择 {{ fileList.length }} 个</n-text>
            <n-button size="small" :disabled="submitting" @click="addFiles">添加文件</n-button>
            <n-button size="small" :disabled="fileList.length === 0 || submitting" @click="clear">
              清空
            </n-button>
          </div>
        </template>

        <FileSelect
          ref="fileSelect"
          v-model="fileList"
          :sort="false"
          :extensions="['*']"
          area-placeholder="可选择任意文件"
        />
        <n-text depth="3" class="file-hint">
          {{ isWeb ? "可一次选择多个文件" : "可点击选择或拖入多个文件" }}
        </n-text>
      </n-card>

      <n-card class="workspace-card settings-card" :bordered="false">
        <template #header>
          <div class="card-heading"><span class="step-number">2</span>设置</div>
        </template>

        <div class="setting-section">
          <div class="setting-title">同步网盘</div>
          <n-select
            v-model:value="options.syncType"
            :options="syncConfigOptions"
            placeholder="选择同步网盘"
          />
        </div>

        <div v-if="options.syncType === 'aliyunpan'" class="setting-section">
          <div class="setting-title">上传位置</div>
          <n-select
            v-model:value="options.aliyunpanDriveType"
            :options="aliyunpanDriveOptions"
            placeholder="选择上传位置"
          />
        </div>

        <div class="setting-section">
          <div class="setting-title">目标路径</div>
          <n-input
            v-model:value="targetPathDraft"
            placeholder="请输入目标路径"
            @blur="handleTargetPathBlur"
          />
        </div>

        <div class="setting-section source-option">
          <n-checkbox v-model:checked="options.removeOrigin">上传完成后移除源文件</n-checkbox>
          <n-text depth="3">仅在同步任务完成后处理源文件</n-text>
        </div>
      </n-card>
    </div>

    <n-alert
      v-if="submissionResult"
      class="submission-result"
      :type="
        submissionResult.failed.length
          ? submissionResult.submitted
            ? 'warning'
            : 'error'
          : 'success'
      "
      :title="`已提交 ${submissionResult.submitted} 个任务${submissionResult.failed.length ? `，${submissionResult.failed.length} 个文件未提交` : ''}`"
      closable
      @close="submissionResult = null"
    >
      <div v-if="submissionResult.failed.length" class="failed-files">
        <div v-for="failure in submissionResult.failed" :key="failure.id">
          {{ failure.name }}：{{ failure.message }}
        </div>
      </div>
      <n-button v-if="submissionResult.submitted" text type="primary" @click="openQueue">
        查看任务队列
      </n-button>
    </n-alert>

    <div class="submit-bar">
      <div class="submit-summary">
        <strong>{{ fileList.length }} 个文件待上传</strong>
        <n-text depth="3" :title="submitHint">{{ submitHint }}</n-text>
      </div>
      <n-button
        type="primary"
        size="large"
        :loading="submitting"
        :disabled="!canSync"
        title="快捷键 Ctrl+Enter"
        @click="sync"
      >
        开始上传（{{ fileList.length }} 个文件）
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
import FileSelect from "@renderer/pages/Tools/pages/FileUpload/components/FileSelect.vue";
import { useAppConfig } from "@renderer/stores";
import { syncApi } from "@renderer/apis";
import { useRouter } from "vue-router";
import hotkeys from "hotkeys-js";

import type { AliyunPanDriveType } from "@biliLive-tools/types";

defineOptions({ name: "FileSync" });

const notice = useNotice();
const router = useRouter();
const isWeb = window.isWeb;
const { appConfig } = storeToRefs(useAppConfig());
const options = toReactive(
  computed({
    get: () => appConfig.value.tool.fileSync,
    set: (value) => {
      appConfig.value.tool.fileSync = value;
    },
  }),
);

const targetPathDraft = ref("");
watch(
  () => options.targetPath,
  (value) => {
    targetPathDraft.value = value;
  },
  { immediate: true },
);
const handleTargetPathBlur = () => {
  if (targetPathDraft.value !== options.targetPath) options.targetPath = targetPathDraft.value;
};

const fileList = ref<{ id: string; title: string; path: string; visible: boolean }[]>([]);
const fileSelect = ref<InstanceType<typeof FileSelect> | null>(null);
const submitting = ref(false);
const processedCount = ref(0);
const submittingTotal = ref(0);
const submissionResult = ref<{
  submitted: number;
  failed: { id: string; name: string; message: string }[];
} | null>(null);

watch(submissionResult, (result, _, onCleanup) => {
  if (!result?.submitted || result.failed.length) return;
  const timer = setTimeout(() => {
    submissionResult.value = null;
  }, 10000);
  onCleanup(() => clearTimeout(timer));
});

const syncConfigOptions = [
  { label: "百度网盘", value: "baiduPCS" },
  { label: "阿里云盘", value: "aliyunpan" },
  { label: "alist", value: "alist" },
  { label: "123网盘", value: "pan123" },
];
const aliyunpanDriveOptions: Array<{ label: string; value: AliyunPanDriveType }> = [
  { label: "备份盘", value: "backup" },
  { label: "资源库", value: "resource" },
];

const canSync = computed(
  () => !submitting.value && fileList.value.length > 0 && !!options.syncType,
);
const submitHint = computed(() => {
  if (submitting.value) return `正在提交 ${processedCount.value}/${submittingTotal.value} 个文件`;
  if (!fileList.value.length) return "请先添加文件";
  if (!options.syncType) return "请先选择同步网盘";
  return targetPathDraft.value.trim() || "上传到网盘默认位置";
});

onActivated(() => {
  hotkeys("ctrl+enter", () => {
    sync();
  });
});
onDeactivated(() => hotkeys.unbind("ctrl+enter"));
onUnmounted(() => hotkeys.unbind("ctrl+enter"));

const sync = async () => {
  if (submitting.value) return;
  if (!options.syncType) {
    notice.error({ title: "请选择同步网盘" });
    return;
  }
  if (!fileList.value.length) {
    notice.error({ title: "至少选择一个文件" });
    return;
  }

  handleTargetPathBlur();
  submitting.value = true;
  processedCount.value = 0;
  submissionResult.value = null;
  const files = [...fileList.value];
  const taskOptions = {
    type: options.syncType,
    targetPath: options.targetPath,
    aliyunpanDriveType:
      options.syncType === "aliyunpan" ? options.aliyunpanDriveType || "backup" : undefined,
    options: { removeOrigin: options.removeOrigin },
  };
  submittingTotal.value = files.length;

  try {
    const submittedIds = new Set<string>();
    const failed: { id: string; name: string; message: string }[] = [];
    for (const file of files) {
      try {
        await syncApi.sync({ file: file.path, ...taskOptions });
        submittedIds.add(file.id);
      } catch (error) {
        failed.push({
          id: file.id,
          name: file.title,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        processedCount.value += 1;
      }
    }
    fileList.value = fileList.value.filter((file) => !submittedIds.has(file.id));
    submissionResult.value = { submitted: submittedIds.size, failed };
  } finally {
    submitting.value = false;
  }
};

const addFiles = () => fileSelect.value?.select();
const clear = () => {
  fileList.value = [];
};
const openQueue = () => router.push({ name: "Queue" });
</script>

<style scoped lang="less">
@import "../workbench.less";
</style>
