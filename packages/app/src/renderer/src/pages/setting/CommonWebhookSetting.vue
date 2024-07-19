<template>
  <h2>压制配置</h2>
  <n-form-item>
    <template #label>
      <span class="inline-flex">
        弹幕压制
        <Tip tip="将弹幕文件硬编码到视频中"></Tip>
      </span>
    </template>
    <n-switch v-model:value="data.danmu" :disabled="globalFieldsObj.danmu" />

    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.danmu" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item v-if="!data.danmu">
    <template #label>
      <span class="inline-flex">
        不压制后处理
        <Tip tip="关闭弹幕压制但仍对视频调用ffmepg进行处理"></Tip>
      </span>
    </template>
    <n-switch
      v-model:value="data.noConvertHandleVideo"
      :disabled="globalFieldsObj.noConvertHandleVideo"
    />

    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.noConvertHandleVideo"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>

  <!-- 当弹幕压制开启或弹幕压制关闭但不压制后处理开启时展示 -->
  <n-form-item v-if="data.danmu || (!data.danmu && data.noConvertHandleVideo)">
    <template #label>
      <span class="inline-flex">
        视频预设
        <Tip tip="视频编码不能为copy"></Tip>
      </span>
    </template>
    <n-cascader
      v-model:value="data.ffmpegPreset"
      placeholder="请选择预设"
      expand-trigger="click"
      :options="ffmpegOptions"
      check-strategy="child"
      :show-path="false"
      :filterable="true"
      :disabled="globalFieldsObj.ffmpegPreset"
      style="margin-right: 10px"
    />
    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.ffmpegPreset" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <template v-if="data.danmu">
    <n-form-item label="弹幕预设">
      <n-select
        v-model:value="data.danmuPreset"
        :options="danmuPresetsOptions"
        placeholder="选择预设"
        :disabled="globalFieldsObj.danmuPreset"
        style="margin-right: 10px"
      />
      <n-checkbox
        v-if="isRoom"
        v-model:checked="globalFieldsObj.danmuPreset"
        class="global-checkbox"
        >全局</n-checkbox
      >
    </n-form-item>
    <n-form-item label="高能进度条">
      <n-switch v-model:value="data.hotProgress" :disabled="globalFieldsObj.hotProgress" />
      <n-checkbox
        v-if="isRoom"
        v-model:checked="globalFieldsObj.hotProgress"
        class="global-checkbox"
        >全局</n-checkbox
      >
    </n-form-item>
    <template v-if="data.hotProgress">
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            采样间隔
            <Tip tip="每隔一段时间对弹幕进行一次汇总计算，影响波峰"></Tip>
          </span>
        </template>
        <n-input-number
          v-model:value="data.hotProgressSample"
          placeholder="单位秒"
          min="1"
          :disabled="globalFieldsObj.hotProgressSample"
        >
          <template #suffix> 秒 </template></n-input-number
        >
        <n-checkbox
          v-if="isRoom"
          v-model:checked="globalFieldsObj.hotProgressSample"
          class="global-checkbox"
          >全局</n-checkbox
        >
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 高度 </span>
        </template>
        <n-input-number
          v-model:value="data.hotProgressHeight"
          placeholder="单位像素"
          min="10"
          :disabled="globalFieldsObj.hotProgressHeight"
        >
          <template #suffix> 像素 </template></n-input-number
        >
        <n-checkbox
          v-if="isRoom"
          v-model:checked="globalFieldsObj.hotProgressHeight"
          class="global-checkbox"
          >全局</n-checkbox
        >
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 默认颜色 </span>
        </template>
        <n-color-picker
          v-model:value="data.hotProgressColor"
          :disabled="globalFieldsObj.hotProgressColor"
          style="margin-right: 10px"
        />
        <n-checkbox
          v-if="isRoom"
          v-model:checked="globalFieldsObj.hotProgressColor"
          class="global-checkbox"
          >全局</n-checkbox
        >
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 覆盖颜色 </span>
        </template>
        <n-color-picker
          v-model:value="data.hotProgressFillColor"
          :disabled="globalFieldsObj.hotProgressFillColor"
          style="margin-right: 10px"
        />
        <n-checkbox
          v-if="isRoom"
          v-model:checked="globalFieldsObj.hotProgressFillColor"
          class="global-checkbox"
          >全局</n-checkbox
        >
      </n-form-item>
    </template>
  </template>
  <n-form-item v-if="data.danmu || (!data.danmu && data.noConvertHandleVideo)">
    <template #label>
      <span class="inline-flex"> 完成后删除源文件 </span>
    </template>
    <n-switch
      v-model:value="data.removeOriginAfterConvert"
      :disabled="globalFieldsObj.removeOriginAfterConvert"
    />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.removeOriginAfterConvert"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>

  <n-form-item>
    <template #label>
      <span class="inline-flex">
        转封装为mp4
        <Tip tip="将视频文件转换为mp4封装格式，转换完毕后会删除原始视频文件"></Tip>
      </span>
    </template>
    <n-switch v-model:value="data.convert2Mp4" :disabled="globalFieldsObj.convert2Mp4" />

    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.convert2Mp4" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>

  <h2>上传配置</h2>
  <n-form-item label="上传账号">
    <n-select
      v-model:value="data.uid"
      :options="userOptins"
      placeholder="请选择账号"
      :disabled="globalFieldsObj.uid"
      style="margin-right: 10px"
    />
    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.uid" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item label="上传预设">
    <n-select
      v-model:value="data.uploadPresetId"
      :options="props.biliupPresetsOptions"
      placeholder="请选择"
      :disabled="globalFieldsObj.uploadPresetId"
      style="margin-right: 10px"
    />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.uploadPresetId"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item>
    <template #label>
      <span class="inline-flex"> 完成后删除源文件 </span>
    </template>
    <n-switch
      v-model:value="data.removeOriginAfterUpload"
      :disabled="globalFieldsObj.removeOriginAfterUpload"
    />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.removeOriginAfterUpload"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item>
    <template #label>
      <span class="inline-flex">
        最小上传大小
        <Tip tip="小于这个大小的视频不会上传，用于过滤因网络问题导致的分段录播"></Tip>
      </span>
    </template>
    <n-input-number
      v-model:value="data.minSize"
      placeholder="单位MB"
      min="0"
      :disabled="globalFieldsObj.minSize"
    >
      <template #suffix> M </template></n-input-number
    >
    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.minSize" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item>
    <template #label>
      <span class="inline-flex">
        使用视频文件名 <Tip tip="使用本地视频文件名作为视频标题"></Tip>
      </span>
    </template>
    <n-switch v-model:value="data.useVideoAsTitle" :disabled="globalFieldsObj.useVideoAsTitle" />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.useVideoAsTitle"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item>
    <template #label>
      <span class="inline-flex">
        使用直播封面
        <Tip
          tip="使用直播封面作为视频封面，默认寻找视频目录下文件名为'视频文件名+.cover.jpg|.jpg的文件"
        ></Tip>
      </span>
    </template>
    <n-switch v-model:value="data.useLiveCover" :disabled="globalFieldsObj.useLiveCover" />
    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.useLiveCover" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item v-if="!data.useVideoAsTitle">
    <template #label>
      <Tip :tip="titleTip" text="视频标题"></Tip>
    </template>
    <n-input
      v-model:value="data.title"
      placeholder="请输入视频标题,支持{{title}},{{user}},{{now}}等占位符"
      clearable
      :disabled="globalFieldsObj.title"
      style="margin-right: 10px"
    />
    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.title" class="global-checkbox"
      >全局</n-checkbox
    >
    <template #feedback>
      <span
        v-for="item in titleList"
        :key="item.value"
        :title="item.label"
        class="title-var"
        :class="{
          disabled: globalFieldsObj.title,
        }"
        @click="setTitleVar(item.value)"
        >{{ item.value }}</span
      >
    </template>
  </n-form-item>

  <n-form-item>
    <template #label>
      <span class="inline-flex">
        断播续传
        <Tip tip="开启后，会将某主播一场直播上传到同一个视频中"></Tip>
      </span>
    </template>
    <n-switch v-model:value="data.autoPartMerge" :disabled="globalFieldsObj.autoPartMerge" />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.autoPartMerge"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item v-if="data.autoPartMerge">
    <template #label>
      <span class="inline-flex">
        上传到同分p间隔时间
        <Tip tip="监测直播是否为同一场的时间间隔"></Tip>
      </span>
    </template>
    <n-input-number
      v-model:value="data.partMergeMinute"
      placeholder="请输入分钟"
      min="0.1"
      :disabled="globalFieldsObj.partMergeMinute"
    >
      <template #suffix> 分钟 </template></n-input-number
    >
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.partMergeMinute"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
</template>

