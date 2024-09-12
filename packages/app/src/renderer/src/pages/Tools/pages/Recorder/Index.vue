<template>
  <div class="container">
    <p>这并非是经过严格监测的录播工具，请谨慎在生产环境使用</p>

    <div style="margin-bottom: 20px">
      <n-button type="primary" @click="add">添加</n-button>
    </div>

    <div class="recorder-container">
      <div v-for="(item, index) in list" :key="index" class="recorder">
        <div
          class="cover"
          :style="{
            backgroundImage: `url(${item.cover})`,
          }"
        >
          <span v-if="item.roomTitle" class="room-title">{{ item.roomTitle }}</span>
          <div v-if="item.state === 'recording'" class="recording-container">
            <div class="recording"></div>
            <span class="source">{{ item.usedSource }}</span>
            <span class="line">{{ item.usedStream }}</span>
          </div>
        </div>
        <div class="content">
          <img class="avatar" :src="item.avatar" />
          <div style="display: flex; flex-direction: column; justify-content: space-between">
            <div style="display: flex; gap: 5px; align-items: center">
              <div class="owner" :title="item.remarks">{{ item.owner }}</div>
              <n-icon v-if="item.living" size="20" title="直播中">
                <Live24Regular />
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

            <div class="section" style="color: #e88080" @click="remove(item.id)">删除房间</div>
          </div>
        </n-popover>
      </div>
    </div>

    <addModal :id="editId" v-model:visible="addModalVisible" @confirm="init"></addModal>
  </div>
</template>

<script setup lang="ts">
import { recoderApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";
import addModal from "./components/addModal.vue";
import { EllipsisHorizontalOutline } from "@vicons/ionicons5";
import { Live24Regular } from "@vicons/fluent";

import type { ClientRecorder, API } from "@biliLive-tools/http";

const recorderList = ref<ClientRecorder[]>([]);
const liveInfos = ref<API.getLiveInfo.LiveInfo[]>([]);
const list = computed(() => {
  return recorderList.value.map((item) => {
    const liveInfo = liveInfos.value.find((liveInfo) => liveInfo.roomId === item.channelId);
    return {
      ...item,
      cover: liveInfo?.cover,
      owner: liveInfo?.owner,
      avatar: liveInfo?.avatar,
      roomTitle: liveInfo?.roomTitle,
      living: liveInfo?.living,
    };
  });
});

const getList = async () => {
  recorderList.value = await recoderApi.infoList();
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

const getLiveInfo = async () => {
  const ids = recorderList.value.map((item) => item.channelId);
  if (ids.length === 0) return;
  liveInfos.value = await recoderApi.getLiveInfo(ids);
};

const init = async () => {
  await getList();
  await getLiveInfo();
};

init();

setInterval(() => {
  getList();
}, 2000);
</script>

<style scoped lang="less">
.recorder-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.recorder {
  // border: 2px solid #78a379;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  // padding: 10px;
  position: relative;

  .cover {
    position: relative;
    background-size: cover;
    background-position: center;
    width: 100%;
    min-width: 320px;
    height: 180px;
    border-radius: 5px 5px 0px 0px;
    border-color: white;

    .room-title {
      color: white;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 5px;
      border-radius: 5px;
      position: relative;
      top: 5px;
      left: 5px;
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
      width: 60px;
      height: 60px;
      border-radius: 5px;
      // margin-left: 10px;
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
