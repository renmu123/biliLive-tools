<template>
  <div class="tool-workbench">
    <header class="page-header">
      <div>
        <h2>FLV 修复</h2>
        <p>批量修复 FLV 录播文件</p>
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
            <n-button size="small" :disabled="submitting" @click="addVideo">添加文件</n-button>
            <n-button size="small" :disabled="fileList.length === 0 || submitting" @click="clear">
              清空
            </n-button>
          </div>
        </template>

        <FileSelect
          ref="fileSelect"
          v-model="fileList"
          area-placeholder="仅支持 FLV 文件"
          :extensions="['flv']"
          :sort="false"
        />
        <n-text depth="3" class="file-hint">
          {{ isWeb ? "可一次选择多个 FLV 文件" : "可点击选择或拖入多个 FLV 文件" }}
        </n-text>
      </n-card>

      <n-card class="workspace-card settings-card" :bordered="false">
        <template #header>
          <div class="card-heading"><span class="step-number">2</span>设置</div>
        </template>

        <div class="setting-section">
          <div class="setting-title">修复方式</div>
          <n-radio-group v-model:value="options.type">
            <n-space>
              <n-radio value="bililive">录播姬</n-radio>
              <n-radio value="mesio">mesio</n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <div class="setting-section">
          <div class="setting-title">保存位置</div>
          <n-radio-group v-model:value="options.saveRadio" class="save-location">
            <n-radio :value="1">保存到源文件所在文件夹</n-radio>
            <n-radio :value="2">保存到指定文件夹</n-radio>
          </n-radio-group>
          <div v-if="options.saveRadio === 2" class="path-control">
            <n-input
              v-model:value="options.savePath"
              placeholder="选择或输入保存目录"
              title="支持相对路径"
            />
            <n-button @click="getDir">
              <template #icon>
                <n-icon><FolderOpenOutline /></n-icon>
              </template>
              浏览
            </n-button>
          </div>
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
        <strong>{{ fileList.length }} 个文件待修复</strong>
        <n-text depth="3" :title="submitHint">{{ submitHint }}</n-text>
      </div>
      <n-button
        type="primary"
        size="large"
        :loading="submitting"
        :disabled="!canRepair"
        title="快捷键 Ctrl+Enter"
        @click="convert"
      >
        开始修复（{{ fileList.length }} 个文件）
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
import hotkeys from "hotkeys-js";
import { FolderOpenOutline } from "@vicons/ionicons5";
import { useRouter } from "vue-router";

import FileSelect from "@renderer/pages/Tools/pages/FileUpload/components/FileSelect.vue";
import { useAppConfig } from "@renderer/stores";
import { taskApi } from "@renderer/apis";
import { showDirectoryDialog } from "@renderer/utils/fileSystem";

defineOptions({ name: "FlvRepair" });

const notice = useNotice();
const router = useRouter();
const isWeb = window.isWeb;
const { appConfig } = storeToRefs(useAppConfig());
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

const options = toReactive(
  computed({
    get: () => appConfig.value.tool.flvRepair,
    set: (value) => {
      appConfig.value.tool.flvRepair = value;
    },
  }),
);

const canRepair = computed(
  () =>
    !submitting.value &&
    fileList.value.length > 0 &&
    (options.saveRadio !== 2 || options.savePath.trim().length > 0),
);
const submitHint = computed(() => {
  if (submitting.value) return `正在提交 ${processedCount.value}/${submittingTotal.value} 个文件`;
  if (!fileList.value.length) return "请先添加 FLV 文件";
  return options.saveRadio === 1
    ? "输出到各源文件夹"
    : options.savePath.trim() || "请先选择保存目录";
});

onActivated(() => {
  hotkeys("ctrl+enter", () => {
    convert();
  });
});
onDeactivated(() => hotkeys.unbind("ctrl+enter"));
onUnmounted(() => hotkeys.unbind("ctrl+enter"));

const convert = async () => {
  if (submitting.value) return;
  if (!fileList.value.length) {
    notice.error({ title: "至少选择一个文件" });
    return;
  }
  if (options.saveRadio === 2 && !options.savePath.trim()) {
    notice.error({ title: "请选择保存目录" });
    return;
  }

  submitting.value = true;
  processedCount.value = 0;
  submissionResult.value = null;
  const files = [...fileList.value];
  const taskOptions = { ...options };
  submittingTotal.value = files.length;

  try {
    const submittedIds = new Set<string>();
    const failed: { id: string; name: string; message: string }[] = [];
    for (const file of files) {
      try {
        await taskApi.flvRepair(file.path, file.title, taskOptions);
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

const addVideo = () => fileSelect.value?.select();
const clear = () => {
  fileList.value = [];
};
const openQueue = () => router.push({ name: "Queue" });

async function getDir() {
  const dir = await showDirectoryDialog({ defaultPath: options.savePath });
  if (!dir) return;
  options.savePath = dir;
  options.saveRadio = 2;
}
</script>

<style scoped lang="less">
@import "./workbench.less";
</style>
