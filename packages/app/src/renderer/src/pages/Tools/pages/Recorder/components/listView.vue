<template>
  <n-table :bordered="false" :single-line="false">
    <thead>
      <tr>
        <th>房间号</th>
        <th>主播名</th>
        <th>标题</th>
        <th @click="handleSort('living')" class="sortable-header">
          直播状态
          <n-icon
            size="14"
            class="sort-icon"
            :class="{
              active: sortField === 'living',
              asc: sortDirections.living === 'asc',
            }"
          >
            <ArrowUpOutline></ArrowUpOutline>
          </n-icon>
        </th>
        <th @click="handleSort('state')" class="sortable-header">
          录制状态
          <n-icon
            size="14"
            class="sort-icon"
            :class="{
              active: sortField === 'state',
              asc: sortDirections.state === 'asc',
            }"
          >
            <ArrowUpOutline></ArrowUpOutline>
          </n-icon>
        </th>
        <td>录制参数</td>
        <th @click="handleSort('monitorStatus')" class="sortable-header">
          监听状态
          <n-icon
            size="14"
            class="sort-icon"
            :class="{
              active: sortField === 'monitorStatus',
              asc: sortDirections.monitorStatus === 'asc',
            }"
          >
            <ArrowUpOutline></ArrowUpOutline>
          </n-icon>
        </th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in props.list" :key="item.channelId">
        <td>
          <a class="link" target="_blank" :href="item.channelURL">{{ item.channelId }}</a>
        </td>
        <td>{{ item.owner || item.remarks }}</td>
        <td>{{ item.roomTitle }}</td>
        <td
          :style="{
            color: item.living ? 'skyblue' : 'normal',
          }"
        >
          {{ item.living ? "直播中" : "未开始" }}
        </td>
        <td
          :class="{
            recording: item.state === 'recording',
            error: item.state === 'check-error',
            'title-blocked': item.state === 'title-blocked',
          }"
        >
          {{ stateMap[item.state] }}
        </td>
        <td :title="item?.recordHandle?.url">
          {{ item.state === "recording" ? `${item.usedSource}/${item.usedStream}` : "" }}
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
import { ArrowUpOutline } from "@vicons/ionicons5";

interface Props {
  list: any[];
  sortField: string;
  sortDirections: {
    living: string;
    state: string;
    monitorStatus: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  list: () => [],
  sortField: "",
  sortDirections: () => ({
    living: "desc",
    state: "desc",
    monitorStatus: "desc",
  }),
});

const emit = defineEmits<{
  (e: "sort", field: string): void;
}>();

const handleSort = (field: string) => {
  emit("sort", field);
};

const stateMap = {
  idle: "空闲",
  recording: "录制中",
  "check-error": "检查错误",
  "stopping-record": "停止中",
  "title-blocked": "标题屏蔽",
};
</script>

<style scoped lang="less">
.link {
  text-decoration: none;
  color: inherit;
}
.recording {
  color: skyblue;
}
.error,
.title-blocked {
  color: #ff4d4f;
}
.sort-icon {
  cursor: pointer;

  margin-left: 0px;
  color: #ccc; /* 默认未激活颜色 */
  transition: fill 0.2s;
  vertical-align: middle;
  transition: all 0.2s;

  &.active {
    color: #36ad6a; /* 激活状态颜色 */
  }
  &.asc {
    transform: rotate(180deg);
  }
}
</style>
