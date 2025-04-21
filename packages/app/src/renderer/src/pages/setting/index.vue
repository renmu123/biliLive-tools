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
      <n-tabs v-model:value="selectTab" type="bar" animated placement="left" class="setting-tab">
        <n-tab-pane name="common" tab="基本">
          <n-form ref="formRef" label-placement="left" :label-width="160">
            <n-form-item>
              <template #label>
                <Tip
                  text="删除至回收站"
                  tip="关闭后若使用“删除源文件”等选项，文件将被直接删除，不会进入回收站，如果使用的文件为smb等远程协议挂载，可能会删除失败"
                ></Tip>
              </template>
              <n-switch v-model:value="config.trash" />
            </n-form-item>
            <n-form-item v-if="!isWeb">
              <template #label>
                <span class="inline-flex"> 自动检查更新 </span>
              </template>
              <n-switch v-model:value="config.autoUpdate" />
            </n-form-item>
            <n-form-item v-if="!isWeb">
              <template #label>
                <span class="inline-flex"> 开启自启动 </span>
              </template>
              <n-switch v-model:value="config.autoLaunch" />
            </n-form-item>
            <n-form-item v-if="!isWeb">
              <template #label>
                <span class="inline-flex"> 最小化到任务栏 </span>
              </template>
              <n-switch v-model:value="config.minimizeToTray" />
            </n-form-item>
            <n-form-item v-if="!isWeb">
              <template #label>
                <span class="inline-flex"> 关闭到任务栏 </span>
              </template>
              <n-switch v-model:value="config.closeToTray" />
            </n-form-item>
            <n-form-item label="log等级"
              ><n-select v-model:value="config.logLevel" :options="logLevelOptions" />
            </n-form-item>
            <!-- <n-form-item>
              <template #label>
                <span class="inline-flex">
                  https
                  <Tip
                    tip="需重启生效，开启后使用https协议，默认使用自签名证书，所有外部访问如webhook需修改为https协议，桌面版用户如无必要请勿开启"
                  ></Tip>
                </span>
              </template>
              <n-switch v-model:value="config.https" />
            </n-form-item> -->
            <n-form-item>
              <template #label>
                <Tip text="host" :tip="`修改后需重启生效`"></Tip>
              </template>
              <n-input v-model:value="config.host"> </n-input>
            </n-form-item>
            <n-form-item>
              <template #label>
                <Tip
                  text="port"
                  :tip="`你可以在浏览器访问 http://127.0.0.1:${config.port} 查询是否启动成功<br/><b>修改后需重启生效</b>`"
                ></Tip>
              </template>
              <n-input-number v-model:value="config.port" min="1" max="65535"> </n-input-number>
            </n-form-item>
            <n-form-item>
              <template #label>
                <Tip text="鉴权密钥" tip="用于webui鉴权，修改后需重启生效"></Tip>
              </template>
              <n-input v-model:value="config.passKey" type="password" show-password-on="click">
              </n-input>
            </n-form-item>
            <n-form-item label="主题"
              ><n-select v-model:value="config.theme" :options="themeOptions" />
            </n-form-item>
            <n-form-item>
              <template #label>
                <span class="inline-flex">
                  <Tip
                    text="自定义二进制文件"
                    :tip="`开启后，将无法自动使用项目内二进制文件，可能导致应用无法使用，请谨慎开启`"
                  ></Tip>
                </span>
              </template>
              <n-switch v-model:value="config.customExecPath" />
            </n-form-item>
            <template v-if="config.customExecPath">
              <n-form-item label="ffmpeg路径">
                <n-input
                  v-model:value="config.ffmpegPath"
                  placeholder="请输入ffmpeg可执行文件路径，需要重启软件"
                />
                <n-icon
                  style="margin-left: 10px"
                  size="24"
                  class="pointer"
                  title="选择文件"
                  v-if="!isWeb"
                  @click="selectFile('ffmpeg', config.ffmpegPath)"
                >
                  <FolderOpenOutline />
                </n-icon>
                <n-icon
                  style="margin-left: 10px"
                  size="24"
                  class="pointer"
                  title="重置"
                  @click="resetBin('ffmpeg')"
                >
                  <Refresh />
                </n-icon>
              </n-form-item>
              <n-form-item label="ffprobe路径">
                <n-input
                  v-model:value="config.ffprobePath"
                  placeholder="请输入ffprobe可执行文件路径，需要重启软件"
                />
                <n-icon
                  style="margin-left: 10px"
                  size="24"
                  class="pointer"
                  v-if="!isWeb"
                  @click="selectFile('ffprobe', config.ffprobePath)"
                >
                  <FolderOpenOutline />
                </n-icon>
                <n-icon
                  style="margin-left: 10px"
                  size="24"
                  class="pointer"
                  title="重置"
                  @click="resetBin('ffprobe')"
                >
                  <Refresh />
                </n-icon>
              </n-form-item>
              <n-form-item label="danmakuFactory路径">
                <n-input
                  v-model:value="config.danmuFactoryPath"
                  placeholder="请输入danmakuFactory可执行文件路径，需要重启软件"
                />
                <n-icon
                  style="margin-left: 10px"
                  size="24"
                  class="pointer"
                  v-if="!isWeb"
                  @click="selectFile('danmakuFactory', config.danmuFactoryPath)"
                >
                  <FolderOpenOutline />
                </n-icon>
                <n-icon
                  style="margin-left: 10px"
                  size="24"
                  class="pointer"
                  title="重置"
                  @click="resetBin('danmakuFactory')"
                >
                  <Refresh />
                </n-icon>
              </n-form-item>
            </template>

            <n-form-item label="lossless-cut路径">
              <n-input
                v-model:value="config.losslessCutPath"
                placeholder="请输入lossless-cut可执行文件路径，设置为空使用默认桌面程序"
              />
              <n-icon
                style="margin-left: 10px"
                size="26"
                class="pointer"
                v-if="!isWeb"
                @click="selectFile('losslessCut', config.losslessCutPath)"
              >
                <FolderOpenOutline />
              </n-icon>
            </n-form-item>
            <n-form-item>
              <template #label>
                <Tip
                  text="配置"
                  tip="导出配置文件，导入后重启应用生效，尽量保持版本一致，如果按钮无法使用，请参照常见问题进行手动备份"
                ></Tip>
              </template>
              <n-button type="primary" @click="exportSettingZip">导出配置</n-button>
              <n-button type="primary" style="margin-left: 10px" @click="importSettingZip"
                >导入配置</n-button
              >
            </n-form-item>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="webhook" tab="Webhook">
          <n-form label-placement="left" :label-width="130">
            <n-form-item>
              <template #label>
                <Tip
                  text="webhook"
                  :tip="`webhook路径：<br/>B站录播姬：http://127.0.0.1:${config.port}/webhook/bililiverecorder<br/>blrec：http://127.0.0.1:${config.port}/webhook/blrec<br/>DDTV：http://127.0.0.1:${config.port}/webhook/ddtv<br/>自定义（参数见文档）：http://127.0.0.1:${config.port}/webhook/custom <br/>`"
                ></Tip>
              </template>
              <n-switch v-model:value="config.webhook.open" />
            </n-form-item>
            <n-form-item>
              <template #label>
                <Tip
                  text="黑名单"
                  tip="设置后相应直播间的视频不会被处理，用英文逗号分隔，如: 123456,1234567，也可以使用*，代表所有房间号"
                ></Tip>
              </template>
              <n-input
                v-model:value="config.webhook.blacklist"
                placeholder="设置需要屏蔽的房间号，用英文逗号分隔"
              />
            </n-form-item>
            <n-form-item label="录播姬工作目录">
              <template #label>
                <Tip text="录播姬工作目录" tip="仅当你使用录播姬的webhook时，需要配置此选项"></Tip>
              </template>
              <n-input
                v-model:value="config.webhook.recoderFolder"
                placeholder="请选择录播姬工作目录"
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
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="upload" tab="B站上传">
          <BiliSetting v-model:data="config"></BiliSetting>
        </n-tab-pane>
        <n-tab-pane name="recorder" tab="直播录制">
          <RecordSetting v-model:data="config"></RecordSetting>
        </n-tab-pane>
        <n-tab-pane name="task" tab="任务">
          <TaskSetting v-model:data="config"></TaskSetting>
        </n-tab-pane>
        <n-tab-pane name="translate" tab="订阅">
          <VideoSetting v-model:data="config"></VideoSetting>
        </n-tab-pane>
        <!-- <n-tab-pane name="translate" tab="翻译">
          <TranslateSetting v-model:data="config"></TranslateSetting>
        </n-tab-pane> -->
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
defineOptions({
  name: "Setting",
});
import { useFileDialog } from "@vueuse/core";

