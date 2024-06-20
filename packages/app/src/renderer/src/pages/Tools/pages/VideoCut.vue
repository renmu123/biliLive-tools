<template>
  <div class="container">
    <div class="btns">
      <n-button @click="importCsv"> 导入 </n-button>
      <n-button type="primary" @click="addVideo"> 添加视频 </n-button>
      <input ref="videoInputRef" type="file" style="display: none" @change="handleVideoChange" />
      <n-button type="primary" @click="addSubtitle"> 添加字幕 </n-button>
      <n-button type="primary" @click="exportVideo"> 导出切片 </n-button>
      <!-- <n-select
        v-model:value="danmuPresetId"
        :options="danmuPresetsOptions"
        placeholder="选择预设"
        style="width: 140px"
      /> -->
    </div>

    <div class="content">
      <video ref="videoRef" controls width="640" height="480">
        你的浏览器不支持HTML5 video标签。
      </video>
    </div>
  </div>
</template>

<script setup lang="ts">
const files = ref<{
  video: string | null;
  subtitle: string | null;
}>({
  video: null,
  subtitle: null,
});

const importCsv = async () => {
  //   const file = await window.api.openFile({
  //     multi: false,
  //     filters: [
  //       {
  //         name: "csv",
  //         extensions: ["csv"],
  //       },
  //       {
  //         name: "所有文件",
  //         extensions: ["*"],
  //       },
  //     ],
  //   });
  //   if (!file) return;
  //   files.value.subtitle = file[0].path;
};

const videoInputRef = ref<HTMLInputElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const addVideo = () => {
  videoInputRef.value?.click();
};
const handleVideoChange = async (event: any) => {
  const file = event.target.files[0];
  const url = URL.createObjectURL(file);

  // 设置视频播放器的src属性为选中的视频文件
  // videoPlayer.src = url;
  if (!videoRef.value) return;
  videoRef.value.src = url;
};

const addSubtitle = async () => {
  // const file = await window.api.openFile({
  //   multi: false,
  //   filters: [
  //     {
  //       name: "subtitle",
  //       extensions,
  //     },
  //     {
  //       name: "所有文件",
  //       extensions: ["*"],
  //     },
  //   ],
  // });
  // if (!file) return;
  // files.value.subtitle = file[0].path;
};

const exportVideo = () => {};
</script>

<style scoped lang="less">
.btns {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  gap: 10px;
}
</style>
