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
      <div>
        <n-tabs type="segment">
          <n-tab-pane name="first" tab="普通设置">
            <n-form ref="formRef" label-placement="left" :label-width="120">
              <n-form-item>
                <template #label>
                  <span class="inline-flex">
                    删除至回收站
                    <Tip
                      tip="关闭后若使用“删除源文件”等选项，文件将被直接删除，不会进入回收站"
                    ></Tip>
                  </span>
                </template>
                <n-switch v-model:value="config.trash" />
              </n-form-item>

              <n-form-item label="log等级"
                ><n-select v-model:value="config.logLevel" :options="logLevelOptions" />
              </n-form-item>
              <n-form-item>
                <template #label>
                  <span class="inline-flex"> 自动更新检测 </span>
                </template>
                <n-switch v-model:value="config.autoUpdate" />
              </n-form-item>

              <n-form-item label="ffmpeg路径">
                <n-input
                  v-model:value="config.ffmpegPath"
                  placeholder="请输入ffmpeg可执行文件路径，设置为空使用环境变量，需要重启软件"
                />
                <n-button type="primary" style="margin-left: 10px" @click="selectFile('ffmpeg')">
                  选择文件
                </n-button>
              </n-form-item>
              <n-form-item label="ffprobe路径">
                <n-input
                  v-model:value="config.ffprobePath"
                  placeholder="请输入ffprobe可执行文件路径，设置为空使用环境变量，需要重启软件"
                />
                <n-button type="primary" style="margin-left: 10px" @click="selectFile('ffprobe')">
                  选择文件
                </n-button>
              </n-form-item>
            </n-form>
          </n-tab-pane>
          <n-tab-pane name="second" tab="webhook">
            <n-form label-placement="left" :label-width="120">
              <n-form-item>
                <template #label>
                  <span class="inline-flex">
                    开启server
                    <Tip
                      :tip="`开启后支持自动上传，需重启应用<br/>录播姬的webhook地址设置为:http://127.0.0.1:${config.webhook.port}/webhook<br/>blrec的webhook地址设置为:http://127.0.0.1:${config.webhook.port}/blrec`"
                    ></Tip>
                  </span>
                </template>
                <n-switch v-model:value="config.webhook.open" />
              </n-form-item>
              <n-form-item>
                <template #label>
                  <span class="inline-flex">
                    黑名单
                    <Tip
                      tip="设置后相关房间号的录播不会上传，用英文逗号分隔，如: 123456,1234567"
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
                <n-button
                  type="primary"
                  style="margin-left: 10px"
                  @click="selectFolder('recorder')"
                >
                  选择文件夹
                </n-button>
              </n-form-item>
              <n-form-item>
                <template #label>
                  <span class="inline-flex">
                    最小上传大小
                    <Tip tip="小于这个大小的视频不会上传，用于过滤因网络问题导致的分段录播"></Tip>
                  </span>
                </template>
                <n-input-number v-model:value="config.webhook.minSize" placeholder="单位MB" />
                M
              </n-form-item>
              <n-form-item>
                <template #label>
                  <span class="inline-flex">
                    默认视频标题
                    <Tip :tip="titleTip"></Tip>
                  </span>
                </template>
                <n-input
                  v-model:value="config.webhook.title"
                  placeholder="请输入视频标题,支持{{title}},{{user}},{{now}}占位符"
                  clearable
                />
              </n-form-item>
              <n-form-item label="默认上传预设">
                <n-select
                  v-model:value="config.webhook.uploadPresetId"
                  :options="presetsOptions"
                  placeholder="请选择"
                />
              </n-form-item>
              <n-form-item>
                <template #label>
                  <span class="inline-flex">
                    独立配置
                    <Tip tip="单独设置房间号的上传配置，会覆盖全局配置"></Tip>
                  </span>
                </template>
                <div class="room-list">
                  <span
                    v-for="roomId in roomList"
                    :key="roomId"
                    class="room"
                    @click="handleRoomDetail(roomId)"
                    >{{ roomId }}</span
                  >
                </div>
                <n-button type="primary" @click="setRoomVisible = true"> 添加 </n-button>
              </n-form-item>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </div>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="close">取消</n-button>
          <n-button type="primary" class="btn" @click="saveConfig"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>

  <n-modal v-model:show="setRoomVisible" :mask-closable="false">
    <n-card :bordered="false" size="small" role="dialog" aria-modal="true" style="width: 400px">
      <n-input v-model:value="tempRoomId" placeholder="请输入房间号" />
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="setRoomVisible = false">取消</n-button>
          <n-button type="primary" class="btn" @click="saveRoom"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>

  <n-modal v-model:show="roomDetailVisible" :mask-closable="false" :on-after-enter="handleRoomOpen">
    <n-card :bordered="false" size="small" role="dialog" aria-modal="true" style="width: 800px">
      <n-form ref="formRef2" label-placement="left" :label-width="120">
        <n-form-item>
          <template #label>
            <span class="inline-flex">
              最小上传大小
              <Tip tip="小于这个大小的视频不会上传，用于过滤因网络问题导致的分段录播"></Tip>
            </span>
          </template>
          <n-input-number v-model:value="tempRoomDetail.minSize" placeholder="单位MB" />
          M
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex">
              默认视频标题
              <Tip :tip="titleTip"></Tip>
            </span>
          </template>
          <n-input
            v-model:value="tempRoomDetail.title"
            placeholder="请输入视频标题,支持{{title}},{{user}},{{now}}占位符"
            clearable
          />
        </n-form-item>
        <n-form-item label="默认上传预设">
          <n-select
            v-model:value="tempRoomDetail.uploadPresetId"
            :options="presetsOptions"
            placeholder="请选择"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="roomDetailVisible = false">取消</n-button>
          <n-button type="error" class="btn" @click="deleteRoom"> 删除 </n-button>
          <n-button type="primary" class="btn" @click="saveRoomDetail"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import type { AppConfig, LogLevel, BiliupPreset } from "../../../types";

