<!-- bili设置 -->
<template>
  <div>
    <n-form ref="formRef" :label-width="labelWidth" label-placement="left" label-align="right">
      <n-form-item v-if="!isEditOnlyMode" label="预设">
        <n-select v-model:value="presetId" :options="uploaPresetsOptions" />
      </n-form-item>
      <n-divider v-if="!isEditOnlyMode" />

      <n-form-item>
        <template #label>
          <Tip tip="非必选，不设置B站会自动进行选择" text="封面"></Tip>
        </template>
        <image-crop v-model="options.config.cover"></image-crop>
      </n-form-item>
      <n-form-item label="视频标题" style="margin-bottom: 10px">
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
      <n-form-item label="分P标题" style="margin-bottom: 10px">
        <template #label>
          <Tip :tip="partTitleTip" text="分P标题"></Tip>
        </template>
        <n-input
          ref="partTitleInput"
          v-model:value="options.config.partTitleTemplate"
          placeholder="留空则使用当前分P标题"
          clearable
          style="margin-right: 10px"
          spellcheck="false"
        />
        <n-button
          style="margin-right: 10px"
          @click="previewPartTitle(options.config.partTitleTemplate || '')"
          >预览</n-button
        >
        <template #feedback>
          <span
            v-for="item in partTitleList"
            :key="item.value"
            :title="item.label"
            class="title-var"
            @click="setPartTitleVar(item.value)"
            >{{ item.value }}</span
          >
        </template>
      </n-form-item>
      <n-form-item label="稿件类型">
        <n-radio-group v-model:value="options.config.copyright" name="radiogroup">
          <n-space>
            <n-radio :value="1"> 自制 </n-radio>
            <n-radio :value="2"> 转载 </n-radio>
            <n-radio :value="3"> 其他 </n-radio>
          </n-space>
        </n-radio-group>
      </n-form-item>
      <n-form-item v-if="options.config.copyright === 2">
        <template #label>
          <Tip
            tip="如果为空，在webhook使用时，会尝试会替换为直播间链接，如果无法匹配到，会被替换为直播间号"
            text="转载来源"
          ></Tip>
        </template>
        <n-input
          v-model:value="options.config.source"
          placeholder="注明视频来源网址"
          :allow-input="noSideSpace"
          clearable
          maxlength="200"
          show-count
        />
      </n-form-item>
      <n-form-item
        label="创作声明"
        v-if="options.config.copyright === 1 || options.config.copyright === 3"
      >
        <n-select
          v-model:value="options.config.creationStatement"
          :options="creationStatementList"
          key-field="id"
          label-field="name"
          value-field="id"
          clearable
        />
      </n-form-item>
      <n-form-item label="分区">
        <n-select
          v-model:value="options.config.human_type2"
          :options="humanTypeList"
          key-field="id"
          label-field="name"
          value-field="id"
        />
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip tip="留着默认的tag，秋梨膏(๑>◡<๑)" text="标签"></Tip>
        </template>
        <dynamic-tags
          v-model="options.config.tag"
          :max="10"
          :before-create="beforeTagCreate"
          placeholder="回车输入标签，最多十个"
          :loading="tagCreateLoading"
        />
      </n-form-item>
      <n-form-item v-if="options.config.copyright === 1 || options.config.copyright === 3">
        <template #label>
          <Tip tip="话题也会占据一个tag栏~" text="话题"></Tip>
        </template>
        <n-select
          :value="options.config.topic_name"
          @update:value="handleTopicChange"
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

      <n-form-item style="margin-bottom: 10px">
        <template #label>
          <Tip :tip="descTip" text="视频简介"></Tip>
        </template>
        <n-input
          ref="descInput"
          v-model:value="options.config.desc"
          placeholder="请输入视频简介,支持{{title}},{{user}},{{now}}等占位符。可以输入[暮色312]<10995238>来进行艾特用户"
          clearable
          :maxlength="descMaxLength"
          show-count
          type="textarea"
          :autosize="{
            minRows: 4,
          }"
        />
        <n-button style="margin-right: 10px" @click="previewDesc(options.config.desc || '')"
          >预览</n-button
        >
        <template #feedback>
          <span
            v-for="item in titleList"
            :key="item.value"
            :title="item.label"
            class="title-var"
            @click="setDescVar(item.value)"
            >{{ item.value }}</span
          >
        </template>
      </n-form-item>

      <n-form-item path="dtime" :rule="scheduledDatetimeRule">
        <template #label>
          <Tip
            text="定时发布"
            tip="可选择距离当前最早≥2小时/最晚≤15天的时间，花火稿件或距发布不足5分钟时不可修改/取消，会保存到配置中"
          ></Tip>
        </template>
        <n-date-picker
          type="datetime"
          clearable
          placeholder="请选择定时发布时间"
          :value="scheduledTimestampMillis"
          :on-update:value="
            (value) => {
              scheduledTimestampMillis = value;
            }
          "
        ></n-date-picker>
      </n-form-item>
      
      <n-form-item label="关联预约">
        <div v-if="reserveOptions.length" style="display: flex; flex-direction: column; gap: 8px;">
          <n-checkbox
            v-for="item in reserveOptions"
            :key="item.value"
            :checked="reserveSid === item.value"
            @update:checked="(checked: boolean) => handleReserveChange(checked, item.value)"
          >
            {{ item.label }}
          </n-checkbox>
        </div>
        <div v-else style="color: #999; font-size: 12px;">
          暂无可用预约，<span @click="loadReserveList" style="cursor: pointer; color: #2080f0;">点击刷新</span>
        </div>
      </n-form-item>

      <n-form-item label="联合投稿">
        <div style="display: flex; flex-direction: column; gap: 0;">
          <div style="font-size: 12px; color: #999; margin-bottom: 8px; line-height: 1.8;">
            <div>{{ staffRemaining >= 0 ? (staffRemainingTips || ('本月剩余联合投稿发起次数：' + staffRemaining + '次/6次')) : '剩余次数获取中...' }}</div>
            <div>最多10名合作者</div>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <n-input v-model:value="staffSearchKeyword" placeholder="输入昵称或者UID搜索" style="flex: 1;" @keyup.enter="searchStaff" />
            <n-button type="primary" :loading="staffSearchLoading" @click="searchStaff">搜索</n-button>
          </div>
          <div v-for="user in staffSearchResults" :key="user.mid" style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">
            <img :src="user.face" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 12px;" />
            <span style="flex: 1; font-size: 14px;">{{ user.name }}</span>
            <n-button type="primary" @click="addStaff(user)" style="margin-right: 8px;">添加</n-button>
            <n-button type="error" @click="removeSearchResult(user.mid)">删除</n-button>
          </div>
          <div v-for="(staff, index) in options.config.staffs" :key="staff.mid" style="display: flex; align-items: center; padding: 8px 12px; background: #fafafa; border-bottom: 1px solid #f0f0f0;">
            <span style="flex: 1; margin-right: 12px; font-size: 14px;">{{ staff.title }} - {{ staff.name || 'UID:' + staff.mid }}</span>
            <n-select v-model:value="staff.title" :options="staffTitleOptions" style="width: 120px; margin-right: 8px;" />
            <n-button type="error" @click="removeStaff(index)">删除</n-button>
          </div>
        </div>
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
      <n-form-item
        v-if="options.config.copyright === 1 || options.config.copyright === 3"
        label="添加水印"
      >
        <n-checkbox
          v-model:checked="options.config.watermark"
          :checked-value="1"
          :unchecked-value="0"
          title="开启"
          >开启</n-checkbox
        >
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
          <div class="inline-item">
            <n-checkbox
              v-model:checked="options.config.space_hidden"
              :checked-value="1"
              :unchecked-value="2"
              >在个人空间-投稿中隐藏
            </n-checkbox>
          </div>
        </div>
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip
            tip="谨慎使用，可能会导致评论被阿瓦隆风控，以及可能的风控等级上升"
            text="自动评论"
          ></Tip>
        </template>
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
            <Tip
              :tip="`此处的合集为投稿中的合集功能，仅适用于设置合集的账户(${options.config.uid})`"
            ></Tip>
          </span>
        </template>
        <div class="inline-items" style="align-items: center; flex-wrap: wrap; width: 100%">
          <n-select
            v-model:value="options.config.seasonId"
            :options="seasonList"
            placeholder="请选择合集"
            style="flex: 1; min-width: 100px; max-width: 250px"
            clearable
          />
          <n-select
            v-if="options.config.seasonId"
            v-model:value="options.config.sectionId"
            :options="currentSections"
            label-field="title"
            value-field="id"
            placeholder="请选择小节"
            style="flex: 1; min-width: 100px; max-width: 250px"
            clearable
          />
          <n-checkbox
            v-model:checked="options.config.no_disturbance"
            :checked-value="1"
            :unchecked-value="0"
            style="flex: none"
            >此稿件不生成更新推送</n-checkbox
          >
          <n-button @click="getSeasonList(true)" type="primary">强制刷新</n-button>
        </div>
      </n-form-item>
    </n-form>

    <div v-if="props.showActionButtons" style="text-align: right">
      <template v-if="!isEditOnlyMode">
        <n-button v-if="options.id !== 'default'" text type="error" @click="deletePreset"
          >删除</n-button
        >
        <n-button type="primary" style="margin-left: 10px" @click="rename">重命名</n-button>
        <n-button type="primary" style="margin-left: 10px" @click="saveAnotherPreset"
          >另存为</n-button
        >
      </template>
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
import { biliApi, videoPresetApi } from "@renderer/apis";
import { useConfirm, useBreakpoints } from "@renderer/hooks";
import { uuid } from "@renderer/utils";

