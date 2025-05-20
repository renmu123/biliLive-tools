<template>
  <n-modal v-model:show="roomDetailVisible" :mask-closable="false">
    <n-card :bordered="false" size="small" role="dialog" aria-modal="true" style="width: 800px">
      <n-form label-placement="left" :label-width="130">
        <n-form-item v-if="props.type === 'add'" label="房间号">
          <n-input v-model:value="data.id" placeholder="请输入房间号" />
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex">
              开启
              <Tip tip="直播间是否开启webhook，覆盖黑名单配置"></Tip>
            </span>
          </template>
          <n-switch v-model:value="data.open" />
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex">
              备注
              <Tip tip="仅用于提示"></Tip>
            </span>
          </template>
          <n-input v-model:value="data.remark" placeholder="请输入备注" clearable />
        </n-form-item>
        <CommonSetting
          v-model:data="data"
          v-model:global-fields-obj="globalFieldsObj"
          :biliup-presets-options="props.biliupPresetsOptions"
          :ffmpeg-options="props.ffmpegOptions"
          :global-value="props.globalValue"
          :syncConfigs="props.syncConfigs"
          type="room"
        >
        </CommonSetting>
      </n-form>
      <template #footer>
        <div class="footer">
          <n-button
            v-if="props.type === 'edit'"
            ghost
            quaternary
            type="error"
            class="btn"
            @click="deleteRoom"
          >
            删除
          </n-button>
          <n-button class="btn" @click="roomDetailVisible = false">取消</n-button>
          <n-button v-if="props.type !== 'add'" type="info" class="btn" @click="copyRoom">
            复制
          </n-button>
          <n-button type="primary" class="btn" @click="saveRoomDetail"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
  <n-modal v-model:show="copyVisible" :mask-closable="false">
    <n-card :bordered="false" size="small" role="dialog" aria-modal="true" style="width: 400px">
      <n-form label-placement="left" label-width="auto">
        <n-form-item label="房间号">
          <n-input v-model:value="copyData.id" placeholder="请输入房间号" />
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex">
              备注
              <Tip tip="仅用于提示"></Tip>
            </span>
          </template>
          <n-input v-model:value="copyData.remark" placeholder="请输入备注" clearable />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="copyVisible = false">取消</n-button>
          <n-button type="primary" class="btn" @click="saveCopyRoom"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import CommonSetting from "./CommonWebhookSetting.vue";
import { useConfirm } from "@renderer/hooks";
import { cloneDeep } from "lodash-es";

import type { AppRoomConfig, SyncType } from "@biliLive-tools/types";

type Options = {
  value: string;
  label: string;
}[];

const props = defineProps<{
  type: "edit" | "add";
  biliupPresetsOptions: Options;
  ffmpegOptions: Options;
  globalValue: {
    [key: string]: any;
  };
  syncConfigs: {
    id: string;
    name: string;
    syncSource: SyncType;
  }[];
}>();

const roomDetailVisible = defineModel("visible", {
  type: Boolean,
  default: false,
});
const data = defineModel<AppRoomConfig & { id?: string }>("data", {
  default: () => {},
});
const globalFieldsObj = defineModel<{
  [key: string]: boolean;
}>("globalFieldsObj", {
  type: Object,
  default: () => {},
});
const confirm = useConfirm();

const emits = defineEmits<{
  (event: "save", value: AppRoomConfig & { id?: string }): void;
  (event: "delete", value: string): void;
}>();
const notice = useNotification();

const saveRoomDetail = async () => {
  if (!data.value.id) {
    notice.error({
      title: "请输入房间号",
      duration: 1000,
    });
    return;
  }
  // 如果id不是数字，增加额外确认
  if (props.type === "add" && !/^\d+$/.test(data.value.id)) {
    const [status] = await confirm.warning({
      content: "确认输入的房间号是否正确？非直播间链接，短号等",
    });
    if (!status) return;
  }
  data.value.noGlobal = Object.entries(globalFieldsObj.value)
    .filter(([, value]) => {
      return !value;
    })
    .map(([key]) => key);
  emits("save", data.value);
  roomDetailVisible.value = false;
};

const deleteRoom = async () => {
  const [status] = await confirm.warning({
    content: "是否确认删除？",
  });
  if (!status) return;
  emits("delete", data.value.id!);
  roomDetailVisible.value = false;
};

// @ts-ignore
const copyData = ref<AppRoomConfig & { id?: string }>({});
const copyVisible = ref(false);
const copyRoom = () => {
  const cloneData = cloneDeep(data.value);
  cloneData.id = "";
  cloneData.remark = "";
  copyData.value = cloneData;
  copyVisible.value = true;
};
const saveCopyRoom = async () => {
  if (!copyData.value.id) {
    notice.error({
      title: "请输入房间号",
      duration: 1000,
    });
    return;
  }
  if (!/^\d+$/.test(copyData.value.id)) {
    const [status] = await confirm.warning({
      content: "确认输入的房间号是否正确？非直播间链接，短号等",
    });
    if (!status) return;
  }
  console.log("copyData.value", copyData.value);
  emits("save", copyData.value);
  roomDetailVisible.value = false;
  copyVisible.value = false;
};
</script>

<style scoped>
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
