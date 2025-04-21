<template>
  <div class="live-history">
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
        <n-data-table v-if="!loading" :columns="columns" :data="recordList" :pagination="false" />

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
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { recordHistoryApi } from "../../apis";
import { DataTableColumns, NButton } from "naive-ui";

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
  [key: string]: any;
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

// 表格列定义
const columns: DataTableColumns<LiveRecord> = [
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
    title: "时长",
    key: "duration",
    render: (row: LiveRecord) => formatDuration(row.record_start_time, row.record_end_time),
  },
  {
    title: "操作",
    key: "actions",
    render: (row: LiveRecord) => {
      if (window.isWeb) return null;
      if (!row.video_file) return null;
      return h("div", [
        // h(
        //   NButton,
        //   {
        //     size: "small",
        //     style: "margin-right: 8px",
        //     onClick: () => openFile(row.video_file as string),
        //   },
        //   { default: () => "打开文件" },
        // ),
        h(
          NButton,
          {
            size: "small",
            onClick: () => openFolder(row.video_file as string),
          },
          { default: () => "打开目录" },
        ),
      ]);
    },
  },
];

// 页面初始化时自动查询
onMounted(() => {
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

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

// 打开文件或文件夹
// const openFile = (filePath: string): void => {
//   if (!filePath) return;
//   window.api.openPath(filePath);
// };

const openFolder = (filePath: string): void => {
  if (!filePath) return;
  window.api.common.showItemInFolder(filePath);
};

const router = useRouter();
const goBack = () => {
  router.back();
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
