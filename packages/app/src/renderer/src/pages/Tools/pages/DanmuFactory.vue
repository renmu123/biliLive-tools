<!-- 将xml转换为ass -->
<template>
  <div>
    <div class="flex justify-center align-center" style="margin-bottom: 20px; gap: 10px">
      <span v-if="fileList.length !== 0" style="cursor: pointer; color: #958e8e" @click="clear"
        >清空</span
      >
      <n-button @click="addVideo"> 添加 </n-button>
      <n-button type="primary" @click="convert" title="立即转换(ctrl+enter)"> 立即转换 </n-button>
      <n-select
        v-model:value="danmuPresetId"
        :options="danmuPresetsOptions"
        placeholder="选择预设"
        style="width: 140px"
      />
      <n-icon size="25" class="pointer" @click="openSetting">
        <SettingIcon />
      </n-icon>
    </div>

    <FileSelect
      ref="fileSelect"
      v-model="fileList"
      area-placeholder="请选择xml文件"
      :extensions="['xml']"
      :sort="false"
    ></FileSelect>

    <div class="flex align-center column" style="margin-top: 10px">
      <n-radio-group v-model:value="options.saveRadio" class="radio-group">
        <n-space class="flex align-center column">
          <n-radio :value="1"> 保存到原始文件夹 </n-radio>
          <n-radio :value="2"> </n-radio>
          <n-input
            title="支持相对路径"
            v-model:value="options.savePath"
            type="text"
            placeholder="选择文件夹"
            style="width: 300px"
          />
          <n-icon size="30" style="margin-left: -10px" class="pointer" @click="getDir">
            <FolderOpenOutline />
          </n-icon>
        </n-space>
      </n-radio-group>
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
import { useConfirm } from "@renderer/hooks";
import hotkeys from "hotkeys-js";

defineOptions({
  name: "DanmakuFactory",
});

const { danmuPresetsOptions, danmuPresetId } = storeToRefs(useDanmuPreset());
const { appConfig } = storeToRefs(useAppConfig());

const notice = useNotice();
const confirm = useConfirm();
// const isWeb = computed(() => window.isWeb);

const fileList = ref<{ id: string; title: string; path: string; visible: boolean }[]>([]);

const options = toReactive(
  computed({
    get: () => appConfig.value.tool.danmu,
    set: (value) => {
      appConfig.value.tool.danmu = value;
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
  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
    });
    return;
  }

  const [status] = await confirm.warning({
    title: "确认转换",
    content: `输出文件名中请勿包含emoji或奇怪符号，否则可能导致转换失败`,
    showCheckbox: true,
    showAgainKey: "danmuFactoryConvert-filename",
  });
  if (!status) return;

  const presetId = danmuPresetId.value;
  const config = (await danmuPresetApi.get(presetId)).config;

  if (config.resolutionResponsive) {
    notice.warning({
      duration: 5000,
      title: `本次转换无法使用自适应分辨率，将使用${config.resolution[0]}X${config.resolution[1]}分辨率，请确认与你的视频分辨率一致`,
    });
  }
  for (let i = 0; i < fileList.value.length; i++) {
    const file = {
      input: fileList.value[i].path,
      output: fileList.value[i].title,
    };
    try {
      await taskApi.convertXml2Ass(file.input, file.output, config, options);
    } catch (err) {
      notice.error({
        title: err as string,
      });
    }
  }

  fileList.value = [];
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
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
