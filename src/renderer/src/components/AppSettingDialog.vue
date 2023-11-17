<template>
  <n-modal v-model:show="showModal" :mask-closable="false" auto-focus>
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
              <n-form-item label="log等级"
                ><n-select v-model:value="config.logLevel" :options="logLevelOptions" />
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
          <n-tab-pane name="second" tab="录播姬webhook">
            <n-form label-placement="left" :label-width="120">
              <n-form-item>
                <template #label>
                  <n-popover trigger="hover">
                    <template #trigger>
                      <span
                        class="flex align-center"
                        :style="{
                          'justify-content': 'flex-end',
                        }"
                      >
                        开启server
                        <n-icon size="18" class="pointer"> <HelpCircleOutline /> </n-icon
                      ></span>
                    </template>
                    开启后需重启应用，录播姬的webhook地址设置为: http://127.0.0.1:18010/webhook
                  </n-popover>
                </template>
                <n-switch v-model:value="config.webhook.open" />
              </n-form-item>
              <n-form-item label="开启自动上传">
                <n-switch v-model:value="config.webhook.autoUpload" />
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
              <n-form-item label="最小上传大小">
                <n-input-number v-model:value="config.webhook.minSize" placeholder="单位MB" />
                M
              </n-form-item>
              <n-form-item>
                <template #label>
                  <n-popover trigger="hover">
                    <template #trigger>
                      <span
                        class="flex align-center"
                        :style="{
                          'justify-content': 'flex-end',
                        }"
                      >
                        上传视频标题
                        <n-icon size="18" class="pointer"> <HelpCircleOutline /> </n-icon
                      ></span>
                    </template>
                    {{ titleTip }}
                  </n-popover>
                </template>
                <n-input
                  v-model:value="config.webhook.title"
                  placeholder="请输入视频标题,支持{{title}},{{user}},{{now}}占位符"
                  clearable
                />
              </n-form-item>
              <n-form-item label="上传预设">
                <n-select
                  v-model:value="config.webhook.uploadPresetId"
                  :options="presetsOptions"
                  placeholder="请选择"
                />
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
</template>

<script setup lang="ts">
import type { AppConfig, LogLevel, BiliupPreset } from "../../../types";
import { HelpCircleOutline } from "@vicons/ionicons5";

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

onMounted(async () => {
  await getConfig();
});

const titleTip = ref("支持{{ title }},{{ user }},{{ now }}占位符，会覆盖预设中的标题");

const presets = ref<BiliupPreset[]>([]);
const getPresets = async () => {
  presets.value = await window.api.readBiliupPresets();
};
const presetsOptions = computed(() => {
  return presets.value.map((item) => {
    return {
      label: item.name,
      value: item.id,
    };
  });
});
getPresets();
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
