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
            <div class="owner" :title="item.remarks">{{ item.owner || item.remarks }}</div>
            <n-icon v-if="item.living" size="20" title="直播中">
              <Live24Regular style="color: gray" />
            </n-icon>
            <n-icon v-if="!item.disableAutoCheck" size="20" title="自动录制">
              <AccessTime24Regular style="color: gray" />
            </n-icon>
            <n-icon v-if="item.onlyAudio" size="20" title="仅录制音频">
              <AudiotrackRound style="color: gray" />
            </n-icon>
            <n-icon
              v-if="item.tempStopIntervalCheck && !item.disableAutoCheck"
              size="20"
              title="跳过本场直播"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="color: gray">
                <g fill="none">
                  <!-- 保持原有外圈 -->
                  <path
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10s10-4.477 10-10zM3.5 12a8.5 8.5 0 1 1 17 0a8.5 8.5 0 0 1-17 0z"
                    fill="currentColor"
                  />

                  <!-- 新增暂停符号 -->
                  <rect x="9" y="8" width="2" height="8" rx="1" fill="currentColor" />
                  <rect x="13" y="8" width="2" height="8" rx="1" fill="currentColor" />
                </g>
              </svg>
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
import { Live24Regular, AccessTime24Regular } from "@vicons/fluent";
import { AudiotrackRound } from "@vicons/material";

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
      background-color: rgba(0, 0, 0, 0.7);
      padding: 4px 8px;
      position: absolute;
      width: 100%;
      bottom: 0px;
      left: 0px;

      .recording {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #ff4d4f;
        vertical-align: middle;
        animation: pulse 1.5s ease-in-out infinite;
      }

      .source {
        font-weight: 500;
      }

      .line {
        color: rgba(255, 255, 255, 0.85);
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

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(255, 77, 79, 0);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
  }
}
</style>
