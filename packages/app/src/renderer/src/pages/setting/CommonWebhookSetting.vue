<template>
  <h2>文件处理</h2>
  <n-form-item>
    <template #label>
      <Tip
        text="最小处理文件"
        tip="小于这个大小的视频不会被之后的流程处理，用于过滤因网络问题导致的分段录播"
      ></Tip>
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

  <!-- 转封装为mp4 -->
  <n-form-item>
    <template #label>
      <Tip
        text="转封装为mp4"
        tip="将视频文件转换为mp4封装格式，开启后，之后的源文件指向的都是转封装的视频"
      ></Tip>
    </template>
    <n-switch v-model:value="data.convert2Mp4" :disabled="globalFieldsObj.convert2Mp4" />
    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.convert2Mp4" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>

  <n-form-item v-if="data.convert2Mp4">
    <template #label>
      <Tip
        text="封装后删除源文件（废弃）"
        tip="该选项已废弃，请使用「处理后操作」中的「删除转封装为mp4的原文件」"
      ></Tip>
    </template>
    <n-switch
      v-model:value="data.removeSourceAferrConvert2Mp4"
      :disabled="globalFieldsObj.removeSourceAferrConvert2Mp4"
    />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.removeSourceAferrConvert2Mp4"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>

  <!-- flv修复 -->
  <!-- <n-form-item>
    <template #label>
      <Tip
        text="测试：FLV修复"
        tip="调用录播姬的修复引擎对FLV文件进行修复，如果你是用录播姬录制的FLV文件，无需额外开启，<b>与封装为mp4互斥</b>，<b>如果你需要压制弹幕，也不要开启</b>"
      ></Tip>
    </template>
    <n-switch v-model:value="data.flvRepair" :disabled="globalFieldsObj.flvRepair" />
    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.flvRepair" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item> -->
  <n-form-item>
    <template #label>
      <Tip
        text="弹幕压制"
        tip="将弹幕文件硬编码到视频中，如果你开启了该选项，那么必然要选择视频以及弹幕预设"
      ></Tip>
    </template>
    <n-switch v-model:value="data.danmu" :disabled="globalFieldsObj.danmu" />

    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.danmu" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>

  <n-form-item>
    <template #label>
      <Tip
        text="视频预设"
        tip="如果只选择视频预设却未打开弹幕压制，将只会对视频进行转码，<b>确保这是你需要的选项</b>"
      ></Tip>
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
      style="margin-right: 10px; width: 200px"
      clearable
    />
    <n-button
      v-if="data.ffmpegPreset && !globalFieldsObj.ffmpegPreset"
      text
      @click="data.ffmpegPreset = null"
      >清除</n-button
    >
    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.ffmpegPreset" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item>
    <template #label>
      <Tip
        text="弹幕预设"
        tip="如果只选择弹幕预设却未打开弹幕压制，将只会对弹幕进行处理，<b>确保这是你需要的选项</b>"
      ></Tip>
    </template>
    <n-select
      v-model:value="data.danmuPreset"
      :options="danmuPresetsOptions"
      placeholder="选择预设"
      :disabled="globalFieldsObj.danmuPreset"
      style="margin-right: 10px; width: 200px"
      clearable
    />
    <n-button
      v-if="data.danmuPreset && !globalFieldsObj.danmuPreset"
      text
      @click="data.danmuPreset = null"
      >清除</n-button
    >
    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.danmuPreset" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <template v-if="data.danmu && data.ffmpegPreset && data.danmuPreset">
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
          <Tip text="采样间隔" tip="每隔一段时间对弹幕进行一次汇总计算，影响波峰"></Tip>
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
  <n-form-item>
    <template #label>
      <Tip text="同步器" tip="选择要使用的同步器，用于将视频同步到网盘"></Tip>
    </template>
    <n-select
      v-model:value="data.syncId"
      :options="props.syncConfigs"
      label-field="name"
      value-field="id"
      :disabled="globalFieldsObj.syncId"
      style="margin-right: 10px; width: 200px"
      clearable
    />
    <n-button v-if="data.syncId && !globalFieldsObj.syncId" text @click="data.syncId = null"
      >清除</n-button
    >
    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.syncId" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item>
    <template #label>
      <Tip
        text="处理后操作"
        tip="转换以及同步操作后都会执行本步骤，如果你未操作相关文件，也请不要选择相关文件删除"
      ></Tip>
    </template>
    <n-select
      v-model:value="data.afterConvertAction"
      :options="[
        { label: '删除不符合最小处理大小的文件', value: 'removeSmallFile' },
        // { label: '删除FLV修复后的原文件', value: 'removeAfterFlvRepair' },
        { label: '删除转封装为mp4的原文件', value: 'removeAfterConvert2Mp4' },
        { label: '删除视频处理或同步后的原文件', value: 'removeVideo' },
        { label: '删除弹幕转换或同步后的原文件', value: 'removeXml' },
      ]"
      multiple
      :disabled="globalFieldsObj.afterConvertAction"
      style="margin-right: 10px"
      placeholder="主要用来删除文件，不选就是不做处理"
    />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.afterConvertAction"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>

  <n-form-item>
    <template #label>
      <Tip text="限制处理时间" tip="开启后，只会在某段时间执行处理，仅限视频"></Tip>
    </template>
    <n-switch
      v-model:value="data.limitVideoConvertTime"
      :disabled="globalFieldsObj.limitVideoConvertTime"
    />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.limitVideoConvertTime"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item v-if="data.limitVideoConvertTime">
    <template #label>
      <span class="inline-flex"> 允许处理时间段 </span>
    </template>
    <n-time-picker
      v-model:formatted-value="data.videoHandleTime[0]"
      :disabled="globalFieldsObj.videoHandleTime"
    />
    ~
    <n-time-picker
      v-model:formatted-value="data.videoHandleTime[1]"
      :disabled="globalFieldsObj.videoHandleTime"
    />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.videoHandleTime"
      class="global-checkbox"
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
  <n-form-item label="预设">
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
      <Tip :tip="titleTip" text="视频标题"></Tip>
    </template>
    <n-input
      ref="titleInput"
      v-model:value="data.title"
      placeholder="请输入视频标题,支持{{title}},{{user}},{{now}}等占位符"
      clearable
      :disabled="globalFieldsObj.title"
      style="margin-right: 10px"
      spellcheck="false"
    />
    <n-button style="margin-right: 10px" @click="previewTitle(data.title)">预览</n-button>
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

  <n-form-item style="margin-top: 15px">
    <template #label>
      <Tip
        text="使用直播封面"
        tip="使用直播封面作为视频封面，默认寻找视频目录下文件名为'视频文件名+.cover.jpg|.jpg的文件"
      ></Tip>
    </template>
    <n-switch v-model:value="data.useLiveCover" :disabled="globalFieldsObj.useLiveCover" />
    <n-checkbox v-if="isRoom" v-model:checked="globalFieldsObj.useLiveCover" class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>

  <n-form-item>
    <template #label>
      <Tip text="断播续传" tip="开启后，会将某主播一场直播上传到同一个视频中"></Tip>
    </template>
    <n-switch v-model:value="data.autoPartMerge" :disabled="globalFieldsObj.autoPartMerge" />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.autoPartMerge"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>

  <template v-if="data.autoPartMerge">
    <n-form-item>
      <template #label>
        <Tip
          text="分p间隔时间"
          tip="检测直播是否为同一场的时间间隔，避免因网络中断原因出现错误分P"
        ></Tip>
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
    <n-form-item>
      <template #label>
        <Tip :tip="partTitleTip" text="分P标题"></Tip>
      </template>
      <n-input
        ref="partTitleInput"
        v-model:value="data.partTitleTemplate"
        placeholder="请输入分P标题"
        clearable
        :disabled="globalFieldsObj.partTitleTemplate"
        style="margin-right: 10px"
        spellcheck="false"
      />
      <n-button style="margin-right: 10px" @click="previewPartTitle(data.partTitleTemplate)"
        >预览</n-button
      >
      <n-checkbox
        v-if="isRoom"
        v-model:checked="globalFieldsObj.partTitleTemplate"
        class="global-checkbox"
        >全局</n-checkbox
      >
      <template #feedback>
        <span
          v-for="item in partTitleList"
          :key="item.value"
          :title="item.label"
          class="title-var"
          :class="{
            disabled: globalFieldsObj.partTitleTemplate,
          }"
          @click="setPartTitleVar(item.value)"
          >{{ item.value }}</span
        >
      </template>
    </n-form-item>
  </template>

  <n-form-item style="margin-top: 15px">
    <template #label> 上传后操作 </template>
    <n-select
      v-model:value="data.afterUploadDeletAction"
      :options="uploadAfterActionOptions"
      :disabled="globalFieldsObj.afterUploadDeletAction"
      style="margin-right: 10px"
    />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.afterUploadDeletAction"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>

  <n-form-item>
    <template #label>
      <Tip text="限制上传时间" tip="开启后，支持只在某段时间执行上传操作"></Tip>
    </template>
    <n-switch v-model:value="data.limitUploadTime" :disabled="globalFieldsObj.limitUploadTime" />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.limitUploadTime"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>
  <n-form-item v-if="data.limitUploadTime">
    <template #label>
      <span class="inline-flex"> 允许上传时间段 </span>
    </template>
    <n-time-picker
      v-model:formatted-value="data.uploadHandleTime[0]"
      :disabled="globalFieldsObj.uploadHandleTime"
    />
    ~
    <n-time-picker
      v-model:formatted-value="data.uploadHandleTime[1]"
      :disabled="globalFieldsObj.uploadHandleTime"
    />
    <n-checkbox
      v-if="isRoom"
      v-model:checked="globalFieldsObj.uploadHandleTime"
      class="global-checkbox"
      >全局</n-checkbox
    >
  </n-form-item>

  <!-- 非弹幕版相关配置 -->
  <template v-if="data.uid">
    <n-divider />
    <n-form-item>
      <template #label>
        <Tip
          text="上传非弹幕版"
          tip="如果你没有压制弹幕版，请不要勾选该设置！用于在上传弹幕版后同时上传一份非弹幕版本，大部分配置与上面的共用，不含「上传后操作」选项
            <br/>视频标题去上传预设中配置，标题模板不要与弹幕版完全一致，不然b站可能会上传错误"
        ></Tip>
      </template>
      <n-switch v-model:value="data.uploadNoDanmu" :disabled="globalFieldsObj.uploadNoDanmu" />
      <n-checkbox
        v-if="isRoom"
        v-model:checked="globalFieldsObj.uploadNoDanmu"
        class="global-checkbox"
        >全局</n-checkbox
      >
    </n-form-item>
    <n-form-item v-if="data.uploadNoDanmu" label="非弹幕版上传预设">
      <n-select
        v-model:value="data.noDanmuVideoPreset"
        :options="props.biliupPresetsOptions"
        placeholder="请选择"
        :disabled="globalFieldsObj.noDanmuVideoPreset"
        style="margin-right: 10px"
      />
      <n-checkbox
        v-if="isRoom"
        v-model:checked="globalFieldsObj.noDanmuVideoPreset"
        class="global-checkbox"
        >全局</n-checkbox
      >
    </n-form-item>
  </template>
