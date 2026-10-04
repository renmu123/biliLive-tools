<template>
  <div class="danmu-workbench">
    <header class="page-header">
      <div>
        <h2>弹幕转换</h2>
        <p>将 XML 弹幕文件批量转换为 ASS 字幕</p>
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
          area-placeholder="仅支持 XML 文件"
          :extensions="['xml']"
          :sort="false"
        />
        <n-text depth="3" class="file-hint">
          {{ isWeb ? "可一次选择多个 XML 文件" : "可点击选择或拖入多个 XML 文件" }}
        </n-text>
      </n-card>

      <n-card class="workspace-card settings-card" :bordered="false">
        <template #header>
          <div class="card-heading"><span class="step-number">2</span>设置</div>
        </template>

        <div class="setting-section">
          <div class="setting-title">弹幕预设</div>
          <div class="preset-control">
            <n-select
              v-model:value="danmuPresetId"
              :options="danmuPresetsOptions"
              placeholder="选择预设"
            />
            <n-button @click="openSetting">
              <template #icon
                ><n-icon><SettingIcon /></n-icon
              ></template>
              编辑预设
            </n-button>
          </div>
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
              <template #icon
                ><n-icon><FolderOpenOutline /></n-icon
              ></template>
              浏览
            </n-button>
          </div>
        </div>

        <div class="setting-section">
          <div class="setting-title">同名文件</div>
          <n-radio-group v-model:value="options.override">
            <n-space>
              <n-radio :value="false">不覆盖已有文件</n-radio>
              <n-radio :value="true">覆盖已有文件</n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <div class="setting-section source-option">
          <n-checkbox v-model:checked="options.removeOrigin">转换成功后移除源 XML 文件</n-checkbox>
          <n-text depth="3">仅在转换任务完成后处理源文件</n-text>
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
        <strong>{{ fileList.length }} 个文件待转换</strong>
        <n-text depth="3" :title="submitHint">{{ submitHint }}</n-text>
      </div>
      <n-button
        type="primary"
        size="large"
        :loading="submitting"
        :disabled="!canConvert"
        title="快捷键 Ctrl+Enter"
        @click="convert"
      >
        开始转换（{{ fileList.length }} 个文件）
      </n-button>
    </div>

    <DanmuFactorySettingDailog
      v-model:visible="show"
      v-model="danmuPresetId"
    ></DanmuFactorySettingDailog>
  </div>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
import FileSelect from "@renderer/pages/Tools/pages/FileUpload/components/FileSelect.vue";
import DanmuFactorySettingDailog from "@renderer/components/DanmuFactorySettingDailog.vue";
import { showDirectoryDialog } from "@renderer/utils/fileSystem";
import { useDanmuPreset, useAppConfig } from "@renderer/stores";
import { danmuPresetApi, taskApi } from "@renderer/apis";
import { Settings as SettingIcon, FolderOpenOutline } from "@vicons/ionicons5";
import { useRouter } from "vue-router";
import hotkeys from "hotkeys-js";

defineOptions({
  name: "DanmakuFactory",
});

const { danmuPresetsOptions, danmuPresetId } = storeToRefs(useDanmuPreset());
const { appConfig } = storeToRefs(useAppConfig());

const notice = useNotice();
const router = useRouter();
const isWeb = window.isWeb;

const fileList = ref<{ id: string; title: string; path: string; visible: boolean }[]>([]);
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
    get: () => appConfig.value.tool.danmu,
    set: (value) => {
      appConfig.value.tool.danmu = value;
    },
  }),
);

const canConvert = computed(
  () =>
    !submitting.value &&
    fileList.value.length > 0 &&
    !!danmuPresetId.value &&
    (options.saveRadio !== 2 || options.savePath.trim().length > 0),
);

const submitHint = computed(() => {
  if (submitting.value) return `正在提交 ${processedCount.value}/${submittingTotal.value} 个文件`;
  if (!fileList.value.length) return "请先添加 XML 文件";
  if (!danmuPresetId.value) return "请先选择弹幕预设";
  return options.saveRadio === 1
    ? "输出到各源文件夹"
    : options.savePath.trim() || "请先选择保存目录";
});

