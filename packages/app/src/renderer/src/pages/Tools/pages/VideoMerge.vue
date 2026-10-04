<template>
  <div class="tool-workbench">
    <header class="page-header">
      <div>
        <h2>视频合并</h2>
        <p>按文件列表顺序合并多个视频，可同时合并对应弹幕</p>
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
            <n-dropdown
              :options="sortOptions"
              :disabled="fileList.length < 2 || submitting"
              @select="sortFiles"
            >
              <n-button size="small" :disabled="fileList.length < 2 || submitting">排序</n-button>
            </n-dropdown>
            <n-button size="small" :disabled="submitting" @click="addVideo">添加文件</n-button>
            <n-button size="small" :disabled="fileList.length === 0 || submitting" @click="clear">
              清空
            </n-button>
          </div>
        </template>

        <FileSelect
          ref="fileSelect"
          v-model="fileList"
          :extensions="[...supportedVideoExtensions, 'xml']"
          :disable-edit="true"
          area-placeholder="请选择至少两个视频文件"
        />
        <n-text depth="3" class="file-hint">
          {{
            isWeb
              ? "可一次选择多个视频及对应 XML 文件"
              : "可拖动调整顺序，或点击选择视频及对应 XML 文件"
          }}
        </n-text>
        <n-alert type="warning" style="margin-top: 8px">
          并非所有容器都支持流复制。如果出现播放问题或未合并文件，可能需要重新编码。
        </n-alert>
      </n-card>

      <n-card class="workspace-card settings-card" :bordered="false">
        <template #header>
          <div class="card-heading"><span class="step-number">2</span>设置</div>
        </template>

        <div class="setting-section source-option">
          <n-checkbox v-model:checked="options.mergeXml">合并弹幕</n-checkbox>
          <n-text depth="3">需要为每个视频选择对应的弹幕文件</n-text>
        </div>

        <div class="setting-section">
          <div class="setting-title">保存位置</div>
          <n-checkbox v-model:checked="options.saveOriginPath">保存到首个视频所在文件夹</n-checkbox>
          <n-text depth="3" class="setting-hint">
            {{ options.saveOriginPath ? "输出文件将自动命名" : "提交时选择视频输出文件" }}
          </n-text>
        </div>

        <div class="setting-section source-option">
          <n-checkbox v-model:checked="options.keepFirstVideoMeta">保留首个视频的元数据</n-checkbox>
          <n-text depth="3">保留首个视频的相关元数据</n-text>
        </div>
      </n-card>
    </div>

    <n-alert
      v-if="submissionResult"
      class="submission-result"
      :type="
        submissionResult.videoSubmitted
          ? submissionResult.xmlError
            ? 'warning'
            : 'success'
          : 'error'
      "
      :title="submissionResult.videoSubmitted ? '视频合并任务已提交' : '视频合并任务未提交'"
      closable
      @close="submissionResult = null"
    >
      <div v-if="submissionResult.videoError">{{ submissionResult.videoError }}</div>
      <div v-if="submissionResult.xmlError">弹幕合并失败：{{ submissionResult.xmlError }}</div>
      <div v-else-if="submissionResult.xmlMerged">弹幕合并成功</div>
      <n-button v-if="submissionResult.videoSubmitted" text type="primary" @click="openQueue">
        查看任务队列
      </n-button>
    </n-alert>

    <div class="submit-bar">
      <div class="submit-summary">
        <strong>{{ fileList.length }} 个文件待合并</strong>
        <n-text depth="3" :title="submitHint">{{ submitHint }}</n-text>
      </div>
      <n-button
        type="primary"
        size="large"
        :loading="submitting"
        :disabled="!canMerge"
        title="快捷键 Ctrl+Enter"
        @click="convert"
      >
        开始合并（{{ fileList.length }} 个文件）
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
import hotkeys from "hotkeys-js";
import { useRouter } from "vue-router";

import FileSelect from "@renderer/pages/Tools/pages/Burn/components/FileSelect.vue";
import Tip from "@renderer/components/Tip.vue";
import { useAppConfig } from "@renderer/stores";
import { formatFile, supportedVideoExtensions } from "@renderer/utils";
import { taskApi, danmaApi } from "@renderer/apis";
import { showSaveDialog } from "@renderer/utils/fileSystem";
import { useConfirm } from "@renderer/hooks";

defineOptions({ name: "VideoMerge" });

const notice = useNotice();
const confirm = useConfirm();
const router = useRouter();
const isWeb = window.isWeb;
const { appConfig } = storeToRefs(useAppConfig());

const fileList = ref<
  { id: string; title: string; videoPath: string; danmakuPath?: string; ext?: string }[]
