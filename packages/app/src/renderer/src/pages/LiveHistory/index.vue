<template>
  <div class="live-history">
    <!-- TODO:增加一个header来展示主播相关数据，支持聚合通过liveId来进行聚合展示 -->
    <!-- 查询表单 -->
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px">
      <n-date-picker
        v-model:value="queryParams.startTime"
        type="date"
        clearable
        :actions="['clear', 'confirm']"
        placeholder="开始时间"
        style="width: 150px"
      />
      <n-date-picker
        v-model:value="queryParams.endTime"
        type="date"
        clearable
        :actions="['clear', 'confirm']"
        placeholder="结束时间"
        style="width: 150px"
      />
      <n-button type="primary" @click="handleQuery"> 查询 </n-button>
      <n-select
        v-model:value="visibleColumns"
        multiple
        :options="columnConfig.map((col) => ({ label: col.label, value: col.value }))"
        style="width: 150px"
        max-tag-count="responsive"
      />
      <n-button @click="goBack">返回</n-button>
    </div>

    <!-- 房间信息 -->
    <n-card v-if="streamerInfo.room_id" class="room-info" size="small">
      <n-space>
        <n-tag>平台：{{ streamerInfo.platform }}</n-tag>
        <n-tag>房间号：{{ streamerInfo.room_id }}</n-tag>
        <n-tag v-if="streamerInfo.name">主播：{{ streamerInfo.name }}</n-tag>
      </n-space>
    </n-card>

    <!-- 结果展示 -->
    <div class="result-container" v-if="recordList.length > 0 || loading">
      <n-spin :show="loading">
        <n-data-table :columns="visibleTableColumns" :data="recordList" :pagination="false" />

        <!-- 分页 -->
        <n-pagination
          style="margin-top: 20px"
          v-if="pagination.total > 0"
          v-model:page="pagination.page"
          :page-size="pagination.pageSize"
          :item-count="pagination.total"
          show-size-picker
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
          :page-sizes="[10, 20, 30, 40]"
        />
      </n-spin>
    </div>

    <n-empty v-else-if="!loading && hasQueried" description="没有查询到相关记录" />

    <PreviewModal
      v-model:visible="previewModalVisible"
      :files="previewFiles"
      :hotProgress="{
        visible: false,
        sampling: 60,
        height: 10,
        color: 'white',
        fillColor: 'white',
      }"
    ></PreviewModal>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { recordHistoryApi, commonApi } from "../../apis";
import { NIcon } from "naive-ui";
import { FolderOpenOutline, DownloadOutline } from "@vicons/ionicons5";
import { Delete20Regular, PlayCircle24Regular } from "@vicons/fluent";
import { FileOpenOutlined } from "@vicons/material";
import { useConfirm } from "@renderer/hooks";
import PreviewModal from "../Home/components/previewModal.vue";

import type { VNode } from "vue";

// 类型定义
interface StreamerInfo {
  platform: string;
  room_id: string;
  name: string;
}

interface QueryParams {
  room_id: string;
  platform: string;
  page: number;
  pageSize: number;
  startTime: number | null;
  endTime: number | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

interface LiveRecord {
  id: number;
  title: string;
  live_start_time: number;
  record_start_time: number;
  record_end_time: number | null;
  video_file?: string;
  streamer_name?: string;
  danma_num?: number;
  interact_num?: number;
  video_duration?: number;
  danma_density?: number | null; // 弹幕密度，弹幕数量/视频时长
  [key: string]: any;
}

interface ColumnConfig {
  value: string;
  label: string;
  defaultVisible: boolean;
}

const route = useRoute();

// 主播信息
const streamerInfo = reactive<StreamerInfo>({
  platform: (route.query.platform as string) || "",
  room_id: (route.query.channelId as string) || "",
  name: (route.query.name as string) || "",
});

// 查询参数
const queryParams = reactive<QueryParams>({
  room_id: streamerInfo.room_id,
  platform: streamerInfo.platform,
  page: 1,
  pageSize: 10,
  startTime: null,
  endTime: null,
});

// 状态变量
const recordList = ref<LiveRecord[]>([]);
const pagination = reactive<Pagination>({
  page: 1,
  pageSize: 10,
  total: 0,
});
const loading = ref<boolean>(false);
const hasQueried = ref<boolean>(false);

// 列配置
const columnConfig: ColumnConfig[] = [
  { value: "title", label: "标题", defaultVisible: true },
  { value: "live_start_time", label: "开播时间", defaultVisible: true },
  { value: "record_start_time", label: "录制开始时间", defaultVisible: true },
  { value: "record_end_time", label: "录制结束时间", defaultVisible: true },
  { value: "duration", label: "持续时长", defaultVisible: true },
  { value: "video_duration", label: "视频时长", defaultVisible: true },
  { value: "danma_num", label: "弹幕数量", defaultVisible: true },
  { value: "interact_num", label: "弹幕互动人数", defaultVisible: true },
  { value: "danma_density", label: "弹幕密度", defaultVisible: true },
  { value: "actions", label: "操作", defaultVisible: true },
];

// 可见列配置
const visibleColumns = ref<string[]>([]);

// 本地存储键名
const STORAGE_KEY = "live-history-visible-columns";

// 初始化列配置
const initColumnConfig = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      visibleColumns.value = JSON.parse(saved);
    } catch (error) {
      console.error("解析保存的列配置失败:", error);
      visibleColumns.value = getDefaultColumns();
    }
  } else {
    visibleColumns.value = getDefaultColumns();
  }
};

