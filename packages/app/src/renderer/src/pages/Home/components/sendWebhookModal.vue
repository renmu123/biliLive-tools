<template>
  <n-modal v-model:show="showModal">
    <n-card style="width: 80%" :bordered="false" role="dialog" aria-modal="true">
      <n-form>
        <h4>除房间号外，其余参数都用于上传，如果不需要可以不设置</h4>
        <n-form-item label="房间号">
          <n-input v-model:value="params.roomId" placeholder="房间号" />
        </n-form-item>
        <n-form-item>
          <template #label>
            <Tip text="开始时间"
              >视频录制开始时间，与标题时间占位符、断播续传相关，默认从弹幕或视频中读取</Tip
            >
          </template>
          <n-date-picker v-model:value="params.startTimestamp" type="datetime" clearable />
        </n-form-item>
        <n-form-item>
          <template #label>
            <Tip text="结束时间"
              >视频录制结束时间，与断播续传相关，默认从弹幕或视频中读取，如果不在意</Tip
            >
          </template>
          <n-date-picker v-model:value="params.endTimestamp" type="datetime" clearable />
        </n-form-item>
        <n-form-item label="标题">
          <n-input v-model:value="params.title" placeholder="标题" />
        </n-form-item>
        <n-form-item label="用户名">
          <n-input v-model:value="params.username" placeholder="用户名" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="showModal = false">取消</n-button>
          <n-button class="btn" type="primary" @click="confirm">确定</n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { taskApi, commonApi } from "@renderer/apis";
import { sleep } from "@renderer/utils";

interface Props {
  files: {
    video: string;
    danmu: string;
  };
}

const notice = useNotification();
const showModal = defineModel<boolean>("visible", { required: true, default: false });
const props = withDefaults(defineProps<Props>(), {
  files: () => {
    return {
      video: "",
      danmu: "",
    };
  },
});

const params = ref<{
  startTimestamp: number | null;
  endTimestamp: number | null;
  roomId: string | null;
  title: string | null;
  username: string | null;
  duration: number;
}>({
  roomId: "",
  startTimestamp: null,
  endTimestamp: null,
  title: "",
  username: "",
  duration: 0,
});

const confirm = async () => {
  const data = { ...params.value };
  // 验证并提示
  if (!data.roomId) {
    notice.error({
      title: "请输入房间号",
      duration: 1000,
    });
    return;
  }
  if (!data.startTimestamp) {
    data.startTimestamp = new Date().getTime();
  }
  if (!data.endTimestamp) {
    data.endTimestamp = data.startTimestamp + 100000;
  }
  if (!data.title) {
    data.title = "未知";
  }
  if (!data.username) {
    data.username = "未知";
  }

  await taskApi.sendToWebhook({
    event: "FileOpening",
    time: new Date(data.startTimestamp).toISOString(),
    filePath: props.files.video,
    danmuPath: props.files.danmu,
    roomId: data.roomId,
    title: data.title,
    username: data.username,
  });
  sleep(1000);

  await taskApi.sendToWebhook({
    event: "FileClosed",
    time: new Date(data.endTimestamp).toISOString(),
    filePath: props.files.video,
    danmuPath: props.files.danmu,
    roomId: data.roomId,
    title: data.title,
    username: data.username,
  });
  notice.success({
    title: "发送成功",
    duration: 1000,
  });

  showModal.value = false;
};

watch(showModal, async (val) => {
  if (val) {
    params.value = await commonApi.parseMeta({
      videoFilePath: props.files.video,
      danmaFilePath: props.files.danmu,
    });
    params.value.endTimestamp = params.value.startTimestamp
      ? (params.value.startTimestamp + params.value.duration) * 1000
      : null;
    params.value.startTimestamp = params.value.startTimestamp
      ? params.value.startTimestamp * 1000
      : null;
    console.log(params.value);
  }
});
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
