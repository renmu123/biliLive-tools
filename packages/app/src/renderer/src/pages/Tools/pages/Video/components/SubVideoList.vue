<template>
  <div class="list">
    <div v-for="item in list" :key="item.id" class="card">
      <div class="card-content">
        <div class="name">
          <span>{{ item.name }}</span>
          <n-icon v-if="item.enable" size="20" title="自动监听">
            <AccessTime24Regular style="color: gray" />
          </n-icon>
        </div>
        <div>
          房间号：<a
            class="link"
            target="_blank"
            :href="hanleChannelURL(item.platform, item.roomId)"
            >{{ item.roomId }}</a
          >
        </div>
      </div>
      <div class="card-action">
        <TextButton
          style="display: inline-block"
          type="primary"
          :loading="loadingIds.has(item.id)"
          @click="checkSub(item.id)"
          >运行</TextButton
        >
        <TextButton type="primary" @click="editSub(item)">配置</TextButton>
        <TextButton type="danger" @click="removeSub(item.id)">删除</TextButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { videoApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";
import TextButton from "@renderer/components/textButton.vue";
import { AccessTime24Regular } from "@vicons/fluent";

import type { VideoAPI } from "@biliLive-tools/http/types/video.js";

interface props {
  list: VideoAPI["SubList"]["Resp"];
}
const props = defineProps<props>();
const emits = defineEmits<{
  (event: "remove", value: number): void;
  (event: "edit", item: VideoAPI["SubList"]["Resp"][0]): void;
}>();

const notice = useNotice();
const confirm = useConfirm();
const loadingIds = ref<Set<number>>(new Set());

const removeSub = async (id: number) => {
  const [status] = await confirm.warning({
    content: "是否确认删除",
  });
  if (!status) return;
  await videoApi.removeSub(id);
  notice.success("取消订阅成功");
  emits("remove", id);
};

const editSub = (item: VideoAPI["SubList"]["Resp"][0]) => {
  emits("edit", item);
};

const checkSub = async (id: number) => {
  try {
    loadingIds.value.add(id);
    await videoApi.checkSub(id);
    notice.success("检查完成");
  } catch (error) {
    notice.error("检查失败");
  } finally {
    loadingIds.value.delete(id);
  }
};

const hanleChannelURL = (platform: string, roomId: string) => {
  if (platform === "douyu") {
    return `https://www.douyu.com/${roomId}`;
  } else if (platform === "huya") {
    return `https://www.huya.com/${roomId}`;
  } else {
    return "";
  }
};
</script>

<style scoped lang="less">
.list {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.card {
  min-width: 200px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  overflow: hidden;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    // transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .card-content {
    padding: 12px;

    .name {
      font-size: 18px;
      font-weight: 500;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }

  .card-action {
    border-top: 1px solid #f0f0f0;
    padding: 8px 12px;
    text-align: right;
  }
}
.link {
  text-decoration: none;
  color: inherit;
}

// 添加暗黑模式支持
[data-theme="dark"] & {
  .card {
    background-color: #1e1e1e;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    .card-content {
      .name {
        color: #e0e0e0;
      }
    }

    .card-action {
      border-top: 1px solid #333333;
    }
  }
}
</style>
