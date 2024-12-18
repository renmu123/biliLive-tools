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
        placeholder="自动录制"
        style="width: 140px"
        clearable
      />
      <n-button type="primary" @click="add">添加</n-button>
    </div>

    <div v-if="list.length" class="recorder-container">
      <div v-for="(item, index) in list" :key="index" class="recorder">
        <div class="cover-container">
          <img v-if="item.cover" class="cover" :src="item.cover" referrerpolicy="no-referrer" />
          <span v-if="item.roomTitle" class="room-title" :title="item.roomTitle">{{
            item.roomTitle
          }}</span>
          <div v-if="item.state === 'recording'" class="recording-container">
            <div class="recording"></div>
            <span class="source">{{ item.usedSource }}</span>
            <span class="line">{{ item.usedStream }}</span>
          </div>
        </div>
        <div class="content">
          <img class="avatar" :src="item.avatar" referrerpolicy="no-referrer" />
          <div style="display: flex; flex-direction: column; justify-content: space-between">
            <div style="display: flex; gap: 5px; align-items: center">
              <div class="owner" :title="item.remarks">{{ item.owner }}</div>
              <n-icon v-if="item.living" size="20" title="直播中">
                <Live24Regular style="color: gray" />
              </n-icon>
              <n-icon v-if="!item.disableAutoCheck" size="20" title="自动录制">
                <AccessTime24Regular style="color: gray" />
              </n-icon>
            </div>
            <div class="channel-id">
              房间号：<a class="link" target="_blank" :href="item.channelURL">{{
                item.channelId
              }}</a>
            </div>
          </div>
        </div>

        <n-popover placement="right-start" trigger="hover">
          <template #trigger>
            <n-icon size="25" class="pointer menu">
              <EllipsisHorizontalOutline />
            </n-icon>
          </template>
          <div style="margin-top: 10px" class="section-container">
            <div class="section" @click="startRecord(item.id)">开始录制</div>
            <div class="section" @click="stopRecord(item.id)">停止录制</div>
            <div class="section" @click="edit(item.id)">直播间设置</div>
            <div class="section" @click="getLiveInfo">刷新直播间信息</div>
            <div
              v-if="item.recordHandle?.savePath"
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

            <div class="section" style="color: #e88080" @click="remove(item.id)">删除房间</div>
          </div>
        </n-popover>
      </div>
    </div>
    <h1 v-else>木有主播捏，添加看看吧，支持斗鱼、虎牙平台、B站</h1>

    <addModal :id="editId" v-model:visible="addModalVisible" @confirm="init"></addModal>
    <videoModal :id="editId" v-model:visible="videoModalVisible" :video-url="videoUrl"></videoModal>
  </div>
</template>

<script setup lang="ts">
import { recoderApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";
import addModal from "./components/addModal.vue";
import videoModal from "./components/videoModal.vue";
import { EllipsisHorizontalOutline } from "@vicons/ionicons5";
import { Live24Regular, AccessTime24Regular } from "@vicons/fluent";
import { useEventListener } from "@vueuse/core";

import type { ClientRecorder } from "@biliLive-tools/http/types/recorder.js";

const notice = useNotification();
const params = ref<Parameters<typeof recoderApi.infoList>[0]>({
  platform: undefined,
  recordStatus: undefined,
  name: undefined,
  autoCheck: undefined,
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
    label: "HuYa",
    value: "虎牙",
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
    label: "自动录制",
    value: "1",
  },
  {
    label: "手动录制",
    value: "2",
  },
]);

watch(params, () => {
  getList();
});

const recorderList = ref<ClientRecorder[]>([]);
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
      duration: 2000,
    });
    return;
  }
  videoModalVisible.value = true;
};

const getLiveInfo = async () => {
  if (recorderList.value.length === 0) return;
  liveInfos.value = await recoderApi.getLiveInfo();
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
</script>

<style scoped lang="less">
.recorder-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.recorder {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  position: relative;

  .cover-container {
    position: relative;
    width: 288px;
    height: 162px;
    border-radius: 5px 5px 0px 0px;
    border-color: white;

    .cover {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      object-fit: cover;
    }

    .room-title {
      display: inline-block;
      color: white;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 0 5px;
      border-radius: 5px;
      position: relative;
      top: 5px;
      left: 5px;
      // 超过忽略
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 95%;
    }
    .recording-container {
      display: flex;
      gap: 10px;
      align-items: center;
      box-sizing: border-box;
      color: white;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 2px 5px;
      position: absolute;
      width: 100%;

      bottom: 0px;
      left: 0px;
      .recording {
        display: inline-block;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background-color: red;
        vertical-align: middle;
      }
    }
  }

  .content {
    display: flex;
    gap: 10px;
    margin: 10px;
    .avatar {
      width: 50px;
      height: 50px;
      border-radius: 5px;
      margin-left: -10px;
    }
    .owner {
      font-size: 20px;
      font-weight: bold;
    }
  }

  .menu {
    position: absolute;
    bottom: 5px;
    right: 10px;
    color: rgb(51, 54, 57);

    @media screen and (prefers-color-scheme: dark) {
      color: white;
    }
  }
}

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

.link {
  text-decoration: none;
  color: inherit;
}

@keyframes livingSprite {
  0% {
    background-position: 0 0;
  }

  3.333% {
    background-position: -108px 0;
  }

  6.667% {
    background-position: -216px 0;
  }

  10% {
    background-position: -324px 0;
  }

  13.333% {
    background-position: -432px 0;
  }

  16.667% {
    background-position: -540px 0;
  }

  20% {
    background-position: -648px 0;
  }

  23.333% {
    background-position: -756px 0;
  }

  26.667% {
    background-position: -864px 0;
  }

  30% {
    background-position: -972px 0;
  }

  33.333% {
    background-position: -1080px 0;
  }

  36.667% {
    background-position: -1188px 0;
  }

  40% {
    background-position: -1296px 0;
  }

  43.333% {
    background-position: -1404px 0;
  }

  46.667% {
    background-position: -1512px 0;
  }

  50% {
    background-position: -1620px 0;
  }

  53.333% {
    background-position: -1728px 0;
  }

  56.667% {
    background-position: -1836px 0;
  }

  60% {
    background-position: -1944px 0;
  }

  63.333% {
    background-position: -2052px 0;
  }

  66.667% {
    background-position: -2160px 0;
  }

  70% {
    background-position: -2268px 0;
  }

  73.333% {
    background-position: -2376px 0;
  }

  76.667% {
    background-position: -2484px 0;
  }

  80% {
    background-position: -2592px 0;
  }

  83.333% {
    background-position: -2700px 0;
  }

  86.667% {
    background-position: -2808px 0;
  }

  90% {
    background-position: -2916px 0;
  }

  93.333% {
    background-position: -3024px 0;
  }

  96.667% {
    background-position: -3132px 0;
  }

  to {
    background-position: -3240px 0;
  }
}
</style>
