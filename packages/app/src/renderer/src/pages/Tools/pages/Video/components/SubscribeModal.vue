<template>
  <n-modal
    v-model:show="showModal"
    :mask-closable="false"
    auto-focus
    preset="dialog"
    :show-icon="false"
    :title="data.name"
  >
    <div class="container">
      <div style="margin-top: 10px; display: flex; align-items: center">
        <span style="flex: none">自动监听：</span>
        <n-switch v-model:value="data.enable" />
      </div>

      <div style="margin-top: 10px; display: flex; align-items: center">
        <span style="flex: none" title="">清晰度：</span>
        <n-select
          v-model:value="data.options.quality"
          :options="qualityOptions"
          style="width: 150px"
        />
      </div>
      <div style="margin-top: 10px; display: flex; align-items: center">
        <span style="flex: none">发送至webhook：</span>
        <n-switch v-model:value="data.options.sendWebhook" />
      </div>
      <div
        v-if="data.platform === 'douyu'"
        style="margin-top: 10px; display: flex; align-items: center"
      >
        <span style="flex: none">弹幕：</span>
        <n-switch v-model:value="data.options.danma" />
      </div>

      <n-button type="primary" class="download-btn" @click="confirm"> 确认 </n-button>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { videoApi } from "@renderer/apis";

import type { VideoAPI } from "@biliLive-tools/http/types/video.js";

interface Props {
  data: VideoAPI["SubParse"]["Resp"] & {
    id?: number;
    lastRunTime?: number;
  };
}

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const props = defineProps<Props>();
const emits = defineEmits<{
  (event: "add"): void;
  (event: "update"): void;
}>();

const notice = useNotice();
const type = computed(() => {
  return props.data.id ? "update" : "add";
});
const confirm = async () => {
  if (type.value === "add") {
    await videoApi.addSub(props.data);
    notice.success("订阅成功");
    emits("add");
  } else {
    // @ts-ignore
    await videoApi.updateSub(props.data);
    notice.success("更新成功");
    emits("update");
  }
  showModal.value = false;
};

const qualityOptions = computed(() => {
  if (props.data.platform === "douyu") {
    return [
      {
        label: "最高",
        value: "highest",
      },
      {
        label: "2k60",
        value: "1440p60a",
      },
      {
        label: "1080P60",
        value: "1080p60",
      },
      {
        label: "高清",
        value: "high",
      },
      {
        label: "标清",
        value: "normal",
      },
    ];
  } else if (props.data.platform === "huya") {
    return [];
  } else {
    return [];
  }
});
</script>

<style scoped lang="less">
.file-container {
  height: 200px;
  overflow: auto;
  border: 1px solid #eeeeee;
  border-radius: 4px;
  padding: 10px;

  .file {
    margin-bottom: 5px;
    display: flex;
    align-items: center;
  }
}
.download-btn {
  width: 100%;
  margin-top: 10px;
}

.path {
  // border: 1px solid #eeeeee;
  border-radius: 4px;
  padding: 5px 0px;
  // margin-top: 10px;
  display: flex;
  align-items: center;
}
</style>