import { uploadTitleTemplate } from "@renderer/enums";
import { useAppConfig, useUploadPreset, useUserInfoStore } from "@renderer/stores";
import { templateRef } from "@vueuse/core";
import { cloneDeep, isEqual } from "lodash-es";
import DynamicTags from "./DynamicTags.vue";

import type { BiliupPreset } from "@biliLive-tools/types";
import { FormItemRule } from "naive-ui";
import { computed } from "vue";

const confirm = useConfirm();
const uploadPresetStore = useUploadPreset();
const { saveUploadPreset, removeUploadPreset } = uploadPresetStore;
const { appConfig } = storeToRefs(useAppConfig());
const { uploaPresetsOptions, uploadPresetVersion } = storeToRefs(uploadPresetStore);
const props = withDefaults(
  defineProps<{
    mode?: "full" | "edit-only";
    presetId?: string;
    showActionButtons?: boolean;
  }>(),
  {
    mode: "full",
    showActionButtons: true,
  },
);
const emits = defineEmits<{
  (event: "change", value: BiliupPreset): void;
}>();
const { isMobile } = useBreakpoints();
const labelWidth = computed(() => {
  return isMobile.value ? "90px" : "120px";
});

// const presetId = ref<string>("default");
const presetId = defineModel<string>({ required: false });
const isEditOnlyMode = computed(() => props.mode === "edit-only");
const activePresetId = computed(() => {
  return isEditOnlyMode.value ? props.presetId : presetId.value;
});

