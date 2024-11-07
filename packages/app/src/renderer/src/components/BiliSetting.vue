<!-- bili设置 -->
<template>
  <div>
    <n-form ref="formRef" label-width="120px" label-placement="left" label-align="right">
      <n-form-item label="预设">
        <n-select v-model:value="presetId" :options="uploaPresetsOptions" />
      </n-form-item>
      <n-divider />

      <n-form-item>
        <template #label>
          <Tip tip="非必选，默认由B站决定" text="封面"></Tip>
        </template>
        <image-crop v-model="options.config.cover"></image-crop>
      </n-form-item>
      <n-form-item label="视频标题">
        <template #label>
          <Tip :tip="titleTip" text="视频标题"></Tip>
        </template>
        <n-input
          ref="titleInput"
          v-model:value="options.config.title"
          placeholder="请输入视频标题"
          clearable
        />
        <n-button style="margin-right: 10px" @click="previewTitle(options.config.title)"
          >预览</n-button
        >
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
      <n-form-item label="稿件类型">
        <n-radio-group v-model:value="options.config.copyright" name="radiogroup">
          <n-space>
            <n-radio :value="1"> 自制 </n-radio>
            <n-radio :value="2"> 转载 </n-radio>
          </n-space>
        </n-radio-group>
      </n-form-item>
      <n-form-item v-if="options.config.copyright === 2" label="转载来源">
        <n-input
          v-model:value="options.config.source"
          placeholder="注明视频来源网址"
          :allow-input="noSideSpace"
          clearable
          maxlength="200"
          show-count
        />
      </n-form-item>
      <n-form-item label="分区">
        <n-cascader
          v-model:value="options.config.tid"
          label-field="name"
          value-field="id"
          :options="areaData"
          check-strategy="child"
          filterable
        />
      </n-form-item>
      <n-form-item label="标签">
        <dynamic-tags
          v-model="options.config.tag"
          :max="10"
          :before-create="beforeTagCreate"
          placeholder="回车输入标签，最多十个"
          :loading="tagCreateLoading"
        />
      </n-form-item>
      <n-form-item v-if="options.config.copyright === 1">
        <template #label>
          <Tip tip="话题也会占据一个tag栏~" text="话题"></Tip>
        </template>
        <n-select
          v-model:value="options.config.topic_name"
          filterable
          placeholder="搜索话题"
          :options="topicOptions"
          :loading="topicLoading"
          clearable
          remote
          :clear-filter-after-select="false"
          @search="handleSearch"
        />
      </n-form-item>

      <n-form-item>
        <template #label>
          <Tip
            text="视频简介"
            tip="可以输入[暮色312]<10995238>来进行艾特用户，前面的值为用户名，后面的值为用户id，请务必保持用户名与uid对应。"
          ></Tip>
        </template>
        <n-input
          v-model:value="options.config.desc"
          placeholder="请输入视频简介"
          clearable
          :maxlength="descMaxLength"
          show-count
          type="textarea"
          :autosize="{
            minRows: 4,
          }"
        />
      </n-form-item>

      <n-form-item label="粉丝动态">
        <n-input
          v-model:value="options.config.dynamic"
          placeholder="请输入粉丝动态"
          clearable
          maxlength="233"
          show-count
          type="textarea"
          :autosize="{
            minRows: 2,
          }"
        />
      </n-form-item>

      <n-form-item label="自制声明">
        <div class="inline-items">
          <n-checkbox
            v-model:checked="options.config.noReprint"
            :checked-value="1"
            :unchecked-value="0"
            >未经作者授权 禁止转载</n-checkbox
          >
          <n-checkbox
            v-model:checked="options.config.recreate"
            :checked-value="1"
            :unchecked-value="-1"
            title="勾选即允许创作者基于您的投稿视频内容进行二创"
            >二创声明</n-checkbox
          >
        </div>
      </n-form-item>
      <n-form-item label="充电设置">
        <n-checkbox
          v-model:checked="options.config.openElec"
          :checked-value="1"
          :unchecked-value="0"
          >启用充电面板</n-checkbox
        >
      </n-form-item>
      <n-form-item label="高级设置">
        <div class="inline-items">
          <div class="inline-item">
            <n-checkbox
              v-model:checked="options.config.dolby"
              :checked-value="1"
              :unchecked-value="0"
              >杜比音效</n-checkbox
            >
          </div>
          <div class="inline-item">
            <n-checkbox
              v-model:checked="options.config.hires"
              :checked-value="1"
              :unchecked-value="0"
              >Hi-Res无损音质
            </n-checkbox>
          </div>
        </div>
      </n-form-item>
      <n-form-item label="互动管理">
        <div class="inline-items">
          <div class="inline-item">
            <n-checkbox
              v-model:checked="options.config.closeDanmu"
              :checked-value="1"
              :unchecked-value="0"
              >关闭弹幕</n-checkbox
            >
          </div>
          <div class="inline-item">
            <n-checkbox
              v-model:checked="options.config.closeReply"
              :checked-value="1"
              :unchecked-value="0"
              >关闭评论
            </n-checkbox>
          </div>
          <div class="inline-item">
            <n-checkbox
              v-model:checked="options.config.selectiionReply"
              :checked-value="1"
              :unchecked-value="0"
              >开启精选评论
            </n-checkbox>
          </div>
          <div class="inline-item">
            <n-radio-group v-model:value="options.config.is_only_self" name="radiogroup">
              <n-space>
                <n-radio :value="0"> 公开可见 </n-radio>
                <n-radio :value="1"> 仅自己可见 </n-radio>
              </n-space>
            </n-radio-group>
          </div>
        </div>
      </n-form-item>
      <n-form-item label="自动评论">
        <div class="inline-items">
          <n-checkbox
            v-model:checked="options.config.autoComment"
            title="审核后自动进行评论，续传不会被处理"
            >自动评论</n-checkbox
          >
          <n-checkbox v-model:checked="options.config.commentTop">置顶</n-checkbox>
        </div>
      </n-form-item>
      <n-form-item v-if="options.config.autoComment">
        <template #label>
          <span class="inline-flex">
            <span>自动评论</span>
          </span>
        </template>
        <n-input
          v-model:value="options.config.comment"
          placeholder="请输入评论内容"
          clearable
          :maxlength="1000"
          show-count
          type="textarea"
          :autosize="{
            minRows: 4,
          }"
        />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            <span>合集</span>
            <Tip :tip="`仅适用于设置合集的账户(${options.config.uid})`"></Tip>
          </span>
        </template>
        <div class="inline-items" style="align-items: center">
          <n-select
            v-model:value="options.config.seasonId"
            :options="seasonList"
            placeholder="请选择合集"
            style="width: 200px; flex: none"
            clearable
          />
          <n-select
            v-if="options.config.seasonId"
            v-model:value="options.config.sectionId"
            :options="currentSections"
            label-field="title"
            value-field="id"
            placeholder="请选择小节"
            style="width: 200px; flex: none"
            clearable
          />
          <n-checkbox
            v-if="options.config.seasonId"
            v-model:checked="options.config.no_disturbance"
            :checked-value="1"
            :unchecked-value="0"
            style="flex: none"
            >此稿件不生成更新推送</n-checkbox
          >
        </div>
      </n-form-item>
    </n-form>

    <div style="text-align: right">
      <n-button v-if="options.id !== 'default'" ghost quaternary type="error" @click="deletePreset"
        >删除</n-button
      >
      <n-button type="primary" style="margin-left: 10px" @click="rename">重命名</n-button>
      <n-button type="primary" style="margin-left: 10px" @click="saveAnotherPreset"
        >另存为</n-button
      >
      <n-button type="primary" style="margin-left: 10px" @click="savePreset">保存</n-button>
    </div>

    <n-modal v-model:show="nameModelVisible">
      <n-card style="width: 600px" :bordered="false" role="dialog" aria-modal="true">
        <n-input
          v-model:value="tempPresetName"
          placeholder="请输入预设名称"
          maxlength="15"
          @keyup.enter="saveAnotherPresetConfirm"
        />
        <template #footer>
          <div style="text-align: right">
            <n-button @click="nameModelVisible = false">取消</n-button>
            <n-button type="primary" style="margin-left: 10px" @click="saveAnotherPresetConfirm"
              >确认</n-button
            >
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { deepRaw, uuid } from "@renderer/utils";
import { useConfirm } from "@renderer/hooks";
import { videoPresetApi, biliApi } from "@renderer/apis";
import { previewWebhookTitle } from "@renderer/apis/common";

