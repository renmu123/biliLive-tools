<!-- 将文件转换为mp4 -->
<template>
  <div>
    <div class="center btns" style="margin-bottom: 20px">
      <span v-if="fileList.length !== 0" style="cursor: pointer; color: #958e8e" @click="clear"
        >清空</span
      >
      <n-button @click="addVideo"> 添加 </n-button>
      <n-button type="primary" @click="convert"> 立即转换 </n-button>
      <n-cascader
        v-model:value="options.ffmpegPresetId"
        placeholder="请选择预设"
        expand-trigger="click"
        :options="ffmpegOptions"
        check-strategy="child"
        :show-path="false"
        :filterable="true"
        style="width: 140px; text-align: left"
        title="ffmpeg预设"
      />
      <n-select
        v-model:value="options.danmuPresetId"
        :options="danmuPresetsOptions"
        placeholder="选择预设"
        style="width: 140px"
      />
    </div>
    <FileSelect
      ref="fileSelect"
      v-model="fileList"
      :sort="false"
      :extensions="[...supportedVideoExtensions, 'xml', 'ass']"
    ></FileSelect>

    <div class="flex align-center column" style="margin-top: 10px">
      <div>
        <n-radio-group v-model:value="options.saveRadio">
          <n-space class="flex align-center column">
            <n-radio :value="1"> 保存到原始文件夹 </n-radio>
            <n-radio :value="2"> </n-radio>
            <n-input
              v-model:value="options.savePath"
              placeholder="选择文件夹"
              style="width: 300px"
              :title="options.savePath"
            />
            <n-icon size="30" style="margin-left: -10px" class="pointer" @click="getDir">
              <FolderOpenOutline />
            </n-icon>
          </n-space>
        </n-radio-group>
      </div>
      <div style="margin-top: 10px">
        <n-radio-group v-model:value="options.override">
          <n-space>
            <n-radio :value="true"> 覆盖文件 </n-radio>
            <n-radio :value="false"> 跳过存在文件 </n-radio>
          </n-space>
        </n-radio-group>
        <n-checkbox v-model:checked="options.removeOrigin"> 完成后移除源文件 </n-checkbox>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";

import { useConfirm } from "@renderer/hooks";
import { ffmpegPresetApi, taskApi, danmuPresetApi } from "@renderer/apis";
import { useAppConfig, useFfmpegPreset, useDanmuPreset } from "@renderer/stores";
import FileSelect from "./components/FileSelect.vue";
import { showDirectoryDialog } from "@renderer/utils/fileSystem";
import hotkeys from "hotkeys-js";
import { cloneDeep } from "lodash-es";
import { FolderOpenOutline } from "@vicons/ionicons5";
import { supportedVideoExtensions } from "@renderer/utils";

const notice = useNotification();
const confirm = useConfirm();
const { appConfig } = storeToRefs(useAppConfig());
const { ffmpegOptions } = storeToRefs(useFfmpegPreset());
const { danmuPresetsOptions } = storeToRefs(useDanmuPreset());

const fileList = ref<{ id: string; title: string; videoPath: string; danmakuPath?: string }[]>([]);
const options = toReactive(
  computed({
    get: () => appConfig.value.tool.video2mp4,
    set: (value) => {
      appConfig.value.tool.video2mp4 = value;
    },
  }),
);

onActivated(() => {
  hotkeys("ctrl+enter", function () {
    convert();
  });
});
onDeactivated(() => {
  hotkeys.unbind();
});
onUnmounted(() => {
  hotkeys.unbind();
});

const convert = async () => {
  const ffmpegConfig = await ffmpegPresetApi.get(options.ffmpegPresetId);
  if (!ffmpegConfig) {
    notice.error({
      title: `预设不存在，请重新选择`,
      duration: 1000,
    });
    return;
  }
  const rawDanmuConfig = await danmuPresetApi.get(options.danmuPresetId);
  if (!rawDanmuConfig) {
    notice.error({
      title: `弹幕预设不存在，请重新选择`,
      duration: 1000,
    });
    return;
  }

  const ffmpegOptions = ffmpegConfig.config;
  const danmuOptions = rawDanmuConfig?.config;

  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 1000,
    });
    return;
  }

  // 如果存在弹幕，那么不允许使用copy
  if (ffmpegOptions.encoder === "copy") {
    if (fileList.value.find((item) => item.danmakuPath)) {
      notice.error({
        title: `存在弹幕文件，视频预设编码器不允许使用 copy 选项`,
        duration: 1000,
      });
      return;
    }
  }

  if (ffmpegOptions.encoder !== "copy" || ffmpegOptions.audioCodec !== "copy") {
    const [status] = await confirm.warning({
      content:
        "你可能正在对视频进行重编码，将耗费大量时间，是否继续？（如果你只是想转封装，可以选择预设中的 copy 选项）",
      showCheckbox: true,
      showAgainKey: "video2mp4Convert",
    });
    if (!status) return;
  }

  const files = cloneDeep(fileList.value);

  for (let i = 0; i < files.length; i++) {
    const videoPath = files[i].videoPath;
    const danmakuPath = files[i].danmakuPath;
    const outputName = `${files[i].title}.mp4`;
    if (danmakuPath) {
      await taskApi.burn(
        {
          videoFilePath: videoPath,
          subtitleFilePath: danmakuPath,
        },
        outputName,
        {
          danmaOptions: danmuOptions,
          ffmpegOptions: ffmpegOptions,
          hotProgressOptions: {},
          hasHotProgress: false,
          override: options.override,
          removeOrigin: options.removeOrigin,
          savePath: options.savePath,
          saveType: options.saveRadio,
        },
      );
    } else {
      await taskApi.transcode(videoPath, outputName, ffmpegOptions, {
        override: options.override,
        removeOrigin: options.removeOrigin,
        savePath: options.savePath,
        saveType: options.saveRadio,
      });
    }
    fileList.value.shift();
  }
  notice.warning({
    title: `已加入任务队列，可在任务列表中查看进度`,
    duration: 1000,
  });
};

async function getDir() {
  let dir: string | undefined = await showDirectoryDialog({
    defaultPath: options.savePath,
  });

  if (!dir) return;
  options.savePath = dir;
  options.saveRadio = 2;
}

const fileSelect = ref<InstanceType<typeof FileSelect> | null>(null);
const addVideo = async () => {
  fileSelect.value?.select();
};
const clear = () => {
  fileList.value = [];
};
</script>

<style scoped lang="less">
.btns {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
}
</style>