// @ts-ignore
const options: Ref<BiliupPreset> = ref({
  config: {
    uid: undefined,
    seasonId: undefined,
  },
});
const handlePresetChange = async (id: string) => {
  const preset = await videoPresetApi.get(id);
  if (preset) {
    options.value = preset;
  } else {
    // @ts-ignore
    options.value = {
      // @ts-ignore
      config: {},
    };
  }
  // 每次加载预设后清空联合投稿合作者（不保存到配置文件）
  if (options.value.config) {
    options.value.config.staffs = [];
  }
};

const noSideSpace = (value: string) => !value.startsWith(" ") && !value.endsWith(" ");

watch(
  () => activePresetId.value,
  (id) => {
    id && handlePresetChange(id);
  },
  {
    immediate: true,
  },
);

// 比较配置时忽略联合投稿合作者（staffs 仅本次投稿有效，不因保存刷新预设而清空）
const compareConfigIgnoringStaffs = (a: Record<string, unknown>, b: Record<string, unknown>) => {
  const copyA = { ...(a || {}) };
  const copyB = { ...(b || {}) };
  delete copyA.staffs;
  delete copyB.staffs;
  return isEqual(copyA, copyB);
};

watch(uploadPresetVersion, () => {
  if (activePresetId.value) {
    // 判断当前options是否与uploaPresetsOptions中的activePresetId匹配的options相同，如果不相同则更新options
    const currentOptions = uploaPresetsOptions.value.find(
      (preset) => preset.value === activePresetId.value,
    )?.options;
    if (currentOptions) {
      if (!compareConfigIgnoringStaffs(options.value.config, currentOptions)) {
        console.log("options已过时，更新options");
        handlePresetChange(activePresetId.value);
      }
    } else {
      // 说明预设已经被删除了，重置为默认预设
      presetId.value = "default";
    }
  }
});

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
      title: String(e),
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

