<template>
  <div class="container">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px">
      <n-input
        v-model:value="params.name"
        placeholder="备注或房间号"
        style="width: 140px"
        clearable
      />
      <n-select
        v-model:value="params.platform"
        :options="platformOptions"
        placeholder="平台"
        style="width: 140px"
        clearable
      />
      <n-select
        v-model:value="params.recordStatus"
        :options="statusOptions"
        placeholder="录制状态"
        style="width: 140px"
        clearable
      />
      <n-select
        v-model:value="params.autoCheck"
        :options="recordOptions"
        placeholder="监听状态"
        style="width: 140px"
        clearable
      />
      <n-select
        v-model:value="recorderLocalParams.pageSize"
        :options="pageSizeOptions"
        placeholder="每页显示"
        style="width: 110px"
      />
      <n-select
        v-model:value="recorderLocalParams.view"
        :options="viewOptions"
        placeholder="视图"
        style="width: 110px"
      />
      <SortButton
        :field="sortField"
        :direction="recorderLocalParams.sortDirection"
        :options="[
          { label: '默认状态', key: undefined },
          { label: '直播状态', key: 'living' },
          { label: '录制状态', key: 'state' },
          { label: '监听状态', key: 'monitorStatus' },
          { label: '录制时间', key: 'recordTime' },
        ]"
        @update:field="handleSortFieldChange"
        @update:direction="handleSortDirectionChange"
      />
      <ColumnSelector v-model="visibleColumns" :columns="columnConfig" />
      <n-button type="warning" @click="getLiveInfo(true)">刷新</n-button>
      <ButtonGroup :options="actionBtns" @click="handleActionClick">添加</ButtonGroup>
    </div>

    <template v-if="list.length > 0">
      <component
        :is="viewComponent"
        :list="list"
        :sort-field="sortField"
        :sort-directions="sortDirections"
        :visible-columns="visibleColumns"
        @sort="handleSort"
      >
        <template #action="{ item }">
          <div style="margin-top: 10px" class="section-container">
            <div class="section" @click="startRecord(item.id)">开始录制</div>
            <div class="section" @click="stopRecord(item.id)">停止录制</div>
            <div
              class="section"
              @click="cut(item.id)"
              v-if="item?.recordHandle?.recorderType === 'bililive'"
            >
              切割
            </div>
            <div class="section" @click="edit(item.id)">直播间设置</div>
            <div class="section" @click="refresh(item.id)">刷新直播间信息</div>
            <div
              v-if="item.recordHandle?.savePath && false"
              class="section"
              @click="open(item.id, item?.recordHandle?.url)"
            >
              打开直播
            </div>
            <div
              v-if="!isWeb && item.recordHandle?.savePath"
              class="section"
              @click="openSavePath(item.recordHandle?.savePath)"
            >
              打开录制文件夹
            </div>

            <div class="section" @click="toWebhook(item.channelId)">Webhook配置</div>
            <div class="section" @click="viewHistory(item)">录制历史</div>
            <div class="section" style="color: #e88080" @click="remove(item.id)">删除房间</div>
          </div>
        </template>
      </component>
      <div
        style="margin-top: 20px; display: flex; justify-content: flex-end"
        v-if="pagination.pageCount > 1"
      >
        <n-pagination
          v-model:page="params.page"
          v-model:page-size="recorderLocalParams.pageSize"
          :item-count="pagination.itemCount"
          show-size-picker
          :page-sizes="[10, 20, 30, 40, 50, 100]"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </template>

    <h1 v-else>还木有添加直播捏，添加一个看看吧，支持斗鱼、虎牙、B站、抖音</h1>

    <addModal :id="editId" v-model:visible="addModalVisible" @confirm="handleModalClose"></addModal>
    <batchAddModal
      v-model:visible="batchAddModalVisible"
      @parsed="handleBatchParsed"
    ></batchAddModal>
    <batchResultModal
      v-model:visible="batchResultModalVisible"
      :results="batchParseResults"
      @completed="handleBatchCompleted"
    ></batchResultModal>
    <videoModal :id="editId" v-model:visible="videoModalVisible" :video-url="videoUrl"></videoModal>
  </div>