>([]);
const fileSelect = ref<InstanceType<typeof FileSelect> | null>(null);
const submitting = ref(false);
const submissionResult = ref<{
  videoSubmitted: boolean;
  videoError?: string;
  xmlMerged?: boolean;
  xmlError?: string;
} | null>(null);

watch(submissionResult, (result, _, onCleanup) => {
  if (!result?.videoSubmitted || result.xmlError) return;
  const timer = setTimeout(() => {
    submissionResult.value = null;
  }, 10000);
  onCleanup(() => clearTimeout(timer));
});

const options = toReactive(
  computed({
    get: () => appConfig.value.tool.videoMerge,
    set: (value) => {
      appConfig.value.tool.videoMerge = value;
    },
  }),
);

const sortOptions = [
  { key: "asc", label: "文件名升序" },
  { key: "desc", label: "文件名降序" },
];
const sortFiles = (key: string | number) => {
  const direction = key === "asc" ? 1 : -1;
  fileList.value.sort(
    (a, b) => direction * a.videoPath.localeCompare(b.videoPath, "zh-Hans-CN", { numeric: true }),
  );
};

const canMerge = computed(
  () =>
    !submitting.value &&
    fileList.value.length >= 2 &&
    (!options.mergeXml || fileList.value.every((item) => !!item.danmakuPath)),
);
const submitHint = computed(() => {
  if (submitting.value) return "正在检查并提交合并任务";
  if (fileList.value.length < 2) return "请至少添加两个视频文件";
  if (options.mergeXml && fileList.value.some((item) => !item.danmakuPath)) {
    return "请为每个视频选择弹幕文件";
  }
  return options.saveOriginPath ? "输出到首个视频所在文件夹" : "提交时选择输出文件";
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
  if (fileList.value.length < 2) {
    notice.error({ title: "至少选择2个文件" });
    return;
  }
  if (options.mergeXml && fileList.value.some((item) => !item.danmakuPath)) {
    notice.error({ title: "所有视频文件必须全部选择弹幕文件" });
    return;
  }

  submitting.value = true;
  submissionResult.value = null;
  const files = fileList.value.map((item) => ({ ...item }));
  const taskOptions = { ...options };

  try {
    const result = await taskApi.checkMergeVideos(files.map((item) => item.videoPath));
    if (result.errors.length || result.warnings.length) {
      const [status] = await confirm.warning({
        title: "继续合并很有可能出现问题，是否继续？",
        content: [...result.errors, ...result.warnings].join("\n"),
      });
      if (!status) return;
    }

    let videoOutput: string | undefined;
    let xmlOutput: string | undefined;
    if (!taskOptions.saveOriginPath) {
      const video = formatFile(files[0].videoPath);
      videoOutput = await showSaveDialog({
        defaultPath: window.path.join(video.dir, `${video.name}-合并.mp4`),
      });
      if (!videoOutput) return;

      if (taskOptions.mergeXml) {
        const xml = formatFile(files[0].danmakuPath!);
        xmlOutput = await showSaveDialog({
          defaultPath: window.path.join(xml.dir, `${xml.name}-合并.xml`),
        });
        if (!xmlOutput) return;
      }
    }

    await taskApi.mergeVideos(
      files.map((item) => item.videoPath),
      { output: videoOutput, ...taskOptions },
    );
    fileList.value = fileList.value.filter((item) => !files.some((file) => file.id === item.id));
    submissionResult.value = { videoSubmitted: true };

    if (taskOptions.mergeXml) {
      try {
        await danmaApi.mergeXml(
          files.map((item) => ({ videoPath: item.videoPath, danmakuPath: item.danmakuPath! })),
          {
            output: xmlOutput,
            saveOriginPath: taskOptions.saveOriginPath,
            saveMeta: taskOptions.keepFirstVideoMeta,
          },
        );
        submissionResult.value = { videoSubmitted: true, xmlMerged: true };
      } catch (error) {
        submissionResult.value = {
          videoSubmitted: true,
          xmlError: error instanceof Error ? error.message : String(error),
        };
      }
    }
  } catch (error) {
    submissionResult.value = {
      videoSubmitted: false,
      videoError: error instanceof Error ? error.message : String(error),
    };
  } finally {
    submitting.value = false;
  }
};

const addVideo = () => fileSelect.value?.select();
const clear = () => {
  fileList.value = [];
};
const openQueue = () => router.push({ name: "Queue" });
</script>

<style scoped lang="less">
@import "./workbench.less";

.setting-hint {
  display: block;
  margin-top: 8px;
  font-size: 12px;
}
</style>