const scheduledDatetimeRule: FormItemRule = {
  trigger: ["blur", "change"],
  validator() {
    if (!options.value.config.dtime) {
      return true;
    }
    const now = Date.now() / 1000;
    const dtime = options.value.config.dtime;
    if (dtime < now + 2 * 60 * 60) {
      return new Error("定时发布时间必须≥当前时间+2小时");
    }
    if (dtime > now + 15 * 24 * 60 * 60) {
      return new Error("定时发布时间必须≤当前时间+15天");
    }
    return true;
  },
};
const scheduledTimestampMillis = computed({
  get() {
    return options.value.config.dtime ? options.value.config.dtime * 1000 : undefined;
  },
  set(value) {
    options.value.config.dtime = value ? Math.floor(value / 1000) : undefined;
  },
});
const reserveOptions = ref<{ label: string; value: number }[]>([]);
const reserveSid = computed(() => options.value.config.act_reserve?.sid);

const handleReserveChange = (checked: boolean, sid: number) => {
  if (checked) {
    options.value.config.act_reserve = { sid };
  } else {
    options.value.config.act_reserve = undefined;
  }
};

const loadReserveList = async () => {
  try {
    if (!userInfoStore.userInfo?.uid) {
      reserveOptions.value = [];
      return;
    }
    const data = await biliApi.getReserveList(userInfoStore.userInfo.uid);
    const list = data?.data?.act_reserve?.act_reserve_list || [];
    reserveOptions.value = list.map((item: any) => ({
      label: item.title,
      value: item.sid,
    }));
  } catch (e) {
    console.error("获取预约列表失败", e);
  }
};

// 联合投稿相关
const userInfoStore = useUserInfoStore();
const staffSearchKeyword = ref("");
const staffSearchResults = ref<any[]>([]);
const staffSearchLoading = ref(false);
const staffSearched = ref(false);
const staffRemaining = ref(-1);
const staffRemainingTips = ref("");
const staffTitleOptions = [
  { label: "参演", value: "参演" },
  { label: "策划", value: "策划" },
  { label: "设计", value: "设计" },
  { label: "配音", value: "配音" },
  { label: "后期", value: "后期" },
  { label: "调音", value: "调音" },
  { label: "剪辑", value: "剪辑" },
  { label: "视频制作", value: "视频制作" },
  { label: "填词", value: "填词" },
  { label: "作词", value: "作词" },
  { label: "作曲", value: "作曲" },
  { label: "编曲", value: "编曲" },
  { label: "演唱", value: "演唱" },
  { label: "混音", value: "混音" },
  { label: "曲绘", value: "曲绘" },
  { label: "调教", value: "调教" },
  { label: "合剪", value: "合剪" },
  { label: "导演", value: "导演" },
  { label: "编剧", value: "编剧" },
  { label: "主演", value: "主演" },
  { label: "封面设计", value: "封面设计" },
  { label: "文案", value: "文案" },
  { label: "合舞", value: "合舞" },
  { label: "舞者", value: "舞者" },
  { label: "摄影", value: "摄影" },
  { label: "字幕", value: "字幕" },
  { label: "渲染", value: "渲染" },
  { label: "模型", value: "模型" },
  { label: "动作", value: "动作" },
  { label: "调校", value: "调校" },
  { label: "演奏", value: "演奏" },
  { label: "母带", value: "母带" },
  { label: "手工制作", value: "手工制作" },
  { label: "研发", value: "研发" },
  { label: "编舞", value: "编舞" },
];

