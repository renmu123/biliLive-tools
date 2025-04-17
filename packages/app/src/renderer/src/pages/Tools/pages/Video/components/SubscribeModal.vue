<template>
  <n-modal v-model:show="showModal" :mask-closable="false" auto-focus :show-icon="false">
    <n-card
      style="width: 500px"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <n-form label-placement="left" :label-width="150">
        <h3>{{ data.name }}</h3>

        <n-form-item>
          <template #label>
            <span class="inline-flex">自动监听</span>
          </template>
          <n-switch v-model:value="data.enable" />
        </n-form-item>

        <n-form-item>
          <template #label>
            <span class="inline-flex">清晰度</span>
          </template>
          <n-select
            v-model:value="data.options.quality"
            :options="qualityOptions"
            style="width: 150px"
          />
        </n-form-item>

        <n-form-item>
          <template #label>
            <span class="inline-flex">发送至webhook</span>
          </template>
          <n-switch v-model:value="data.options.sendWebhook" />
        </n-form-item>

        <n-form-item v-if="data.platform === 'douyu'">
          <template #label>
            <span class="inline-flex">弹幕</span>
          </template>
          <n-switch v-model:value="data.options.danma" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="footer">
          <n-button type="default" class="btn" @click="showModal = false">取消</n-button>
          <n-button type="primary" class="btn" @click="confirm">确认</n-button>
        </div>
      </template>
    </n-card>
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
    return [
      {
        label: "最高",
        value: "highest",
      },
      { value: "4000", label: "1080P" },
      { value: "1300", label: "720P" },
      { value: "350", label: "360P" },
    ];
  } else {
    return [];
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

.inline-flex {
  display: inline-flex;
  align-items: center;
}

.card {
  max-width: 90vw;
}

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