</template>

<script setup lang="ts">
import { useDanmuPreset, useUserInfoStore } from "@renderer/stores";
import { formatWebhookTitle, formatWebhookPartTitle } from "@renderer/apis/bili";
import { templateRef } from "@vueuse/core";
import { uploadTitleTemplate } from "@renderer/enums";

import type { AppRoomConfig, SyncType } from "@biliLive-tools/types";

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
  syncConfigs: {
    id: string;
    name: string;
    syncSource: SyncType;
  }[];
}>();

const data = defineModel<AppRoomConfig>("data", {
  default: () => ({
    syncId: "",
    open: true,
    minSize: 0,
    title: "",
    danmu: false,
    autoPartMerge: false,
    hotProgress: false,
    useLiveCover: false,
    partTitleTemplate: "",
    videoHandleTime: ["00:00:00", "23:59:59"],
    uploadHandleTime: ["00:00:00", "23:59:59"],
    afterUploadDeletAction: "none",
  }),
});

const globalFieldsObj = defineModel<{
  [key: string]: boolean;
}>("globalFieldsObj", {
  type: Object,
  default: () => {},
});

const notice = useNotification();
const { danmuPresetsOptions } = storeToRefs(useDanmuPreset());
const { userList } = storeToRefs(useUserInfoStore());

