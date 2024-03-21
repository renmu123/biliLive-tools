<!-- bili设置 -->
<template>
  <div>
    <n-form ref="formRef" label-width="120px" label-placement="left" label-align="right">
      <n-form-item label="预设">
        <n-select
          v-model:value="presetId"
          :options="uploaPresetsOptions"
          @update:value="handlePresetChange"
        />
      </n-form-item>
      <n-divider />

      <n-form-item label="视频标题">
        <n-input
          v-model:value="options.config.title"
          placeholder="请输入视频标题"
          clearable
          maxlength="80"
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
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            <span>视频简介</span>
            <Tip
              tip="仅限非biliup上传：可以输入[暮色312]<10995238>来进行艾特用户，前面的值为用户名，后面的值为用户id，请务必保持用户名与id对应。"
            ></Tip>
          </span>
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
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            <span>封面</span>
            <Tip tip="不设置默认使用视频第一帧"></Tip>
          </span>
        </template>
        <image-crop v-model="options.config.cover"></image-crop>
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
      <n-form-item label="标签">
        <n-dynamic-tags
          v-model:value="options.config.tag"
          :max="12"
          @update:value="handleTagChange"
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
        </div>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            <span>合集</span>
            <Tip
              :tip="`仅限非biliup上传方式，多p视频无法加入，仅适用于设置合集的账户(${options.config.uid})，需电磁力3级才可开通`"
            ></Tip>
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
import { storeToRefs } from "pinia";
import { deepRaw, uuid } from "@renderer/utils";
import { useConfirm } from "@renderer/hooks";
import { useUploadPreset, useAppConfig, useUserInfoStore } from "@renderer/stores";
import { cloneDeep } from "lodash-es";

import type { BiliupPreset } from "../../../types";

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
  const preset = await window.api.bili.getPreset(value);
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

onMounted(async () => {
  handlePresetChange(presetId.value);
});

const notice = useNotification();
const handleTagChange = async (tags: string[]) => {
  if (tags.length !== 0) {
    if (!appConfig.value.uid) {
      notice.warning({
        title: "请先登录",
        duration: 500,
      });
      options.value.config.tag.splice(-1);
      return;
    }
    const res = await window.api.bili.checkTag(tags[tags.length - 1], appConfig.value.uid);

    if (res.code !== 0) {
      notice.error({
        title: res.message,
        duration: 1000,
      });
      options.value.config.tag.splice(-1);
    }
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
  const appConfig = await window.api.config.getAll();
  let ids = Object.entries(appConfig.webhook.rooms || {}).map(([, value]) => {
    return value?.uploadPresetId;
  });
  ids.push(appConfig.webhook?.uploadPresetId);
  ids = ids.filter((id) => id !== undefined && id !== "");

  const msg = ids.includes(options.value.id)
    ? "该预设正在被使用中，删除后使用该预设的功能将失效，是否确认删除？"
    : "是否确认删除该预设？";

  const status = await confirm.warning({
    content: msg,
  });
  if (!status) return;

  const id = options.value.id;
  await window.api.bili.deletePreset(id);
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
  await window.api.bili.savePreset(deepRaw(data));
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
watchEffect(() => {
  if (options.value.config.tid) {
    getTypeDesc(options.value.config.tid);
  }
});

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
  const data = await window.api.bili.getSeasonList(userInfoStore.userInfo.uid);
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
  const data = await window.api.bili.getPlatformPre(userInfoStore.userInfo.uid);
  areaData.value = data.typelist;
};

const descMaxLength = ref(250);
const getTypeDesc = async (tid: number) => {
  if (!userInfoStore?.userInfo?.uid) {
    return;
  }
  const data = await window.api.bili.getTypeDesc(tid, userInfoStore.userInfo.uid);
  console.log(data);
  if (data) {
    descMaxLength.value = 2000;
  } else {
    descMaxLength.value = 250;
  }
};

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
</style>
