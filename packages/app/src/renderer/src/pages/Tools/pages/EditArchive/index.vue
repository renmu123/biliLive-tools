<!-- 编辑稿件 -->
<template>
  <div>
    <!-- 顶部操作区 -->
    <div style="display: flex; gap: 10px; margin-bottom: 20px">
      <n-input
        v-model:value="archiveId"
        placeholder="输入BV号或AV号，如 BV1xx / av123 / 123"
        clearable
        style="width: 320px"
        @keyup.enter="loadArchive"
      />
      <n-button type="primary" :loading="loading" @click="loadArchive">加载稿件</n-button>
      <n-button
        type="primary"
        :disabled="!canSubmit"
        :loading="submitLoading"
        @click="submitEdit"
      >
        提交编辑
      </n-button>
    </div>

    <!-- 稿件信息展示 -->
    <n-card v-if="archiveView" title="稿件信息" style="margin-bottom: 20px">
      <div style="display: flex; gap: 20px">
        <img
          v-if="coverUrl"
          :src="coverUrl"
          style="width: 200px; height: 125px; object-fit: cover; border-radius: 4px; flex-shrink: 0"
        />
        <n-descriptions :column="2" label-placement="left" style="flex: 1">
          <n-descriptions-item label="标题">{{ archiveView.title }}</n-descriptions-item>
          <n-descriptions-item label="BV号">{{ archiveView.bvid }}</n-descriptions-item>
          <n-descriptions-item label="AV号">{{ archiveView.aid }}</n-descriptions-item>
          <n-descriptions-item label="分区">{{ tidName }}</n-descriptions-item>
          <n-descriptions-item label="时长">{{ durationText }}</n-descriptions-item>
          <n-descriptions-item label="UP主">{{ archiveView.owner?.name }}</n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="archiveStateType" size="small">{{ archiveStateText }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="标签">{{ archiveTagList.join("、") }}</n-descriptions-item>
          <n-descriptions-item label="简介" :span="2">{{ archiveView.desc }}</n-descriptions-item>
        </n-descriptions>
      </div>
    </n-card>

    <!-- 视频文件选择 -->
    <n-card v-if="archiveView" title="替换视频" style="margin-bottom: 20px">
      <div style="display: flex; align-items: center; gap: 10px">
        <n-button @click="selectFile">选择视频文件</n-button>
        <n-text v-if="filePath" depth="3">{{ filePath }}</n-text>
        <n-text v-else depth="3">请选择用于编辑（替换/覆盖）稿件的视频文件</n-text>
      </div>
    </n-card>

    <!-- 投稿配置 -->
    <n-card v-if="archiveView" title="投稿配置（已自动填充，可修改）">
      <BiliSetting
        ref="biliSettingRef"
        mode="edit-only"
        :show-action-buttons="false"
      ></BiliSetting>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useNotification } from "naive-ui";

import BiliSetting from "@renderer/components/BiliSetting.vue";
import { biliApi } from "@renderer/apis";
import { useUserInfoStore } from "@renderer/stores";
import { deepRaw, supportedVideoExtensions } from "@renderer/utils";

defineOptions({
  name: "EditArchive",
});

const { userInfo } = storeToRefs(useUserInfoStore());
const notice = useNotification();

const archiveId = ref("");
const loading = ref(false);
const submitLoading = ref(false);
const archiveView = ref<any>(null);
const aid = ref<number | null>(null);
const filePath = ref("");
const biliSettingRef = ref<InstanceType<typeof BiliSetting> | null>(null);

const canSubmit = computed(() => !!archiveView.value && !!filePath.value);

// 分区 ID -> 名称 映射（公开接口未返回 tname 时兜底）
const tidNameMap: Record<number, string> = {
  1: "动画",
  2: "番剧",
  3: "国创",
  4: "音乐",
  5: "舞蹈",
  6: "游戏",
  7: "知识",
  8: "科技",
  9: "运动",
  10: "汽车",
  11: "生活",
  12: "美食",
  13: "动物圈",
  14: "鬼畜",
  15: "时尚",
  16: "资讯",
  17: "娱乐",
  18: "影视",
  19: "纪录片",
  20: "电影",
  21: "短片",
  22: "VLOG",
  23: "小视频",
  24: "搞笑",
  25: "日常",
};

// 稿件状态 -> 文本/颜色
const archiveStateMap: Record<
  number,
  { text: string; type: "success" | "warning" | "error" | "default" }
> = {
  0: { text: "正常", type: "success" },
  1: { text: "已删除", type: "error" },
  [-1]: { text: "审核中", type: "warning" },
  [-2]: { text: "审核中", type: "warning" },
  [-3]: { text: "已锁定", type: "error" },
  [-4]: { text: "审核未通过", type: "error" },
  [-5]: { text: "打回", type: "error" },
  [-6]: { text: "退稿", type: "error" },
  [-10]: { text: "审核未通过", type: "error" },
  [-11]: { text: "仅UP主可见", type: "warning" },
  [-13]: { text: "仅自己可见", type: "warning" },
  [-16]: { text: "仅UP主可见", type: "warning" },
  [-20]: { text: "审核中", type: "warning" },
  [-30]: { text: "仅自己可见", type: "warning" },
  [-40]: { text: "仅自己可见", type: "warning" },
};

