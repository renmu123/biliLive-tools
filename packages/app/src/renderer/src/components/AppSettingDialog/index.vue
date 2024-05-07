<template>
  <n-modal v-model:show="showModal" :mask-closable="false" auto-focus :on-after-enter="handleOpen">
    <n-card
      style="width: calc(100% - 60px)"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <n-tabs type="segment">
        <n-tab-pane name="common" tab="普通设置">
          <n-form ref="formRef" label-placement="left" :label-width="160">
            <n-form-item>
              <template #label>
                <span class="inline-flex">
                  删除至回收站
                  <Tip
                    tip="关闭后若使用“删除源文件”等选项，文件将被直接删除，不会进入回收站，如果使用的文件为smb等远程协议挂载，可能会删除失败"
                  ></Tip>
                </span>
              </template>
              <n-switch v-model:value="config.trash" />
            </n-form-item>
            <n-form-item>
              <template #label>
                <span class="inline-flex"> 自动检查更新 </span>
              </template>
              <n-switch v-model:value="config.autoUpdate" />
            </n-form-item>
            <n-form-item>
              <template #label>
                <span class="inline-flex"> 开启自启动 </span>
              </template>
              <n-switch v-model:value="config.autoLaunch" />
            </n-form-item>
            <n-form-item>
              <template #label>
                <span class="inline-flex"> 最小化到任务栏 </span>
              </template>
              <n-switch v-model:value="config.minimizeToTray" />
            </n-form-item>
            <n-form-item>
              <template #label>
                <span class="inline-flex"> 关闭到任务栏 </span>
              </template>
              <n-switch v-model:value="config.closeToTray" />
            </n-form-item>
            <n-form-item label="log等级"
              ><n-select v-model:value="config.logLevel" :options="logLevelOptions" />
            </n-form-item>
            <n-form-item>
              <template #label>
                <span class="inline-flex">
                  port
                  <Tip
                    :tip="`你可以在浏览器访问 http://127.0.0.1:${config.port} 查询是否启动成功<br/>录播姬的webhook地址设置为：http://127.0.0.1:${config.port}/webhook/bililiverecorder<br/>blrec的webhook地址设置为：http://127.0.0.1:${config.port}/webhook/blrec<br/>修改后需重启生效`"
                  ></Tip>
                </span>
              </template>
              <n-input-number v-model:value="config.port" min="1" max="65535"> </n-input-number>
            </n-form-item>
            <n-form-item>
              <template #label>
                <span class="inline-flex">
                  host
                  <Tip :tip="`修改后需重启生效`"></Tip>
                </span>
              </template>
              <n-input v-model:value="config.host"> </n-input>
            </n-form-item>
            <n-form-item label="主题"
              ><n-select v-model:value="config.theme" :options="themeOptions" />
            </n-form-item>
            <n-form-item label="ffmpeg路径">
              <n-input
                v-model:value="config.ffmpegPath"
                placeholder="请输入ffmpeg可执行文件路径，设置为空使用环境变量，需要重启软件"
              />
              <n-icon
                style="margin-left: 10px"
                size="26"
                class="pointer"
                @click="selectFile('ffmpeg')"
              >
                <FolderOpenOutline />
              </n-icon>
            </n-form-item>
            <n-form-item label="ffprobe路径">
              <n-input
                v-model:value="config.ffprobePath"
                placeholder="请输入ffprobe可执行文件路径，设置为空使用环境变量，需要重启软件"
              />
              <n-icon
                style="margin-left: 10px"
                size="26"
                class="pointer"
                @click="selectFile('ffprobe')"
              >
                <FolderOpenOutline />
              </n-icon>
            </n-form-item>
            <n-form-item label="danmakuFactory路径">
              <n-input
                v-model:value="config.danmuFactoryPath"
                placeholder="请输入danmakuFactory可执行文件路径，设置为空使用环境变量，需要重启软件"
              />
              <n-icon
                style="margin-left: 10px"
                size="26"
                class="pointer"
                @click="selectFile('danmakuFactory')"
              >
                <FolderOpenOutline />
              </n-icon>
            </n-form-item>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="webhook" tab="webhook">
          <n-form label-placement="left" :label-width="130">
            <n-form-item>
              <template #label>
                <span class="inline-flex"> webhook </span>
                <Tip
                  :tip="`你可以在浏览器访问 http://127.0.0.1:${config.port} 查询是否启动成功<br/>录播姬的webhook地址设置为：http://127.0.0.1:${config.port}/webhook/bililiverecorder<br/>blrec的webhook地址设置为：http://127.0.0.1:${config.port}/webhook/blrec<br/>修改后需重启生效`"
                ></Tip>
              </template>
              <n-switch v-model:value="config.webhook.open" />
            </n-form-item>
            <n-form-item>
              <template #label>
                <span class="inline-flex">
                  黑名单
                  <Tip
                    tip="设置后相应直播间的视频不会被处理，用英文逗号分隔，如: 123456,1234567，也可以使用*，代表所有房间号"
                  ></Tip>
                </span>
              </template>
              <n-input
                v-model:value="config.webhook.blacklist"
                placeholder="设置需要屏蔽的房间号，用英文逗号分隔"
              />
            </n-form-item>
            <n-form-item label="录播姬工作目录">
              <n-input
                v-model:value="config.webhook.recoderFolder"
                placeholder="请输入录播姬工作目录"
              />
              <n-icon
                style="margin-left: 10px"
                size="26"
                class="pointer"
                @click="selectFolder('recorder')"
              >
                <FolderOpenOutline />
              </n-icon>
            </n-form-item>
            <CommonSetting
              v-model:data="config.webhook"
              :biliup-presets-options="presetsOptions"
              :ffmpeg-options="ffmpegOptions"
              :global-value="webhookDefaultValue"
              :global-fields-obj="{}"
              type="global"
            ></CommonSetting>

            <h2>独立配置<Tip tip="单独设置房间号的上传配置，会覆盖全局配置"></Tip></h2>
            <!-- <div class="flex" style="align-items: center"> -->
            <div class="room-list">
              <span
                v-for="room in roomList"
                :key="room.id"
                class="room"
                @click="handleRoomDetail(room.id)"
                >{{ room.id }}<span v-if="room.remark">({{ room.remark }})</span></span
              >
              <n-button type="primary" @click="addRoom"> 添加 </n-button>
            </div>
            <!-- </div> -->
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="notification" tab="通知">
          <NotificationSetting v-model:data="config"></NotificationSetting>
        </n-tab-pane>
      </n-tabs>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="close">取消</n-button>
          <n-button type="primary" class="btn" @click="saveConfig"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>

  <RoomSettingDialog
    v-model:visible="roomDetailVisible"
    v-model:data="tempRoomDetail"
    :type="roomType"
    :biliup-presets-options="presetsOptions"
    :ffmpeg-options="ffmpegOptions"
    :global-fields-obj="roomGlobalCheckObj"
    :global-value="webhookDefaultValue"
    @save="saveRoomDetail"
    @delete="deleteRoom"
  ></RoomSettingDialog>