import RoomSettingDialog from "./RoomSettingDialog.vue";
import CommonSetting from "./CommonWebhookSetting.vue";
import NotificationSetting from "./NotificationSetting.vue";
import BiliSetting from "./BiliSetting.vue";
import RecordSetting from "./RecordSetting.vue";
import TaskSetting from "./TaskSetting.vue";
import VideoSetting from "./VideoSetting.vue";
// import TranslateSetting from "./TranslateSetting.vue";
import { useAppConfig } from "@renderer/stores";
import { cloneDeep } from "lodash-es";
import { saveAs } from "file-saver";
import { useConfirm } from "@renderer/hooks";
import { FolderOpenOutline, Refresh } from "@vicons/ionicons5";
import { deepRaw } from "@renderer/utils";
import { showDirectoryDialog } from "@renderer/utils/fileSystem";
import { videoPresetApi, ffmpegPresetApi, configApi, commonApi } from "@renderer/apis";

import type { AppConfig, BiliupPreset, AppRoomConfig, Theme } from "@biliLive-tools/types";

const notice = useNotification();
const appConfigStore = useAppConfig();
const showModal = defineModel<boolean>({ required: true, default: false });
const isWeb = computed(() => window.isWeb);

// @ts-ignore
const config: Ref<AppConfig> = ref({
  task: {
    ffmpegMaxNum: 3,
    douyuDownloadMaxNum: -1,
    biliUploadMaxNum: -1,
    biliDownloadMaxNum: -1,
  },
});
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
    !isWeb.value &&
    initConfig.value.webhook.recoderFolder &&
    initConfig.value.webhook.recoderFolder !== config.value.webhook.recoderFolder
  ) {
    const isExits = await window.api.exits(
      window.path.join(config.value.webhook.recoderFolder, "config.json"),
    );
    if (!isExits) {
      const [status] = await confirm.warning({
        content: "录播姬目录下应该有一个名为config.json的文件，请确认选择的目录是否正确？",
      });
      if (!status) return;
    }
  }
  // passKey 为空时不保存
  if (!config.value.passKey) {
    notice.error({
      title: "鉴权密钥不能为空",
      duration: 1000,
    });
    return;
  }

  await configApi.save(deepRaw(config.value));
  window?.api?.common?.setTheme(config.value.theme);
  // 设置自动启动
  window?.api?.common?.setOpenAtLogin(config.value.autoLaunch || false);
  close();
  appConfigStore.getAppConfig();
};