// 获取默认显示的列
const getDefaultColumns = (): string[] => {
  return columnConfig.filter((col) => col.defaultVisible).map((col) => col.value);
};

// 保存列配置到本地存储
const saveColumnConfig = (value: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

watch(
  () => visibleColumns.value,
  (newVal) => {
    saveColumnConfig(newVal);
  },
);

// 完整的表格列定义
const allColumns: {
  key: string;
  title: string;
  render?: (row: LiveRecord) => any;
}[] = [
  {
    title: "标题",
    key: "title",
  },
  {
    title: "开播时间",
    key: "live_start_time",
    render: (row: LiveRecord) => formatTime(row.live_start_time),
  },
  {
    title: "录制开始时间",
    key: "record_start_time",
    render: (row: LiveRecord) => formatTime(row.record_start_time),
  },
  {
    title: "录制结束时间",
    key: "record_end_time",
    render: (row: LiveRecord) => (row.record_end_time ? formatTime(row.record_end_time) : "未结束"),
  },
  {
    title: "持续时长",
    key: "duration",
    render: (row: LiveRecord) => formatDuration(row.record_start_time, row.record_end_time),
  },
  {
    title: "视频时长",
    key: "video_duration",
    render: (row: LiveRecord) => _formatDuration(row.video_duration),
  },
  {
    title: "弹幕数量",
    key: "danma_num",
  },
  {
    title: "弹幕互动人数",
    key: "interact_num",
  },
  {
    title: "弹幕密度",
    key: "danma_density",
    render: (row: LiveRecord) =>
      row.danma_density !== null && row.danma_density !== undefined
        ? `${row.danma_density}/秒`
        : "",
  },
  {
    title: "操作",
    key: "actions",
    render: (row: LiveRecord) => {
      const subNodes: VNode[] = [];
      subNodes.push(
        h(
          NIcon,
          {
            size: "20",
            style: {
              cursor: "pointer",
            },
            title: "视频预览",
            onClick: () => previewVideo(row.id),
          },
          { default: () => h(PlayCircle24Regular) },
        ),
      );

      if (!window.isWeb) {
        subNodes.push(
          h(
            NIcon,
            {
              size: "20",
              style: {
                cursor: "pointer",
              },
              title: "打开文件",
              onClick: () => openFile(row.id),
            },
            { default: () => h(FileOpenOutlined) },
          ),
        );
        subNodes.push(
          h(
            NIcon,
            {
              size: "20",
              style: {
                cursor: "pointer",
              },
              title: "打开文件夹",
              onClick: () => openFolder(row.id),
            },
            { default: () => h(FolderOpenOutline) },
          ),
        );
      }
      if (window.isWeb) {
        subNodes.push(
          h(
            NIcon,
            {
              size: "20",
              style: {
                cursor: "pointer",
              },
              title: "下载",
              onClick: () => downloadFile(row.id),
            },
            { default: () => h(DownloadOutline) },
          ),
        );
      }

      return h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
          },
        },
        [
          ...subNodes,
          h(
            NIcon,
            {
              size: "20",
              style: {
                cursor: "pointer",
              },
              title: "删除记录",
              onClick: () => removeRecord(row.id),
            },
            { default: () => h(Delete20Regular) },
          ),
        ],
      );
    },
  },
];