const fetchStaffRemaining = async () => {
  const uid = appConfig.value.uid;
  if (!uid) return;
  try {
    const res: any = await biliApi.getStaffRemaining(uid);
    staffRemaining.value = res?.cnt_remaining ?? -1;
    staffRemainingTips.value = res?.tips ?? "";
  } catch (e) {
    console.error("获取联合投稿剩余次数失败", e);
  }
};

const searchStaff = async () => {
  if (!staffSearchKeyword.value.trim()) return;
  if (!userInfoStore.userInfo?.uid) {
    console.error("未登录，无法搜索UP主");
    return;
  }
  staffSearchLoading.value = true;
  staffSearched.value = true;
  try {
    const res: any = await biliApi.searchStaffUser(
      staffSearchKeyword.value.trim(),
      userInfoStore.userInfo.uid,
    );
    staffSearchResults.value = res?.data?.users || res?.users || [];
  } catch (e) {
    console.error("搜索UP主失败", e);
  } finally {
    staffSearchLoading.value = false;
  }
};

const addStaff = (user: { mid: number; name: string; face: string }) => {
  if (!options.value.config.staffs) {
    options.value.config.staffs = [];
  }
  if (options.value.config.staffs.length >= 10) {
    notice.warning({ title: "联合投稿最多支持10名合作者", duration: 2000 });
    return;
  }
  if (options.value.config.staffs.some((s: any) => s.mid === user.mid)) {
    return;
  }
  options.value.config.staffs.push({ title: "参演", mid: user.mid, name: user.name });
  staffSearchResults.value = staffSearchResults.value.filter((u) => u.mid !== user.mid);
};

const removeStaff = (index: number) => {
  options.value.config.staffs?.splice(index, 1);
};

const removeSearchResult = (mid: number) => {
  staffSearchResults.value = staffSearchResults.value.filter((u) => u.mid !== mid);
};

onMounted(() => {
  loadReserveList();
  fetchStaffRemaining();
});

watch(
  () => appConfig.value.uid,
  (newUid) => {
    if (newUid) {
      fetchStaffRemaining();
    }
  },
);

const saveAnotherPresetConfirm = async () => {
  if (!tempPresetName.value) {
    notice.warning({
      title: "预设名称不得为空",
      duration: 500,
    });
    return;
  }
  const preset = cloneDeep(options.value);

  if (!isRename.value) preset.id = uuid();
  preset.name = tempPresetName.value;

  // 合作者仅本次投稿有效，不写入配置文件
  if (Array.isArray(preset.config.staffs) && preset.config.staffs.length > 0) {
    delete preset.config.staffs;
  }

  await saveUploadPreset(preset);
  nameModelVisible.value = false;
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
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
  await removeUploadPreset(id);
  presetId.value = "default";
  handlePresetChange("default");
};

const savePreset = async () => {
  if (isEditOnlyMode.value && !options.value.id) {
    notice.error({
      title: "未找到可编辑的上传预设",
      duration: 1000,
    });
    return false;
  }

  const data = options.value;
  if (userInfoStore.userInfo?.uid) {
    data.config.uid = userInfoStore.userInfo.uid;
  }
  const hasStaffs = Array.isArray(data.config.staffs) && data.config.staffs.length > 0;
  // 合作者不保存到预设配置文件中
  const saveData = hasStaffs
    ? { ...data, config: { ...data.config, staffs: undefined } }
    : data;
  await saveUploadPreset(saveData);
  notice.success({
    title: "保存成功",
    content: hasStaffs ? "合作者仅本次投稿有效，不会保存到配置文件中" : undefined,
    duration: hasStaffs ? 3000 : 1000,
  });
  return true;
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
  if (options.value?.config?.closeReply) {
    options.value.config.selectiionReply = 0;
  }
});
watchEffect(() => {
  if (options.value?.config?.selectiionReply) {
    options.value.config.closeReply = 0;
  }
});