const close = () => {
  showModal.value = false;
};

const getConfig = async () => {
  const data = await configApi.get();
  config.value = data;
  initConfig.value = cloneDeep(data);
};

/**
 * 选择二进制文件的地址
 * @param file bin文件类型
 * @param defaultPath 默认地址
 */
const selectFile = async (
  type: "ffmpeg" | "ffprobe" | "danmakuFactory" | "losslessCut",
  defaultPath: string,
) => {
  const files = await window.api.openFile({
    multi: false,
    defaultPath,
  });
  if (!files) return;

  if (type === "ffmpeg") {
    config.value.ffmpegPath = files[0];
  } else if (type === "ffprobe") {
    config.value.ffprobePath = files[0];
  } else if (type === "danmakuFactory") {
    config.value.danmuFactoryPath = files[0];
  } else if (type === "losslessCut") {
    config.value.losslessCutPath = files[0];
  } else {
    console.error("未知文件类型");
  }
};

/**
 * 重置二进制文件的地址
 */
const resetBin = async (type: "ffmpeg" | "ffprobe" | "danmakuFactory") => {
  if (type === "ffmpeg") {
    config.value.ffmpegPath = await configApi.resetBin(type);
  } else if (type === "ffprobe") {
    config.value.ffprobePath = await configApi.resetBin(type);
  } else if (type === "danmakuFactory") {
    config.value.danmuFactoryPath = await configApi.resetBin(type);
  } else {
    console.error("未知文件类型");
  }
};

