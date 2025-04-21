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
        v-model:value="recorderLocalParams.view"
        :options="viewOptions"
        placeholder="视图"
        style="width: 140px"
      />
      <n-button type="primary" @click="add">添加</n-button>
    </div>

    <template v-if="list.length">
      <component :is="viewComponent" :list="list">
        <template #action="{ item }">
          <div style="margin-top: 10px" class="section-container">
            <div class="section" @click="startRecord(item.id)">开始录制</div>
            <div class="section" @click="stopRecord(item.id)">停止录制</div>
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
    </template>

    <h1 v-else>还木有添加直播捏，添加一个看看吧，支持斗鱼、虎牙、B站、抖音</h1>

    <addModal :id="editId" v-model:visible="addModalVisible" @confirm="handleModalClose"></addModal>
    <videoModal :id="editId" v-model:visible="videoModalVisible" :video-url="videoUrl"></videoModal>
  </div>
</template>

<script setup lang="ts">
import { recoderApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";
import addModal from "./components/addModal.vue";
import videoModal from "./components/videoModal.vue";
import cardView from "./components/cardView.vue";
import listView from "./components/listView.vue";
import { useRouter } from "vue-router";

import { useEventListener, useStorage } from "@vueuse/core";
import eventBus from "@renderer/utils/eventBus";

import type { RecorderAPI } from "@biliLive-tools/http/types/recorder.js";

defineOptions({
  name: "recorder",
});

const notice = useNotification();
const router = useRouter();
const params = ref<Parameters<typeof recoderApi.infoList>[0]>({
  platform: undefined,
  recordStatus: undefined,
  name: undefined,
  autoCheck: undefined,
});

const recorderLocalParams = useStorage("recorder", {
  view: "card",
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

watch(params, () => {
  getList();
});

const recorderList = ref<RecorderAPI["getRecorders"]["Resp"]>([]);
const liveInfos = ref<Awaited<ReturnType<typeof recoderApi.getLiveInfo>>>([]);
const list = computed(() => {
  return recorderList.value.map((item) => {
    const liveInfo = liveInfos.value.find((liveInfo) => liveInfo.channelId === item.channelId);
    return {
      ...item,
      cover: liveInfo?.cover,
      owner: liveInfo?.owner,
      avatar: liveInfo?.avatar,
      roomTitle: liveInfo?.title,
      living: item?.liveInfo?.living ?? liveInfo?.living,
    };
  });
});

const getList = async () => {
  recorderList.value = await recoderApi.infoList(params.value);
};

const addModalVisible = ref(false);
const add = async () => {
  editId.value = "";
  addModalVisible.value = true;
};

const confirm = useConfirm();
const remove = async (id: string) => {
  const [status] = await confirm.warning({
    content: "是否确认删除录制？",
  });
  if (!status) return;

  await recoderApi.remove(id);
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

const getLiveInfo = async () => {
  if (recorderList.value.length === 0) return;
  liveInfos.value = await recoderApi.getLiveInfo();
};

// 刷新直播间信息
const refresh = async (id: string) => {
  const data = await recoderApi.getLiveInfo(id);
  liveInfos.value = liveInfos.value.map((item) => {
    if (item.channelId === id) {
      return data[0];
    }
    return item;
  });
};

const handleModalClose = () => {
  // 仅在添加时刷新列表
  if (!editId.value) {
    init();
  }
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
</style>