<script setup lang="ts">
import { useDanmuPreset, useUserInfoStore } from "@renderer/stores";

import type { AppRoomConfig } from "@biliLive-tools/types";

type Options = {
  value: string;
  label: string;
}[];

const props = defineProps<{
  biliupPresetsOptions: Options;
  ffmpegOptions: Options;
  type: "room" | "global";
  globalValue: {
    [key: string]: any;
  };
}>();

const data = defineModel<AppRoomConfig>("data", {
  default: () => {},
});

const globalFieldsObj = defineModel<{
  [key: string]: boolean;
}>("globalFieldsObj", {
  type: Object,
  default: () => {},
});

const { danmuPresetsOptions } = storeToRefs(useDanmuPreset());
const { userList } = storeToRefs(useUserInfoStore());
const userOptins = computed(() => {
  return [
    {
      value: "",
      label: "无",
    },
    ...userList.value.map((user) => ({
      value: user.uid,
      label: `${user.name}(${user.uid})`,
    })),
  ];
});

const titleList = ref([
  {
    value: "{{title}}",
    label: "视频标题",
  },
  {
    value: "{{user}}",
    label: "主播名",
  },
  {
    value: "{{now}}",
    label: "当前时间（示例：2024.01.24）",
  },
  {
    value: "{{yyyy}}",
    label: "年",
  },
  {
    value: "{{MM}}",
    label: "月（补零）",
  },
  {
    value: "{{dd}}",
    label: "日（补零）",
  },
  {
    value: "{{HH}}",
    label: "时（补零）",
  },
  {
    value: "{{mm}}",
    label: "分（补零）",
  },
  {
    value: "{{ss}}",
    label: "秒（补零）",
  },
]);
const titleTip = computed(() => {
  const base = `支持{{title}},{{user}},{{now}}等占位符，会覆盖预设中的标题，如【{{user}}】{{title}}-{{now}}<br/>
  不要在直播开始后修改字段，本场直播不会生效<br/>`;
  return titleList.value
    .map((item) => {
      return `${item.label}：${item.value}<br/>`;
    })
    .reduce((prev, cur) => prev + cur, base);
});
const setTitleVar = (value: string) => {
  if (globalFieldsObj.value.title) return;
  data.value.title += value;
};

const isRoom = computed(() => props.type === "room");

watch(
  () => globalFieldsObj.value,
  () => {
    for (const key in globalFieldsObj.value) {
      const value = globalFieldsObj.value[key];
      if (value) {
        data.value[key] = props.globalValue[key];
      }
    }
  },
  {
    deep: true,
  },
);
</script>

<style scoped lang="less">
.global-checkbox {
  flex: none;
  margin-left: auto;
}
.title-var {
  display: inline-block;
  margin-top: 4px;
  margin-right: 10px;
  padding: 4px 8px;
  border-radius: 5px;
  background-color: #f0f0f0;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  &:not(.disabled):hover {
    background-color: #e0e0e0;
  }
  &.disabled {
    cursor: not-allowed;
  }
}
</style>
