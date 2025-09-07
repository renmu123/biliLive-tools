<template>
  <div>
    <input
      ref="fileInputRef"
      type="file"
      accept=".png,.jpg,.jpeg"
      style="display: none"
      @change="handleCoverChange"
    />
    <div
      :style="{
        height: props.height,
        width: props.width,
      }"
      class="image-container"
    >
      <img v-if="src" class="image" :src="src" @click="selectImage" />
      <div v-else class="empty-image" @click="selectImage">选择图片</div>
      <n-icon v-if="src" size="14" class="remove" @click="remove">
        <svg
          viewBox="0 0 12 12"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g fill="currentColor" fill-rule="nonzero">
              <path
                d="M2.08859116,2.2156945 L2.14644661,2.14644661 C2.32001296,1.97288026 2.58943736,1.95359511 2.7843055,2.08859116 L2.85355339,2.14644661 L6,5.293 L9.14644661,2.14644661 C9.34170876,1.95118446 9.65829124,1.95118446 9.85355339,2.14644661 C10.0488155,2.34170876 10.0488155,2.65829124 9.85355339,2.85355339 L6.707,6 L9.85355339,9.14644661 C10.0271197,9.32001296 10.0464049,9.58943736 9.91140884,9.7843055 L9.85355339,9.85355339 C9.67998704,10.0271197 9.41056264,10.0464049 9.2156945,9.91140884 L9.14644661,9.85355339 L6,6.707 L2.85355339,9.85355339 C2.65829124,10.0488155 2.34170876,10.0488155 2.14644661,9.85355339 C1.95118446,9.65829124 1.95118446,9.34170876 2.14644661,9.14644661 L5.293,6 L2.14644661,2.85355339 C1.97288026,2.67998704 1.95359511,2.41056264 2.08859116,2.2156945 L2.14644661,2.14644661 L2.08859116,2.2156945 Z"
              ></path>
            </g>
          </g>
        </svg>
      </n-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { commonApi, api } from "@renderer/apis";

const filename = defineModel<string | undefined>({ required: true, default: "" });
const src = computed(() => {
  if (filename.value) {
    if (window.path.isAbsolute(filename.value)) {
      return filename.value;
    } else {
      return `${api.defaults.baseURL}/assets/cover/${filename.value}`;
    }
  }
  return "";
});

interface Props {
  height?: string;
  width?: string;
}
const props: Props = withDefaults(defineProps<Props>(), {
  height: "100px",
  width: "160px",
});

const notice = useNotification();
const handleCoverChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  console.log(file);
  if (file.size > 1024 * 1024 * 2) {
    notice.warning({
      title: "图片大小超过2M可能导致无法上传成功~",
      duration: 2000,
    });
  }
  const res = await commonApi.uploadCover(file);
  filename.value = res.name;
};

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectImage = () => {
  // 重置input的value，以支持重复选择同一个文件
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
  fileInputRef.value?.click();
};

const remove = () => {
  filename.value = "";
};
</script>

<style scoped lang="less">
.image-container {
  position: relative;
}
.image {
  cursor: pointer;
  height: 100%;
  width: 100%;
}

.empty-image {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed #ccc;
  cursor: pointer;
  color: #666;
  height: 100%;
  width: 100%;
}
.remove {
  position: absolute;
  top: 4px;
  right: 4px;
  color: rgba(0, 0, 0, 0.8);
  background: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