</template>

<script setup lang="ts">
import RoomSettingDialog from "./RoomSettingDialog.vue";
import CommonSetting from "./CommonWebhookSetting.vue";
import NotificationSetting from "./NotificationSetting.vue";
import { useAppConfig } from "@renderer/stores";
import { cloneDeep } from "lodash-es";
import { useConfirm } from "@renderer/hooks";
import { FolderOpenOutline } from "@vicons/ionicons5";
import { deepRaw } from "@renderer/utils";

import type { AppConfig, BiliupPreset, AppRoomConfig, Theme } from "@biliLive-tools/types";

const appConfigStore = useAppConfig();
const showModal = defineModel<boolean>({ required: true, default: false });

// @ts-ignore
const config: Ref<AppConfig> = ref({});
// @ts-ignore
const initConfig: Ref<AppConfig> = ref({});

const logLevelOptions = ref<{ label: string; value: any }[]>([
  { label: "debug", value: "debug" },
  { label: "info", value: "info" },
  { label: "warn", value: "warn" },
  { label: "error", value: "error" },
]);

const themeOptions = ref<{ label: string; value: Theme }[]>([
  { label: "自动", value: "system" },
  { label: "浅色", value: "light" },
  { label: "深色", value: "dark" },
]);

const confirm = useConfirm();
const saveConfig = async () => {
  if (
    initConfig.value.webhook.recoderFolder &&
    initConfig.value.webhook.recoderFolder !== config.value.webhook.recoderFolder
  ) {
    const isExits = await window.api.exits(
      window.path.join(config.value.webhook.recoderFolder, "config.json"),
    );
    if (!isExits) {
      const status = await confirm.warning({
        content: "录播姬目录下应该有一个名为config.json的文件，请确认选择的目录是否正确？",
      });
      if (!status) return;
    }
  }

  await window.api.config.save(deepRaw(config.value));
  window.api.common.setTheme(config.value.theme);
  // 设置自动启动
  window.api.common.setOpenAtLogin(config.value.autoLaunch || false);
  close();
  appConfigStore.getAppConfig();
};

const close = () => {
  showModal.value = false;
};

const getConfig = async () => {
  const data = await window.api.config.getAll();
  config.value = data;
  initConfig.value = cloneDeep(data);
};

