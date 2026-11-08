<template>
  <div class="record-calendar">
    <div class="calendar-toolbar">
      <h2>录制日历</h2>
      <n-date-picker
        type="month"
        :value="visibleMonth"
        :clearable="false"
        aria-label="选择月份"
        class="month-picker"
        @update:value="handleMonthSelect"
      />
    </div>

    <n-spin :show="calendarLoading">
      <n-calendar
        :key="visibleMonth"
        :default-value="visibleMonth"
        :is-date-disabled="isDateDisabled"
        @panel-change="handlePanelChange"
        @update:value="handleDateSelect"
      >
        <template #header> </template>
        <template #default="{ year, month, date }">
          <span v-if="getRecordCount(year, month, date)" class="record-count">
            {{ getRecordCount(year, month, date) }} 条录制
          </span>
        </template>
      </n-calendar>
      <p v-if="calendarError" class="calendar-message error-message">{{ calendarError }}</p>
      <p v-else-if="!calendarLoading && !hasRecords" class="calendar-message">本月暂无录制记录</p>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { recoderApi } from "@renderer/apis";

const props = defineProps<{
  recorderId: string;
  refreshKey: number;
}>();

const emit = defineEmits<{
  selectDate: [date: string];
}>();

const currentMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
const visibleMonth = ref(currentMonth());
const recordCounts = ref<Record<string, number>>({});
const calendarLoading = ref(false);
const calendarError = ref("");
let requestId = 0;

const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const hasRecords = computed(() => Object.keys(recordCounts.value).length > 0);
const getRecordCount = (year: number, month: number, date: number) =>
  recordCounts.value[formatLocalDate(new Date(year, month - 1, date))] || 0;
const getRecordCountFromTimestamp = (timestamp: number) =>
  recordCounts.value[formatLocalDate(new Date(timestamp))] || 0;
const isDateDisabled = (timestamp: number) => getRecordCountFromTimestamp(timestamp) === 0;

const handlePanelChange = ({ year, month }: { year: number; month: number }) => {
  visibleMonth.value = new Date(year, month - 1, 1).getTime();
};
const handleMonthSelect = (timestamp: number | null) => {
  if (timestamp === null) return;
  const date = new Date(timestamp);
  visibleMonth.value = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
};
const handleDateSelect = (timestamp: number) => {
  if (getRecordCountFromTimestamp(timestamp) === 0) return;
  emit("selectDate", formatLocalDate(new Date(timestamp)));
};

const loadCalendar = async () => {
  const id = ++requestId;
  recordCounts.value = {};
  calendarError.value = "";
  if (!props.recorderId) return;

  calendarLoading.value = true;
  try {
    const startTime = visibleMonth.value;
    const month = new Date(startTime);
    const endTime = new Date(month.getFullYear(), month.getMonth() + 1, 1).getTime();
    const timestamps = await recoderApi.queryRecordCalendar({
      recorderId: props.recorderId,
      startTime,
      endTime,
    });
    if (id !== requestId) return;
    const counts: Record<string, number> = {};
    for (const timestamp of timestamps) {
      const key = formatLocalDate(new Date(timestamp));
      counts[key] = (counts[key] || 0) + 1;
    }
    recordCounts.value = counts;
  } catch (error: any) {
    if (id !== requestId) return;
    calendarError.value = error?.message || "查询录制日历失败";
  } finally {
    if (id === requestId) calendarLoading.value = false;
  }
};

watch(() => [props.recorderId, props.refreshKey, visibleMonth.value], loadCalendar, {
  immediate: true,
});
onUnmounted(() => {
  requestId++;
});
</script>

<style scoped lang="less">
.record-calendar {
  padding: 8px 2px;
}

.calendar-toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0 0 4px;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: #667085;
    font-size: 13px;
  }

  [data-theme="dark"] & p {
    color: rgba(255, 255, 255, 0.6);
  }
}

.month-picker {
  width: 160px;
}

.record-calendar :deep(.n-calendar) {
  height: 550px;
}

.record-calendar :deep(.n-calendar-header__extra .n-button:nth-child(2)) {
  display: none;
}

.record-calendar :deep(.n-calendar-cell--selected .n-calendar-cell__bar) {
  background-color: transparent;
}

.record-calendar :deep(.n-calendar-cell:not(.n-calendar-cell--disabled)) {
  background: rgba(255, 122, 89, 0.1);

  [data-theme="dark"] & {
    background: rgba(255, 122, 89, 0.16);
  }
}

.record-calendar :deep(.n-calendar-cell:not(.n-calendar-cell--disabled):hover) {
  background: rgba(255, 122, 89, 0.18);
}

.record-count {
  color: #c25031;
  font-size: 12px;
  white-space: nowrap;

  [data-theme="dark"] & {
    color: #ffad94;
  }
}

.calendar-message {
  margin: 16px 0 0;
  color: #667085;
  text-align: center;

  &.error-message {
    color: #d03050;
  }
}

@media (max-width: 640px) {
  .record-calendar :deep(.n-calendar) {
    height: 430px;
  }

  .record-calendar :deep(.n-calendar-cell) {
    padding: 5px;
  }

  .record-count {
    white-space: normal;
    line-height: 1.2;
  }
}
</style>