// 封面 URL（http 转 https）
const coverUrl = computed(() => {
  const pic = archiveView.value?.pic;
  if (!pic) return "";
  return String(pic).replace(/^http:\/\//, "https://");
});

// 分区 ID 转名称
const tidName = computed(() => {
  const view = archiveView.value;
  if (!view) return "-";
  if (view.tname) return view.tname;
  return tidNameMap[view.tid] || String(view.tid);
});

// 时长（秒 -> 时分秒）
const durationText = computed(() => {
  const d = archiveView.value?.duration;
  if (!d) return "-";
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = d % 60;
  return h > 0 ? `${h}小时${m}分${s}秒` : `${m}分${s}秒`;
});

// 稿件状态文本
const archiveStateText = computed(() => {
  const view = archiveView.value;
  if (!view) return "";
  return archiveStateMap[view.state]?.text || `未知(${view.state})`;
});

// 稿件状态颜色
const archiveStateType = computed(() => {
  const view = archiveView.value;
  if (!view) return "default";
  return archiveStateMap[view.state]?.type || "default";
});

// 标签字符串转数组
const archiveTagList = computed<string[]>(() => {
  if (!archiveView.value) return [];
  const tag = archiveView.value.tag;
  if (Array.isArray(tag)) return tag;
  if (typeof tag === "string") return tag.split(",").filter(Boolean);
  return [];
});

/**
 * 加载稿件信息（支持 BV/AV 号）
 */
const loadArchive = async () => {
  const input = archiveId.value.trim();
  if (!input) {
    notice.warning({ title: "请输入BV号或AV号", duration: 1000 });
    return;
  }
  if (!userInfo.value.uid) {
    notice.error({ title: "请先登录", duration: 1000 });
    return;
  }
  loading.value = true;
  try {
    // 兼容 BV 号 / AV 号（av123 或纯数字）
    const res: any = await biliApi.getArchiveDetail(input, userInfo.value.uid);
    const view = res?.View || res?.data?.View || res;
    if (!view?.aid) {
      notice.error({ title: "未找到该稿件，请检查BV/AV号是否正确", duration: 2000 });
      return;
    }
    // 账号校验：稿件所属账号必须与当前登录账号一致
    if (view.owner?.mid && Number(view.owner.mid) !== Number(userInfo.value.uid)) {
      notice.error({
        title: `该稿件不属于当前登录账号（UP主：${view.owner.name}），无法编辑`,
        duration: 3000,
      });
      return;
    }
    archiveView.value = view;
    aid.value = view.aid;
    filePath.value = "";
    await loadArchiveConfig(view.aid);
    notice.success({ title: "加载成功，请确认稿件信息后编辑", duration: 1500 });
  } catch (e) {
    notice.error({ title: String(e), duration: 3000 });
  } finally {
    loading.value = false;
  }
};

/**
 * 加载稿件配置并填充到 BiliSetting
 */
const loadArchiveConfig = async (aidNum: number) => {
  try {
    const res: any = await biliApi.getPlatformArchiveDetail(aidNum, userInfo.value.uid!);
    const archive = res?.data?.archive;
    if (!archive) {
      notice.warning({ title: "未能获取创作中心稿件配置，请手动填写表单", duration: 2000 });
      return;
    }
    const config: Record<string, unknown> = {
      title: archive.title,
      desc: archive.desc,
      tag:
        typeof archive.tag === "string" ? archive.tag.split(",").filter(Boolean) : archive.tag || [],
      tid: archive.tid,
      copyright: archive.copyright,
      cover: archive.cover ? String(archive.cover).replace(/^http:\/\//, "https://") : "",
      source: archive.source,
      dtime: archive.dtime || undefined,
      dynamic: archiveView.value?.dynamic,
      no_reprint: archiveView.value?.rights?.no_reprint ?? 0,
    };
    if (archive.creation_statement?.id != null) {
      config.creationStatement = archive.creation_statement.id;
    }
    biliSettingRef.value?.setConfig(config);
  } catch (e) {
    notice.error({ title: `加载稿件配置失败：${e}`, duration: 3000 });
  }
};

/**
 * 选择视频文件
 */
const selectFile = async () => {
  if (window.isWeb) {
    notice.warning({ title: "网页端暂不支持选择本地视频", duration: 1500 });
    return;
  }
  const files = await window.api.openFile({
    multi: false,
    filters: [
      { name: "视频文件", extensions: supportedVideoExtensions },
      { name: "所有文件", extensions: ["*"] },
    ],
  });
  if (files && files.length > 0) {
    filePath.value = files[0];
  }
};

/**
 * 提交编辑
 */
const submitEdit = async () => {
  if (!userInfo.value.uid) {
    notice.error({ title: "请先登录", duration: 1000 });
    return;
  }
  if (!archiveView.value || !aid.value) {
    notice.error({ title: "请先加载稿件", duration: 1000 });
    return;
  }
  if (!filePath.value) {
    notice.error({ title: "请选择视频文件", duration: 1000 });
    return;
  }
  const config = biliSettingRef.value?.getConfig() as Record<string, unknown> | undefined;
  if (!config?.title) {
    notice.error({ title: "标题不能为空", duration: 1000 });
    return;
  }
  submitLoading.value = true;
  try {
    const uploadConfig = deepRaw(config);
    await biliApi.validUploadParams(uploadConfig);
    await biliApi.upload({
      uid: userInfo.value.uid,
      vid: aid.value,
      videos: [{ path: filePath.value }],
      config: uploadConfig,
      options: { removeOriginAfterUploadCheck: false },
    });
    notice.success({ title: "已提交编辑任务", duration: 2000 });
  } catch (e) {
    notice.error({ title: String(e), duration: 3000 });
  } finally {
    submitLoading.value = false;
  }
};
</script>

<style scoped lang="less"></style>