const uploadAfterActionOptions = [
  { label: "无操作", value: "none" },
  { label: "上传后删除", value: "delete" },
  { label: "审核通过后删除", value: "deleteAfterCheck" },
];

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

const titleList = ref(uploadTitleTemplate);
const titleTip = computed(() => {
  const base = `推荐在上传预设设置模板标题，但如果预设标题中不存在占位符，依然使用webhook配置。<br/>
  支持{{title}},{{user}},{{now}}等占位符，如【{{user}}】{{title}}-{{now}}<br/>
  更多模板引擎等高级用法见文档<br/>`;
  return titleList.value
    .map((item) => {
      return `${item.label}：${item.value}<br/>`;
    })
    .reduce((prev, cur) => prev + cur, base);
});
const titleInput = templateRef("titleInput");
const setTitleVar = async (value: string) => {
  if (globalFieldsObj.value.title) return;
  const input = titleInput.value?.inputElRef;
  if (input) {
    // 获取input光标位置
    const start = input.selectionStart ?? data.value.title.length;
    const end = input.selectionEnd ?? data.value.title.length;
    const oldValue = data.value.title;
    data.value.title = oldValue.slice(0, start) + value + oldValue.slice(end);
    // 设置光标位置
    input.focus();
    await nextTick();
    input.setSelectionRange(start + value.length, start + value.length);
  } else {
    data.value.title += value;
  }
};