const selectFolder = async (type: "recorder") => {
  let file: string | undefined = await showDirectoryDialog({
    defaultPath: config.value.webhook.recoderFolder,
  });

  if (!file) return;

  if (type === "recorder") {
    config.value.webhook.recoderFolder = file;
  }
};

const handleOpen = async () => {
  await Promise.all([getPresets(), getPresetOptions()]);
  await getConfig();
};

const presets = ref<BiliupPreset[]>([]);
const getPresets = async () => {
  presets.value = await videoPresetApi.list();
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
  "removeSourceAferrConvert2Mp4",
  "removeOriginAfterConvert",
  "removeOriginAfterUpload",
  "removeOriginAfterUploadCheck",
  "noConvertHandleVideo",
  "uploadHandleTime",
  "limitUploadTime",
  "uploadNoDanmu",
  "noDanmuVideoPreset",
  "limitVideoConvertTime",
  "videoHandleTime",
  "partTitleTemplate",
]);
const webhookDefaultValue = computed(() => {
  if (!config.value.webhook) return {};

  const data = cloneDeep(config.value.webhook);
  // @ts-ignore
  delete data.rooms;
  // @ts-ignore
  delete data.blacklist;
  // @ts-ignore
  delete data.recoderFolder;

  return data;
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
  convert2Mp4: false,
  removeSourceAferrConvert2Mp4: true,
  removeOriginAfterConvert: false,
  removeOriginAfterUpload: false,
  removeOriginAfterUploadCheck: false,
  noConvertHandleVideo: false,
  uploadHandleTime: ["00:00:00", "23:59:59"],
  limitUploadTime: false,
  uploadNoDanmu: false,
  noDanmuVideoPreset: undefined,
  limitVideoConvertTime: false,
  videoHandleTime: ["00:00:00", "23:59:59"],
  partTitleTemplate: "",
});
const saveRoomDetail = (data: AppRoomConfig & { id?: string }) => {
  config.value.webhook.rooms[data.id!] = data;
};
const deleteRoom = (roomId: string) => {
  delete config.value.webhook.rooms[roomId];
  roomDetailVisible.value = false;
};

const ffmpegOptions = ref<any[]>([]);
const getPresetOptions = async () => {
  ffmpegOptions.value = await ffmpegPresetApi.options();
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
  console.log("tempRoomDetail", tempRoomDetail.value);
  roomDetailVisible.value = true;

  for (const key of globalFields.value) {
    roomGlobalCheckObj.value[key] = true;
  }
  console.log(roomGlobalCheckObj.value);
};

// 导出配置
const exportSettingZip = async () => {
  const version = await commonApi.version();
  const name = `biliLive-tools-${version}-${new Date().getTime()}-配置备份.zip`;

  // 导出文件
  const blob = await configApi.exportConfig();
  saveAs(blob, name);
};

// 导入配置
const { open: openImportFile, onChange: onImportFileChange } = useFileDialog({
  accept: ".zip",
  directory: false,
  multiple: false,
});

onImportFileChange((files) => {
  if (!files) return;
  if (files.length === 0) return;
  console.log(files[0]);
  confirmImportSettingZip(files[0]);
});
const importSettingZip = async () => {
  const [status] = await confirm.warning({
    content:
      "导入前请尽量保持版本一致，部分配置将在重启后生效，导入后所有配置都将被替换，是否继续？",
  });
  if (!status) return;
  openImportFile();
};

const confirmImportSettingZip = async (file: File) => {
  await configApi.importConfig(file);

  await confirm.warning({
    content: "导入成功，重启应用后生效",
  });
  showModal.value = false;
};

const selectTab = ref<string>("common");
defineExpose({
  set: async (
    tab?: string,
    extra?: {
      roomId?: string;
    },
  ) => {
    if (tab) {
      selectTab.value = tab;
    }
    if (selectTab.value === "webhook" && extra?.roomId) {
      if (config?.value?.webhook?.rooms?.[extra.roomId]) {
        handleRoomDetail(extra.roomId);
      }
    }
  },
});
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
    &:hover {
      border: 1px solid #358457;
    }
  }
}
.setting-tab > :deep(.n-tab-pane) {
  overflow: auto;
  height: calc(100vh - 200px);
}
</style>