// 根据可见列配置过滤表格列
const visibleTableColumns = computed(() => {
  return allColumns.filter((column) => visibleColumns.value.includes(column.key as string));
});

// 页面初始化
onMounted(() => {
  // 初始化列配置
  initColumnConfig();

  // 如果有查询参数，自动查询
  if (streamerInfo.room_id && streamerInfo.platform) {
    handleQuery();
  }
});

// 查询方法
const handleQuery = async (): Promise<void> => {
  // 确保从路由参数更新最新的查询参数
  queryParams.room_id = streamerInfo.room_id;
  queryParams.platform = streamerInfo.platform;

  if (!queryParams.room_id || !queryParams.platform) {
    console.error("缺少必要的房间号或平台参数");
    return;
  }

  // 将时间戳传递给API
  const apiParams = { ...queryParams };

  loading.value = true;
  hasQueried.value = true;

  try {
    // @ts-ignore
    const result = await recordHistoryApi.queryRecords(apiParams);
    recordList.value = result.data || [];
    pagination.total = result.pagination.total;
    pagination.page = result.pagination.page;
    pagination.pageSize = result.pagination.pageSize;

    // 如果有数据，可以从第一条记录获取主播名称
    if (result.data && result.data.length > 0 && result.data[0].streamer_name) {
      streamerInfo.name = result.data[0].streamer_name;
    }
  } catch (error) {
    console.error("查询直播记录失败", error);
    // 可以添加错误提示
  } finally {
    loading.value = false;
  }
};

// 分页切换
const handlePageChange = (page: number): void => {
  queryParams.page = page;
  handleQuery();
};

const handlePageSizeChange = (pageSize: number): void => {
  queryParams.pageSize = pageSize;
  handleQuery();
};

// 格式化时间
const formatTime = (timestamp: number): string => {
  if (!timestamp) return "--";
  const date = new Date(timestamp);
  return date
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-");
};

// 计算录制时长
const formatDuration = (startTime: number, endTime: number | null): string => {
  if (!startTime || !endTime) return "--";

  const duration = (endTime - startTime) / 1000; // 秒
  return _formatDuration(duration);
};

const _formatDuration = (duration?: number) => {
  if (!duration) return "--";
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

// 打开文件
const openFile = async (id: number) => {
  if (!id) return;
  const filePath = await recordHistoryApi.getVideoFile(id);
  if (!filePath) return;
  window.api.openPath(filePath);
};

// 下载文件
const downloadFile = async (id: number) => {
  const fileUrl = await recordHistoryApi.downloadFile(id);

  const a = document.createElement("a");
  a.href = fileUrl;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const openFolder = async (id: number) => {
  if (!id) return;
  const filePath = await recordHistoryApi.getVideoFile(id);
  if (!filePath) return;
  window.api.common.showItemInFolder(filePath);
};

const confirm = useConfirm();
const notice = useNotification();

const removeRecord = async (id: number) => {
  const [status] = await confirm.warning({
    content: "确定要删除这条直播记录吗？此操作不可撤销。",
  });
  if (!status) return;
  await recordHistoryApi.removeRecord(id);
  notice.success({
    title: `删除成功`,
    duration: 1000,
  });
  // 重新查询数据
  await handleQuery();
};

const router = useRouter();
const goBack = () => {
  router.back();
};

const previewModalVisible = ref(false);
const previewFiles = ref({
  video: "",
  danmu: "",
  type: "",
});
const previewVideo = async (id: number) => {
  const { fileId, type } = await recordHistoryApi.getTempVideoId(id);
  if (type === "ts") {
    notice.warning({
      title: `暂不支持预览ts格式的视频`,
      duration: 2000,
    });
    return;
  }
  const videoUrl = await commonApi.getVideo(fileId);
  previewFiles.value.video = videoUrl;
  previewFiles.value.type = type;
  previewModalVisible.value = true;
};

defineOptions({
  name: "LiveHistory",
});
</script>

<style scoped>
.live-history {
  padding: 20px;
}

.query-form,
.room-info {
  margin-bottom: 20px;
}

.result-container {
  margin-top: 20px;
}
</style>
