<template>
  <div class="container">
    <p>这并非是经过严格监测的录播工具，请谨慎在生产环境使用</p>
    <div style="margin-bottom: 20px">
      <n-button type="primary" @click="add">添加</n-button>
      <n-button type="primary" @click="getList">刷新</n-button>
    </div>

    <div class="recorder-container">
      <div v-for="(item, index) in recorderList" :key="index" class="recorder">
        <div
          class="cover"
          :style="{
            backgroundImage: `url(${item.cover})`,
          }"
        >
          <span v-if="item.roomTitle" class="room-title">{{ item.roomTitle }}</span>
        </div>
        <div class="content">
          <img class="avatar" :src="item.avatar" />
          <div style="display: flex; flex-direction: column; justify-content: space-between">
            <div class="owner" :title="item.remarks">{{ item.owner }}</div>
            <div class="channel-id">房间号：{{ item.channelId }}</div>
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
            <div class="section" @click="edit(item.id)">房间配置</div>

            <a class="section link" target="_blank" :href="item.channelURL">打开直播间页面</a>
            <div class="section" style="color: #e88080" @click="remove(item.id)">删除房间</div>
          </div>
        </n-popover>
      </div>
    </div>

    <addModal :id="editId" v-model:visible="addModalVisible" @confirm="getList"></addModal>
  </div>
</template>

<script setup lang="ts">
import { recoderApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";
import addModal from "./components/addModal.vue";
import { EllipsisHorizontalOutline } from "@vicons/ionicons5";

import type { ClientRecorder, API } from "@biliLive-tools/http";

const recorderList = ref<(ClientRecorder & API.getLiveInfo.LiveInfo)[]>([]);
const liveInfos = ref<API.getLiveInfo.LiveInfo[]>([]);

const getList = async () => {
  // @ts-ignore
  recorderList.value = await recoderApi.infoList();
};

const addModalVisible = ref(false);
const add = async () => {
  editId.value = "";
  addModalVisible.value = true;
  // await recoderApi.add({ name: "test" });
  // getList();
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

const init = async () => {
  await getList();
  liveInfos.value = await recoderApi.getLiveInfo(recorderList.value.map((item) => item.channelId));
  recorderList.value.forEach((item, index) => {
    item.roomTitle = liveInfos.value[index].roomTitle;
    item.avatar = liveInfos.value[index].avatar;
    item.cover = liveInfos.value[index].cover;
  });
};

init();
// getList();

// setInterval(() => {
//   getList();
// }, 1000);
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
    background-size: cover;
    background-position: center;
    width: 320px;
    height: 180px;
    border-radius: 5px 5px 0px 0px;
    border-color: white;
  }
  .room-title {
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 5px;
    border-radius: 5px;
    position: relative;
    top: 5px;
    left: 5px;
  }

  .content {
    display: flex;
    gap: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 5px;
      margin-left: 10px;
    }
    .owner {
      font-size: 20px;
      font-weight: bold;
    }
  }

  .menu {
    position: absolute;
    bottom: 0px;
    right: 5px;
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
    &.link {
      text-decoration: none;
      color: initial;
    }
    &:hover {
      background-color: #eee;
      @media screen and (prefers-color-scheme: dark) {
        background-color: rgba(255, 255, 255, 0.09);
      }
    }
  }
}
</style>