import { useUploadPreset, useAppConfig, useUserInfoStore } from "@renderer/stores";
import { cloneDeep } from "lodash-es";
import { templateRef } from "@vueuse/core";
import DynamicTags from "./DynamicTags.vue";

import type { BiliupPreset } from "@biliLive-tools/types";

const confirm = useConfirm();
const { getUploadPresets } = useUploadPreset();
const { appConfig } = storeToRefs(useAppConfig());
const { uploaPresetsOptions } = storeToRefs(useUploadPreset());
const emits = defineEmits<{
  (event: "change", value: BiliupPreset): void;
}>();

// const presetId = ref<string>("default");
const presetId = defineModel<string>({ required: false, default: "default" });

// @ts-ignore
const options: Ref<BiliupPreset> = ref({
  config: {
    uid: undefined,
    seasonId: undefined,
  },
});
const handlePresetChange = async (value: string) => {
  const preset = await videoPresetApi.get(value);
  if (preset) {
    options.value = preset;
  } else {
    // @ts-ignore
    options.value = {
      // @ts-ignore
      config: {},
    };
  }
};

const noSideSpace = (value: string) => !value.startsWith(" ") && !value.endsWith(" ");

watch(
  () => presetId.value,
  (value) => {
    handlePresetChange(value);
  },
  {
    immediate: true,
  },
);

