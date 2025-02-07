<template>
  <n-table :bordered="false" :single-line="false">
    <thead>
      <tr>
        <th>房间号</th>
        <th>主播名</th>
        <th>标题</th>
        <th>直播状态</th>
        <th>录制状态</th>
        <th>监听状态</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in list" :key="index">
        <td>
          <a class="link" target="_blank" :href="item.channelURL">{{ item.channelId }}</a>
        </td>
        <td>{{ item.owner }}</td>
        <td>{{ item.roomTitle }}</td>
        <td
          :style="{
            color: item.living ? 'skyblue' : 'normal',
          }"
        >
          {{ item.living ? "直播中" : "未开始" }}
        </td>
        <td
          :title="`${item.usedSource}-${item.usedStream}`"
          :class="{
            recording: item.state === 'recording',
          }"
        >
          {{ item.state === "recording" ? "录制中" : "尚未开始" }}
        </td>
        <td>
          {{
            item.disableAutoCheck
              ? "手动"
              : `自动${item.tempStopIntervalCheck && !item.disableAutoCheck ? "(跳过本场直播)" : ""}`
          }}
        </td>
        <td>
          <n-popover placement="right-start" trigger="hover">
            <template #trigger>
              <span style="cursor: pointer; color: skyblue">编辑</span>
            </template>
            <slot name="action" :item="item"></slot>
          </n-popover>
        </td>
      </tr>
    </tbody>
  </n-table>
</template>

<script setup lang="ts">
interface Props {
  list: any[];
}

const props = withDefaults(defineProps<Props>(), {
  list: () => [],
});

const list = computed(() => props.list);
</script>

<style scoped lang="less">
.link {
  text-decoration: none;
  color: inherit;
}
.recording {
  color: skyblue;
}
</style>