</template>

<script setup lang="ts">
import { recoderApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";
import { useVisibleColumns } from "@renderer/hooks/useVisibleColumns";
import addModal from "./components/addModal.vue";
import batchAddModal from "./components/batchAddModal.vue";
import batchResultModal from "./components/batchResultModal.vue";
import videoModal from "./components/videoModal.vue";
import cardView from "./components/cardView.vue";
import listView from "./components/listView.vue";
import { useRouter } from "vue-router";
import ButtonGroup from "@renderer/components/ButtonGroup.vue";
import ColumnSelector from "@renderer/components/ColumnSelector.vue";

import { useEventListener, useStorage } from "@vueuse/core";
import eventBus from "@renderer/utils/eventBus";

import type { RecorderAPI } from "@biliLive-tools/http/types/recorder.js";
import SortButton from "./components/SortButton.vue";

defineOptions({
  name: "recorder",
});

type SortField = "living" | "state" | "monitorStatus";

// 列配置
const columnConfig = [
  { value: "channelId", label: "房间号" },
  { value: "owner", label: "主播名" },
  { value: "remark", label: "备注" },
  { value: "roomTitle", label: "标题" },
  { value: "living", label: "直播状态" },
  { value: "state", label: "录制状态" },
  { value: "recordParams", label: "录制参数" },
  { value: "lastRecordTime", label: "最近录制时间" },
  { value: "monitorStatus", label: "监听状态" },
  { value: "actions", label: "操作" },
];

// 使用可见列 hook
const { visibleColumns } = useVisibleColumns({
  columns: columnConfig,
  storageKey: "recorder-list-visible-columns",
});

const notice = useNotice();
const router = useRouter();
const recorderLocalParams = useStorage(
  "recorder",
  {
    view: "card",
    pageSize: 20,
    sortField: "" as SortField,
    sortDirection: "desc" as "asc" | "desc",
  },
  localStorage,
  { mergeDefaults: true },
);

const params = ref<Parameters<typeof recoderApi.infoList>[0]>({
  platform: undefined,
  recordStatus: undefined,
  name: undefined,
  autoCheck: undefined,
  page: 1,
});

const platformOptions = ref([
  {
    label: "斗鱼",
    value: "DouYu",
  },
  {
    label: "B站",
    value: "Bilibili",
  },
  {
    label: "虎牙",
    value: "HuYa",
  },
  {
    label: "抖音",
    value: "DouYin",
  },
]);
const statusOptions = ref([
  {
    label: "录制中",
    value: "recording",
  },
  {
    label: "未录制",
    value: "unrecorded",
  },
]);
const recordOptions = ref([
  {
    label: "自动",
    value: "1",
  },
  {
    label: "手动",
    value: "2",
  },
]);
const viewOptions = ref([
  {
    label: "卡片",
    value: "card",
  },
  {
    label: "列表",
    value: "list",
  },
]);
const viewComponent = computed(() => {
  switch (recorderLocalParams.value.view) {
    case "card":
      return cardView;
    case "list":
      return listView;
    default:
      return cardView;
  }
});

const sortField = ref<SortField>(recorderLocalParams.value.sortField);
const sortDirections = reactive({
  living:
    recorderLocalParams.value.sortField === "living"
      ? recorderLocalParams.value.sortDirection
      : "desc",
  state:
    recorderLocalParams.value.sortField === "state"
      ? recorderLocalParams.value.sortDirection
      : "desc",
  monitorStatus:
    recorderLocalParams.value.sortField === "monitorStatus"
      ? recorderLocalParams.value.sortDirection
      : "desc",
});

const handleSort = (field: SortField) => {
  if (sortField.value === field) {
    // 如果点击的是当前排序字段，则切换排序方向
    const newDirection = sortDirections[field] === "asc" ? "desc" : "asc";
    sortDirections[field] = newDirection;
    // 保存当前排序方向
    recorderLocalParams.value.sortDirection = newDirection;
  } else {
    // 如果点击的是新字段，使用该字段已保存的排序方向
    sortField.value = field;
    // 保存当前排序字段
    recorderLocalParams.value.sortField = field;
  }
  // 重新获取数据
  getList();
};

const recorderList = ref<RecorderAPI["getRecorders"]["Resp"]["data"]>([]);
const liveInfos = ref<Awaited<ReturnType<typeof recoderApi.getLiveInfo>>>([]);
const pagination = ref({
  pageCount: 0,
  itemCount: 0,
});

const list = computed(() => {
  // 后端已经处理了排序，前端只需要合并直播信息
  const mappedList = recorderList.value.map((item) => {
    const liveInfo = liveInfos.value.find((liveInfo) => liveInfo.channelId === item.channelId);
    return {
      ...item,
      cover: item?.liveInfo?.cover || liveInfo?.cover,
      owner: item?.liveInfo?.owner || liveInfo?.owner,
      avatar: item?.liveInfo?.avatar || liveInfo?.avatar || item?.extra?.avatar,
      roomTitle: item?.liveInfo?.title || liveInfo?.title,
      living: item?.liveInfo?.living ?? liveInfo?.living,
    };
  });

  if (!sortField.value) return mappedList;

  return [...mappedList].sort((a, b) => {
    let comparison = 0;
    const currentDirection = sortDirections[sortField.value];

    if (sortField.value === "living") {
      comparison = a.living === b.living ? 0 : a.living ? -1 : 1;
    }

    return currentDirection === "asc" ? -comparison : comparison;
  });
});

const getList = async () => {
  const result = await recoderApi.infoList({
    ...params.value,
    pageSize: recorderLocalParams.value.pageSize,
    sortField: sortField.value || undefined,
    sortDirection: recorderLocalParams.value.sortDirection,
  });
  recorderList.value = result.data;
  pagination.value = {
    pageCount: Math.ceil(result.pagination.total / result.pagination.pageSize),
    itemCount: result.pagination.total,
  };
  if (
    params.value.page &&
    pagination.value.pageCount &&
    params.value.page > pagination.value.pageCount
  ) {
    params.value.page = pagination.value.pageCount;
  }
};

const addModalVisible = ref(false);
const batchAddModalVisible = ref(false);
const batchResultModalVisible = ref(false);
const batchParseResults = ref<any[]>([]);

const add = async () => {
  editId.value = "";
  addModalVisible.value = true;
};

const batchAdd = async () => {
  batchAddModalVisible.value = true;
};

const confirm = useConfirm();
const remove = async (id: string) => {
  const [status, removeHistory] = await confirm.warning({
    content: "是否确认删除录制？",
    showCheckbox: true,
    checkboxText: "删除录制历史",
  });
  if (!status) return;

  await recoderApi.remove(id, removeHistory);
  getList();
};

const startRecord = async (id: string) => {
  await recoderApi.startRecord(id);
  getList();
};

const stopRecord = async (id: string) => {
  await recoderApi.stopRecord(id);
  getList();
};

const cut = async (id: string) => {
  await recoderApi.cut(id);
};

const editId = ref("");
const edit = async (id: string) => {
  editId.value = id;
  addModalVisible.value = true;
};

const videoModalVisible = ref(false);
const videoUrl = ref("");
/**
 * 打开直播间
 * @param id 内部直播间id
 */
const open = async (id: string, streamUrl: string) => {
  editId.value = id;
  videoUrl.value = streamUrl;
  if (!streamUrl) {
    notice.error({
      title: "未找到直播流地址",
    });
    return;
  }
  videoModalVisible.value = true;
};

const getLiveInfo = async (forceRequest: boolean = false) => {
  if (recorderList.value.length === 0) return;
  const ids = recorderList.value.map((item) => item.id);
  liveInfos.value = await recoderApi.getLiveInfo(ids, forceRequest);
};

// 刷新单个直播间信息
const refresh = async (id: string) => {
  const data = await recoderApi.getLiveInfo([id], true);
  liveInfos.value = liveInfos.value.map((item) => {
    if (item.channelId === id) {
      return data[0];
    }
    return item;
  });
  notice.success({
    title: "刷新成功",
  });
};

const handleModalClose = () => {
  // 仅在添加时刷新列表
  if (!editId.value) {
    init();
  }
};

const handleBatchParsed = (results: any[]) => {
  batchParseResults.value = results;
  batchResultModalVisible.value = true;
};

const handleBatchCompleted = () => {
  // 刷新列表
  init();
};

const init = async () => {
  await getList();
  await getLiveInfo();
};

init();

let intervalId: NodeJS.Timeout | null = null;

function createInterval() {
  if (intervalId) return;
  const interval = window.isWeb ? 2000 : 1000;
  intervalId = setInterval(() => {
    getList();
  }, interval);
}

function cleanInterval() {
  intervalId && clearInterval(intervalId);
  intervalId = null;
}

// 十分钟更新一次直播间信息
setInterval(
  () => {
    getLiveInfo();
  },
  10 * 60 * 1000,
);

onDeactivated(() => {
  cleanInterval();
});

onActivated(() => {
  createInterval();
});

// 在模块失活时清除定时器
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanInterval();
  });
}

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    cleanInterval();
  } else {
    createInterval();
  }
}

