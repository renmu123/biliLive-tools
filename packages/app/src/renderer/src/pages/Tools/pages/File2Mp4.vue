<!-- 将文件转换为mp4 -->
<template>
  <div>
    <div class="center btns" style="margin-bottom: 20px">
      <span v-if="fileList.length !== 0" style="cursor: pointer; color: #958e8e" @click="clear"
        >清空</span
      >
      <n-button @click="addVideo"> 添加 </n-button>
      <n-button type="primary" :disabled="isWeb" @click="convert"> 立即转换 </n-button>
      <n-cascader
        v-model:value="options.ffmpegPresetId"
        placeholder="请选择预设"
        expand-trigger="click"
        :options="ffmpegOptions"
        check-strategy="child"
        :show-path="false"
        :filterable="true"
        style="width: 140px; text-align: left"
      />
    </div>
    <FileSelect ref="fileSelect" v-model="fileList" :sort="false"></FileSelect>

    <div class="flex align-center column" style="margin-top: 10px">
      <div>
        <n-radio-group v-model:value="options.saveRadio" class="radio-group2">
          <n-space class="flex align-center column">
            <n-radio :value="1"> 保存到原始文件夹 </n-radio>
            <n-radio :value="2">
              <n-input
                v-model:value="options.savePath"
                type="text"
                placeholder="选择文件夹"
                style="width: 300px"
                :title="options.savePath"
              />
            </n-radio>
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
import { ffmpegPresetApi, taskApi } from "@renderer/apis";
import { useAppConfig, useFfmpegPreset } from "@renderer/stores";
import FileSelect from "@renderer/pages/Tools/pages/FileUpload/components/FileSelect.vue";
import showDirectoryDialog from "@renderer/components/showDirectoryDialog";
import hotkeys from "hotkeys-js";
import { cloneDeep } from "lodash-es";
import { FolderOpenOutline } from "@vicons/ionicons5";

const notice = useNotification();
const confirm = useConfirm();
const { appConfig } = storeToRefs(useAppConfig());
const { ffmpegOptions } = storeToRefs(useFfmpegPreset());
const isWeb = computed(() => window.isWeb);

const fileList = ref<{ id: string; title: string; path: string; visible: boolean }[]>([]);
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
  const ffmpegOptions = ffmpegConfig.config;
  console.log(ffmpegOptions);

  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 1000,
    });
    return;
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
    // try {
    const input = files[i].path;
    const outputName = `${files[i].title}.mp4`;
    await taskApi.transcode(input, outputName, ffmpegOptions, {
      override: options.override,
      removeOrigin: false,
      savePath: options.savePath,
      saveType: options.saveRadio,
    });
    fileList.value.splice(i, 1);

    // let savePath: string;
    // if (options.saveRadio === 1) {
    //   savePath = window.path.dirname(fileList.value[i].path);
    // } else if (options.saveRadio === 2) {
    //   if (options.savePath === "") {
    //     notice.error({
    //       title: "请选择保存路径",
    //       duration: 1000,
    //     });
    //     return;
    //   }
    //   savePath = options.savePath;
    // } else {
    //   notice.error({
    //     title: "不支持此项配置",
    //     duration: 1000,
    //   });
    //   return;
    // }

    // window.api.mergeAssMp4(
    //   {
    //     videoFilePath: fileList.value[i].path,
    //     assFilePath: undefined,
    //     outputPath: window.path.join(savePath, `${fileList.value[i].title}.mp4`),
    //     hotProgressFilePath: undefined,
    //   },
    //   { override: options.override, removeOrigin: false },
    //   ffmpegOptions,
    // );
    // } catch (err) {
    //   notice.error({
    //     title: err as string,
    //     duration: 1000,
    //   });
    // }
  }
  // fileList.value = [];
  notice.warning({
    title: `已加入任务队列，可在任务列表中查看进度`,
    duration: 1000,
  });
};

async function getDir() {
  let dir: string | undefined;
  if (window.isWeb) {
    dir = await showDirectoryDialog({
      type: "directory",
    })[0];
  } else {
    dir = await window.api.openDirectory({
      defaultPath: options.savePath,
    });
  }
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
.radio-group2 {
  :deep(.n-radio) {
    align-items: center;
  }
}
.btns {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
}
</style>
