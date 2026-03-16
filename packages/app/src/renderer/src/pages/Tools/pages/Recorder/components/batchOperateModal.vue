<template>
  <n-modal v-model:show="showModal" :show-icon="false" :closable="false">
    <n-card
      style="width: 900px; max-height: 700px"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <h3>批量操作</h3>

      <!-- 筛选区 -->
      <div style="display: flex; gap: 10px; margin-bottom: 16px">
        <n-select
          v-model:value="filterPlatform"
          :options="platformOptions"
          placeholder="选择平台"
          clearable
          style="width: 150px"
        />
        <n-select
          v-model:value="filterRecordStatus"
          :options="recordStatusOptions"
          placeholder="录制状态"
          clearable
          style="width: 150px"
        />
        <n-input
          v-model:value="filterKeyword"
          placeholder="搜索备注名或房间号"
          clearable
          style="flex: 1"
        />
      </div>

      <!-- 操作按钮区 -->
      <div style="display: flex; gap: 10px; margin-bottom: 16px; align-items: center">
        <n-button size="small" @click="selectAll">全选</n-button>
        <n-button size="small" @click="invertSelection">反选</n-button>
        <n-text>已选 {{ selectedIds.length }} / {{ filteredRecorders.length }} 个</n-text>
      </div>

      <!-- 列表区 -->
      <n-spin :show="loading">
        <div
          style="max-height: 400px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 4px"
        >
          <div
            v-for="recorder in filteredRecorders"
            :key="recorder.id"
            style="
              padding: 12px;
              border-bottom: 1px solid #f0f0f0;
              display: flex;
              align-items: center;
              gap: 12px;
              cursor: pointer;
            "
            @click="toggleSelection(recorder.id)"
          >
            <n-checkbox
              :checked="selectedIds.includes(recorder.id)"
              @update:checked="(checked) => handleCheckboxChange(recorder.id, checked)"
              @click.stop
            />
            <n-avatar
              :src="recorder.extra?.avatar || recorder.liveInfo?.avatar"
              round
              size="small"
              fallback-src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ccc' d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"
            />
            <div style="flex: 1; min-width: 0">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px">
                <n-text strong>{{
                  recorder.remarks || recorder.liveInfo?.owner || "未命名"
                }}</n-text>
                <n-tag size="small" type="info">
                  {{ getPlatformName(recorder.providerId) }}
                </n-tag>
                <n-tag size="small" :type="recorder.recordHandle ? 'error' : 'default'">
                  {{ recorder.recordHandle ? "录制中" : "未录制" }}
                </n-tag>
              </div>
              <n-text depth="3" style="font-size: 12px">房间号: {{ recorder.channelId }}</n-text>
            </div>
          </div>
          <div
            v-if="!loading && filteredRecorders.length === 0"
            style="padding: 40px; text-align: center"
          >
            <n-text depth="3">暂无符合条件的直播间</n-text>
          </div>
        </div>
      </n-spin>

      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="cancel" style="min-width: 80px">取消</n-button>
          <n-button
            type="primary"
            class="btn"
            style="min-width: 120px"
            @click="handleBatchStart"
            :loading="operating"
            :disabled="selectedIds.length === 0"
          >
            批量开始录制
          </n-button>
          <n-button
            type="error"
            class="btn"
            style="min-width: 120px"
            @click="handleBatchStop"
            :loading="operating"
            :disabled="selectedIds.length === 0"
          >
            批量停止录制
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { recoderApi } from "@renderer/apis";
import { platformOptions } from "../data";
import type { RecorderAPI } from "@biliLive-tools/http/types/recorder.js";

const showModal = defineModel<boolean>("visible", { required: true, default: false });

const emits = defineEmits<{
  (event: "completed"): void;
}>();

const notice = useNotification();

// 直播间列表数据
const recorders = ref<RecorderAPI["getRecorders"]["Resp"]["data"]>([]);
const loading = ref(false);

// 筛选条件
const filterPlatform = ref<string | null>(null);
const filterRecordStatus = ref<string | null>(null);
const filterKeyword = ref("");

// 选中的ID列表
const selectedIds = ref<string[]>([]);

// 操作中状态
const operating = ref(false);