const notice = useNotification();
const tagCreateLoading = ref(false);
const beforeTagCreate = async (tag: string) => {
  if (!appConfig.value.uid) {
    notice.warning({
      title: "请先登录",
      duration: 1000,
    });
    return false;
  }
  if ((options.value?.config?.tag ?? []).includes(tag)) {
    notice.warning({
      title: "Σ( ° △ °|||) 该输入标签已经存在",
      duration: 1000,
    });
    return false;
  }

  tagCreateLoading.value = true;
  try {
    const res = await biliApi.checkTag(tag, appConfig.value.uid);
    if (res.code !== 0) {
      notice.error({
        title: res.message,
        duration: 1000,
      });
      return false;
    }
    return true;
  } catch (e) {
    notice.error({
      title: "无法添加标签",
      duration: 1000,
    });
    return false;
  } finally {
    tagCreateLoading.value = false;
  }
};

const nameModelVisible = ref(false);
const tempPresetName = ref("");
const saveAnotherPreset = () => {
  isRename.value = false;
  tempPresetName.value = "";
  nameModelVisible.value = true;
};

const isRename = ref(false);
const rename = () => {
  tempPresetName.value = options.value.name;
  isRename.value = true;
  nameModelVisible.value = true;
};

const saveAnotherPresetConfirm = async () => {
  if (!tempPresetName.value) {
    notice.warning({
      title: "预设名称不得为空",
      duration: 500,
    });
    return;
  }
  const preset = cloneDeep(options.value);

  if (preset?.config?.desc && preset?.config?.desc?.length > descMaxLength.value) {
    notice.error({
      title: "简介超过字数限制",
      duration: 1000,
    });
    return;
  }

  if (!isRename.value) preset.id = uuid();
  preset.name = tempPresetName.value;

  await _savePreset(preset);
  nameModelVisible.value = false;
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
  await getUploadPresets();
  presetId.value = preset.id;
  handlePresetChange(preset.id);
};

const deletePreset = async () => {
  let ids = Object.entries(appConfig.value.webhook.rooms || {}).map(([, value]) => {
    return value?.uploadPresetId;
  });
  ids.push(appConfig.value.webhook?.uploadPresetId);
  ids = ids.filter((id) => id !== undefined && id !== "");

  const msg = ids.includes(options.value.id)
    ? "该预设正在被使用中，删除后使用该预设的功能将失效，是否确认删除？"
    : "是否确认删除该预设？";

  const [status] = await confirm.warning({
    content: msg,
  });
  if (!status) return;

  const id = options.value.id;
  await videoPresetApi.remove(id);
  getUploadPresets();
  presetId.value = "default";
  handlePresetChange("default");
};

const savePreset = async () => {
  const data = options.value;
  if (userInfoStore.userInfo?.uid) {
    data.config.uid = userInfoStore.userInfo.uid;
  }
  if (data?.config?.desc && data?.config?.desc?.length > descMaxLength.value) {
    notice.error({
      title: "简介超过字数限制",
      duration: 1000,
    });
    return;
  }
  await _savePreset(options.value);
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
};

const _savePreset = async (data: BiliupPreset) => {
  await biliApi.validUploadParams(deepRaw(data.config));
  await videoPresetApi.save(deepRaw(data));
};

watch(
  () => options.value,
  (value) => {
    emits("change", value);
  },
  {
    deep: true,
  },
);