const showModal = defineModel<boolean>({ required: true, default: false });

// @ts-ignore
const config: Ref<AppConfig> = ref({});

const logLevelOptions = ref<{ label: string; value: LogLevel }[]>([
  { label: "debug", value: "debug" },
  { label: "info", value: "info" },
  { label: "warn", value: "warn" },
  { label: "error", value: "error" },
]);

const saveConfig = async () => {
  await window.api.saveAppConfig(toRaw(config.value));
  close();
};

const close = () => {
  showModal.value = false;
};

const getConfig = async () => {
  const data = await window.api.getAppConfig();
  config.value = data;
};

const selectFile = async (file: "ffmpeg" | "ffprobe") => {
  const files = await window.api.openFile({
    multi: false,
  });
  if (!files) return;

  if (file === "ffmpeg") {
    config.value.ffmpegPath = files[0];
  } else if (file === "ffprobe") {
    config.value.ffprobePath = files[0];
  }
};

const selectFolder = async (type: "recorder") => {
  const files = await window.api.openDirectory();
  console.log(files);

  if (!files) return;
  console.log("files");

  if (type === "recorder") {
    config.value.webhook.recoderFolder = files;
  }
};

const handleOpen = async () => {
  await getPresets();
  await getConfig();
};

const titleTip = ref(
  "支持{{title}},{{user}},{{now}}占位符，会覆盖预设中的标题，如【{{user}}】{{title}}-{{now}}",
);

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

// 房间号设置
const setRoomVisible = ref(false);
const tempRoomId = ref("");
watch(
  () => setRoomVisible.value,
  (val) => {
    if (val) {
      tempRoomId.value = "";
    }
  },
);

const saveRoom = () => {
  if (!tempRoomId.value) return;
  console.log(config.value.webhook.rooms);
  config.value.webhook.rooms[tempRoomId.value] = {
    minSize: config.value.webhook.minSize,
    title: config.value.webhook.title,
    uploadPresetId: config.value.webhook.uploadPresetId,
  };
  setRoomVisible.value = false;
};
const roomList = computed(() => {
  return Object.keys(config.value.webhook.rooms);
});

// 房间具体设置
const roomDetailVisible = ref(false);
const handleRoomDetail = (roomId: string) => {
  tempRoomId.value = roomId;
  roomDetailVisible.value = true;
};

const tempRoomDetail = ref({
  minSize: 0,
  title: "",
  uploadPresetId: "",
});
const handleRoomOpen = () => {
  const room = config.value.webhook.rooms[tempRoomId.value];
  tempRoomDetail.value = {
    minSize: room.minSize,
    title: room.title,
    uploadPresetId: room.uploadPresetId,
  };
};
const saveRoomDetail = () => {
  if (!tempRoomId.value) return;
  config.value.webhook.rooms[tempRoomId.value] = {
    minSize: tempRoomDetail.value.minSize,
    title: tempRoomDetail.value.title,
    uploadPresetId: tempRoomDetail.value.uploadPresetId,
  };
  roomDetailVisible.value = false;
};
const deleteRoom = () => {
  if (!tempRoomId.value) return;
  delete config.value.webhook.rooms[tempRoomId.value];
  roomDetailVisible.value = false;
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
  .room {
    padding: 8px 20px;
    cursor: pointer;
    border: 1px solid #eee;
    border-radius: 4px;
  }
  .room {
    margin-right: 15px;
  }
}
</style>
