<template>
  <n-modal v-model:show="roomDetailVisible" :mask-closable="false">
    <n-card :bordered="false" size="small" role="dialog" aria-modal="true" style="width: 800px">
      <n-form label-placement="left" :label-width="120">
        <n-form-item v-if="props.type === 'add'" label="请输入房间号">
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
          :biliup-presets-options="props.biliupPresetsOptions"
          :ffmpeg-options="props.ffmpegOptions"
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
          <n-button type="primary" class="btn" @click="saveRoomDetail"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import CommonSetting from "./CommonWebhookSetting.vue";
import { useConfirm } from "@renderer/hooks";

import type { AppRoomConfig } from "../../../../types";

type Options = {
  value: string;
  label: string;
}[];

const props = defineProps<{
  type: "edit" | "add";
  biliupPresetsOptions: Options;
  ffmpegOptions: Options;
}>();

const roomDetailVisible = defineModel("visible", {
  type: Boolean,
  default: false,
});
const data = defineModel<AppRoomConfig & { id?: string }>("data", {
  default: () => {},
});
const emits = defineEmits<{
  (event: "save", value: AppRoomConfig & { id?: string }): void;
  (event: "delete", value: string): void;
}>();

const saveRoomDetail = () => {
  if (!data.value.id) {
    return;
  }
  emits("save", data.value);
  roomDetailVisible.value = false;
};

const confirm = useConfirm();
const deleteRoom = async () => {
  const status = await confirm.warning({
    content: "是否确认删除？",
  });
  if (!status) return;
  emits("delete", data.value.id!);
  roomDetailVisible.value = false;
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
