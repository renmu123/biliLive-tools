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
      <tr v-for="item in list" :key="item.channelId">
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
          }"
        >
          {{ item.state === "recording" ? "录制中" : "尚未开始" }}
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
}

const props = withDefaults(defineProps<Props>(), {
  list: () => [],
});

const sortField = ref("");
const sortDirections = reactive({
  living: "desc",
  state: "desc",
  monitorStatus: "desc",
});

const handleSort = (field: string) => {
  if (sortField.value === field) {
    // 如果点击的是当前排序字段，则切换排序方向
    sortDirections[field] = sortDirections[field] === "asc" ? "desc" : "asc";
  } else {
    // 如果点击的是新字段，使用该字段已保存的排序方向
    sortField.value = field;
  }
};

const list = computed(() => {
  if (!sortField.value) return props.list;

  return [...props.list].sort((a, b) => {
    let comparison = 0;
    const currentDirection = sortDirections[sortField.value];

    if (sortField.value === "living") {
      comparison = a.living === b.living ? 0 : a.living ? -1 : 1;
    } else if (sortField.value === "state") {
      comparison = a.state === b.state ? 0 : a.state === "recording" ? -1 : 1;
    } else if (sortField.value === "monitorStatus") {
      // 自动监听优先于手动
      const aIsManual = a.disableAutoCheck;
      const bIsManual = b.disableAutoCheck;

      if (aIsManual === bIsManual) {
        // 如果监听类型相同，比较是否跳过本场直播
        const aIsSkipping = a.tempStopIntervalCheck && !a.disableAutoCheck;
        const bIsSkipping = b.tempStopIntervalCheck && !b.disableAutoCheck;
        comparison = aIsSkipping === bIsSkipping ? 0 : aIsSkipping ? 1 : -1;
      } else {
        comparison = aIsManual ? 1 : -1;
      }
    }

    return currentDirection === "asc" ? -comparison : comparison;
  });
});
</script>

<style scoped lang="less">
.link {
  text-decoration: none;
  color: inherit;
}
.recording {
  color: skyblue;
}
.sort-icon {
  cursor: pointer;

  margin-left: 0px;
  color: #ccc; /* 默认未激活颜色 */
  transition: fill 0.2s;
  vertical-align: middle;

  &.active {
    color: skyblue; /* 激活状态颜色 */
  }
  &.asc {
    transform: rotate(180deg);
  }
}
</style>