useEventListener(document, "visibilitychange", () => {
  handleVisibilityChange();
});

const isWeb = ref(window.isWeb);

/**
 * 打开录制文件夹
 * @param path
 */
const openSavePath = (path: string) => {
  window.api.openPath(window.path.dirname(path));
};

const toWebhook = (channelId: string) => {
  eventBus.emit("open-setting-dialog", {
    tab: "webhook",
    extra: {
      roomId: channelId,
    },
  });
};

/**
 * 查看直播记录
 * @param item 主播信息
 */
const viewHistory = (item: any) => {
  router.push({
    path: "/liveHistory",
    query: {
      id: item.id,
      channelId: item.channelId,
      platform: item.providerId,
      name: item.owner,
    },
  });
};

const handlePageChange = (page: number) => {
  params.value.page = page;
  getList();
};

const handlePageSizeChange = (pageSize: number) => {
  recorderLocalParams.value.pageSize = pageSize;
  params.value.page = 1;
  getList();
};
const pageSizeOptions = ref([
  {
    label: "10条/页",
    value: 10,
  },
  {
    label: "20条/页",
    value: 20,
  },
  {
    label: "30条/页",
    value: 30,
  },
  {
    label: "40条/页",
    value: 40,
  },
  {
    label: "50条/页",
    value: 50,
  },
  {
    label: "100条/页",
    value: 100,
  },
]);

const handleSortFieldChange = (field: string) => {
  sortField.value = field as SortField;
  recorderLocalParams.value.sortField = field as SortField;
  getList();
};

const handleSortDirectionChange = (direction: "asc" | "desc") => {
  recorderLocalParams.value.sortDirection = direction;
  if (sortField.value === "living") {
    sortDirections.living = direction;
  } else if (sortField.value === "state") {
    sortDirections.state = direction;
  } else if (sortField.value === "monitorStatus") {
    sortDirections.monitorStatus = direction;
  }
  getList();
};

const actionBtns = ref([{ label: "批量添加", key: "batchAdd" }]);
const handleActionClick = (key?: string | number) => {
  switch (key) {
    case "batchAdd":
      batchAdd();
      break;
    case undefined:
      add();
      break;
  }
};
</script>

<style scoped lang="less">
.section-container {
  display: flex;
  gap: 2px;
  flex-direction: column;
  .section {
    padding: 5px 10px;
    cursor: pointer;
    display: inline-block;
    &:hover {
      background-color: #eee;
      @media screen and (prefers-color-scheme: dark) {
        background-color: rgba(255, 255, 255, 0.09);
      }
    }
  }
}
.sort-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