// 分p标题
const partTitleList = ref([
  {
    label: "标题",
    value: "{{title}}",
  },
  {
    value: "{{user}}",
    label: "主播名",
  },
  {
    value: "{{roomId}}",
    label: "房间号",
  },
  {
    label: "文件名",
    value: "{{filename}}",
  },
  {
    label: "序号",
    value: "{{index}}",
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
const partTitleTip = computed(() => {
  const base = `更多模板引擎等高级用法见文档<br/>`;
  return partTitleList.value
    .map((item) => {
      return `${item.label}：${item.value}<br/>`;
    })
    .reduce((prev, cur) => prev + cur, base);
});
const partTitleInput = templateRef("partTitleInput");
const setPartTitleVar = async (value: string) => {
  if (globalFieldsObj.value.partTitleTemplate) return;
  const input = partTitleInput.value?.inputElRef;
  if (input) {
    // 获取input光标位置
    const start = input.selectionStart ?? data.value.partTitleTemplate.length;
    const end = input.selectionEnd ?? data.value.partTitleTemplate.length;
    const oldValue = data.value.partTitleTemplate;
    data.value.partTitleTemplate = oldValue.slice(0, start) + value + oldValue.slice(end);
    // 设置光标位置
    input.focus();
    await nextTick();
    input.setSelectionRange(start + value.length, start + value.length);
  } else {
    data.value.partTitleTemplate += value;
  }
};
const previewPartTitle = async (template: string) => {
  const data = await formatWebhookPartTitle(template);
  notice.info({
    title: data,
    duration: 3000,
  });
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

const previewTitle = async (template: string) => {
  const data = await formatWebhookTitle(template);
  notice.info({
    title: data,
    duration: 3000,
  });
};
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

h2 {
  margin: 0;
  margin-bottom: 10px;
}
</style>
