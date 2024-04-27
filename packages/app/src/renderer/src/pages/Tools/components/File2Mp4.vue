<!-- 将文件转换为mp4 -->
<template>
  <div>
    <div class="center btns" style="margin-bottom: 20px">
      <n-button @click="addVideo"> 添加视频 </n-button>
      <n-button type="primary" @click="convert"> 立即转换 </n-button>
    </div>
    <FileSelect ref="fileSelect" v-model="fileList" :sort="false"></FileSelect>

    <div class="flex align-center column" style="margin-top: 10px">
      <div>
        <n-radio-group v-model:value="options.saveRadio" class="radio-group">
          <n-space class="flex align-center column">
            <n-radio :value="1"> 保存到原始文件夹 </n-radio>
            <n-radio :value="2">
              <n-input
                v-model:value="options.savePath"
                type="text"
                placeholder="选择文件夹"
                style="width: 300px"
                :title="options.savePath"
              />
            </n-radio>
            <n-icon size="30" style="margin-left: -10px" class="pointer" @click="getDir">
              <FolderOpenOutline />
            </n-icon>
          </n-space>
        </n-radio-group>
      </div>
      <div style="margin-top: 10px">
        <n-radio-group v-model:value="options.override">
          <n-space>
            <n-radio :value="true"> 覆盖文件 </n-radio>
            <n-radio :value="false"> 跳过存在文件 </n-radio>
          </n-space>
        </n-radio-group>
        <n-checkbox v-model:checked="options.removeOrigin"> 完成后移除源文件 </n-checkbox>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfirm } from "@renderer/hooks";
import { FolderOpenOutline } from "@vicons/ionicons5";
import { useAppConfig } from "@renderer/stores";
import { storeToRefs } from "pinia";
import FileSelect from "@renderer/pages/Tools/components/FileUpload/components/FileSelect.vue";

const notice = useNotification();
const confirm = useConfirm();
const { appConfig } = storeToRefs(useAppConfig());

const fileList = ref<{ id: string; title: string; path: string; visible: boolean }[]>([]);

const options = appConfig.value.tool.video2mp4;

// const options = ref<Video2Mp4Options>({
//   saveRadio: 1, // 1：保存到原始文件夹，2：保存到特定文件夹
//   saveOriginPath: true,
//   savePath: "",

//   override: false, // 覆盖文件
//   removeOrigin: false, // 完成后移除源文件
// });

const convert = async () => {
  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 1000,
    });
    return;
  }
  const status = await confirm.warning({
    content: "转封装增加大量 CPU 占用以及硬盘 IO，请耐心等待",
  });
  if (!status) return;

  for (let i = 0; i < fileList.value.length; i++) {
    try {
      const file = window.api.formatFile(fileList.value[i].path);
      window.api.convertVideo2Mp4(toRaw(file), toRaw(options));
    } catch (err) {
      notice.error({
        title: err as string,
        duration: 1000,
      });
    }
  }
  fileList.value = [];
  notice.warning({
    title: `已加入任务队列，可在任务列表中查看进度`,
    duration: 1000,
  });
};

async function getDir() {
  const path = await window.api.openDirectory();
  if (!path) return;
  options.savePath = path;
}

const fileSelect = ref(null);
const addVideo = async () => {
  // @ts-ignore
  fileSelect.value.select();
};
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
.btns {
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>
