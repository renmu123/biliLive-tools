<template>
  <n-form-item label="上传账号">
    <n-select v-model:value="data.uid" :options="userOptins" placeholder="请选择账号" />
  </n-form-item>
  <n-form-item>
    <template #label>
      <span class="inline-flex">
        最小上传大小
        <Tip tip="小于这个大小的视频不会上传，用于过滤因网络问题导致的分段录播"></Tip>
      </span>
    </template>
    <n-input-number v-model:value="data.minSize" placeholder="单位MB" min="0">
      <template #suffix> M </template></n-input-number
    >
  </n-form-item>
  <n-form-item>
    <template #label>
      <span class="inline-flex">
        默认视频标题
        <Tip :tip="titleTip"></Tip>
      </span>
    </template>
    <n-input
      v-model:value="data.title"
      placeholder="请输入视频标题,支持{{title}},{{user}},{{now}}占位符"
      clearable
    />
  </n-form-item>
  <n-form-item>
    <template #label>
      <span class="inline-flex">
        断播续传
        <Tip tip="该功能在测试阶段，开启后，会将某主播一场直播上传到同一个视频中"></Tip>
      </span>
    </template>
    <n-switch v-model:value="data.autoPartMerge" />
  </n-form-item>
  <n-form-item v-if="data.autoPartMerge">
    <template #label>
      <span class="inline-flex">
        上传到同分p间隔时间
        <Tip tip="监测直播是否为同一场的时间间隔"></Tip>
      </span>
    </template>
    <n-input-number v-model:value="data.partMergeMinute" placeholder="请输入分钟" min="0.1">
      <template #suffix> 分钟 </template></n-input-number
    >
  </n-form-item>
  <n-form-item label="上传预设">
    <n-select
      v-model:value="data.uploadPresetId"
      :options="props.biliupPresetsOptions"
      placeholder="请选择"
    />
  </n-form-item>
  <n-form-item>
    <template #label>
      <span class="inline-flex">
        使用直播封面
        <Tip tip="如果你在录制软件设置了保存的话"></Tip>
      </span>
    </template>
    <n-switch v-model:value="data.useLiveCover" />
  </n-form-item>

  <n-form-item label="弹幕压制后上传">
    <n-switch v-model:value="data.danmu" />
  </n-form-item>
  <n-form-item v-if="data.danmu" label="弹幕转化预设">
    <n-select
      v-model:value="data.danmuPreset"
      :options="danmuPresetsOptions"
      placeholder="选择预设"
    />
  </n-form-item>
  <n-form-item v-if="data.danmu" label="视频压制预设">
    <n-cascader
      v-model:value="data.ffmpegPreset"
      placeholder="请选择预设"
      expand-trigger="click"
      :options="ffmpegOptions"
      check-strategy="child"
      :show-path="false"
      :filterable="true"
    />
  </n-form-item>
  <n-form-item v-if="data.danmu" label="高能进度条">
    <n-switch v-model:value="data.hotProgress" />
  </n-form-item>
</template>

<script setup lang="ts">
import type { AppRoomConfig } from "../../../../types";
import { useDanmuPreset, useUserInfoStore } from "@renderer/stores";
import { storeToRefs } from "pinia";

type Options = {
  value: string;
  label: string;
}[];

const props = defineProps<{
  biliupPresetsOptions: Options;
  ffmpegOptions: Options;
}>();

const data = defineModel<AppRoomConfig>("data", {
  default: () => {},
});

const { danmuPresetsOptions } = storeToRefs(useDanmuPreset());
const { userList } = storeToRefs(useUserInfoStore());
const userOptins = computed(() => {
  return userList.value.map((user) => ({
    value: user.uid,
    label: `${user.name}(${user.uid})`,
  }));
});

const titleTip = ref(
  "支持{{title}},{{user}},{{now}}占位符，会覆盖预设中的标题，如【{{user}}】{{title}}-{{now}}",
);
</script>

<style scoped></style>