const selectFile = async (file: "ffmpeg" | "ffprobe" | "danmakuFactory") => {
  const files = await window.api.openFile({
    multi: false,
  });
  if (!files) return;

  if (file === "ffmpeg") {
    config.value.ffmpegPath = files[0];
  } else if (file === "ffprobe") {
    config.value.ffprobePath = files[0];
  } else if (file === "danmakuFactory") {
    config.value.danmuFactoryPath = files[0];
  }
};

const selectFolder = async (type: "recorder") => {
  const files = await window.api.openDirectory();
  if (!files) return;

  if (type === "recorder") {
    config.value.webhook.recoderFolder = files;
  }
};

const handleOpen = async () => {
  await Promise.all([getPresets(), getPresetOptions()]);
  await getConfig();
};

const presets = ref<BiliupPreset[]>([]);
const getPresets = async () => {
  presets.value = await window.api.bili.getPresets();
};
const presetsOptions = computed(() => {
  return presets.value.map((item) => {
    return {
      label: item.name,
      value: item.id,
    };
  });
});

const roomList = computed(() => {
  return Object.entries(config.value.webhook.rooms).map(([id, value]) => {
    return {
      id,
      ...value,
    };
  });
});

// 房间具体设置
const roomType = ref<"edit" | "add">("add");
const roomDetailVisible = ref(false);
const roomGlobalCheckObj = ref<{
  [key: string]: boolean;
}>({});
const globalFields = ref([
  "uid",
  "minSize",
  "title",
  "uploadPresetId",
  "danmu",
  "ffmpegPreset",
  "danmuPreset",
  "autoPartMerge",
  "partMergeMinute",
  "hotProgressSample",
  "hotProgressHeight",
  "hotProgressColor",
  "hotProgressFillColor",
  "hotProgress",
  "useLiveCover",
  "convert2Mp4",
  "useVideoAsTitle",
  "removeOriginAfterConvert",
  "removeOriginAfterUpload",
]);
const webhookDefaultValue = computed(() => {
  if (!config.value.webhook) return {};

  return cloneDeep(config.value.webhook);
});

const handleRoomDetail = (roomId: string) => {
  roomType.value = "edit";
  const room = config.value.webhook.rooms[roomId];
  tempRoomDetail.value = {
    id: roomId,
    ...room,
  };

  const noGlobalFields = room.noGlobal ?? [];
  for (const key of globalFields.value) {
    roomGlobalCheckObj.value[key] = !noGlobalFields.includes(key);

    if (roomGlobalCheckObj.value[key]) {
      tempRoomDetail.value[key] = webhookDefaultValue.value[key];
    }
  }

  console.log(roomGlobalCheckObj.value, room);
  roomDetailVisible.value = true;
};

const tempRoomDetail = ref<AppRoomConfig & { id?: string }>({
  id: undefined,
  uid: undefined,
  open: true,
  minSize: 0,
  title: "",
  uploadPresetId: "",
  remark: "",
  danmu: false,
  ffmpegPreset: undefined,
  danmuPreset: undefined,
  autoPartMerge: false,
  partMergeMinute: 10,
  hotProgress: false,
  useLiveCover: false,
  hotProgressSample: 30,
  hotProgressHeight: 60,
  hotProgressColor: "#f9f5f3",
  hotProgressFillColor: "#333333",
  useVideoAsTitle: false,
  convert2Mp4: false,
  removeOriginAfterConvert: false,
  removeOriginAfterUpload: false,
});
const saveRoomDetail = ({ id }: AppRoomConfig & { id?: string }) => {
  config.value.webhook.rooms[id!] = tempRoomDetail.value;
};
const deleteRoom = (roomId: string) => {
  delete config.value.webhook.rooms[roomId];
  roomDetailVisible.value = false;
};

const ffmpegOptions = ref<any[]>([]);
const getPresetOptions = async () => {
  ffmpegOptions.value = await window.api.ffmpeg.getPresetOptions();
};

const addRoom = () => {
  roomType.value = "add";
  // @ts-ignore
  tempRoomDetail.value = {
    id: undefined,
    open: true,
    remark: "",
    ...toRaw(webhookDefaultValue.value),
  };
  roomDetailVisible.value = true;

  for (const key of globalFields.value) {
    roomGlobalCheckObj.value[key] = true;
  }
  console.log(roomGlobalCheckObj.value);
};
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
.room-list {
  gap: 15px;
  flex-wrap: wrap;
  display: flex;
  align-items: center;
  .room {
    padding: 8px 14px;
    cursor: pointer;
    border: 1px solid #eee;
    border-radius: 4px;
  }
}
</style>
