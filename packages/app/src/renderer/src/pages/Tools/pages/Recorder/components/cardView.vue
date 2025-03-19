<template>
  <div class="recorder-container">
    <div v-for="(item, index) in list" :key="index" class="recorder">
      <div class="cover-container">
        <img v-if="item.cover" class="cover" :src="item.cover" referrerpolicy="no-referrer" />
        <span v-if="item.roomTitle" class="room-title" :title="item.roomTitle">{{
          item.roomTitle
        }}</span>
        <div
          v-if="item.state === 'recording'"
          class="recording-container"
          :title="item?.recordHandle?.url"
        >
          <div class="recording"></div>
          <span class="source">{{ item.usedSource }}</span>
          <span class="line">{{ item.usedStream }}</span>
          <span>{{ formatTime(item?.recordHandle?.progress?.time) }}</span>
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
            <n-icon
              v-if="item.tempStopIntervalCheck && !item.disableAutoCheck"
              size="20"
              title="跳过本场直播"
            >
              <RecordStop16Regular style="color: gray" />
            </n-icon>
          </div>
          <div class="channel-id">
            房间号：<a class="link" target="_blank" :href="item.channelURL">{{ item.channelId }}</a>
          </div>
        </div>
      </div>

      <n-popover placement="right-start" trigger="hover">
        <template #trigger>
          <n-icon size="25" class="pointer menu">
            <EllipsisHorizontalOutline />
          </n-icon>
        </template>
        <slot name="action" :item="item"></slot>
      </n-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EllipsisHorizontalOutline } from "@vicons/ionicons5";
import { Live24Regular, AccessTime24Regular, RecordStop16Regular } from "@vicons/fluent";

interface Props {
  list: any[];
}

const props = withDefaults(defineProps<Props>(), {
  list: () => [],
});

const list = computed(() => props.list);

function formatTime(time?: string) {
  if (!time) return "";
  return time.split(".")[0];
}
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
  // width: 288px;
  flex: 1 0 288px;
  max-width: 400px;

  .cover-container {
    position: relative;
    width: 100%;
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
      font-size: 16px;
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
.link {
  text-decoration: none;
  color: inherit;
}
</style>
