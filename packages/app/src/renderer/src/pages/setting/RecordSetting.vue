<template>
  <div class="">
    <div style="display: flex; gap: 10px; align-items: center">
      <h2>录制配置</h2>
      <p>此项大部分配置不直接即时生效，需重新开始一个录制方可生效</p>
    </div>

    <n-form label-placement="left" :label-width="140">
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 保存文件夹 </span>
        </template>
        <n-input v-model:value="config.recorder.savePath" placeholder="请选择要保存的文件夹" />
        <n-icon
          style="margin-left: 10px"
          size="26"
          class="pointer"
          @click="selectFolder('recorder')"
        >
          <FolderOpenOutline />
        </n-icon>
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip :tip="titleTip" text="文件命名规则"></Tip>
        </template>
        <n-input
          ref="titleInput"
          v-model:value="config.recorder.nameRule"
          placeholder="请输入文件命名规则"
          clearable
          spellcheck="false"
        />
        <template #feedback>
          <span
            v-for="item in titleList"
            :key="item.value"
            :title="item.label"
            class="title-var"
            @click="setTitleVar(item.value)"
            >{{ item.value }}</span
          >
        </template>
      </n-form-item>
      <n-form-item style="display: none">
        <template #label>
          <span class="inline-flex"> 自动录制 </span>
        </template>
        <n-switch v-model:value="config.recorder.autoRecord" />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            检查间隔
            <Tip tip="直播状态检查，注意风控"></Tip>
          </span>
        </template>
        <n-input-number v-model:value="config.recorder.checkInterval" min="10" step="10">
          <template #suffix>秒</template>
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            分段录制
            <Tip tip="0为不分段"></Tip>
          </span>
        </template>
        <n-input-number v-model:value="config.recorder.segment" min="0" step="10">
          <template #suffix>分钟</template>
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 画质 </span>
        </template>
        <n-select v-model:value="config.recorder.quality" :options="qualityOptions" />
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip text="B站录制账号"></Tip>
        </template>
        <n-select
          v-model:value="config.recorder.uid"
          :options="userList"
          label-field="name"
          value-field="uid"
          clearable
        />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span> 调试模式 </span>
        </template>
        <n-switch v-model:value="config.recorder.debugMode" />
      </n-form-item>

      <h2>弹幕录制</h2>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 弹幕录制 </span>
        </template>
        <n-switch
          v-model:value="config.recorder.disableProvideCommentsWhenRecording"
          :checked-value="false"
          :unchecked-value="true"
        />
      </n-form-item>
      <n-form-item v-if="!config.recorder.disableProvideCommentsWhenRecording">
        <template #label>
          <span class="inline-flex"> 保存礼物 </span>
        </template>
        <n-switch v-model:value="config.recorder.saveGiftDanma" />
      </n-form-item>
      <n-form-item v-if="!config.recorder.disableProvideCommentsWhenRecording">
        <template #label>
          <span class="inline-flex"> 保存高能弹幕 </span>
        </template>
        <n-switch v-model:value="config.recorder.saveSCDanma" />
      </n-form-item>
      <!-- <n-form-item v-if="!config.recorder.disableProvideCommentsWhenRecording">
        <template #label>
          <span class="inline-flex"> 自动转换为ass </span>
        </template>
        待实现
      </n-form-item>
      <n-form-item v-if="!config.recorder.disableProvideCommentsWhenRecording && false">
        <template #label>
          <span class="inline-flex"> ass转换预设 </span>
        </template>
        待实现
      </n-form-item> -->
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { FolderOpenOutline } from "@vicons/ionicons5";
import { templateRef } from "@vueuse/core";
import showDirectoryDialog from "@renderer/components/showDirectoryDialog";
import { useUserInfoStore } from "@renderer/stores";

import type { AppConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});

const { userList } = storeToRefs(useUserInfoStore());
const qualityOptions = [
  { value: "highest", label: "最高" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
  { value: "lowest", label: "最低" },
];

const selectFolder = async (type: "recorder") => {
  let file: string | undefined;

  if (window.isWeb) {
    file = await showDirectoryDialog({
      type: "directory",
    })[0];
  } else {
    file = await window.api.openDirectory({
      defaultPath: config.value.webhook.recoderFolder,
    });
  }
  if (!file) return;

  if (type === "recorder") {
    config.value.recorder.savePath = file;
  }
};
const titleList = ref([
  {
    value: "{platform}",
    label: "平台",
  },
  {
    value: "{channelId}",
    label: "房间号",
  },
  {
    value: "{remarks}",
    label: "备注",
  },
  {
    value: "{owner}",
    label: "主播名",
  },
  {
    value: "{title}",
    label: "标题",
  },
  {
    value: "{year}",
    label: "年",
  },
  {
    value: "{month}",
    label: "月",
  },
  {
    value: "{date}",
    label: "日",
  },
  {
    value: "{hour}",
    label: "时",
  },
  {
    value: "{min}",
    label: "分",
  },
  {
    value: "{sec}",
    label: "秒",
  },
]);
const titleTip = computed(() => {
  const base = `请带上时间相关参数，避免文件被覆盖`;
  return titleList.value
    .map((item) => {
      return `${item.label}：${item.value}<br/>`;
    })
    .reduce((prev, cur) => prev + cur, base);
});

const titleInput = templateRef("titleInput");
const setTitleVar = async (value: string) => {
  const input = titleInput.value?.inputElRef;
  if (input) {
    // 获取input光标位置
    const start = input.selectionStart ?? config.value.recorder.nameRule.length;
    const end = input.selectionEnd ?? config.value.recorder.nameRule.length;
    const oldValue = config.value.recorder.nameRule;
    config.value.recorder.nameRule = oldValue.slice(0, start) + value + oldValue.slice(end);
    // 设置光标位置
    input.focus();
    await nextTick();
    input.setSelectionRange(start + value.length, start + value.length);
  } else {
    config.value.recorder.nameRule += value;
  }
};
</script>

<style scoped lang="less">
.item {
  display: flex;
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
  margin-bottom: 10px;
  &:not(.disabled):hover {
    background-color: #e0e0e0;
  }
  &.disabled {
    cursor: not-allowed;
  }
}
</style>