onActivated(() => {
  hotkeys("ctrl+enter", function () {
    convert();
  });
});
onDeactivated(() => {
  hotkeys.unbind("ctrl+enter");
});
onUnmounted(() => {
  hotkeys.unbind("ctrl+enter");
});

const convert = async () => {
  if (submitting.value) return;
  if (fileList.value.length === 0) {
    notice.error({
      title: "至少选择一个文件",
    });
    return;
  }
  if (options.saveRadio === 2 && !options.savePath.trim()) {
    notice.error({ title: "请选择保存目录" });
    return;
  }
  if (!danmuPresetId.value) {
    notice.error({ title: "请选择弹幕预设" });
    return;
  }

  submitting.value = true;
  processedCount.value = 0;
  submissionResult.value = null;
  const files = [...fileList.value];
  const taskOptions = { ...options };
  submittingTotal.value = files.length;

  try {
    const config = (await danmuPresetApi.get(danmuPresetId.value)).config;
    if (config.resolutionResponsive) {
      notice.warning({
        duration: 5000,
        title: `本次转换无法使用自适应分辨率，将使用${config.resolution[0]}X${config.resolution[1]}分辨率，请确认与你的视频分辨率一致`,
      });
    }

    const submittedIds = new Set<string>();
    const failed: { id: string; name: string; message: string }[] = [];
    for (const file of files) {
      try {
        await taskApi.convertXml2Ass(file.path, file.title, config, taskOptions);
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
  } catch (error) {
    notice.error({
      title: error instanceof Error ? error.message : String(error),
    });
  } finally {
    submitting.value = false;
  }
};

const show = ref(false);
const openSetting = () => {
  show.value = true;
};

async function getDir() {
  let dir: string | undefined = await showDirectoryDialog({
    defaultPath: options.savePath,
  });

  if (!dir) return;
  options.savePath = dir;
  options.saveRadio = 2;
}

const fileSelect = ref<HTMLInputElement | null>(null);
const addVideo = async () => {
  fileSelect.value?.select();
};

const clear = () => {
  fileList.value = [];
};

const openQueue = () => {
  router.push({ name: "Queue" });
};
</script>

<style scoped lang="less">
.danmu-workbench {
  padding-bottom: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;

  h2 {
    margin: 0 0 4px;
  }

  p {
    margin: 0;
    color: var(--text-muted);
  }
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(360px, 1fr);
  align-items: start;
  gap: 18px;
}

.workspace-card {
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  min-width: 0;
  background: var(--bg-primary);
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.step-number {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--text-inverse);
  font-size: 13px;
}

.file-actions,
.preset-control,
.path-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-hint {
  display: block;
  margin-top: 12px;
  font-size: 12px;
}

.setting-section + .setting-section {
  border-top: 1px solid var(--border-secondary);
  margin-top: 20px;
  padding-top: 20px;
}

.setting-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.preset-control .n-select,
.path-control .n-input {
  flex: 1;
  min-width: 0;
}

.preset-control .n-button,
.path-control .n-button {
  flex-shrink: 0;
}

.save-location {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.path-control {
  margin-top: 12px;
}

.source-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;

  .n-text {
    padding-left: 22px;
    font-size: 12px;
  }
}

.submission-result {
  margin-top: 18px;
}

.failed-files {
  max-height: 120px;
  overflow-y: auto;
  margin-bottom: 8px;
}

.submit-bar {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 20px;
  padding: 16px 20px;
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  background: var(--bg-primary);
}

.submit-summary {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;

  .n-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 1050px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .page-header,
  .submit-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .file-card :deep(.n-card-header) {
    flex-wrap: wrap;
    gap: 8px;
  }

  .file-card :deep(.n-card-header__extra) {
    width: 100%;
    margin-left: 0;
  }

  .file-actions {
    flex-wrap: wrap;
  }

  .submit-bar .n-button {
    width: 100%;
  }
}
</style>