// 录制状态选项
const recordStatusOptions = [
  { label: "录制中", value: "recording" },
  { label: "未录制", value: "unrecorded" },
];

// 获取直播间列表
const fetchRecorders = async () => {
  loading.value = true;
  try {
    const result = await recoderApi.infoList({
      page: 1,
      pageSize: 10000,
    });
    recorders.value = result.data;
  } catch (error: any) {
    notice.error({
      title: "获取直播间列表失败",
      content: error.message || "请求失败",
      duration: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// 筛选后的直播间列表
const filteredRecorders = computed(() => {
  let list = recorders.value;

  // 平台筛选
  if (filterPlatform.value) {
    list = list.filter((r) => r.providerId === filterPlatform.value);
  }

  // 录制状态筛选
  if (filterRecordStatus.value) {
    if (filterRecordStatus.value === "recording") {
      list = list.filter((r) => r.recordHandle != null);
    } else if (filterRecordStatus.value === "unrecorded") {
      list = list.filter((r) => r.recordHandle == null);
    }
  }

  // 关键词搜索
  if (filterKeyword.value) {
    const keyword = filterKeyword.value.toLowerCase();
    list = list.filter(
      (r) =>
        r.remarks?.toLowerCase().includes(keyword) ||
        r.channelId.toLowerCase().includes(keyword) ||
        r.liveInfo?.owner?.toLowerCase().includes(keyword),
    );
  }

  return list;
});

// 全选
const selectAll = () => {
  selectedIds.value = filteredRecorders.value.map((r) => r.id);
};

// 反选
const invertSelection = () => {
  const filteredIds = filteredRecorders.value.map((r) => r.id);
  const newSelection = filteredIds.filter((id) => !selectedIds.value.includes(id));
  const keepSelection = selectedIds.value.filter((id) => !filteredIds.includes(id));
  selectedIds.value = [...keepSelection, ...newSelection];
};

// 切换选中状态
const toggleSelection = (id: string) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

// 处理checkbox变更
const handleCheckboxChange = (id: string, checked: boolean) => {
  if (checked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id);
    }
  } else {
    const index = selectedIds.value.indexOf(id);
    if (index > -1) {
      selectedIds.value.splice(index, 1);
    }
  }
};

// 批量开始录制
const handleBatchStart = async () => {
  if (selectedIds.value.length === 0) return;

  operating.value = true;
  try {
    await recoderApi.batchStartRecord(selectedIds.value);
    notice.success({
      title: "批量开始录制完成",
      duration: 3000,
    });

    // 清空选择并关闭弹窗
    selectedIds.value = [];
    showModal.value = false;
    emits("completed");
  } catch (error: any) {
    notice.error({
      title: "批量开始录制异常",
      content: error.message || "操作失败",
      duration: 3000,
    });
  } finally {
    operating.value = false;
  }
};

// 批量停止录制
const handleBatchStop = async () => {
  if (selectedIds.value.length === 0) return;

  operating.value = true;
  try {
    await recoderApi.batchStopRecord(selectedIds.value);
    notice.success({
      title: "批量停止录制完成",
      duration: 3000,
    });

    // 清空选择并关闭弹窗
    selectedIds.value = [];
    showModal.value = false;
    emits("completed");
  } catch (error: any) {
    notice.error({
      title: "批量停止录制异常",
      content: error.message || "操作失败",
      duration: 3000,
    });
  } finally {
    operating.value = false;
  }
};

// 取消
const cancel = () => {
  showModal.value = false;
};

const platformMap = platformOptions.reduce(
  (map, option) => {
    map[option.value] = option.label;
    return map;
  },
  {} as Record<string, string>,
);

// 获取平台名称
const getPlatformName = (providerId: string) => {
  return platformMap[providerId] || providerId;
};

// 监听弹窗打开，重置状态并获取数据
watch(showModal, (val) => {
  if (val) {
    selectedIds.value = [];
    filterPlatform.value = null;
    filterRecordStatus.value = null;
    filterKeyword.value = "";
    fetchRecorders();
  }
});
</script>

<style scoped lang="less">
.footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.card {
  display: flex;
  flex-direction: column;
}
</style>