watchEffect(() => {
  if (options.value.config.closeReply) {
    options.value.config.selectiionReply = 0;
  }
});
watchEffect(() => {
  if (options.value.config.selectiionReply) {
    options.value.config.closeReply = 0;
  }
});
// watchEffect(() => {
//   if (options.value.config.tid) {
//     getTypeDesc(options.value.config.tid);
//   }
// });

// 合集
const userInfoStore = useUserInfoStore();
const seasonList = ref<
  {
    label: string;
    value: number;
    sections: { title: string; id: number }[];
  }[]
>([]);
const currentSections = computed(() => {
  return seasonList.value.find((item) => item.value === options.value.config.seasonId)?.sections;
});
const getSeasonList = async () => {
  if (!userInfoStore?.userInfo?.uid) {
    seasonList.value = [];
    return;
  }
  const data = await biliApi.getSeasonList(userInfoStore.userInfo.uid);
  seasonList.value = (data.seasons || []).map((item) => {
    return {
      label: item.season.title,
      value: item.season.id,
      sections: item?.sections?.sections || [],
    };
  });
};

const areaData = ref<any[]>([]);
const getPlatformTypes = async () => {
  if (!userInfoStore?.userInfo?.uid) {
    return;
  }
  const data = await biliApi.getPlatformPre(userInfoStore.userInfo.uid);
  areaData.value = data.typelist;
};

const descMaxLength = ref(2000);
// const getTypeDesc = async (tid: number) => {
//   if (!userInfoStore?.userInfo?.uid) {
//     return;
//   }
//   const data = await window.api.bili.getTypeDesc(tid, userInfoStore.userInfo.uid);
//   if (data) {
//     descMaxLength.value = 2000;
//   } else {
//     descMaxLength.value = 250;
//   }
// };

watch(
  () => options.value.config.seasonId,
  () => {
    options.value.config.uid = userInfoStore.userInfo?.uid;
  },
);

watchEffect(() => {
  if (!userInfoStore.userInfo) return;
  getSeasonList();
  getPlatformTypes();
});

const topicLoading = ref(false);
const topicOptions = ref<any[]>([]);
const handleSearch = async (query: string) => {
  if (!appConfig.value.uid) {
    topicOptions.value = [];
    return;
  }
  if (!query.length) {
    topicOptions.value = [];
    return;
  }
  topicLoading.value = true;
  const data = await biliApi.searchTopic(query, appConfig.value.uid);
  topicOptions.value = data.result.topics.map((item) => {
    return {
      ...item,
      label: item.name,
      value: item.name,
    };
  });
  topicLoading.value = false;
};

watch(
  () => options.value.config.topic_name,
  () => {
    if (options.value.config.topic_name) {
      options.value.config.topic_id = topicOptions.value.find(
        (item) => item.value === options.value.config.topic_name,
      )?.id;
      options.value.config.mission_id = topicOptions.value.find(
        (item) => item.value === options.value.config.topic_name,
      )?.mission_id;
    } else {
      options.value.config.topic_id = undefined;
      options.value.config.mission_id = undefined;
    }
  },
);

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
    value: "{{roomId}}",
    label: "房间号",
  },
  {
    value: "{{now}}",
    label: "视频录制时间（示例：2024.01.24）",
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
  const base = `上限80字，多余的会被截断。<br/>
  占位符用于支持webhook中的相关功能，如果你是手动上传，和你基本上没关系，如【{{user}}】{{title}}-{{now}}<br/>
  不要在直播开始后修改字段，本场直播不会生效，更多模板引擎等高级用法见文档<br/>`;
  return titleList.value
    .map((item) => {
      return `${item.label}：${item.value}<br/>`;
    })
    .reduce((prev, cur) => prev + cur, base);
});

const previewTitle = async (template: string) => {
  const data = await previewWebhookTitle(template);
  notice.warning({
    title: data,
    duration: 3000,
  });
};

const titleInput = templateRef("titleInput");
const setTitleVar = async (value: string) => {
  const input = titleInput.value?.inputElRef;
  if (input) {
    // 获取input光标位置
    const start = input.selectionStart ?? options.value.config.title.length;
    const end = input.selectionEnd ?? options.value.config.title.length;
    const oldValue = options.value.config.title;
    options.value.config.title = oldValue.slice(0, start) + value + oldValue.slice(end);
    // 设置光标位置
    input.focus();
    await nextTick();
    input.setSelectionRange(start + value.length, start + value.length);
  } else {
    options.value.config.title += value;
  }
};
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}

.inline-items {
  display: flex;
  gap: 10px;

  .inline-item {
    display: inline-flex;
    align-items: center;
  }
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
