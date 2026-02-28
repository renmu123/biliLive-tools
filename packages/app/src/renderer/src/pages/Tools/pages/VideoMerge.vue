<!-- 文件合并 -->
<template>
  <div>
    <div
      class="center"
      style="
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
      "
    >
      <span v-if="fileList.length !== 0" style="cursor: pointer; color: #958e8e" @click="clear"
        >清空</span
      >
      <n-button @click="addVideo"> 添加 </n-button>

      <ButtonGroup :options="buttonGroupOptions" @click="handleConfirm" title="立即合并(ctrl+enter)"
        >立即合并</ButtonGroup
      >

      <n-checkbox v-model:checked="options.mergeXml"> 合并弹幕 </n-checkbox>

      <Tip
        tip="注意：并非所有容器都支持流复制。如果出现播放问题或未合并文件，则可能需要重新编码。"
        :size="26"
      ></Tip>
    </div>
    <FileSelect
      ref="fileSelect"
      v-model="fileList"
      :extensions="[...supportedVideoExtensions, 'xml']"
    ></FileSelect>

    <div class="flex align-center column" style="margin-top: 10px">
      <div></div>
      <div style="margin-top: 10px">
        <n-checkbox v-model:checked="options.saveOriginPath"> 保存到原始文件夹 </n-checkbox>
        <n-checkbox
          v-model:checked="options.keepFirstVideoMeta"
          title="将保留第一个文件的相关元数据，除了可能影响压制时间戳参数之外，对普通用户应该没啥太大用处"
        >
          保留元数据
        </n-checkbox>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
import hotkeys from "hotkeys-js";

import FileSelect from "@renderer/pages/Tools/pages/Burn/components/FileSelect.vue";
import Tip from "@renderer/components/Tip.vue";
import ButtonGroup from "@renderer/components/ButtonGroup.vue";
import { useAppConfig } from "@renderer/stores";
import { formatFile, supportedVideoExtensions } from "@renderer/utils";
import { taskApi, danmaApi } from "@renderer/apis";
import { showSaveDialog } from "@renderer/utils/fileSystem";

defineOptions({
  name: "VideoMerge",
});

const notice = useNotification();
const { appConfig } = storeToRefs(useAppConfig());

const fileList = ref<{ id: string; title: string; videoPath: string; danmakuPath?: string }[]>([]);

const options = toReactive(
  computed({
    get: () => appConfig.value.tool.videoMerge,
    set: (value) => {
      appConfig.value.tool.videoMerge = value;
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

const buttonGroupOptions = computed(() => {
  return [
    {
      key: "sortByFileAsc",
      label: "排序：文件名升序",
    },
    {
      key: "sortByFileDesc",
      label: "排序：文件名降序",
    },
  ];
});

const handleConfirm = (key?: string | number) => {
  if (key === "sortByFileAsc") {
    fileList.value.sort((a, b) => {
      return a.videoPath.localeCompare(b.videoPath, "zh-Hans-CN", { numeric: true });
    });
  } else if (key === "sortByFileDesc") {
    fileList.value.sort((a, b) => {
      return b.videoPath.localeCompare(a.videoPath, "zh-Hans-CN", { numeric: true });
    });
  } else {
    convert();
  }
};

const convert = async () => {
  if (fileList.value.length < 2) {
    notice.error({
      title: `至少选择2个文件`,
      duration: 1000,
    });
    return;
  }
  const result = await taskApi.checkMergeVideos(fileList.value.map((item) => item.videoPath));
  if (result.errors.length > 0) {
    notice.error({
      content: result.errors.join("\n"),
      duration: 5000,
    });
    return;
  }
  if (result.warnings.length > 0) {
    notice.warning({
      content: result.warnings.join("\n"),
      duration: 5000,
    });
  }
  if (options.mergeXml) {
    // 如果开启合并弹幕，那么所有的视频都要有对应的弹幕文件
    const hasDanmaku = fileList.value.every((item) => item.danmakuPath);
    if (!hasDanmaku) {
      notice.error({
        title: `所有视频文件必须全部选择弹幕文件`,
      });
    }
  }
  let videoOutput: string | undefined = undefined;
  let xmlOutput: string | undefined = undefined;

  if (!options.saveOriginPath) {
    const { dir, name } = formatFile(fileList.value[0].videoPath);
    const filePath = window.path.join(dir, `${name}-合并.mp4`);
    const file = await showSaveDialog({
      defaultPath: filePath,
    });
    if (!file) {
      return;
    }
    videoOutput = file;

    if (options.mergeXml) {
      const { dir, name } = formatFile(fileList.value[0].danmakuPath!);
      const filePath = window.path.join(dir, `${name}-合并.xml`);
      const file = await showSaveDialog({
        defaultPath: filePath,
      });
      if (!file) {
        return;
      }
      xmlOutput = file;
    }
  }

  try {
    taskApi.mergeVideos(
      fileList.value.map((item) => item.videoPath),
      { output: videoOutput, ...options },
    );
    notice.warning({
      title: `已加入任务，可在任务队列中查看进度`,
      duration: 1000,
    });

    if (options.mergeXml) {
      danmaApi
        // @ts-expect-error
        .mergeXml(fileList.value, { output: xmlOutput, saveMeta: options.keepFirstVideoMeta })
        .then(() => {
          notice.success({
            title: `弹幕合并成功`,
            duration: 1000,
          });
        })
        .catch((err) => {
          notice.error({
            title: err as string,
            duration: 1000,
          });
        });
    }
  } catch (err) {
    notice.error({
      title: err as string,
      duration: 1000,
    });
  } finally {
    fileList.value = [];
  }
};

const fileSelect = ref<InstanceType<typeof FileSelect> | null>(null);
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