// 合集
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
const getSeasonList = async (force?: boolean) => {
  if (!userInfoStore?.userInfo?.uid) {
    seasonList.value = [];
    return;
  }

  // 优先从本地缓存获取
  const rawLocalData = window.localStorage.getItem("seasonListWithUID");
  if (!force && rawLocalData) {
    try {
      const data = JSON.parse(rawLocalData);
      if (userInfoStore?.userInfo?.uid && data?.[userInfoStore.userInfo.uid]) {
        seasonList.value = data[userInfoStore.userInfo.uid];
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const data = await biliApi.getSeasonList(userInfoStore.userInfo.uid);
  seasonList.value = (data.seasons || []).map((item) => {
    return {
      label: item.season.title,
      value: item.season.id,
      sections: item?.sections?.sections || [],
    };
  });

  try {
    if (rawLocalData) {
      const data = JSON.parse(rawLocalData);
      data[userInfoStore.userInfo.uid] = seasonList.value;
      window.localStorage.setItem("seasonListWithUID", JSON.stringify(data));
    } else {
      window.localStorage.setItem(
        "seasonListWithUID",
        JSON.stringify({ [userInfoStore.userInfo.uid]: seasonList.value }),
      );
    }
    if (force) {
      notice.success({
        title: "刷新成功",
        duration: 1000,
      });
    }
  } catch (e) {
    console.error(e);
  }
};

const descMaxLength = ref(2000);

watch(
  () => options.value.config.seasonId,
  () => {
    options.value.config.uid = userInfoStore.userInfo?.uid;
  },
);

watchEffect(() => {
  if (!userInfoStore.userInfo) return;
  getSeasonList();
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

const handleTopicChange = (topicName: string) => {
  options.value.config.topic_name = topicName;
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
};

const titleList = ref(uploadTitleTemplate);
const titleTip = computed(() => {
  const base = `上限80字，多余的会被截断。<br/>
  占位符用于支持webhook中的相关功能，如【{{user}}】{{title}}-{{now}}<br/>
  不要在直播开始后修改字段，本场直播不会生效，更多模板引擎等高级用法见文档<br/>`;
  return titleList.value
    .map((item) => {
      return `${item.label}：${item.value}<br/>`;
    })
    .reduce((prev, cur) => prev + cur, base);
});

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
    label: "弹幕版or纯享版",
    value: "{{hasDanmaStr}}",
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
  const base = `留空则使用当前分P标题。<br/>更多模板引擎等高级用法见文档<br/>`;
  return partTitleList.value
    .map((item) => {
      return `${item.label}：${item.value}<br/>`;
    })
    .reduce((prev, cur) => prev + cur, base);
});

const partTitleInput = templateRef("partTitleInput");
const setPartTitleVar = async (value: string) => {
  if (!options.value.config.partTitleTemplate) {
    options.value.config.partTitleTemplate = "";
  }
  const input = partTitleInput.value?.inputElRef;
  if (input) {
    const currentValue = options.value.config.partTitleTemplate || "";
    const start = input.selectionStart ?? currentValue.length;
    const end = input.selectionEnd ?? currentValue.length;
    options.value.config.partTitleTemplate =
      currentValue.slice(0, start) + value + currentValue.slice(end);
    input.focus();
    await nextTick();
    input.setSelectionRange(start + value.length, start + value.length);
  } else {
    options.value.config.partTitleTemplate = (options.value.config.partTitleTemplate || "") + value;
  }
};
const previewPartTitle = async (template: string) => {
  if (!template) {
    notice.warning({
      title: "请输入分P标题模板",
      duration: 2000,
    });
    return;
  }
  const data = await biliApi.formatWebhookPartTitle(template);
  notice.info({
    title: data,
    duration: 3000,
  });
};

const previewTitle = async (template: string) => {
  const data = await biliApi.formatWebhookTitle(template);
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

const descInput = templateRef("descInput");
const setDescVar = async (value: string) => {
  if (!options.value.config.desc) {
    options.value.config.desc = "";
  }
  const input = descInput.value?.textareaElRef;
  if (input) {
    const currentValue = options.value.config.desc || "";
    const start = input.selectionStart ?? currentValue.length;
    const end = input.selectionEnd ?? currentValue.length;
    options.value.config.desc = currentValue.slice(0, start) + value + currentValue.slice(end);
    input.focus();
    await nextTick();
    input.setSelectionRange(start + value.length, start + value.length);
  } else {
    options.value.config.desc = (options.value.config.desc || "") + value;
  }
};

const previewDesc = async (template: string) => {
  if (!template) {
    notice.warning({
      title: "请输入简介内容",
      duration: 2000,
    });
    return;
  }
  const data = await biliApi.formatWebhookDesc(template);
  notice.info({
    title: data,
    duration: 3000,
  });
};

const descTip = computed(() => {
  const base = `上限2000字，多余的会被截断。<br/>
  可以输入[暮色312]&lt;10995238&gt;来进行艾特用户，前面的值为用户名，后面的值为用户id，请务必保持用户名与uid对应。<br/>
  更多模板引擎等高级用法见文档<br/>`;
  return titleList.value
    .map((item) => {
      return `${item.label}：${item.value}<br/>`;
    })
    .reduce((prev, cur) => prev + cur, base);
});

const setTitle = (name: string) => {
  options.value.config.title = name;
};
const getTitle = () => {
  return options.value?.config?.title;
};

const setConfig = (config: Record<string, unknown>) => {
  options.value.config = { ...options.value.config, ...config } as typeof options.value.config;
};
const getConfig = () => {
  return options.value?.config;
};

defineExpose({
  setTitle,
  getTitle,
  savePreset,
  setConfig,
  getConfig,
});

const humanTypeList = ref([
  {
    id: 1001,
    name: "影视",
  },
  {
    id: 1002,
    name: "娱乐",
  },
  {
    id: 1003,
    name: "音乐",
  },
  {
    id: 1004,
    name: "舞蹈",
  },
  {
    id: 1005,
    name: "动画",
  },
  {
    id: 1006,
    name: "绘画",
  },
  {
    id: 1007,
    name: "鬼畜",
  },
  {
    id: 1008,
    name: "游戏",
  },
  {
    id: 1009,
    name: "资讯",
  },
  {
    id: 1010,
    name: "知识",
  },
  {
    id: 1011,
    name: "人工智能",
  },
  {
    id: 1012,
    name: "科技数码",
  },
  {
    id: 1013,
    name: "汽车",
  },
  {
    id: 1014,
    name: "时尚美妆",
  },
  {
    id: 1015,
    name: "家装房产",
  },
  {
    id: 1016,
    name: "户外潮流",
  },
  {
    id: 1017,
    name: "健身",
  },
  {
    id: 1018,
    name: "体育运动",
  },
  {
    id: 1019,
    name: "手工",
  },
  {
    id: 1020,
    name: "美食",
  },
  {
    id: 1021,
    name: "小剧场",
  },
  {
    id: 1022,
    name: "旅游出行",
  },
  {
    id: 1023,
    name: "三农",
  },
  {
    id: 1024,
    name: "动物",
  },
  {
    id: 1025,
    name: "亲子",
  },
  {
    id: 1026,
    name: "健康",
  },
  {
    id: 1027,
    name: "情感",
  },
  {
    id: 1029,
    name: "vlog",
  },
  {
    id: 1030,
    name: "生活兴趣",
  },
  {
    id: 1031,
    name: "生活经验",
  },
]);

const creationStatementList = ref([
  {
    id: -1,
    name: "内容无需标注",
  },
  {
    id: 1,
    name: "含AI生成内容",
  },
  {
    id: 2,
    name: "含虚构演绎内容",
  },
  {
    id: 3,
    name: "内容含营销信息",
  },
  {
    id: 4,
    name: "个人观点，仅供参考",
  },
]);
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
  flex-wrap: wrap;

  .inline-item {
    display: inline-flex;
    align-items: center;
    flex: none;
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
